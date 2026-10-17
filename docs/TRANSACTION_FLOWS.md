# Financial Transaction Workflows

This document details the core transaction workflows: Deposit, Withdrawal, and Internal Transfer. It highlights transactional integrity, database row-level locking (`select_for_update()`), and atomic rollbacks.

---

## 1. Sequence Diagram: Internal Account-to-Account Transfer

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Authenticated Customer
    participant React as Frontend Transfer Form
    participant API as Transaction API View
    participant TxService as Banking Transaction Service
    participant DB as PostgreSQL (smartbank_db)

    Customer->>React: Selects Source Account, Destination Account & Amount
    React->>API: POST /api/v1/transactions/transfer/ { source_account, destination_account, amount, description }
    API->>TxService: execute_transfer(user, source_acc_no, dest_acc_no, amount, description)

    activate TxService
    Note over TxService, DB: Begin transaction.atomic()
    TxService->>DB: Lock source & destination accounts ordered by ID: select_for_update()
    
    alt Source Account Not Owned by User or Frozen/Closed
        TxService-->>API: ValidationError("Unauthorized or invalid source account")
        API-->>React: 400 Bad Request
    else Destination Account Invalid or Same Account
        TxService-->>API: ValidationError("Invalid destination account")
        API-->>React: 400 Bad Request
    else Insufficient Available Balance
        TxService-->>API: ValidationError("Insufficient balance")
        API-->>React: 400 Bad Request
    else All Validations Pass
        TxService->>DB: UPDATE source_account SET balance = balance - amount
        TxService->>DB: UPDATE dest_account SET balance = balance + amount
        TxService->>DB: INSERT INTO transactions_transaction (ref, type='TRANSFER', ...)
        TxService->>DB: INSERT INTO notifications_notification (for sender & receiver)
        TxService->>DB: INSERT INTO audit_auditlog (action='TRANSFER_EXECUTED')
        Note over TxService, DB: Commit database transaction
        TxService-->>API: Transaction object created
        deactivate TxService
        API-->>React: 201 Created { transaction_ref, status: "SUCCESS", amount, new_balance }
        React-->>Customer: Show success receipt & update dashboard balance
    end
```

---

## 2. Deposit Workflow

1. Customer or Bank Staff selects an active destination account.
2. The user enters an amount ($> 0.00$).
3. Inside `transaction.atomic()`:
   * The destination account is locked with `select_for_update()`.
   * Verifies that the destination account status is `ACTIVE`.
   * Increments `balance = balance + amount`.
   * Creates a `Transaction` record with `transaction_type='DEPOSIT'`, `source_account=None`, and `destination_account=dest_account`.
   * Dispatches an in-app notification to the account owner.
   * Records an audit log entry.
4. Transaction commits; returns reference and updated balance.

---

## 3. Withdrawal Workflow

1. Customer selects their active account and specifies an amount.
2. Inside `transaction.atomic()`:
   * The source account is locked with `select_for_update()`.
   * Verifies ownership by the authenticated user (or Staff override).
   * Verifies that the account is `ACTIVE`.
   * Verifies `balance >= amount`. If insufficient, rolls back and raises `ValidationError("Insufficient balance.")`.
   * Decrements `balance = balance - amount`.
   * Creates a `Transaction` record with `transaction_type='WITHDRAWAL'`, `source_account=source_account`, and `destination_account=None`.
   * Dispatches an in-app notification.
   * Records an audit log entry.
5. Transaction commits; returns reference and remaining balance.

---

## 4. Concurrency Protection & Row Ordering

When transferring between Account A and Account B, locking them in arbitrary order can cause deadlocks if another concurrent process is transferring from Account B to Account A.
SmartBank avoids deadlocks by sorting the account IDs before acquiring locks:
```python
account_ids = sorted([source_id, dest_id])
accounts = BankAccount.objects.select_for_update().filter(id__in=account_ids)
```
This guarantees consistent acquisition order across all threads.
