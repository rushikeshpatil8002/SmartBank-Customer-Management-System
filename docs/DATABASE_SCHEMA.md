# SmartBank Database Schema Specification

This document provides exact field definitions, constraints, data types, and indexes for all database tables managed by the Django ORM on PostgreSQL.

---

## 1. Table: `accounts_user` (Custom User Model)

* Inherits from Django's `AbstractUser`.
* **Primary Key:** `id` (BigAutoField)
* **Fields:**
  * `username`: `VARCHAR(150)`, UNIQUE, NOT NULL
  * `email`: `VARCHAR(254)`, NULLABLE
  * `password`: `VARCHAR(128)`, NOT NULL (stores PBKDF2-SHA256 password hash)
  * `role`: `VARCHAR(20)`, NOT NULL, DEFAULT `'CUSTOMER'`. Choices: `['ADMIN', 'STAFF', 'CUSTOMER']`
  * `is_active`: `BOOLEAN`, NOT NULL, DEFAULT `TRUE`
  * `is_staff`: `BOOLEAN`, NOT NULL, DEFAULT `FALSE`
  * `is_superuser`: `BOOLEAN`, NOT NULL, DEFAULT `FALSE`
  * `date_joined`: `TIMESTAMPTZ`, NOT NULL
  * `last_login`: `TIMESTAMPTZ`, NULLABLE

---

## 2. Table: `customers_customerprofile`

* **Primary Key:** `id` (BigAutoField)
* **Foreign Keys:**
  * `user_id`: BIGINT, UNIQUE, NOT NULL, REFERENCES `accounts_user(id)` ON DELETE CASCADE
* **Fields:**
  * `full_name`: `VARCHAR(255)`, NOT NULL
  * `phone_number`: `VARCHAR(20)`, NOT NULL
  * `address`: `TEXT`, NOT NULL
  * `date_of_birth`: `DATE`, NULLABLE
  * `created_at`: `TIMESTAMPTZ`, NOT NULL (auto_now_add)
  * `updated_at`: `TIMESTAMPTZ`, NOT NULL (auto_now)

---

## 3. Table: `banking_bankaccount`

* **Primary Key:** `id` (BigAutoField)
* **Foreign Keys:**
  * `customer_id`: BIGINT, NOT NULL, REFERENCES `customers_customerprofile(id)` ON DELETE PROTECT
* **Fields:**
  * `account_number`: `VARCHAR(12)`, UNIQUE, NOT NULL, INDEXED (e.g. `SB1001234567`)
  * `account_type`: `VARCHAR(20)`, NOT NULL, DEFAULT `'SAVINGS'`. Choices: `['SAVINGS', 'CURRENT']`
  * `balance`: `NUMERIC(15, 2)`, NOT NULL, DEFAULT `0.00`, CHECK (`balance >= 0.00`)
  * `status`: `VARCHAR(20)`, NOT NULL, DEFAULT `'ACTIVE'`. Choices: `['ACTIVE', 'FROZEN', 'CLOSED']`
  * `currency`: `VARCHAR(3)`, NOT NULL, DEFAULT `'USD'`
  * `created_at`: `TIMESTAMPTZ`, NOT NULL (auto_now_add)
  * `updated_at`: `TIMESTAMPTZ`, NOT NULL (auto_now)

---

## 4. Table: `transactions_transaction`

* **Primary Key:** `id` (BigAutoField)
* **Foreign Keys:**
  * `source_account_id`: BIGINT, NULLABLE, REFERENCES `banking_bankaccount(id)` ON DELETE PROTECT
  * `destination_account_id`: BIGINT, NULLABLE, REFERENCES `banking_bankaccount(id)` ON DELETE PROTECT
* **Fields:**
  * `transaction_ref`: `VARCHAR(32)`, UNIQUE, NOT NULL, INDEXED (e.g. `TXN20261018ABCD1234`)
  * `transaction_type`: `VARCHAR(20)`, NOT NULL. Choices: `['DEPOSIT', 'WITHDRAWAL', 'TRANSFER']`
  * `amount`: `NUMERIC(15, 2)`, NOT NULL, CHECK (`amount > 0.00`)
  * `status`: `VARCHAR(20)`, NOT NULL, DEFAULT `'SUCCESS'`. Choices: `['SUCCESS', 'FAILED']`
  * `description`: `VARCHAR(255)`, NOT NULL
  * `created_at`: `TIMESTAMPTZ`, NOT NULL (auto_now_add), INDEXED

---

## 5. Table: `beneficiaries_beneficiary`

* **Primary Key:** `id` (BigAutoField)
* **Foreign Keys:**
  * `customer_id`: BIGINT, NOT NULL, REFERENCES `customers_customerprofile(id)` ON DELETE CASCADE
  * `beneficiary_account_id`: BIGINT, NOT NULL, REFERENCES `banking_bankaccount(id)` ON DELETE CASCADE
* **Fields:**
  * `beneficiary_name`: `VARCHAR(150)`, NOT NULL
  * `is_active`: `BOOLEAN`, NOT NULL, DEFAULT `TRUE`
  * `created_at`: `TIMESTAMPTZ`, NOT NULL (auto_now_add)
* **Unique Constraints:** `(customer_id, beneficiary_account_id)` unique together.

---

## 6. Table: `notifications_notification`

* **Primary Key:** `id` (BigAutoField)
* **Foreign Keys:**
  * `user_id`: BIGINT, NOT NULL, REFERENCES `accounts_user(id)` ON DELETE CASCADE
* **Fields:**
  * `title`: `VARCHAR(150)`, NOT NULL
  * `message`: `TEXT`, NOT NULL
  * `is_read`: `BOOLEAN`, NOT NULL, DEFAULT `FALSE`, INDEXED
  * `created_at`: `TIMESTAMPTZ`, NOT NULL (auto_now_add), INDEXED

---

## 7. Table: `audit_auditlog`

* **Primary Key:** `id` (BigAutoField)
* **Foreign Keys:**
  * `user_id`: BIGINT, NULLABLE, REFERENCES `accounts_user(id)` ON DELETE SET_NULL
* **Fields:**
  * `action`: `VARCHAR(100)`, NOT NULL
  * `target_type`: `VARCHAR(100)`, NOT NULL
  * `target_id`: `VARCHAR(100)`, NOT NULL
  * `ip_address`: `GENERIC_IP_ADDRESS`, NULLABLE
  * `details`: `JSONB`, NOT NULL, DEFAULT `{}`
  * `created_at`: `TIMESTAMPTZ`, NOT NULL (auto_now_add), INDEXED
