# Earn Studio — Component Specification

## What Is This Component?

Earn Studio is a **visual mapping builder** for configuring how customers earn loyalty currency (points, tickets, and store credits) from purchases. It provides an admin interface for merchants to define:

1. **Earn Factors** — Rules that determine how much currency a customer earns (e.g. "Spend ฿100 = 1 point" or "3x multiplier on shoes")
2. **Earn Conditions** — Qualifying criteria that gate when a factor applies (e.g. "only for Gold tier members" or "only for Nike products with ≥50 units purchased")
3. **The link between them** — Which earn factors use which condition groups, visualized as connection lines

The component renders as a group-row based layout with SVG bezier connection lines between left (factors) and right (conditions) columns.

---

## Current Architecture

### Layout Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Conditional Currency Multipliers    [🔍 factor] [🔍 cond] [▾ All] [Create▾]│
│ Configure reward multipliers based on...                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ EARN FACTOR GROUP                          EARN CONDITIONS GROUP            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ LEFT (560px)                                   RIGHT (520px)                │
│ ┌────────────┐ ┌────────────────────┐          ┌───────────────────────────┐│
│ │▌           │ │ 🏷 Points Rules ฿100│ ─bezier─ │ ≡ Tier Perks    ✏  ∧    ││
│ │▌ Untitled  │ │   Points (Base)    │          │   2 conditions  🔌1      ││
│ │▌ Group     │ ├────────────────────┤          │ ┌─────────────────────┐  ││
│ │▌      + ✏  │ │ ⚡ Power Boost  3x  │          │ │Type│Items│Logic│Thr│Ex││
│ │▌           │ │   Points (Mult)    │          │ │Tier│ 32● │  —  │ — │— ││
│ └────────────┘ └────────────────────┘          │ │Prod│ 32● │ OR │Amt│No││
│                                                │ └─────────────────────┘  ││
│                                                └───────────────────────────┘│
│─── UNLINKED ────────────────────────────────────────────────────────────────│
│ LEFT: sidebar + cards (dimmed)          RIGHT: unlinked condition groups    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key layout decisions:**

- **Page header** — bindable title + description on the left; search/filter controls + consolidated Create dropdown aligned right (same row to save space); separated from content by a subtle border-bottom
- **Search & filter bar** — two search inputs (factor group name, condition group name) + earn factor type dropdown (All / Earn rate / Multiplier)
- **Create dropdown** — single "Create ▾" primary button; uses `mouseenter`/`mouseleave` events with an invisible bridge pseudo-element (`::before`, 6px height) between button and menu to prevent hover gap disappearance
- **Column labels** — small uppercase grey labels (`EARN FACTOR GROUP` / `EARN CONDITIONS GROUP`) act as table column headers
- **Scroll area wrapper** — `.es__scroll-area` wraps all scrollable content; config panels/backdrop are siblings outside it for proper overlay
- **Group-row layout** — each earn factor group renders as a full-width row: sidebar panel on the left + factor cards + right column condition slots
- **Group sidebar panel (160px)** — white background, blue border, rounded corners, shadow (unified with card styling); colored 4px accent strip; action icons (add/edit) appear on hover only for clean interface
- **Factor cards (60px fixed height)** — tag icon for rate, lightning bolt icon for multiplier; rate shows `฿{amount}`, multiplier shows `{amount}x`
- **Condition cards expandable** — chevron toggle + edit icon; expands to show conditions table inside a bordered container (8px radius, `#EBEDEF` border). All cards (factor, condition, sidebar) share the same blue border (`--p-color-border-info`) with subtle shadow; hover thickens border to 1.5px with elevated shadow
- **Condition detail table** — `table-layout: fixed` with Figma column widths (Type 91px, Items 64px, Logic 70px, Threshold type 165px, Excess fill); pink `#F7E6EF`/`#DA3590` item badges with eye icon; NoteIcon for threshold; cell borders `#EEEEEE`. **Threshold type and Excess columns show "—" for non-product entity types** (tier, persona, store, store_attribute_set) since thresholds only apply to product entities
- **Link badge** — plug/connector SVG icon with linked factor count, rounded pill style (`#E3F1FE` background, `#2C6ECB` text)
- **Linked groups at top** — groups with at least one condition-linked factor appear first
- **Unlinked section at bottom** — two-column row: left has unlinked groups with factors (dimmed) + empty groups (sidebar only), right has unlinked condition groups
- **SVG overlay** covers the full layout with `position: absolute`, `pointer-events: none`
- **Connection lines** use bezier curves anchored to factor card center-right → condition header center-left (top: 30px for expanded cards)
- **Toast notifications** — positioned absolute top-right (z-index 500), Polaris-style: black header for success, red (`--p-color-bg-fill-critical`) header for error; auto-dismiss after 5 seconds with close button; slide-in animation

### Config Panel Overlay Pattern

Config panels (EarnFactorConfig, EarnConditionGroupConfig) use **absolute positioning** within the `.es` root — NOT `position: fixed` (which breaks in WeWeb's iframe/transform context):

```
.es (position: relative, overflow: hidden)
├── .es__toasts (position: absolute, top-right, z-index: 500)
├── .es__scroll-area (overflow: auto, 100% height)
│   ├── .es__page-header
│   ├── .es__layout (main content + SVG)
│   ├── CreateGroupModal (position: fixed via polaris-modal-backdrop)
│   └── ConnectPopup
├── .es__panel-backdrop (position: absolute, 100% × 100%, z-index: 299)
├── EarnFactorConfig (position: absolute, top/right/bottom: 0, z-index: 300)
└── EarnConditionGroupConfig (position: absolute, top/right/bottom: 0, z-index: 300)
```

Delete confirmation modals within config panels use **`position: fixed`** (z-index 500) to center on the screen rather than within the narrow panel.

Backdrop renders directly with `v-if` (no Vue `<transition>` wrapper — unreliable in WeWeb runtime).

### Data Attribute DOM Query Pattern

Connection lines are drawn by querying the DOM directly:

- Factor cards: `data-factor-id="<uuid>"`
- Condition cards: `data-cg-key="<condGroupId>__<factorId>"`
- `rebuildLines()` uses `root.querySelector` with fallback to `wwLib.getFrontDocument()` for WeWeb runtime

---

## Current State & Known Issues

### Working

- Page header with bindable title/description and inline search/filter bar
- Search filtering: factor group name search, condition group name search
- Earn factor type filter: dropdown filters by All / Earn rate / Multiplier
- Data loading: factor groups, factors per group, condition groups, condition details, entity options, ticket types
- Left column: group sidebar panel + factor cards per group, sorted (linked first, unlinked at bottom)
- Right column: expandable condition group cards with conditions detail table, connection count badges
- Edit icon on condition group cards (appears on hover)
- Factor card icons: tag (rate) / lightning bolt (multiplier) with amount badges
- Expandable condition groups: chevron toggle shows/hides conditions detail table in bordered rounded container
- Condition table: Figma-accurate column widths, pink item badges with eye icon, NoteIcon for threshold
- **Conditional threshold display**: threshold type, excess, and min/max fields only shown for product entity types (`product_product`, `product_sku`, `product_brand`, `product_category`). Operator (OR/AND/EACH) shown for product + store entities only. Tier/persona use implicit OR.
- Create Earn Factor Group modal (name, stackable, window dates) — supports both create and edit modes
- Edit Earn Factor sidebar panel — floating overlay with backdrop, uses `polaris-modal-header`/`polaris-modal-footer` mixins
  - Fields: name, type (rate/multiplier), amount, target currency (Points/Tickets/Store Credits), conditional ticket type dropdown, window start/end, public/private toggle, expiry TTL (private only), condition group dropdown
- Edit Earn Condition Group sidebar panel — floating overlay with backdrop
  - Condition list with entity picker, operator toggle, conditional threshold/excess fields
  - Entity picker modal with search + checkbox selection
- **Delete functionality** with confirmation modals for:
  - Earn factor (from factor config sidebar) — calls `admin_delete_earn_factor`
  - Earn factor group (from group edit modal) — calls `admin_delete_earn_factor_group`
  - Earn condition group (from condition config sidebar) — calls `admin_delete_earn_conditions_group`
  - Delete buttons labeled simply "Delete" (no entity name suffix), styled as subtle red text links (`polaris-link-destructive` mixin), not prominent buttons
  - Confirmation popups centered on screen (`position: fixed`)
- **Toast notifications** (Polaris style) for all API actions: create, update, delete, link — black header for success, red for error
- Operator toggle: Figma-accurate pill-style segmented control using `polaris-segmented-pill` mixins
- Connect popup: "+" button on factor card hover → popup lists condition groups → select to link
- Group ID injection: `bff_get_earn_factors_by_group` response doesn't include `earn_factor_group_id`, so it's injected from the query context
- SVG bezier connection lines between factor cards and condition cards
- Line rebuild on data load, resize, panel open/close, condition expand/collapse
- **BFF response validation**: `rpc()` checks for `success: false` in response body and throws error (some RPCs return HTTP 200 with `{ success: false, title: "..." }`)

### Known Issues (to fix in next iteration)

1. **SVG connection lines may not render in WeWeb editor** — `querySelector` with `data-*` attributes works in standard DOM but may fail in WeWeb's shadow DOM or iframe context.

2. **Line rebuild timing** — `scheduleLineUpdate` fires at 150ms delay with 300ms/800ms retries. MutationObserver approach may be more reliable for large datasets.

3. **EarnConditionGroupCard.vue and EarnFactorGroupCard.vue** in `/src/components/` are **dead code** — not imported by wwElement.vue.

---

## File Structure

```
earn-studio/
├── package.json                          # deps: polaris-weweb-styles (github#pinned), @weweb/cli
├── ww-config.js                          # WeWeb element config: props, actions, triggers
├── COMPONENT_SPEC.md                     # This file
├── CURRENCY_KNOWLEDGE.md                 # Currency system reference (points, tickets, conditions)
├── README.md                             # Dev setup + gap tracking
│
└── src/
    ├── wwElement.vue                     # Main component — full rendering + state + API
    │   - Page header: bindable title/description + search/filter bar
    │   - Search: factor group name, condition group name
    │   - Filter: earn factor type (All/Earn rate/Multiplier)
    │   - Toast notification system (success/error)
    │   - Scroll area wrapper for content isolation
    │   - Group-row layout: sidebar + factor cards | condition slots
    │   - Condition table: conditional threshold/excess display per entity type
    │   - SVG absolute overlay for bezier connection lines
    │   - DOM query: data-factor-id, data-cg-key
    │   - Config panel overlay: absolute positioning + backdrop
    │   - Delete handlers for factors, factor groups, condition groups
    │   - Create dropdown: mouseenter/mouseleave with bridge pseudo-element
    │   - Index-based group color map (computed): sequential assignment avoids collisions
    │   - 60px unified card height, 160px sidebar, 560px left, 520px right
    │
    ├── useApi.js                         # Supabase RPC/REST API layer
    │   - getHeaders(): apikey + Bearer token from props
    │   - rpc(): POST /rest/v1/rpc/{fn} with BFF success:false checking
    │   - restGet(): GET /rest/v1/{table}
    │   - Named methods for all 15+ endpoints including delete + ticket types
    │
    └── components/
        ├── EarnFactorConfig.vue          # Sidebar: edit/create earn factor
        │   - Fields: name, type (rate/multiplier), amount, target currency
        │     (Points/Tickets/Store Credits), ticket type dropdown (conditional),
        │     window start/end (native date input, webkit picker indicator hidden),
        │     public/private, expiry TTL (private only), condition group dropdown
        │   - Delete: "Delete" red text link → confirmation modal (fixed center)
        │   - Uses polaris-modal-header/footer, polaris-label, polaris-radio-wrapper
        │   - Save: emits { groupId, factor } → parent upserts
        │   - Delete: emits { factorId, groupId } → parent calls API
        │
        ├── EarnConditionGroupConfig.vue  # Sidebar: edit/create condition group
        │   - Group name field
        │   - Repeatable condition entries with entity type, entity multi-select,
        │     operator toggle (OR/AND/EACH — product/store entities only),
        │     threshold type (product entities only), excess toggle, min/max
        │   - Entity picker modal with search + checkbox selection
        │   - Delete: "Delete" red text link → confirmation modal (fixed center)
        │   - Uses polaris-modal-header/footer, polaris-link-destructive
        │
        ├── CreateGroupModal.vue          # Modal: create/edit earn factor group
        │   - Fields: name, stackable toggle, window start/end (native date
        │     input, webkit picker indicator hidden)
        │   - Supports edit mode (receives group prop) with delete option
        │   - Delete: "Delete" red text link → nested confirmation modal
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

### Response Handling

The `rpc()` function checks both HTTP status and BFF response format:
- HTTP non-200 → throws with status + body text
- HTTP 200 but `{ success: false, title: "..." }` → throws with title/description (used by admin_delete_* RPCs)

### API Calls Made

| When | Endpoint | Method | Purpose |
|------|----------|--------|---------|
| On mount | `GET /rest/v1/earn_factor_group?select=...&order=created_at.desc` | REST | List all earn factor groups |
| Per group | `POST /rest/v1/rpc/bff_get_earn_factors_by_group` | RPC | Get factors for a group (group ID injected on frontend) |
| On mount | `POST /rest/v1/rpc/bff_get_all_earn_conditions_groups` | RPC | List all condition groups |
| Per cond group | `POST /rest/v1/rpc/bff_get_earn_conditions_group` | RPC | Get condition details (thresholds, operators) |
| On mount | `POST /rest/v1/rpc/get_all_entity_options` | RPC | All entities for condition dropdowns |
| On mount | `GET /rest/v1/ticket_type?select=id,name,ticket_code,is_credit,credit_platform` | REST | Ticket types for target currency dropdown |
| Create/edit factor group | `POST /rest/v1/rpc/bff_upsert_earn_factor_group` | RPC | Create/update group (with optional factors array) |
| Save factor | `bff_get_earn_factor_group_details` then `bff_upsert_earn_factor_group` | RPC | Fetch-merge-upsert pattern for factor edits |
| Save condition group | `POST /rest/v1/rpc/bff_upsert_earn_conditions_group` | RPC | Create/update conditions atomically |
| Connect factor | `bff_get_earn_factor_group_details` then `bff_upsert_earn_factor_group` | RPC | Update factor's `earn_conditions_group_id` |
| Delete factor | `POST /rest/v1/rpc/admin_delete_earn_factor` | RPC | Delete single earn factor |
| Delete factor group | `POST /rest/v1/rpc/admin_delete_earn_factor_group` | RPC | Delete group and all its factors |
| Delete condition group | `POST /rest/v1/rpc/admin_delete_earn_conditions_group` | RPC | Delete condition group |

**Important:** `bff_get_earn_factors_by_group` does NOT return `earn_factor_group_id`. The frontend injects it:
```javascript
m[g.id] = factors.map(f => ({ ...f, earn_factor_group_id: f.earn_factor_group_id || g.id }));
```

---

## Component Properties (WeWeb Config)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `pageTitle` | Text | `Conditional Currency Multipliers` | Page heading text (bindable) |
| `pageDescription` | Text | `Configure reward multipliers...` | Page subtitle (bindable) |
| `supabaseUrl` | Text | `https://wkevmsedchftztoolkmi.supabase.co` | Supabase project URL |
| `supabaseAnonKey` | Text | *(hardcoded CRM anon key)* | Public API key |
| `authToken` | Text | *(must bind)* | Admin user JWT |
| `leftColumnWidth` | Length | `580px` | Left column width |
| `rightColumnWidth` | Length | `580px` | Right column width |
| `connectionLineColor` | Color | `#C9CCCF` | Default line color |
| `connectionLineActiveColor` | Color | `#005BD3` | Hovered line color |
| `configPanelWidth` | Length | `380px` | Sidebar panel width |

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
| `earn_factor` | `id`, `earn_factor_type` (rate/multiplier), `earn_factor_amount`, `target_currency` (points/ticket), `target_entity_id`, `public`, `window_*`, `expiry_days`, `earn_factor_group_id` FK, `earn_conditions_group_id` FK |
| `earn_conditions_group` | `id`, `name`, `merchant_id` |
| `earn_conditions` | `id`, `group_id` FK, `entity` (enum), `entity_ids` (uuid[]), `operator`, `threshold_unit`, `min_threshold`, `max_threshold`, `apply_to_excess_only`, `exclude` |
| `ticket_type` | `id`, `name`, `ticket_code`, `is_credit`, `credit_platform` |

### Enums

- **`earn_factor_type`**: `rate`, `multiplier`
- **`currency`**: `points`, `ticket`
- **`earn_factor_entity_type`**: `product_product`, `product_sku`, `product_brand`, `product_category`, `store`, `store_attribute_set`, `tier`, `persona`, and more

### Entity Type Behavior

| Entity Type | Operator Selector | Threshold Fields | Scope |
|-------------|-------------------|------------------|-------|
| `product_product` | OR / AND / EACH | Amount, Qty Primary, Qty Secondary | Line-item |
| `product_sku` | OR / AND / EACH | Amount, Qty Primary, Qty Secondary | Line-item |
| `product_brand` | OR / AND / EACH | Amount, Qty Primary, Qty Secondary | Line-item |
| `product_category` | OR / AND / EACH | Amount, Qty Primary, Qty Secondary | Line-item |
| `store` | OR / AND / EACH | — (no threshold) | Transaction-wide |
| `store_attribute_set` | OR / AND / EACH | — (no threshold) | Transaction-wide |
| `tier` | — (implicit OR) | — (no threshold) | Transaction-wide gate |
| `persona` | — (implicit OR) | — (no threshold) | Transaction-wide gate |

---

## Earn Factor Config — Currency Logic

The target currency dropdown shows three UI options that map to two DB values:

| UI Option | DB `target_currency` | DB `target_entity_id` | Ticket Type Dropdown |
|-----------|---------------------|-----------------------|---------------------|
| Points | `points` | `NULL` | Hidden |
| Tickets | `ticket` | Selected ticket type ID | Shown (non-credit types) |
| Store Credits | `ticket` | Auto-set to credit ticket type ID | Hidden |

- **Expiry TTL** field (`window_end_ttl_days`) is shown only when the factor is **private** (`public = false`)
- **Ticket type dropdown** filters to non-credit ticket types (`is_credit = false`); store credits auto-resolve the credit type

---

## Save Behavior

No page-level save. Each entity saves independently:

| Entity | Trigger | API |
|--------|---------|-----|
| Earn Factor Group | Create/edit modal → Save | `bff_upsert_earn_factor_group` |
| Earn Factor | Sidebar → Save | `bff_upsert_earn_factor_group` (fetch-merge-upsert) |
| Earn Condition Group | Sidebar → Save | `bff_upsert_earn_conditions_group` |
| Factor ↔ Condition link | "+" popup select, or sidebar dropdown | `bff_upsert_earn_factor_group` |
| Delete Factor | Sidebar → Delete link → Confirm | `admin_delete_earn_factor` |
| Delete Factor Group | Edit modal → Delete link → Confirm | `admin_delete_earn_factor_group` |
| Delete Condition Group | Sidebar → Delete link → Confirm | `admin_delete_earn_conditions_group` |

All save/delete actions trigger toast notifications (success = black, error = Polaris red).

---

## Styling

- Built on `polaris-weweb-styles` (GitHub: `rangwan-rocket/polaris-weweb-styles`, pinned to commit `1182962`)
- Uses Polaris design tokens: `--p-color-*`, `--p-space-*`, `--p-font-*`, `--p-border-radius-*`, `--p-shadow-*`
- Uses Polaris mixins: `polaris-button-primary`, `polaris-button-default`, `polaris-button-critical`, `polaris-button-plain`, `polaris-button-slim`, `polaris-input`, `polaris-select`, `polaris-date-field`, `polaris-radio` (with `box-sizing: border-box` + transform centering), `polaris-radio-wrapper`, `polaris-checkbox`, `polaris-switch`, `polaris-spinner`, `polaris-label`, `polaris-text-heading-sm`, `polaris-text-body`, `polaris-text-body-subdued`, `polaris-text-description`, `polaris-modal-header`, `polaris-modal-footer`, `polaris-modal-backdrop`, `polaris-modal`, `polaris-search-field`, `polaris-chip-removable`, `polaris-segmented-pill`, `polaris-segmented-pill-btn`, `polaris-segmented-pill-btn-active`, `polaris-link-destructive`
- Group colors: 8-color palette assigned by index (earn factor groups first, then condition groups) via computed `groupColorMap` to prevent adjacent groups sharing colors; falls back to hash for unknown IDs
- Inter font throughout matching Figma specs
- Factor card icons: tag (rate), lightning bolt (multiplier)
- Condition group icon: filter/lines (descending horizontal bars)
- Condition detail table: bordered 8px-radius container, pink item badges with eye icon, NoteIcon for threshold, `#EEEEEE` cell borders
- Config panels: absolute positioning overlay with 30% opacity backdrop; both panels use consistent `polaris-modal-header`/`polaris-modal-footer` patterns
- Delete buttons: subtle red text links (`polaris-link-destructive` mixin) labeled "Delete" — positioned in body, not footer
- Date fields: native `<input type="date">` with `polaris-date-field` mixin; native webkit calendar picker indicator hidden via `::-webkit-calendar-picker-indicator { opacity: 0 }` to prevent duplicate icons (mixin adds custom SVG background-image calendar icon)
- Card borders: unified blue (`--p-color-border-info`) for all cards including group sidebar; hover thickens to 1.5px with shadow elevation; dim/unlinked cards use grey border, restore blue on hover
- Group sidebar: unified with card design (white bg, blue border, shadow); action icons hidden by default, appear on hover
- Create dropdown: single consolidated button with mouseenter/mouseleave menu + invisible bridge pseudo-element

---

## Figma References

- Main layout: `figma.com/design/lje20iz4W3A92HJOt1diwb/New-CRM-Polaris?node-id=1104-17765`
- Full page with header: `figma.com/design/lje20iz4W3A92HJOt1diwb/New-CRM-Polaris?node-id=1089-79631`
- Config sidebar (factor): `figma.com/design/lje20iz4W3A92HJOt1diwb/New-CRM-Polaris?node-id=1093-144927`
- Config sidebar (condition): `figma.com/design/lje20iz4W3A92HJOt1diwb/New-CRM-Polaris?node-id=1093-148193`
- Condition group detail: `figma.com/design/lje20iz4W3A92HJOt1diwb/New-CRM-Polaris?node-id=1089-7932`
