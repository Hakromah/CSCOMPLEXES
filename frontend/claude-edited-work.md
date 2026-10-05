# Changes made by Claude — 5 October 2026

Base commit: `7e67395` ("grading system updated to 20 instead of 100%").
All work is in the working tree, not yet committed.

**Summary:** two security problems fixed, and every hardcoded credential removed
from the repository. No feature code, no grading logic and no UI was changed.

---

## 1. Eleven admin API routes had no authentication

**File:** `strapicms/src/api/school-admin/controllers/school-admin.ts` (+33 lines)

In `routes/school-admin.ts`, 15 routes are declared `config: { auth: false }`.
That turns off Strapi's own permission layer, so each handler is expected to
check the caller itself by calling the `_verifyAdmin(ctx)` helper at the bottom
of the controller (line ~740).

Four handlers did this. **Eleven did not** — they ran straight through with no
token check at all. `assignTeacher`, for example, was three lines: read the body,
call the service, return. Anyone who could reach the API could call them.

The eleven, now fixed:

| Method | Path | Handler |
|---|---|---|
| POST | `/admin/assign-teacher` | `assignTeacher` |
| POST | `/admin/assign-student` | `assignStudent` |
| POST | `/admin/unassign-teacher` | `unassignTeacher` |
| POST | `/admin/unassign-student` | `unassignStudent` |
| GET | `/admin/teachers/:teacherId/classes` | `getClassesForTeacher` |
| GET | `/admin/students/:studentId/classes` | `getClassesForStudent` |
| GET | `/admin/certificates` | `getAllCertificates` |
| POST | `/admin/certificates` | `createCertificate` |
| PUT | `/admin/certificates/:id/revoke` | `revokeCertificate` |
| GET | `/admin/certificate-types` | `getCertificateTypes` |
| GET | `/admin/certificate-mentions` | `getCertificateMentions` |

In practice this meant an unauthenticated caller could **issue or revoke any
certificate**, list every certificate in the system, and move students and
teachers between classes.

Each handler now opens with the same guard the four correct ones already used:

```ts
async assignTeacher(ctx: any) {
  // Route is auth:false, so the caller must be checked here.
  const user = await _verifyAdmin(ctx);
  if (!user) return;
  ...
```

No new helper was written and no route config changed — this reuses the existing
`_verifyAdmin`, so behaviour matches `deleteTranscript`: no token → 401,
valid token but `schoolRole !== 'ADMIN'` → 403.

### Verifying it

```bash
# before: 200 with data. after: 401
curl -i https://api.2cscomplexes.com/admin/certificates

# with a real ADMIN token: still 200
curl -i -H "Authorization: Bearer <admin JWT>" \
     https://api.2cscomplexes.com/admin/certificates
```

**Heads-up:** if the admin UI now shows empty certificate lists, it means the
frontend was never sending a token to these routes — which is precisely why they
worked while unauthenticated. That is the bug surfacing, not a regression. The
fix is to make those frontend calls send the `Authorization` header.

---

## 2. A live Figma access token was committed to the repository

**Files removed:** `frontend/my token`, `frontend/figma_design.json`

- `frontend/my token` — 45 bytes, a Figma personal access token (`figd_` prefix).
- `frontend/figma_design.json` — 207 KB Figma API dump, a build artifact.

Neither was imported by any source file (checked across `app/`, `components/`,
`lib/`, `hooks/`), so removing them breaks nothing. Both are now deleted and
untracked, and `frontend/.gitignore` has been extended so they cannot return.

### ⚠️ Still required — deleting the file does NOT revoke the token

The token remains in git history and must be revoked by hand:
**figma.com → Settings → Security → Personal access tokens → revoke.**

---

## 3. Hardcoded database password removed; stray debug files deleted

Ten files at the two project roots were tracked in git. Eight were one-off debug
or test scripts with no caller; five of those, plus two worth keeping, hardcoded
the **Postgres superuser password**.

**Deleted** (verified first: zero references from any source file, `package.json`
script, or CI — there is no CI):

| File | What it was |
|---|---|
| `frontend/raw.json` | a captured `/auth/local` response — real JWT **plus** a real person's date of birth, phone and home address |
| `frontend/test-auth.js` | logs in as an admin account with the password `admin` |
| `frontend/test-remote.js` | hits a LAN IP as a production admin; its own comment describes guessing the password |
| `strapicms/debug_parent_certs.js` | dumps all certificates and all STUDENT/PARENT users to console |
| `strapicms/diagnose_cert.js` | prints the `certificates` table |
| `strapicms/test_family.js` | dumps `families` and link tables |
| `strapicms/db-error.txt` | a stack trace from an unrelated project |
| `strapicms/write-engine.ps1` | PowerShell that regenerates `academic-engine.ts`; duplicated a real committed source file, so it was ambiguous which was authoritative |

**Kept, with the credential removed** — these do real work you may need again:

- `strapicms/seed_certificates.js` — seeds the 7 certificate types and 5 mentions
- `strapicms/migrate_cert_status.js` — adds the `cert_status` column

Both now read the same `DATABASE_*` variables as `config/database.ts`
(`DATABASE_URL`, or `DATABASE_HOST` / `PORT` / `NAME` / `USERNAME` / `PASSWORD`),
so they connect exactly the way the app does. Each exits with a clear message if
no password is set. Run them from `strapicms/` so `.env` is loaded:

```bash
node -r dotenv/config seed_certificates.js
node -r dotenv/config migrate_cert_status.js
```

`migrate_cert_status.js` also lost a `process.chdir('C:\\Users\\pc\\...')` line
and a `require('./node_modules/pg')` path, so it now runs on macOS and Linux too.

A repository-wide search confirms the password string appears in **no file**.

### ⚠️ Still required — the password must be rotated

It remains in git history. Change it in Postgres **and** in the server's `.env`
at the same time, or the app loses its database connection.

---

## What was NOT changed

Deliberately left alone — these need a decision, not a patch:

1. **The database password still needs rotating** (see section 3) — removing it
   from the files does not remove it from git history.

2. **Auth in the frontend is decorative.** `frontend/middleware.ts:13` is
   `if (!accessToken)` — a truthiness test; the JWT signature is never verified.
   The role comes from a separate `userRole` cookie that the browser writes
   itself (`app/login/page.tsx:79-83`, not `httpOnly`, no `secure`, no
   `sameSite`). Setting `document.cookie = "accessToken=x; userRole=ADMIN"` loads
   the admin portal. Most API endpoints re-check the role server-side, so this
   mainly exposes the UI shell rather than the data — but it should be reworked
   to verify the JWT in middleware and read the role from the verified claims.

3. **A grading conversion bug** in `strapicms/src/api/school-admin/services/`:
   `academic-engine.ts:28` and `school-admin.ts:779` infer the marking scale from
   the *size* of the score (`if (num > 20)`) instead of using `maxScore`, which is
   already in scope. A score of 20 or less against a 100-mark exam is read as if
   it were already out of 20 — so **12/100 is recorded as 12/20, "Passable,
   Admis(e)"**, a pass. Scores above 20 convert correctly, so only the weakest
   results are affected. Latent if every exam is now marked out of 20; left
   unfixed pending confirmation.

4. **The driver portal is entirely in English** (`frontend/app/driver/`, 20 of 20
   user-facing strings) while the rest of the app is French. Also a register
   mismatch: "Transit Asset Config", "Alert System" are dispatcher jargon, not
   words for a school bus driver.

---

## How this was checked

- `tsc --noEmit` on **both** projects before and after: **0 errors** each time.
- The same script that found the eleven open routes was re-run after the fix:
  **15 of 15 routes verified, 0 open.**
- Type-checking proves the code compiles; it does **not** prove the guard behaves
  correctly at runtime. The `curl` checks above have not been run — please run
  them before deploying.

Nothing was committed, pushed or deployed.
