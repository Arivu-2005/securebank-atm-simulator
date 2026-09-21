(function () {
  // ---- preloaded account data (from the session) ----
  var account = {
    customer_name: "Priya Raman",
    pin: "1234",
    balance: 9800.0,
    history: [
      "Deposited Rs. 500", "Deposited Rs. 23", "Withdrew Rs. 45", "Deposited Rs. 5567",
      "Deposited Rs. 250", "Deposited Rs. 350", "Withdrew Rs. 350", "Deposited Rs. 2",
      "Withdrew Rs. 350", "Withdrew Rs. 947", "Deposited Rs. 500", "Withdrew Rs. 250",
      "Deposited Rs. 350", "Withdrew Rs. 600", "Deposited Rs. 250", "Withdrew Rs. 350",
      "Withdrew Rs. 450", "Deposited Rs. 350"
    ]
  };

  var enteredPin = "";
  var newPinStage = null; // null | "new" | "confirm"
  var newPinBuffer = "";
  var pendingAction = null; // "withdraw" | "deposit"
  var wdSelectedAmt = null;

  function fmt(n) {
    return "Rs. " + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function show(id) {
    document.querySelectorAll(".view").forEach(function (v) { v.classList.remove("active"); });
    document.getElementById("view-" + id).classList.add("active");
  }

  // ---- card insertion ----
  document.getElementById("btn-insert").addEventListener("click", function () {
    var card = document.getElementById("card");
    card.classList.add("inserting");
    this.disabled = true;
    setTimeout(function () {
      show("reading");
      setTimeout(function () {
        show("pin");
        document.getElementById("pin-welcome").textContent = "Card recognised. Enter your 4-digit PIN.";
      }, 900);
    }, 500);
  });

  // ---- PIN entry ----
  function renderPinDots(container, value) {
    var dots = container.querySelectorAll(".pin-dot");
    dots.forEach(function (d, i) { d.classList.toggle("filled", i < value.length); });
  }

  document.getElementById("pin-keypad").addEventListener("click", function (e) {
    var btn = e.target.closest(".key");
    if (!btn) return;
    var k = btn.dataset.k;
    var errorEl = document.getElementById("pin-error");
    if (k === "cancel") {
      enteredPin = "";
      renderPinDots(document.getElementById("pin-dots"), enteredPin);
      errorEl.textContent = "";
      show("insert");
      resetMachine();
      return;
    }
    if (k === "back") {
      enteredPin = enteredPin.slice(0, -1);
      renderPinDots(document.getElementById("pin-dots"), enteredPin);
      return;
    }
    if (enteredPin.length < 4) {
      enteredPin += k;
      renderPinDots(document.getElementById("pin-dots"), enteredPin);
    }
    if (enteredPin.length === 4) {
      setTimeout(function () {
        if (enteredPin === account.pin) {
          errorEl.textContent = "";
          document.getElementById("menu-greeting").textContent = "HELLO, " + account.customer_name.toUpperCase().split(" ")[0];
          enteredPin = "";
          show("menu");
        } else {
          errorEl.textContent = "Incorrect PIN. Please try again.";
          var dotsWrap = document.getElementById("pin-dots");
          dotsWrap.classList.add("pin-shake");
          setTimeout(function () {
            dotsWrap.classList.remove("pin-shake");
            enteredPin = "";
            renderPinDots(dotsWrap, enteredPin);
          }, 420);
        }
      }, 250);
    }
  });

  // ---- menu navigation ----
  document.querySelectorAll("[data-go]").forEach(function (el) {
    el.addEventListener("click", function () {
      var target = el.dataset.go;
      if (target === "balance") {
        document.getElementById("balance-amount").textContent = fmt(account.balance);
        show("balance");
      } else if (target === "history") {
        renderHistory();
        show("history");
      } else if (target === "withdraw") {
        document.getElementById("wd-input").value = "";
        document.getElementById("wd-error").textContent = "";
        wdSelectedAmt = null;
        document.querySelectorAll("#wd-chips .chip-btn").forEach(function (c) { c.classList.remove("selected"); });
        show("withdraw");
      } else if (target === "deposit") {
        document.getElementById("dep-input").value = "";
        document.getElementById("dep-error").textContent = "";
        show("deposit");
      } else if (target === "pin") {
        newPinStage = "new";
        newPinBuffer = "";
        document.getElementById("cp-step-label").textContent = "Enter a new 4-digit PIN.";
        document.getElementById("cp-error").textContent = "";
        renderPinDots(document.getElementById("cp-dots"), "");
        show("changepin");
      } else if (target === "eject") {
        show("eject");
        var c = document.getElementById("card-eject");
        c.style.animation = "none";
        void c.offsetWidth;
        c.style.transform = "translateX(-50%) translateY(-2px)";
        c.style.opacity = "1";
        setTimeout(function () {
          resetMachine();
          show("insert");
        }, 2200);
      } else {
        show(target);
      }
    });
  });

  // ---- withdraw ----
  document.getElementById("wd-chips").addEventListener("click", function (e) {
    var chip = e.target.closest(".chip-btn");
    if (!chip) return;
    document.querySelectorAll("#wd-chips .chip-btn").forEach(function (c) { c.classList.remove("selected"); });
    chip.classList.add("selected");
    document.getElementById("wd-input").value = chip.dataset.amt;
  });

  document.getElementById("wd-confirm").addEventListener("click", function () {
    var errorEl = document.getElementById("wd-error");
    var amt = parseFloat(document.getElementById("wd-input").value);
    if (!amt || amt <= 0) { errorEl.textContent = "Enter a valid amount."; return; }
    if (amt % 100 !== 0) { errorEl.textContent = "Amount must be in multiples of Rs. 100."; return; }
    if (amt > account.balance) { errorEl.textContent = "Insufficient balance."; return; }
    errorEl.textContent = "";
    account.balance -= amt;
    account.history.unshift("Withdrew Rs. " + amt);
    dispenseCash(amt, "Please collect your cash below.");
  });

  // ---- deposit ----
  document.getElementById("dep-confirm").addEventListener("click", function () {
    var errorEl = document.getElementById("dep-error");
    var amt = parseFloat(document.getElementById("dep-input").value);
    if (!amt || amt <= 0) { errorEl.textContent = "Enter a valid amount."; return; }
    errorEl.textContent = "";
    account.balance += amt;
    account.history.unshift("Deposited Rs. " + amt);
    document.getElementById("dispense-sub").textContent = "Deposit confirmed. Updated balance: " + fmt(account.balance);
    var stack = document.getElementById("cash-stack");
    stack.innerHTML = "";
    show("dispense");
  });

  function dispenseCash(amt, subtext) {
    document.getElementById("dispense-sub").textContent = subtext + " New balance: " + fmt(account.balance);
    var stack = document.getElementById("cash-stack");
    stack.innerHTML = "";
    var count = Math.min(5, Math.max(1, Math.round(amt / 1000) || 1));
    for (var i = 0; i < count; i++) {
      (function (i) {
        var bill = document.createElement("div");
        bill.className = "bill";
        bill.style.bottom = (i * 6) + "px";
        stack.appendChild(bill);
        setTimeout(function () { bill.classList.add("dispense"); }, i * 120);
      })(i);
    }
    show("dispense");
  }

  // ---- history ----
  function renderHistory() {
    var list = document.getElementById("history-list");
    list.innerHTML = "";
    account.history.slice(0, 12).forEach(function (entry) {
      var li = document.createElement("li");
      var isCredit = entry.indexOf("Deposited") === 0;
      var match = entry.match(/Rs\.\s*([\d.]+)/);
      var amount = match ? match[1] : "";
      li.innerHTML = "<span>" + entry.replace(/Rs\.\s*[\d.]+/, "").trim() + "</span>" +
        "<span class='amt " + (isCredit ? "credit" : "debit") + "'>" + (isCredit ? "+" : "−") + " Rs. " + amount + "</span>";
      list.appendChild(li);
    });
  }

  // ---- change pin ----
  document.querySelector("#view-changepin .keypad").addEventListener("click", function (e) {
    var btn = e.target.closest(".key");
    if (!btn) return;
    var k = btn.dataset.ck;
    var errorEl = document.getElementById("cp-error");
    var dotsWrap = document.getElementById("cp-dots");

    if (k === "cancel") {
      show("menu");
      return;
    }
    if (k === "back") {
      newPinBuffer = newPinBuffer.slice(0, -1);
      renderPinDots(dotsWrap, newPinBuffer);
      return;
    }
    if (newPinBuffer.length < 4) {
      newPinBuffer += k;
      renderPinDots(dotsWrap, newPinBuffer);
    }
    if (newPinBuffer.length === 4) {
      setTimeout(function () {
        if (newPinStage === "new") {
          window._tempNewPin = newPinBuffer;
          newPinBuffer = "";
          renderPinDots(dotsWrap, "");
          newPinStage = "confirm";
          document.getElementById("cp-step-label").textContent = "Confirm your new PIN.";
        } else {
          if (newPinBuffer === window._tempNewPin) {
            account.pin = newPinBuffer;
            errorEl.textContent = "";
            newPinStage = null;
            newPinBuffer = "";
            show("menu");
          } else {
            errorEl.textContent = "PINs did not match. Start again.";
            dotsWrap.classList.add("pin-shake");
            setTimeout(function () {
              dotsWrap.classList.remove("pin-shake");
              newPinStage = "new";
              newPinBuffer = "";
              renderPinDots(dotsWrap, "");
              document.getElementById("cp-step-label").textContent = "Enter a new 4-digit PIN.";
            }, 420);
          }
        }
      }, 200);
    }
  });

  function resetMachine() {
    var card = document.getElementById("card");
    card.classList.remove("inserting");
    document.getElementById("btn-insert").disabled = false;
    var cardEject = document.getElementById("card-eject");
    cardEject.style.animation = "";
    cardEject.style.transform = "";
    cardEject.style.opacity = "";
    document.getElementById("pin-error").textContent = "";
  }
})();
