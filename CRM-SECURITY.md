# CRM Security Remediation — 2026-02-26

## Overview

Two rounds of security audits on crm.adwoodconsulting.com. Round 1 found 3 CRITICAL + 5 HIGH. Round 2 found 1 CRITICAL + 3 HIGH + 4 MEDIUM + 2 LOW. All fixed and deployed.

**Supabase Project ID**: `kddkibsrdgtcorhrtjip`
**Repo**: `https://github.com/Alijah8/adwood-crm.git`
**Round 1 commit**: `9a77eb1` on `main`
**Round 2 commit**: `ac0a648` on `main`

---

## Round 1 — CRITICAL Fixes

### C1: handle_new_user() trigger hardcoded to 'sales'
- **Migration**: `fix_handle_new_user_hardcode_sales_role`
- **Problem**: Trigger trusted `raw_user_meta_data->>'role'`, allowing anyone to sign up as admin via API
- **Fix**: Role is always `'sales'` — admins promote users afterward via the "Admins can update any profile" RLS policy
- **Function**: `public.handle_new_user()` — `SECURITY DEFINER`, `search_path = public`

### C2: Profile self-update columns restricted
- **Migration**: `restrict_profile_self_update_columns`
- **Problem**: "Users can update own profile" policy allowed changing `role`, `is_active`, `created_by`
- **Fix**: `WITH CHECK` subquery ensures those 3 columns remain unchanged on self-update
- **Policy**: `"Users can update own profile"` on `public.profiles` (FOR UPDATE)

### C3: anon privileges revoked
- **Migration**: `revoke_anon_privileges_on_public_tables`
- **Problem**: `anon` role had ALL privileges on all public tables — unauthenticated API access was possible
- **Fix**: `REVOKE ALL` from `anon` on tables + sequences; `GRANT ALL` to `authenticated`

---

## Round 1 — HIGH Fixes

### H1: Role-based RLS on all CRM data tables
- **Migrations**: `create_get_my_role_helper`, `role_based_rls_crm_data_tables`, `role_based_rls_staff_table`
- **Helper function**: `public.get_my_role()` — `SECURITY DEFINER STABLE`, `search_path = public`
- **7 CRM data tables** (contacts, deals, tasks, calendar_events, communications, campaigns, payments):
  - SELECT: all authenticated (unchanged "Authenticated read" policy)
  - INSERT/UPDATE: admin, manager, sales
  - DELETE: admin only
- **staff table**:
  - SELECT: all authenticated
  - INSERT/UPDATE/DELETE: admin only
- MFA enforcement policies ("Require MFA if enrolled") preserved on all tables

### H2: clearAllData gated behind admin role
- **File**: `src/pages/Settings.tsx`
- **Fix**: "Reset All Data" button only renders when `profile?.role === 'admin'`
- **Backstop**: DELETE RLS from H1 prevents non-admins from deleting even if UI check bypassed

### H3: Hard deletes converted to soft deletes
- **File**: `src/store/index.ts`
- **Problem**: `deleteDeal`, `deleteTask`, `deleteEvent` used `.delete()` — permanent data loss
- **Fix**: Changed to `.update({ deleted_at: new Date().toISOString() })`

### H4: Soft-deleted records filtered from fetches
- **File**: `src/store/index.ts`
- **Fix**: Added `.is('deleted_at', null)` to all 8 queries in `fetchAll()`

### H5: Math.random() replaced with crypto
- **File**: `src/lib/utils.ts` — `generateId()` → `crypto.randomUUID()`
- **File**: `src/components/CreateUserModal.tsx` — `generatePassword()` → `crypto.getRandomValues()` with Fisher-Yates shuffle

### Bonus: search_path set on SECURITY DEFINER functions
- **Migration**: `set_search_path_on_security_definer_functions`

---

## Round 2 — CRITICAL Fix

### C2-R2: migration.sql still contained vulnerable handle_new_user()
- **File**: `supabase/migration.sql:80`
- **Problem**: File still had `COALESCE(NEW.raw_user_meta_data->>'role', 'sales')` — re-running the migration would reintroduce the role escalation vulnerability
- **Fix**: Changed to `'sales',` to match the live database

---

## Round 2 — HIGH Fixes

### H1-R2: Missing HTTP security headers
- **File**: `public/serve.json` (new — Vite copies to `dist/` on build, `serve` reads it automatically)
- **Problem**: Only `X-Content-Type-Options: nosniff` was present. No HSTS, no clickjacking protection, no CSP
- **Fix**: Added all headers:
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://kddkibsrdgtcorhrtjip.supabase.co; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- **Note**: If new external resources are added (fonts, analytics, etc.), update the CSP in `public/serve.json`

### H4-R2: Data export available to all roles
- **File**: `src/pages/Settings.tsx`
- **Problem**: Any authenticated user (including `support`) could bulk-export all CRM data as JSON
- **Fix**: Wrapped Export button in `<RoleGate requiredRoles={['admin', 'manager']}>`

### H5-R2: n8n webhook URL exposed in client-side bundle
- **File**: `src/store/index.ts` — removed `webhook` field from client payload (now sends only `{ payload: {...} }`)
- **Edge Function**: `webhook-proxy` v4 deployed — n8n URL `https://n8n.srv1244261.hstgr.cloud/webhook/sam-tag-listener` hardcoded server-side
- **Before**: Client sent `{ webhook: "https://n8n.../sam-tag-listener", payload: {...} }` — URL visible in JS bundle
- **After**: Client sends `{ payload: {...} }` — edge function handles destination

---

## Round 2 — MEDIUM Fixes

### M1: updateProfile() sends arbitrary fields
- **File**: `src/contexts/AuthContext.tsx`
- **Problem**: Spread `...data` directly into Supabase update — relied entirely on RLS
- **Fix**: Explicit allowlist: only `name`, `phone`, `avatar_url` are sent

### M2: No delete confirmation on contacts
- **File**: `src/pages/Contacts.tsx`
- **Fix**: Added `confirm()` dialog before `deleteContact()`

### M3: CSV import no file size limit
- **File**: `src/components/CSVImportModal.tsx`
- **Fix**: 5 MB max file size check before `readAsText()`

### M4: No rate limiting on password reset
- **File**: `src/pages/Login.tsx`
- **Fix**: 60-second client-side cooldown between reset requests with countdown in button text

---

## Round 2 — LOW Fixes

### L2: ~40 unused database indexes
- **Migration**: `drop_unused_indexes`
- Dropped 28 unused indexes (all `idx_scan = 0`) on agent/system tables and unused CRM filter indexes
- **Kept**: all `deleted_at` indexes (used by every `fetchAll()` query) and FK-like indexes (`contact_id`, `related_contact_id`)

### L4: Unindexed foreign key on profiles.created_by
- **Migration**: `add_index_profiles_created_by`
- Added `idx_profiles_created_by` covering index

---

## Round 3 — Fixes (2026-02-26)

### H1-R3: Security headers not reaching browser
- **Problem**: `serve.json` headers ignored — Railway's edge server doesn't use `serve` package
- **Verified**: `curl -I https://crm.adwoodconsulting.com` returned only `x-content-type-options: nosniff`
- **Fix**: Added `serve` as dependency + `"start": "serve dist -s"` script so Railway runs it as a Node app
- **Files**: `package.json` — added `serve` dep + `start` script

### L1-R3: updateProfile() optimistic UI inconsistency
- **File**: `src/contexts/AuthContext.tsx`
- **Problem**: `setProfile(prev => { ...prev, ...data })` used raw input, not server response
- **Fix**: `.update().select('*').single()` — local state now set from server response

### L2-R3: 13 unused database indexes
- **Migration**: `drop_unused_indexes_round3`
- Dropped 13 unused indexes (idx_profiles_created_by, idx_deals_contact_id, idx_deals_deleted_at, idx_tasks_related_contact, idx_tasks_deleted_at, idx_calendar_events_deleted_at, idx_payments_contact_id, idx_payments_deleted_at, idx_contacts_deleted_at, idx_campaigns_deleted_at, idx_staff_deleted_at, idx_comms_contact_id, idx_communications_deleted_at)

### L3-R3: RLS auth calls wrapped in (select ...)
- **Migration**: `wrap_rls_auth_calls_in_select`
- Recreated 3 profiles policies with `(select auth.uid())` wrapping
- Recreated 9 MFA policies with `(select auth.jwt())` and `(select auth.uid())` wrapping

### BONUS-R3: MFA policies were PERMISSIVE (no-op)
- **Migration**: `make_mfa_policies_restrictive`
- **Problem**: "Require MFA if enrolled" and "Authenticated read" were both PERMISSIVE SELECT policies. PostgreSQL OR's permissive policies: `true OR (MFA check)` = always `true`. MFA enforcement on data tables was effectively disabled.
- **Fix**: Changed all 9 MFA policies to `AS RESTRICTIVE` — now AND'd with the permissive "Authenticated read" policy, so MFA-enrolled users must present aal2 to read data.

---

## Current Security State (post Round 3)

### RLS Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE | MFA (RESTRICTIVE) |
|-------|--------|--------|--------|--------|-----|
| profiles | All auth | Admin | Own (restricted) + Admin (any) | — | — |
| contacts | All auth | admin/manager/sales | admin/manager/sales | admin | Yes |
| deals | All auth | admin/manager/sales | admin/manager/sales | admin | Yes |
| tasks | All auth | admin/manager/sales | admin/manager/sales | admin | Yes |
| calendar_events | All auth | admin/manager/sales | admin/manager/sales | admin | Yes |
| communications | All auth | admin/manager/sales | admin/manager/sales | admin | Yes |
| campaigns | All auth | admin/manager/sales | admin/manager/sales | admin | Yes |
| payments | All auth | admin/manager/sales | admin/manager/sales | admin | Yes |
| staff | All auth | admin | admin | admin | Yes |
| customer_emails | All auth | active user | active user | — | Yes |

### Supabase Security Advisor — Remaining Warnings
1. **Leaked Password Protection Disabled** — unavailable on current plan

### Supabase Performance Advisor — Remaining Warnings
1. **auth_rls_initplan**: 9 MFA policies still flagged due to `ARRAY[]` constructor pattern — inherent to the MFA check approach, no further optimization possible without restructuring
2. **Multiple permissive UPDATE policies on profiles**: `anon`/`authenticated`/`authenticator`/`dashboard_user` roles each see two UPDATE policies (admin + self). Architectural, not fixable without combining policies
3. **Unindexed FKs**: `analytics_snapshots.asset_id_fkey`, `profiles.created_by_fkey` — INFO level, low impact

### Dashboard Actions Completed
1. **Public signup disabled** (done by user)

### Accounts
- **Alijah Wood** (`growth@adwoodconsulting.us`) — role: `admin`, is_active: `true`
- Only admin in the system; all new signups default to `sales`

### Migration History (security-related)
1. `fix_handle_new_user_hardcode_sales_role`
2. `restrict_profile_self_update_columns`
3. `revoke_anon_privileges_on_public_tables`
4. `create_get_my_role_helper`
5. `role_based_rls_crm_data_tables`
6. `role_based_rls_staff_table`
7. `set_search_path_on_security_definer_functions`
8. `drop_unused_indexes` (Round 2)
9. `add_index_profiles_created_by` (Round 2)
10. `drop_unused_indexes_round3` (Round 3)
11. `wrap_rls_auth_calls_in_select` (Round 3)
12. `make_mfa_policies_restrictive` (Round 3)

### Edge Functions
- **webhook-proxy** v4 — JWT auth + active profile check + hardcoded n8n URL + WEBHOOK_SECRET header + CORS locked to crm.adwoodconsulting.com

### Files Modified (Round 3)
- `package.json` — added `serve` dep + `start` script (H1-R3)
- `src/contexts/AuthContext.tsx` — updateProfile uses server response (L1-R3)

### Still Open
1. **Leaked Password Protection** — unavailable on current Supabase plan
2. **Security headers** — will take effect after next `git push` + Railway deploy (needs `npm install` for `serve`)
3. **MFA initplan warnings** — inherent to MFA check pattern, no further optimization available
