# Package, Contract & Standing Benefit System — Feature Specification

## Executive Summary

Three interconnected features extending the CRM platform: bundled reward issuance (packages), B2B contract governance (contracts on persona groups), and period-based non-consumable privileges (benefits). Built as extensions to the existing reward and persona systems.

### The Three Concepts

| Concept | What It Is | Consumed? | How It Works |
|---|---|---|---|
| **Package** | A bundle of rewards with quantities, auto-issued to a user | Yes — decremented per use | Creates redemption ledger rows with balance tracking |
| **Contract** | B2B agreement governing persona groups with auto-issued packages + benefits | N/A — management layer | Metadata on persona groups + persona_entitlement config |
| **Benefit** | Period-based privilege that never depletes (e.g., 30% off OPD) | Never | Per-user rows; persona-sourced validate against source at read time |

---

## 1. Package System

### What Is a Package

A package is a template that bundles multiple rewards with quantities. When assigned to a user, the system auto-creates redemption records for each reward in the bundle. Each record tracks a balance (`qty` = total granted, `used_qty` = consumed so far).

No type classification needed. How it gets distributed is tracked on the assignment (`source_type`), not on the template. If it's purchasable, it has a price. If not, price is null.

### How It Integrates with Existing Reward System

Instead of a separate entitlement system, packages leverage the existing `reward_redemptions_ledger`. When a package is assigned:

1. System reads `package_items` for the package
2. For each mandatory item, creates a `reward_redemptions_ledger` row:
   - `reward_id` = the reward from the package item (links to product details)
   - `qty` = total entitlement (e.g., 5)
   - `used_qty` = 0
   - `points_deducted` = 0 (free from package)
   - `source_type` = `package_assignment`
   - `package_assignment_id` = FK to the assignment record

This means:
- "My Coupons" view automatically shows package entitlements (same table)
- Expiry logic already works (`use_expire_date`)
- Promo code assignment already works
- Cache, views, edge functions, BFF endpoints — all compatible
- GET redemption API returns reward details via existing `reward_id → reward_master` join
- GET redemption API also returns package context via `package_assignment_id → package_assignment → package_master` join

### Reward Master Linkage

```
Template level:
  package_items.reward_id → reward_master    (defines what's in the package)

Instance level:
  reward_redemptions_ledger.reward_id → reward_master      (product details)
  reward_redemptions_ledger.package_assignment_id → package_assignment → package_master  (package context)
```

### Redemption Ledger Semantic Split

| source_type | qty means | used_qty | Behavior |
|---|---|---|---|
| `reward_redemption` (existing) | How many claimed | NULL or = qty | One-shot use |
| `mission` (existing) | Mission reward qty | NULL or = qty | One-shot use |
| `package_assignment` (new) | Total entitlement | Incremented per use | Multi-use, decremented |
| `persona_entitlement` (new) | Total entitlement (direct reward) | Incremented per use | Multi-use, decremented |

Existing queries that `SUM(qty)` for limit checks filter out `package_assignment` and `persona_entitlement` source types for user-scoped limits. Stock checks remain inclusive (correct behavior).

### Package Assignment Sources

| Source Type | Example | Trigger |
|---|---|---|
| `purchase` | Patient buys Health Checkup Package | Payment confirmed |
| `persona_assignment` | Employee assigned Corporate Executive persona | Roster import / admin |
| `tier_upgrade` | User reaches Gold tier | Tier evaluation |
| `campaign` | Birthday reward bundle | Campaign engine |
| `admin` | VIP apology gift set | Manual admin action |
| `his_event` | Post-surgery recovery package | HIS API event |
| `mission` | Mission completion reward bundle | Mission completion |

### Usage Flow

**Each use of a package entitlement:**
1. External trigger (HIS event, staff action, user action in app)
2. `fn_use_entitlement` finds the redemption record with `SELECT FOR UPDATE`
3. Validates `qty - used_qty > 0`, not expired, not cancelled
4. Increments `used_qty`
5. Creates `redemption_usage_log` entry (event sourcing)
6. When `used_qty = qty` → marks `used_status = true` (fully consumed)

### Mandatory vs Elective Items

- **Mandatory**: Auto-issued when package is assigned. User gets them all.
- **Elective**: User picks N from a pool via `select_elective_items()`. `package_items` defines the available pool with `is_elective = true`, `elective_group`, and `elective_max_picks`. Redemption records created only after selection.

---

## 2. Contract System

### What Is a Contract

A contract is a B2B agreement between the merchant and an external organization. It governs which users belong to which persona levels and what each level receives.

A contract is **metadata on the existing `persona_group_master`** — not a separate entity. The persona group already represents the organizational structure.

### Contract Types (All Use Same Structure)

| Type | Example | Roster Source |
|---|---|---|
| **Corporate** | Company ABC, 200 employees | Batch CSV import from HR |
| **Insurance** | AIA Premium / Standard | HIS data or insurer API |
| **VIP (Star)** | Connex, Cheva/BDMS | Hospital assigns directly |
| **Exclusive Partner** | Marriott, airline program | Partner sends roster |

### Contract Metadata (Columns on persona_group_master)

| Column | Type | Description |
|---|---|---|
| `contract_type` | text | corporate, insurance, vip, partner |
| `company_name` | text | Legal entity name |
| `contact_person` | text | Primary contact |
| `contact_email` | text | Contact email |
| `contract_start` | date | Contract effective start |
| `contract_end` | date | Contract effective end |
| `contract_status` | text | active, suspended, expired, pending |
| `contract_metadata` | jsonb | Additional variable data |

These are nullable columns — non-contract persona groups simply leave them NULL.

### Persona Entitlement — Unified Config Table

Single table defining everything a persona level auto-grants. One concept: "what does this persona entitle the user to?" Supports three types via `entitlement_type` discriminator.

```
persona_entitlement
├── id, merchant_id
├── persona_id → persona_master
├── entitlement_type: 'package' | 'reward' | 'benefit'
├── package_id → package_master     (when type = package)
├── reward_id → reward_master       (when type = reward)
├── qty                             (when type = reward)
├── category                        (when type = benefit)
├── benefit_type                    (when type = benefit)
├── value                           (when type = benefit)
├── active_status, ranking
```

CHECK constraint ensures data integrity per type:
```sql
CHECK (
  (entitlement_type = 'package' AND package_id IS NOT NULL) OR
  (entitlement_type = 'reward' AND reward_id IS NOT NULL AND qty IS NOT NULL) OR
  (entitlement_type = 'benefit' AND category IS NOT NULL AND benefit_type IS NOT NULL AND value IS NOT NULL)
)
```

### How Auto-Assign Uses Each Type

When a user is assigned to a persona level, `fn_auto_assign_on_persona` loops over active `persona_entitlement` rows:

- **type = 'package'**: Creates `package_assignment` → `fn_create_package_entitlements` → redemption ledger rows
- **type = 'reward'**: Directly creates a redemption ledger row (reward_id, qty, used_qty=0, source_type='persona_entitlement') — skips package indirection for simple cases like "5 parking passes"
- **type = 'benefit'**: Creates `user_benefit` row (source_type='persona', source_id=persona_id)

### Full Contract Flow

**Setup (admin configures via single upsert):**

```
persona_group_master: "Company ABC"
  + contract_type: corporate, contract_start/end, contract_status
  │
  ├── persona_master: "Executive"
  │     └── persona_entitlement rows:
  │           ├── type=package, package_id="Executive Welcome Pack"
  │           ├── type=reward, reward_id="Parking Pass", qty=5
  │           └── type=benefit, category="opd", benefit_type="discount_percent", value=25
  │
  └── persona_master: "General"
        └── persona_entitlement rows:
              ├── type=package, package_id="General Welcome Pack"
              └── type=benefit, category="opd", benefit_type="discount_percent", value=10
```

**User assignment:**

1. User gets persona "Executive" under "Company ABC"
2. Trigger `trg_auto_assign_on_persona_change` fires
3. Calls `fn_auto_assign_on_persona(user_id, persona_id)`
4. System creates: package assignments, direct reward entitlements, user benefits

**Contract expiry — no triggers needed for benefits:**

Benefits with `source_type = 'persona'` reference back to their source. The eligibility query validates the source is still active at read time. When the contract/persona is deactivated, benefits stop appearing.

---

## 3. Benefit System

### What Is a Benefit

A benefit is a period-based privilege that never gets consumed. It applies every qualifying interaction, for the entire validity period. No stock, no remaining count, no "use" event.

Examples:
- "VIP Connex members get 30% off all OPD services"
- "Corporate Executive gets priority booking access"
- "Marketing gives User X 20% off pharmacy for 3 months"

### `user_benefit` — One Table, Two Validity Modes

Every benefit for every user is a row in `user_benefit`. Persona-sourced benefits reference back to the persona and validate at read time. Individual benefits carry their own validity.

```
user_benefit
├── id, merchant_id, user_id
├── category, benefit_type, value
├── source_type: persona | tier | marketing | admin | campaign
├── source_id (persona_id for persona-sourced)
├── valid_from, valid_to (NULL for persona-sourced — derived from source)
├── status: active | cancelled
├── created_at, created_by, notes, metadata
```

### Two Validity Modes

| Mode | source_type | How Validity Works |
|---|---|---|
| **Persona-sourced** | `persona` | JOIN to check persona still active + contract still active |
| **Self-managed** | `marketing`, `admin`, `campaign` | Own valid_from/to dates |

### Eligibility Query (`fn_evaluate_user_benefits`)

```sql
-- Persona-sourced: validate source is still active
SELECT ... FROM user_benefit ub
JOIN user_accounts ua ON ua.id = p_user_id AND ua.persona_id = ub.source_id
JOIN persona_master pm ON pm.id = ua.persona_id AND pm.active_status = true
JOIN persona_group_master pgm ON pgm.id = pm.group_id
  AND pgm.active_status = true
  AND (pgm.contract_status IS NULL OR pgm.contract_status = 'active')
  AND (pgm.contract_end IS NULL OR pgm.contract_end >= CURRENT_DATE)
WHERE ub.user_id = p_user_id AND ub.source_type = 'persona' AND ub.status = 'active'

UNION ALL

-- Self-managed: validate own dates
SELECT ... FROM user_benefit ub
WHERE ub.user_id = p_user_id
  AND ub.source_type IN ('marketing', 'admin', 'campaign', 'tier')
  AND ub.status = 'active'
  AND (ub.valid_from IS NULL OR ub.valid_from <= now())
  AND (ub.valid_to IS NULL OR ub.valid_to >= now())
```

### Precedence Resolution (`fn_resolve_benefit_precedence`)

When a user has multiple benefits for the same category:
- System picks the highest value per category
- Not stackable — one discount slot, best wins
- `DISTINCT ON (category) ... ORDER BY category, value DESC`

### Eligibility API Response (for HIS)

```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "benefits": [
      { "category": "opd", "benefit_type": "discount_percent", "value": 30, "source": "VIP Connex" },
      { "category": "pharmacy", "benefit_type": "discount_percent", "value": 15, "source": "Corporate Executive" }
    ]
  }
}
```

---

## Schema Summary

### New Tables

| Table | Purpose |
|---|---|
| `package_master` | Package template (name, validity, pricing) |
| `package_items` | What rewards are in a package (reward_id, qty, mandatory/elective) |
| `package_assignment` | Who got which package (user, source, dates, status) |
| `persona_entitlement` | What a persona level auto-grants (packages, rewards, benefits — unified) |
| `redemption_usage_log` | Audit trail for multi-use entitlement usage |
| `user_benefit` | Per-user standing benefits (persona-sourced + individually-assigned) |

### Extended Tables

| Table | Changes |
|---|---|
| `reward_redemptions_ledger` | + `used_qty` (integer, default 0), + `package_assignment_id` (uuid, nullable FK) |
| `persona_group_master` | + contract columns (contract_type, company_name, contact_person, contact_email, contract_start, contract_end, contract_status, contract_metadata) |

### Extended Enums

| Enum | New Values |
|---|---|
| `wallet_transaction_source_type` | `package_assignment`, `persona_entitlement` |

---

## Functions

### Internal Helpers (fn_)

| Function | Purpose |
|---|---|
| `fn_create_package_entitlements(p_assignment_id)` | Creates redemption ledger rows for mandatory package items |
| `fn_use_entitlement(p_redemption_id, p_qty, ...)` | Atomic decrement with concurrency protection + usage log |
| `fn_reverse_entitlement_use(p_redemption_id, p_qty, ...)` | Reverse a previous use |
| `fn_adjust_entitlement_total(p_redemption_id, p_qty_change, ...)` | Admin adjusts total quantity |
| `fn_auto_assign_on_persona(p_user_id, p_persona_id)` | Auto-assigns packages, rewards, benefits from persona_entitlement config |
| `fn_evaluate_user_benefits(p_user_id)` | Returns all active benefits (both validity modes) |
| `fn_resolve_benefit_precedence(p_benefits)` | Groups by category, picks highest value |
| `fn_expire_package_entitlements()` | Cron: expires past-due entitlements |

### Admin BFF (bff_)

| Function | Purpose |
|---|---|
| `bff_upsert_package_with_items(p_id, p_name, ..., p_items)` | Create/update package with items (update-by-ID) |
| `bff_upsert_contract_with_levels(p_group_id, ..., p_levels)` | Create/update contract + personas + entitlements |
| `bff_admin_get_package_list(p_status, p_search)` | List packages with counts |
| `bff_admin_get_package_detail(p_package_id)` | Package with items and reward details |
| `bff_admin_get_contract_list(p_status, p_type)` | List contracts with level/member counts |
| `bff_admin_get_contract_detail(p_group_id)` | Contract with levels and entitlement config |
| `bff_admin_assign_package(p_assignments)` | Batch assign package to users |
| `bff_admin_assign_benefit(p_benefits)` | Batch assign standing benefits |
| `bff_admin_get_user_packages(p_user_id)` | Admin view of user's packages |
| `bff_admin_get_user_benefits(p_user_id)` | Admin view of user's benefits |
| `bff_admin_cancel_benefit(p_benefit_id, p_reason)` | Cancel a benefit |
| `bff_admin_adjust_entitlement(p_redemption_id, p_qty_change, p_reason)` | Adjust entitlement total |

### External API (api_)

| Function | Purpose |
|---|---|
| `api_use_entitlement(p_redemption_id, ...)` | HIS: deduct one use from entitlement |
| `api_get_eligibility(p_user_identifier, p_identifier_type, ...)` | HIS: get user's active benefits with precedence |
| `api_assign_package(p_user_id, p_package_id, ...)` | HIS/e-commerce: assign package to user |

### User Self-Service (no prefix)

| Function | Purpose |
|---|---|
| `get_user_packages(p_status)` | List my packages with entitlement balances |
| `get_user_benefits()` | List my active standing benefits |
| `select_elective_items(p_assignment_id, p_selected_reward_ids)` | Pick elective items from a package |

### Trigger

| Trigger | Event | Action |
|---|---|---|
| `trg_auto_assign_on_persona_change` | AFTER UPDATE OF persona_id ON user_accounts | Cancels old persona benefits, auto-assigns new persona entitlements |

### Backward Compatibility Patches

| Function | Patch |
|---|---|
| `redeem_reward_with_points` | User-scope limit checks exclude `package_assignment` and `persona_entitlement` source types |
| `api_mark_redemption_used` | Guard rejects multi-use entitlements (qty > 1) with message to use `api_use_entitlement` |

---

## Key Design Decisions

### 1. Entitlement balance lives in redemption ledger
Reusing `reward_redemptions_ledger` with `used_qty` — zero changes to "My Coupons" views, cache, BFF endpoints.

### 2. Benefits are per-user rows, persona-sourced validate at read time
No triggers for persona lifecycle. No validity in two places. Contract expires → JOIN fails → benefit excluded.

### 3. Single `persona_entitlement` table for all auto-grant config
One table, one concept, one children array in admin upsert. CHECK constraint enforces per-type integrity.

### 4. `type = 'reward'` skips package indirection
Simple cases like "5 parking passes" don't need a package_master + package_items wrapper.

### 5. Admin upserts follow BFF conventions
Individual `p_` params for parent, JSONB for children arrays. Update-by-ID pattern. Comprehensive response counts.

### 6. Contract is metadata on persona_group_master
Not a separate entity. Nullable columns — non-contract groups simply leave them NULL.
