# SmartBank Automated Testing Guide

This guide describes how to run and verify the test suites for both backend and frontend layers.

---

## 1. Backend Testing (Django & DRF)

The backend test suite covers:
* Authentication & JWT token generation.
* User roles & permission restrictions (RBAC).
* Customer profile creation & ownership.
* Bank account generation & balance security.
* Financial transaction rules:
  * Deposits increment balance accurately.
  * Withdrawals decrement balance.
  * Overdraft / insufficient balance prevention.
  * Negative / zero amount rejection.
  * Frozen and closed account transaction blocks.
  * Atomic rollback verification.
* Internal transfers between distinct accounts.
* Prevention of self-transfers.
* Beneficiary verification & ownership checks.
* In-app notification creation & read status.
* CSV statement export security.

### Running Backend Tests
Activate the virtual environment and execute:
```powershell
python backend/manage.py test backend.tests --verbosity=2
```

---

## 2. Frontend Testing (React)

The frontend features can be tested using Vite's development server or automated test runner:
* Form validation checks (amount, empty fields, password requirements).
* Axios interceptor token refresh flow.
* Route guards (`ProtectedRoute` and `RoleBasedRoute`).
* Error boundaries and notification toasts.

### Running Frontend Checks
```powershell
cd frontend
npm run build
```
This verifies that all JSX, imports, CSS, and components compile without syntax or type errors.
