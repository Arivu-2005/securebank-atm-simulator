import json
import os
from datetime import datetime


class Account:
    def __init__(self, customer_name, pin, balance, history=None):
        self.customer_name = customer_name
        self.pin = str(pin)
        self.balance = float(balance)
        self.history = history if history is not None else []

    def verify_pin(self, entered_pin):
        return self.pin == str(entered_pin)

    def deposit(self, amount):
        self.balance += amount
        self.history.insert(0, f"Deposited Rs. {amount:,.2f}")

    def withdraw(self, amount):
        self.balance -= amount
        self.history.insert(0, f"Withdrew Rs. {amount:,.2f}")

    def change_pin(self, new_pin):
        self.pin = str(new_pin)

    def to_dict(self):
        return {
            "customer_name": self.customer_name,
            "pin": self.pin,
            "balance": self.balance,
            "history": self.history,
        }


class ATM:
    def __init__(self, filepath="account.json"):
        self.filepath = filepath
        self.account = None
        self.load_from_file()

    def load_from_file(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, "r") as file:
                    data = json.load(file)
                    self.account = Account(
                        data["customer_name"], data["pin"], data["balance"], data.get("history", [])
                    )
            except (json.JSONDecodeError, KeyError):
                self.account = self._default_account()
        else:
            self.account = self._default_account()
            self.save_to_file()

    def _default_account(self):
        # Seed data, used if no account.json is found yet.
        return Account(
            customer_name="Priya Raman",
            pin="1234",
            balance=9800.0,
            history=[
                "Deposited Rs. 500", "Deposited Rs. 23", "Withdrew Rs. 45", "Deposited Rs. 5567",
                "Deposited Rs. 250", "Deposited Rs. 350", "Withdrew Rs. 350", "Deposited Rs. 2",
                "Withdrew Rs. 350", "Withdrew Rs. 947", "Deposited Rs. 500", "Withdrew Rs. 250",
                "Deposited Rs. 350", "Withdrew Rs. 600", "Deposited Rs. 250", "Withdrew Rs. 350",
                "Withdrew Rs. 450", "Deposited Rs. 350",
            ],
        )

    def save_to_file(self):
        with open(self.filepath, "w") as file:
            json.dump(self.account.to_dict(), file, indent=4)

    # ---- PIN check with limited attempts ----
    def authenticate(self, max_attempts=3):
        print(f"\nWelcome. Please insert your card. (Account holder on file: {self.account.customer_name})")
        for attempt in range(1, max_attempts + 1):
            entered = input("Enter your 4-digit PIN: ").strip()
            if self.account.verify_pin(entered):
                print(f"\n[Success] PIN accepted. Hello, {self.account.customer_name}!")
                return True
            remaining = max_attempts - attempt
            if remaining > 0:
                print(f"[Error] Incorrect PIN. {remaining} attempt(s) remaining.")
            else:
                print("[Error] Too many incorrect attempts. Card retained. Goodbye.")
        return False

    # ---- transactions ----
    def check_balance(self):
        print("\n" + "-" * 40)
        print(f"Account Holder : {self.account.customer_name}")
        print(f"Available Balance: Rs. {self.account.balance:,.2f}")
        print("-" * 40)

    def deposit_cash(self, amount):
        if amount <= 0:
            print("\n[Error] Deposit amount must be greater than zero!")
            return False
        self.account.deposit(amount)
        self.save_to_file()
        print(f"\n[Success] Rs. {amount:,.2f} deposited. New balance: Rs. {self.account.balance:,.2f}")
        return True

    def withdraw_cash(self, amount):
        if amount <= 0:
            print("\n[Error] Withdrawal amount must be greater than zero!")
            return False
        if amount % 100 != 0:
            print("\n[Error] Amount must be in multiples of Rs. 100!")
            return False
        if amount > self.account.balance:
            print("\n[Error] Insufficient balance!")
            return False
        self.account.withdraw(amount)
        self.save_to_file()
        print(f"\n[Success] Please collect Rs. {amount:,.2f}. New balance: Rs. {self.account.balance:,.2f}")
        return True

    def change_pin(self, old_pin, new_pin, confirm_pin):
        if not self.account.verify_pin(old_pin):
            print("\n[Error] Current PIN is incorrect!")
            return False
        if new_pin != confirm_pin:
            print("\n[Error] New PIN and confirmation do not match!")
            return False
        if len(new_pin) != 4 or not new_pin.isdigit():
            print("\n[Error] PIN must be exactly 4 digits!")
            return False
        self.account.change_pin(new_pin)
        self.save_to_file()
        print("\n[Success] PIN changed successfully!")
        return True

    def mini_statement(self, count=10):
        if not self.account.history:
            print("\nNo transactions found.")
            return
        print("\n" + "=" * 45)
        print(f"{'MINI STATEMENT':^45}")
        print("=" * 45)
        for entry in self.account.history[:count]:
            print(f" - {entry}")
        print("=" * 45)


def main():
    atm = ATM()

    if not atm.authenticate():
        return

    while True:
        print("\n========================================")
        print("            SECUREBANK ATM              ")
        print("========================================")
        print("1. Check Balance")
        print("2. Withdraw Cash")
        print("3. Deposit Cash")
        print("4. Mini Statement")
        print("5. Change PIN")
        print("6. Exit / Eject Card")
        print("========================================")

        choice = input("Enter your choice (1-6): ").strip()

        if choice == "1":
            atm.check_balance()
        elif choice == "2":
            try:
                amount = float(input("Enter amount to withdraw: Rs. "))
                atm.withdraw_cash(amount)
            except ValueError:
                print("\n[Error] Invalid input! Amount must be numeric.")
        elif choice == "3":
            try:
                amount = float(input("Enter amount to deposit: Rs. "))
                atm.deposit_cash(amount)
            except ValueError:
                print("\n[Error] Invalid input! Amount must be numeric.")
        elif choice == "4":
            atm.mini_statement()
        elif choice == "5":
            old_pin = input("Enter current PIN: ").strip()
            new_pin = input("Enter new PIN: ").strip()
            confirm_pin = input("Confirm new PIN: ").strip()
            atm.change_pin(old_pin, new_pin, confirm_pin)
        elif choice == "6":
            print(f"\nThank you for banking with SecureBank, {atm.account.customer_name}. Please take your card. Goodbye!\n")
            break
        else:
            print("\n[Error] Invalid choice! Please select an option between 1 and 6.")


if __name__ == "__main__":
    main()
