# Authentication & Authorization Flow

This document details the JSON Web Token (JWT) lifecycle and role-based access control (RBAC) mechanism.

---

## 1. Sequence Diagram: JWT Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as User / Customer
    participant React as React Frontend
    participant API as Django REST API (/api/v1/auth/)
    participant DB as PostgreSQL

    Customer->>React: Enters username & password
    React->>API: POST /api/v1/auth/login/ { username, password }
    API->>DB: Query User & verify PBKDF2 hash
    alt Valid Credentials
        DB-->>API: User authenticated
        API-->>React: 200 OK { access, refresh, user: { id, username, role, full_name } }
        React->>React: Store tokens & user in localStorage / state
        React-->>Customer: Redirect to /dashboard
    else Invalid Credentials
        API-->>React: 401 Unauthorized { detail: "No active account found with given credentials" }
        React-->>Customer: Display error banner
    end

    Note over React, API: Authenticated API Requests
    Customer->>React: Navigates to My Accounts
    React->>API: GET /api/v1/accounts/ (Header: Bearer <access_token>)
    API->>API: Decode JWT & identify User role
    API->>DB: Query accounts filtered by request.user
    DB-->>API: Account list
    API-->>React: 200 OK [ accounts ]

    Note over React, API: Access Token Expiry & Silent Refresh
    Customer->>React: Action when access token has expired (15m)
    React->>API: GET /api/v1/accounts/
    API-->>React: 401 Unauthorized (token_expired)
    React->>API: POST /api/v1/auth/token/refresh/ { refresh: <refresh_token> }
    alt Refresh Token Valid
        API-->>React: 200 OK { access: <new_access_token> }
        React->>API: Retry original request with new access token
        API-->>React: 200 OK [ accounts ]
    else Refresh Token Expired or Invalid
        API-->>React: 401 Unauthorized
        React->>React: Clear auth state & redirect to /login
    end
```

---

## 2. Role-Based Permissions Matrix

| Endpoint | ADMIN | STAFF | CUSTOMER |
|---|---|---|---|
| `POST /api/v1/auth/register/` | Public / Open | Public / Open | Public / Open |
| `POST /api/v1/auth/login/` | Public / Open | Public / Open | Public / Open |
| `GET /api/v1/profile/` | Self | Self | Self |
| `GET /api/v1/customers/` | All customers | All customers | Forbidden (403) |
| `POST /api/v1/customers/` | Allowed | Allowed | Forbidden (403) |
| `GET /api/v1/accounts/` | All accounts | All accounts | Own accounts only |
| `PATCH /api/v1/accounts/{id}/status/` | Allowed | Allowed | Forbidden (403) |
| `POST /api/v1/transactions/deposit/` | Allowed | Allowed | Allowed (Own active accounts) |
| `POST /api/v1/transactions/withdraw/` | Allowed | Allowed | Allowed (Own active accounts) |
| `POST /api/v1/transactions/transfer/` | Allowed | Allowed | Allowed (Own active accounts) |
| `GET /api/v1/audit/` | Allowed | Allowed (Read) | Forbidden (403) |
| `GET /api/v1/dashboard/` | System overview | Staff metrics | Customer metrics & balance |
