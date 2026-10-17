# Database Relationships Rationale & Cardinality

This document explains why each relational link exists, its cardinalities, foreign key delete rules, and transactional integrity guarantees.

---

## 1. User to CustomerProfile (One-to-One)

* **Cardinality:** `1 : 0..1` (A User with role `CUSTOMER` has exactly one `CustomerProfile`. Staff and Admin users may exist without a CustomerProfile).
* **ForeignKey Rule:** `on_delete=models.CASCADE`
* **Why it exists:** Keeps authentication credentials separate from customer demographic data. This enables staff and admin users to log in through the same auth mechanism without having to invent dummy customer addresses or phone numbers.

---

## 2. CustomerProfile to BankAccount (One-to-Many)

* **Cardinality:** `1 : 0..N` (One customer can hold multiple accounts, such as one Savings account and one Current account).
* **ForeignKey Rule:** `on_delete=models.PROTECT`
* **Why it exists:** A customer cannot be deleted from the database if they still own bank accounts with historical balances. This prevents accidental deletion of financial records.

---

## 3. BankAccount to Transaction (One-to-Many, Dual-Role)

* **Cardinalities:**
  * Source Account: `1 : 0..N` (`source_account`)
  * Destination Account: `1 : 0..N` (`destination_account`)
* **ForeignKey Rule:** `on_delete=models.PROTECT`
* **Why it exists:**
  * In a **Deposit**, `source_account` is NULL, and `destination_account` is the credited account.
  * In a **Withdrawal**, `source_account` is the debited account, and `destination_account` is NULL.
  * In a **Transfer**, both `source_account` and `destination_account` are populated.
  * Accounts tied to transactions can never be deleted from the database (`PROTECT`), ensuring strict auditability.

---

## 4. CustomerProfile to Beneficiary (One-to-Many)

* **Cardinality:** `1 : 0..N` (A customer can save multiple trusted payees).
* **ForeignKey Rule:** `on_delete=models.CASCADE`
* **Why it exists:** Allows customers to save recipient accounts for easy transfer initiation without having to re-enter account numbers.

---

## 5. BankAccount to Beneficiary (One-to-Many)

* **Cardinality:** `1 : 0..N` (A BankAccount can be saved as a beneficiary by other customers).
* **ForeignKey Rule:** `on_delete=models.CASCADE`
* **Why it exists:** Validates that beneficiaries point to valid internal bank accounts within SmartBank.

---

## 6. User to Notification (One-to-Many)

* **Cardinality:** `1 : 0..N` (A user receives multiple transaction alerts, security notices, and status change alerts).
* **ForeignKey Rule:** `on_delete=models.CASCADE`
* **Why it exists:** Enables personalized customer communications and dashboard alert badges.

---

## 7. User to AuditLog (One-to-Many)

* **Cardinality:** `1 : 0..N` (An actor triggers multiple audit actions).
* **ForeignKey Rule:** `on_delete=models.SET_NULL`
* **Why it exists:** Even if an administrator or staff user account is removed, the audit log entries must remain intact to preserve forensic history.
