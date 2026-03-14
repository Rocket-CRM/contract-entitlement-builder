# Earn Studio — Component Specification

## What Is This Component?

Earn Studio is a **visual mapping builder** for configuring how customers earn loyalty currency (points and tickets) from purchases. It provides an admin interface for merchants to define:

1. **Earn Factors** — Rules that determine how much currency a customer earns (e.g. "Spend ฿100 = 1 point" or "3x multiplier on shoes")
2. **Earn Conditions** — Qualifying criteria that gate when a factor applies (e.g. "only for Gold tier members" or "only for Nike products with ≥50 units purchased")
3. **The link between them** — Which earn factors use which condition groups, visualized as connection lines

The component renders as a group-row based layout with SVG bezier connection lines between left (factors) and right (conditions) columns.

---

## Current Architecture

### Layout Design

```
LEFT (560px)                                              RIGHT (480px)
┌────────────┐ ┌──────────────────────────────┐           ┌────────────────────────────────────┐
│▌           │ │ 🏷 Points Starter Rules ฿100  │ ─bezier─ │ ≡ Untitled Conditions Group    ∧   │
│▌ Untitled  │ │    Points (Base rate)         │           │   2 conditions  🔗1                │
│▌ Group     │ ├──────────────────────────────┤           │   Type  Items  Logic  Thresh  Excs │
│▌      + ✏  │ │ ⚡ Points Power Boost    3x   │           │   SKU    1●    OR     -       No   │
│▌           │ │    Points (Multiplier)        │           │   Brand  1●    OR     -       No   │
└────────────┘ └──────────────────────────────┘           └────────────────────────────────────┘

─── UNLINKED ──────────────────────

LEFT: sidebar + cards (dimmed)                   RIGHT: unlinked condition groups
┌────────────┐ ┌──────────────────┐              ┌──────────────────────────┐
│▌ EFG 10... │ │ ⚡ Power Boost 2x │              │ ≡ Untitled  2 conditions │
│▌      + ✏  │ └──────────────────┘              └──────────────────────────┘
└────────────┘                                   ┌──────────────────────────┐
┌────────────┐                                   │ ≡ aefawefawef 3 conds    │
│▌ Empty Grp │ (no cards — sidebar only)         └──────────────────────────┘
│▌      + ✏  │
└────────────┘
```

**Key layout decisions:**

- **Group-row layout** — each earn factor group renders as a full-width row: sidebar panel on the left + factor cards + right column condition slots
- **Group sidebar panel (160px)** — colored 4px internal accent strip, group name (wrapping text), add (+) and edit (✏) icon buttons, `min-height: 60px` matching card height
- **Factor cards (60px fixed height)** — tag icon for rate, lightning bolt icon for multiplier; rate shows `฿{amount}`, multiplier shows `{amount}x`
- **Condition cards expandable** — chevron toggle expands to show conditions table (Type, Items, Logic, Threshold type, Excess); connection badge shows link icon + count
- **Linked groups at top** — groups with at least one condition-linked factor appear first
- **Unlinked section at bottom** — two-column row: left has unlinked groups with factors (dimmed) + empty groups (sidebar only), right has unlinked condition groups
- **SVG overlay** covers the full layout with `position: absolute`, `pointer-events: none`
- **Connection lines** use bezier curves anchored to factor card center-right → condition header center-left (top: 30px for expanded cards)

### Data Attribute DOM Query Pattern

Connection lines are drawn by querying the DOM directly:

- Factor cards: `data-factor-id="<uuid>"`
- Condition cards: `data-cg-key="<condGroupId>__<factorId>"`
- `rebuildLines()` uses `root.querySelector` with fallback to `wwLib.getFrontDocument()` for WeWeb runtime

---

## Current State & Known Issues

### Working

- Data loading: factor groups, factors per group, condition groups, condition details, entity options
- Left column: group sidebar panel + factor cards per group, sorted (linked first, unlinked at bottom)
- Right column: expandable condition group cards with conditions table, connection count badges
- Factor card icons: tag (rate) / lightning bolt (multiplier) with amount badges
- Expandable condition groups: chevron toggle shows/hides conditions detail table
- Create Earn Factor Group modal (name, stackable, window dates)
- Edit Earn Factor sidebar panel (all fields)
- Edit Earn Condition Group sidebar panel (condition list with entity picker, operator toggle, thresholds)
- Connect popup: "+" button on factor card hover → popup lists condition groups → select to link
- Group ID injection: `bff_get_earn_factors_by_group` response doesn't include `earn_factor_group_id`, so it's injected from the query context
- SVG bezier connection lines between factor cards and condition cards
- Line rebuild on data load, resize, panel open/close, condition expand/collapse

### Known Issues (to fix in next iteration)

1. ~~**Condition table styling**~~ — FIXED. Table now uses `table-layout: fixed` with Figma-accurate column widths (Type 91px, Items 64px, Logic 70px, Threshold type 165px, Excess fill). Items badge uses pink `#F7E6EF`/`#DA3590` pill with eye icon (ViewIcon). Threshold type shows NoteIcon. Header/cell borders use `#EEEEEE`.

2. ~~**Config sidebar panel not floating**~~ — FIXED. Restructured DOM: scrollable content is inside `.es__scroll-area`, panels/backdrop are siblings positioned absolutely within `.es` root (avoids `position: fixed` containment issues from WeWeb wrapper transforms). Panels use `position: absolute; top:0; right:0; bottom:0` with semi-transparent backdrop overlay and slide transition.

3. **SVG connection lines may not render in WeWeb editor** — `querySelector` with `data-*` attributes works in standard DOM but may fail in WeWeb's shadow DOM or iframe context.

4. **Line rebuild timing** — `scheduleLineUpdate` fires at 150ms delay with 300ms/800ms retries. MutationObserver approach may be more reliable for large datasets.

5. **EarnConditionGroupCard.vue and EarnFactorGroupCard.vue** in `/src/components/` are **dead code** — not imported by wwElement.vue.

6. **No delete functionality in UI** — delete API functions exist in `useApi.js` but no UI buttons call them.

---

## File Structure

```
earn-studio/
├── package.json                          # deps: polaris-weweb-styles (github), @weweb/cli
├── ww-config.js                          # WeWeb element config: props, actions, triggers
├── COMPONENT_SPEC.md                     # This file
├── README.md                             # Dev setup + gap tracking
│
└── src/
    ├── wwElement.vue                     # Main component — full rendering + state + API
    │   - Group-row layout: sidebar + factor cards | condition slots
    │   - SVG absolute overlay for bezier connection lines
    │   - DOM query: data-factor-id, data-cg-key
    │   - Computed: linkedGroupEntries, unlinkedGroupsWithFactors, emptyGroups
    │   - Expandable condition cards with conditions table
    │   - Factor icons: tag (rate), lightning (multiplier)
    │   - Connection count badges (link icon + number)
    │   - 60px unified card height, 160px sidebar width
    │
    ├── useApi.js                         # Supabase RPC/REST API layer
    │   - getHeaders(): apikey + Bearer token from props
    │   - rpc(): POST /rest/v1/rpc/{fn}
    │   - restGet(): GET /rest/v1/{table}
    │   - Named methods for all 12+ endpoints
    │
    └── components/
        ├── EarnFactorConfig.vue          # Sidebar: edit/create earn factor
        │   - Fields: name, type (rate/multiplier), amount, target currency,
        │     window start/end, expiry days, public/private, condition group dropdown
        │   - Save: emits { groupId, factor } → parent upserts
        │
        ├── EarnConditionGroupConfig.vue  # Sidebar: edit/create condition group
        │   - Group name field
        │   - Repeatable condition entries with entity type, entity multi-select,
        │     operator toggle (OR/AND/EACH), threshold type, excess toggle, min/max
        │   - Entity picker modal with search + checkbox selection
        │
        ├── CreateGroupModal.vue          # Modal: create new earn factor group
        │   - Fields: name, stackable toggle, window start/end
        │
        ├── ConnectPopup.vue              # Popup: link factor → condition group
        │   - Searchable list of all condition groups
        │
        ├── EarnFactorGroupCard.vue       # ⚠️ DEAD CODE — not imported
        └── EarnConditionGroupCard.vue    # ⚠️ DEAD CODE — not imported
```

---

## How The Component Calls APIs

All API calls go directly to Supabase via `fetch()` — no Supabase JS client library. The API layer is in `src/useApi.js`.

### Authentication

Every request includes two headers:

```
apikey: {supabaseAnonKey}          ← public anon key (hardcoded default)
Authorization: Bearer {authToken}   ← admin user JWT (bound from WeWeb auth context)
```

### Base URL

```
https://wkevmsedchftztoolkmi.supabase.co
```

### API Calls Made

| When | Endpoint | Method | Purpose |
|------|----------|--------|---------|
| On mount | `GET /rest/v1/earn_factor_group?select=...&order=created_at.desc` | REST | List all earn factor groups |
| Per group | `POST /rest/v1/rpc/bff_get_earn_factors_by_group` | RPC | Get factors for a group (group ID injected into each factor on frontend) |
| On mount | `POST /rest/v1/rpc/bff_get_all_earn_conditions_groups` | RPC | List all condition groups |
| Per cond group | `POST /rest/v1/rpc/bff_get_earn_conditions_group` | RPC | Get condition details (thresholds, operators) |
| On mount | `POST /rest/v1/rpc/get_all_entity_options` | RPC | All entities for condition dropdowns |
| Create factor group | `POST /rest/v1/rpc/bff_upsert_earn_factor_group` | RPC | Create group with empty factors array |
| Save factor | `bff_get_earn_factor_group_details` then `bff_upsert_earn_factor_group` | RPC | Fetch-merge-upsert pattern for factor edits |
| Save condition group | `POST /rest/v1/rpc/bff_upsert_earn_conditions_group` | RPC | Create/update conditions atomically |
| Connect factor | `bff_get_earn_factor_group_details` then `bff_upsert_earn_factor_group` | RPC | Update factor's `earn_conditions_group_id` |

**Important:** `bff_get_earn_factors_by_group` does NOT return `earn_factor_group_id`. The frontend injects it:
```javascript
m[g.id] = factors.map(f => ({ ...f, earn_factor_group_id: f.earn_factor_group_id || g.id }));
```

---

## Component Properties (WeWeb Config)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `supabaseUrl` | Text | `https://wkevmsedchftztoolkmi.supabase.co` | Supabase project URL |
| `supabaseAnonKey` | Text | *(hardcoded CRM anon key)* | Public API key |
| `authToken` | Text | *(must bind)* | Admin user JWT |
| `leftColumnWidth` | Length | `580px` | Left column width |
| `rightColumnWidth` | Length | `580px` | Right column width |
| `connectionLineColor` | Color | `#C9CCCF` | Default line color |
| `connectionLineActiveColor` | Color | `#005BD3` | Hovered line color |
| `configPanelWidth` | Length | `400px` | Sidebar panel width |

## Trigger Events

| Event | When | Payload |
|-------|------|---------|
| `data-loaded` | After initial load | `{ factorGroupCount, conditionGroupCount }` |
| `earn-factor-group-saved` | Group created/updated | `{ groupId, groupName, action }` |
| `earn-factor-saved` | Factor created/updated | `{ factorId, factorType, groupId }` |
| `earn-condition-group-saved` | Condition group saved | `{ groupId, groupName, action }` |
| `connection-changed` | Factor linked/unlinked | `{ factorId, conditionGroupId, action }` |
| `error` | Any API failure | `{ message, code }` |

## Actions

| Action | Description |
|--------|-------------|
| `refreshData` | Reload all data from Supabase |
| `closePanel` | Close any open sidebar panel |

---

## Database Tables

| Table | Key Columns |
|-------|-------------|
| `earn_factor_group` | `id`, `name`, `stackable`, `window_start`, `window_end`, `active_status`, `merchant_id` |
| `earn_factor` | `id`, `earn_factor_type` (rate/multiplier), `earn_factor_amount`, `target_currency` (points/ticket), `target_entity_id`, `public`, `window_*`, `earn_factor_group_id` FK, `earn_conditions_group_id` FK |
| `earn_conditions_group` | `id`, `name`, `merchant_id` |
| `earn_conditions` | `id`, `group_id` FK, `entity` (enum), `entity_ids` (uuid[]), `operator`, `threshold_unit`, `min_threshold`, `max_threshold`, `apply_to_excess_only`, `exclude` |

### Enums

- **`earn_factor_type`**: `rate`, `multiplier`
- **`currency`**: `points`, `ticket`
- **`earn_factor_entity_type`**: `product_product`, `product_sku`, `product_brand`, `product_category`, `store`, `store_attribute_set`, `tier`, `persona`, and more

---

## Save Behavior

No page-level save. Each entity saves independently:

| Entity | Trigger | API |
|--------|---------|-----|
| Earn Factor Group | Create modal → Save | `bff_upsert_earn_factor_group` |
| Earn Factor | Sidebar → Save | `bff_upsert_earn_factor_group` (fetch-merge-upsert) |
| Earn Condition Group | Sidebar → Save | `bff_upsert_earn_conditions_group` |
| Factor ↔ Condition link | "+" popup select, or sidebar dropdown | `bff_upsert_earn_factor_group` |

---

## Styling

- Built on `polaris-weweb-styles` v2.2.0 (GitHub: `rangwan-rocket/polaris-weweb-styles`)
- Uses Polaris design tokens: `--p-color-*`, `--p-space-*`, `--p-font-*`, `--p-border-radius-*`, `--p-shadow-*`
- Uses Polaris mixins: `polaris-button-primary`, `polaris-button-plain`, `polaris-input`, `polaris-select`, `polaris-radio`, `polaris-spinner`, `polaris-text-title`, `polaris-text-subtitle`, `polaris-text-description`, `polaris-separator-dot`, `polaris-card-bordered`
- Group colors: 8-color deterministic palette hashed by group ID
- Inter font throughout matching Figma specs
- Factor card icons: tag (rate), lightning bolt (multiplier)
- Condition group icon: filter/lines (descending horizontal bars)
- Condition detail table: pink item badges, clipboard threshold icons

---

## Figma References

- Main layout: `figma.com/design/lje20iz4W3A92HJOt1diwb/New-CRM-Polaris?node-id=1104-17765`
- Config sidebar: `figma.com/design/lje20iz4W3A92HJOt1diwb/New-CRM-Polaris?node-id=1089-79631`
- Condition group detail: `figma.com/design/lje20iz4W3A92HJOt1diwb/New-CRM-Polaris?node-id=1089-86487`
