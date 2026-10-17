# SmartBank Entity-Relationship Diagram (ERD)

This document visualizes and outlines all entities, attributes, primary keys, foreign keys, and cardinalities for the SmartBank Customer Management System.

## Mermaid ERD

```mermaid
erDiagram
    USER ||--o| CUSTOMER_PROFILE : "has"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ AUDIT_LOG : "triggers"
    CUSTOMER_PROFILE ||--o{ BANK_ACCOUNT : "owns"
    CUSTOMER_PROFILE ||--o{ BENEFICIARY : "manages"
    BANK_ACCOUNT ||--o{ TRANSACTION : "source_for"
    BANK_ACCOUNT ||--o{ TRANSACTION : "destination_for"
    BANK_ACCOUNT ||--o{ BENEFICIARY : "referenced_by"

    USER {
        bigint id PK
        string username UK
        string email
        string password_hash
        string role "ADMIN | STAFF | CUSTOMER"
        boolean is_active
        timestamp date_joined
        timestamp last_login
    }

    CUSTOMER_PROFILE {
        bigint id PK
        bigint user_id FK, UK
        string full_name
        string phone_number
        text address
        date date_of_birth
        timestamp created_at
        timestamp updated_at
    }

    BANK_ACCOUNT {
        bigint id PK
        bigint customer_id FK
        string account_number UK
        string account_type "SAVINGS | CURRENT"
        decimal balance "15, 2"
        string status "ACTIVE | FROZEN | CLOSED"
        string currency "USD"
        timestamp created_at
        timestamp updated_at
    }

    TRANSACTION {
        bigint id PK
        string transaction_ref UK
        string transaction_type "DEPOSIT | WITHDRAWAL | TRANSFER"
        bigint source_account_id FK "nullable"
        bigint destination_account_id FK "nullable"
        decimal amount "15, 2"
        string status "SUCCESS | FAILED"
        string description
        timestamp created_at
    }

    BENEFICIARY {
        bigint id PK
        bigint customer_id FK
        string beneficiary_name
        bigint beneficiary_account_id FK
        boolean is_active
        timestamp created_at
    }

    NOTIFICATION {
        bigint id PK
        bigint user_id FK
        string title
        text message
        boolean is_read
        timestamp created_at
    }

    AUDIT_LOG {
        bigint id PK
        bigint user_id FK "nullable"
        string action
        string target_type
        string target_id
        string ip_address
        json details
        timestamp created_at
    }
```

---

## Entity Summary Table

| Entity | Primary Key | Key Foreign Keys | Purpose |
|---|---|---|---|
| **User** | `id` | None | Base credentials, login, and authorization role (`ADMIN`, `STAFF`, `CUSTOMER`). |
| **CustomerProfile** | `id` | `user_id` (OneToOne) | Personal info for customers (Name, Phone, Address, DOB). |
| **BankAccount** | `id` | `customer_id` (ForeignKey) | Bank accounts holding simulated currency balances. |
| **Transaction** | `id` | `source_account_id` (FK, Nullable), `destination_account_id` (FK, Nullable) | Immutable financial ledger records for Deposits, Withdrawals, Transfers. |
| **Beneficiary** | `id` | `customer_id` (FK), `beneficiary_account_id` (FK) | Saved payee accounts for simplified internal money transfers. |
| **Notification** | `id` | `user_id` (FK) | Real-time in-app customer alerts for transaction & account updates. |
| **AuditLog** | `id` | `user_id` (FK, Nullable) | Security and compliance tracking for administrative actions. |
