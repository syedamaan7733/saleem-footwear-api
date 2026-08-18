# PIN-based Authentication — Design Spec

**Date:** 2026-08-18
**Repos affected:** `saleem-footwear-api` (API), `saleem-footwear` (website), `salim-mobile-app` (mobile)
**Status:** Approved for planning

## 1. Problem & Goal

Dealers find password login hard on both web and mobile. The client will
not spend money (OTP/SMS is ruled out). Replace the password with a
**6-digit numeric PIN**: easier to type on a phone (numeric keypad),
easier to remember, ₹0 cost.

Users are a **known B2B dealer base** (wholesale footwear ordering), not
anonymous public signups.

## 2. Decisions (locked)

- **Existing users** are seeded to a shared temporary PIN `966900`. Not a
  forced reset — instead a self-service **Change PIN** option is provided
  on web and mobile.
  - *Accepted residual risk:* until a dealer changes their PIN, their
    account is reachable by anyone who knows the phone number + the shared
    `966900`. The Change PIN option is the mitigation.
- **Brute-force protection:** per-account lockout — **10** failed
  attempts → **5-minute** cooldown.
- **Forgotten PIN:** **admin-assisted reset** (admin resets dealer back to
  `966900`). No OTP.
- **Spec + migration script live in the API repo.**

## 3. Constraints that shape the design

- **Serverless (Vercel).** In-memory `express-rate-limit` counters are
  unreliable across serverless instances → lockout state must be
  **persisted on the User document**, not in memory.
- **Mobile version skew.** Old installed app builds will keep sending the
  `password` field after the API deploys. The API must stay
  **backward-compatible**: accept either `pin` or `password`.

## 4. API Design (`saleem-footwear-api`)

### 4.1 User model (`models/User.js`)

- Keep the existing `password` field (bcrypt-hashed) as the stored
  credential — no DB rename, avoids churn. It now holds a 6-digit PIN.
- Add validation: PIN must match `^\d{6}$` (exactly 6 digits). Applied at
  the controller layer (register / change-pin / reset), since the stored
  value is a bcrypt hash and can't be schema-validated after hashing.
- Add lockout fields:
  - `failedPinAttempts: { type: Number, default: 0 }`
  - `lockUntil: { type: Date, default: null }`
- Existing `pre("save")` bcrypt hashing and `comparePassword` are reused
  unchanged.

### 4.2 Login (`controllers/authControllers.js` → `logIn`)

Wire contract: accept `pin` OR `password` (prefer `pin`) alongside the
existing `identifier`.

```
const credential = req.body.pin ?? req.body.password;
```

Flow:
1. Look up user by `identifier` (phone or email) — unchanged.
2. **If `lockUntil` is set and in the future** → reject with a clear
   "too many attempts, try again in N minutes" message (do not reveal
   whether the PIN was right).
3. Compare credential via `comparePassword`.
   - **Wrong:** increment `failedPinAttempts`. If it reaches 10, set
     `lockUntil = now + 5 min` and reset the counter. Save. Reject.
   - **Correct:** if `failedPinAttempts` or `lockUntil` are set, clear
     them (`failedPinAttempts = 0`, `lockUntil = null`) and save. Issue
     JWT as today.

The lockout check/counter is **per user document**, so one dealer's
mistakes never lock out another.

### 4.3 Register (`register`)

- Accept `pin` OR `password`.
- Validate `^\d{6}$` → `BadRequestError("PIN must be exactly 6 digits.")`.
- Otherwise unchanged (phone validation, first-user-is-admin, etc.).

### 4.4 New endpoint — Change PIN

`PATCH /api/v1/auth/change-pin` (authenticated)

- Body: `{ currentPin, newPin }`.
- Validate `newPin` = `^\d{6}$`.
- Load `req.user.userId`, verify `currentPin` via `comparePassword`
  (reject `UnauthenticatedError` if wrong).
- Reject if `newPin === currentPin`.
- Set `user.password = newPin` (pre-save re-hashes), clear lockout fields,
  save. Return success message.

Route added in `routes/authRoutes.js` guarded by `authenticateUser`.

### 4.5 New endpoint — Admin reset PIN

`PATCH /api/v1/users/:id/reset-pin` (admin only)

- Guarded by `authenticateUser` + `authorizePermission("admin")`.
- Sets target user's `password = "966900"`, clears `failedPinAttempts`
  and `lockUntil`, saves.
- Returns `{ msg: "PIN reset to temporary 966900." }` (no credential echo
  beyond the known shared temp value).

Added to `routes/userRoutes.js`; handler in `controllers/userController.js`.

### 4.6 Migration script

`scripts/seed-pins.cjs` (new): connects via existing `db/connect`, and for
**every** existing user sets `password = bcrypt(966900)` and initializes
`failedPinAttempts = 0`, `lockUntil = null`. Idempotent, run once
manually. Uses the model's hashing (load doc, set `password`, `.save()`)
so hashing is consistent.

## 5. Website (`saleem-footwear`)

- `src/components/auth/Login.jsx`: relabel "Password" → "PIN"; input
  `inputMode="numeric"`, `maxLength={6}`, pattern digits-only; keep the
  show/hide eye. Send `{ identifier, pin }`.
- `src/components/auth/Register.jsx`: same relabel + 6-digit numeric PIN
  and confirm-PIN.
- `src/components/user/Profile.jsx`: add a **Change PIN** control
  (currentPin, newPin, confirm) calling `PATCH /auth/change-pin`.
- `src/components/Admin/AllCustomers.jsx`: add a per-dealer **Reset PIN**
  button calling `PATCH /users/:id/reset-pin`, with a confirm step.

## 6. Mobile (`salim-mobile-app`)

- `app/(auth)/login.tsx` + `components/auth/AuthPhonePasswordForm.tsx`:
  PIN field — `keyboardType="number-pad"`, `maxLength={6}`, secure entry;
  zod `regex(/^\d{6}$/, 'Enter your 6-digit PIN')`. Keep sending via the
  existing `login()`; the service may send `pin` (new) — API still accepts
  old `password` for un-updated installs.
- `app/(auth)/sign-up.tsx` + `components/auth/AuthSignUpForm.tsx`: 6-digit
  PIN + confirm.
- `components/layout/ProfileDrawer.tsx`: add a **Change PIN** entry (new
  small screen/modal) calling `PATCH /auth/change-pin`.
- `app/(auth)/forgot-password.tsx`: replace the OTP copy with
  "Contact admin to reset your PIN."
- Relabel user-facing "Password" strings to "PIN".

## 7. UI detail

Single secure **numeric field** (not 6 separate boxes) on both platforms —
simpler and consistent. Boxed OTP-style input is a possible later polish,
not in scope.

## 8. Out of scope (YAGNI)

- OTP / SMS anything.
- Self-service forgot-PIN without admin (no recovery channel budget).
- Renaming the DB `password` field to `pin`.
- Refresh-token / long-lived session rework (raised as a future option,
  not included).

## 9. Testing

- **API:** unit/integration for login (correct, wrong, lockout at 10,
  lockout expiry, `pin` vs `password` field), change-pin (happy, wrong
  current, bad format, same-as-current), admin reset (admin allowed,
  non-admin forbidden), register PIN validation.
- **Migration:** run against a scratch DB copy; assert every user logs in
  with `966900` afterward and lockout fields initialized.
- **Clients:** manual smoke of login/register/change-pin on web and
  mobile; verify old-build compatibility by posting `password` to login.

## 10. Rollout order

1. Deploy **API** (backward-compatible: accepts `pin` and `password`).
2. Run **migration** seeding `966900`.
3. Communicate `966900` + "change your PIN in Profile" to dealers.
4. Ship **website**.
5. Ship **mobile** (old installs keep working until users update).
