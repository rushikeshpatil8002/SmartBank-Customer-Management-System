# SmartBank REST API Documentation

All API routes are prefixed with `/api/v1/`. Responses return standard JSON formats with appropriate HTTP status codes.

---

## 1. Authentication Endpoints

### 1.1 User Registration
* **Endpoint:** `POST /api/v1/auth/register/`
* **Auth Required:** No
* **Request Body:**
  ```json
  {
    "username": "johndoe",
    "password": "Password123!",
    "email": "johndoe@example.com",
    "full_name": "John Doe",
    "phone_number": "+1234567890",
    "address": "123 Wall Street, NY",
    "date_of_birth": "1995-05-15",
    "account_type": "SAVINGS"
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "message": "Customer registered successfully",
    "user": {
      "id": 1,
      "username": "johndoe",
      "role": "CUSTOMER"
    },
    "account_number": "SB1001827465"
  }
  ```

### 1.2 User Login
* **Endpoint:** `POST /api/v1/auth/login/`
* **Auth Required:** No
* **Request Body:**
  ```json
  {
    "username": "johndoe",
    "password": "Password123!"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "access": "eyJhbGciOi...",
    "refresh": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "johndoe@example.com",
      "role": "CUSTOMER",
      "full_name": "John Doe"
    }
  }
  ```

### 1.3 Refresh Token
* **Endpoint:** `POST /api/v1/auth/token/refresh/`
* **Auth Required:** No
* **Request Body:** `{"refresh": "eyJhbGciOi..."}`
* **Success Response (200 OK):** `{"access": "eyJhbGciOi..."}`

---

## 2. Customer Profile Endpoints

### 2.1 Get Current User Profile
* **Endpoint:** `GET /api/v1/profile/`
* **Auth Required:** Yes (Bearer token)
* **Success Response (200 OK):**
  ```json
  {
    "id": 1,
    "username": "johndoe",
    "email": "johndoe@example.com",
    "role": "CUSTOMER",
    "profile": {
      "full_name": "John Doe",
      "phone_number": "+1234567890",
      "address": "123 Wall Street, NY",
      "date_of_birth": "1995-05-15"
    }
  }
  ```

### 2.2 Update Profile
* **Endpoint:** `PATCH /api/v1/profile/`
* **Auth Required:** Yes
* **Request Body:** `{"phone_number": "+1987654321", "address": "456 Broadway, NY"}`
* **Success Response (200 OK):** Updated user profile object.

---

## 3. Customer Directory (Admin / Staff)

* `GET /api/v1/customers/` (List, search, filter customers)
* `POST /api/v1/customers/` (Create new customer by Staff)
* `GET /api/v1/customers/{id}/` (Retrieve specific customer details)
* `PATCH /api/v1/customers/{id}/` (Update customer info or deactivate)

---

## 4. Bank Accounts

### 4.1 List Accounts
* **Endpoint:** `GET /api/v1/accounts/`
* **Auth Required:** Yes
* **Behavior:** Customers view only their own accounts; Staff/Admins view all accounts.
* **Success Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "account_number": "SB1001827465",
      "account_type": "SAVINGS",
      "balance": "5420.50",
      "status": "ACTIVE",
      "currency": "USD",
      "created_at": "2026-10-18T00:00:00Z"
    }
  ]
  ```

### 4.2 Create Account
* **Endpoint:** `POST /api/v1/accounts/`
* **Auth Required:** Yes (Staff / Admin, or permitted Customer)
* **Request Body:** `{"account_type": "CURRENT", "initial_deposit": 500.00}`

### 4.3 Update Account Status
* **Endpoint:** `PATCH /api/v1/accounts/{id}/status/`
* **Auth Required:** Yes (`ADMIN` or `STAFF`)
* **Request Body:** `{"status": "FROZEN"}`

---

## 5. Transactions

### 5.1 Simulated Deposit
* **Endpoint:** `POST /api/v1/transactions/deposit/`
* **Auth Required:** Yes
* **Request Body:**
  ```json
  {
    "account_number": "SB1001827465",
    "amount": "250.00",
    "description": "Salary deposit simulation"
  }
  ```

### 5.2 Simulated Withdrawal
* **Endpoint:** `POST /api/v1/transactions/withdraw/`
* **Auth Required:** Yes
* **Request Body:**
  ```json
  {
    "account_number": "SB1001827465",
    "amount": "50.00",
    "description": "ATM cash withdrawal"
  }
  ```

### 5.3 Internal Transfer
* **Endpoint:** `POST /api/v1/transactions/transfer/`
* **Auth Required:** Yes
* **Request Body:**
  ```json
  {
    "source_account_number": "SB1001827465",
    "destination_account_number": "SB1002938475",
    "amount": "120.00",
    "description": "Rent share payment"
  }
  ```

### 5.4 Transaction History & Statement Export
* `GET /api/v1/transactions/` (Filter by `account_number`, `type`, `start_date`, `end_date`)
* `GET /api/v1/transactions/export-csv/?account_number=SB1001827465` (Streams RFC 4180 compliant CSV statement)

---

## 6. Beneficiaries

* `GET /api/v1/beneficiaries/` (List customer's saved payees)
* `POST /api/v1/beneficiaries/` (Add new beneficiary with account number verification)
* `DELETE /api/v1/beneficiaries/{id}/` (Remove beneficiary)

---

## 7. Notifications

* `GET /api/v1/notifications/` (List notifications for current user with unread count)
* `PATCH /api/v1/notifications/{id}/read/` (Mark single notification as read)
* `POST /api/v1/notifications/mark-all-read/` (Mark all notifications read)

---

## 8. Dashboard Analytics

* `GET /api/v1/dashboard/`
* **Behavior:**
  * For `CUSTOMER`: Returns aggregate balance, account cards, recent transactions, unread notifications.
  * For `ADMIN` / `STAFF`: Returns total customers, total accounts, active vs frozen counts, deposit/withdrawal volume totals, recent system transactions.
