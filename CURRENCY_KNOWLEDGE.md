# Currency System Knowledge — Earn Studio Reference

This document extracts the currency system concepts, business rules, and data model details that are directly relevant to the Earn Studio admin component. It omits backend processing (CDC, Kafka, Inngest, wallet, expiry, reversals) and focuses on what the component needs to understand for configuration UI.

---

## Core Concepts

### Currency Types

The system supports two currency types:

| Currency | Type | Storage | `target_entity_id` |
|----------|------|---------|---------------------|
| **Points** | Fungible — all points are interchangeable | Single balance per user | Always `NULL` |
| **Tickets** | Non-fungible — each ticket type is distinct | Separate balance per ticket type per user | Must be `ticket_type.id` |

- Ticket examples: "Raffle Tickets", "Birthday Vouchers", "VIP Access Passes", "Parking Passes"
- Each ticket type maintains independent balances and cannot be exchanged between types
- A special **Credit Ticket Type** (`ticket_type.is_credit = true`) exists for Shopify store credit — the earn engine treats it identically to any other ticket

### Earn Factor

A rule that determines how customers earn currency. Two types:

| Type | Description | Example |
|------|-------------|---------|
| **Rate** | Converts purchase amount to currency | "Spend 100 THB = 1 point" or "Spend 500 THB = 1 ticket" |
| **Multiplier** | Increases currency by a multiplication factor | "Triple points on shoes", "Double tickets for VIP" |

- For **tickets**, rate factors must specify which ticket type via `target_entity_id`
- Multiplier factors apply to specific currency + ticket type combinations

### Earn Factor Group

A container that bundles related earn factors, defining shared properties:
- **Validity period** (`window_start`, `window_end`)
- **Stacking rules** (`stackable` boolean)
- **Activation status** (`active_status`)

### Property Inheritance

Individual earn factors automatically inherit from their parent group unless explicitly overridden:

| Property | Inheritance Rule |
|----------|-----------------|
| Window period | Factor inherits group's window if factor's window is NULL |
| Active status | Factor inherits group's active status if not explicitly set |
| Defaults | If neither group nor factor specifies, factor runs indefinitely and is active |

```
Group: "Q2 2024 Earning Rules" (Apr 1 - Jun 30, Active)
├── Factor 1: "Standard earning rate"   → Inherits Apr 1 - Jun 30
├── Factor 2: "Category multiplier"     → Inherits Apr 1 - Jun 30
└── Factor 3: "Flash weekend bonus"     → Override to specific weekends only
```

---

## Earn Conditions

### What Conditions Do

Qualifying criteria that must be met for an earn factor to apply. Each condition has an `exclude` flag:

| `exclude` | Role | Effect |
|-----------|------|--------|
| `false` (default) | **Include** | Only items/users matching this condition are eligible |
| `true` | **Exclude** | Items matching this condition are removed from the eligible set |

### Entity Types

| Entity | Description | Scope |
|--------|-------------|-------|
| `product_sku` | Specific product variants | Line-item |
| `product_product` | Product types | Line-item |
| `product_brand` | Brand-based rules | Line-item |
| `product_category` | Category-wide rules | Line-item |
| `store` | Store-based rules | Transaction-wide |
| `store_attribute_set` | Store attribute set | Transaction-wide |
| `tier` | Customer loyalty tier | Transaction-wide gate |
| `persona` | Customer persona/segment | Transaction-wide gate |

- **Product entity types** support both include and exclude modes
- **Tier, persona, store** conditions are always include-only transaction-wide gates

### Operators

Determines how multiple entities within a single condition are evaluated:

| Operator | Behavior | Example |
|----------|----------|---------|
| **OR** (Aggregate) | Sum quantities/amounts across all matching entities, check threshold on total | "Buy 50+ total of SKU-A or SKU-B" |
| **AND** (All Required) | All entities must be present in purchase, each checked individually | "Must buy both SKU-A and SKU-B" |
| **EACH** (Independent) | Each entity evaluated independently, only those meeting threshold included | "Each qualifying SKU must have 10+ units" |

- Only relevant for product/store entities (tier/persona use implicit OR since user has a single value)

### Threshold Configuration

Product conditions can include minimum and maximum thresholds measured in three ways:

| `threshold_unit` | What It Checks | Use Case |
|------------------|----------------|----------|
| `quantity_primary` | Primary quantity (bags, pieces, bottles) | "Buy ≥50 bags of cement → 5x points" |
| `quantity_secondary` | Secondary/bulk quantity (tonnes, pallets) | "Buy ≥2 tonnes of steel → 10x points" |
| `amount` | Line total value in currency | "Spend ≥5000 THB on electronics → 3x points" |
| `NULL` | No threshold | Factor applies if entity matches |

**Threshold fields on `earn_conditions`:**

| Field | Type | Purpose |
|-------|------|---------|
| `threshold_unit` | TEXT | Which measurement to check |
| `min_threshold` | NUMERIC | Minimum value required to qualify |
| `max_threshold` | NUMERIC | Maximum eligible value (cap to prevent abuse) |
| `apply_to_excess_only` | BOOLEAN | How multiplier applies when threshold met |

**Multiplier Application Modes:**

| Mode | `apply_to_excess_only` | Behavior |
|------|------------------------|----------|
| **Full Line** | `false` (default) | Multiplier applies to entire matched line value |
| **Excess Only** | `true` | Multiplier applies only to quantity/value above `min_threshold` |

```
Full Line Mode:     Customer buys 60 bags (min: 50) → 5x applies to ALL 60 bags
Excess Only Mode:   Customer buys 60 bags (min: 50) → 5x applies ONLY to 10 bags (60 - 50)
```

### Condition Evaluation (Two-Pass)

The engine evaluates conditions in two passes:

1. **Pass 1 — Include** (`exclude = false`): Build eligible item set from matching product conditions. If no product include conditions exist, base = all items.
2. **Pass 2 — Exclude** (`exclude = true`, product entities only): Remove matching items from the eligible set. If set becomes empty → factor does not apply.

**Scope determination:**
- Rules with product conditions → Apply only to matching items
- Rules with only tier/persona conditions → Apply to entire transaction
- Rules with no conditions → Apply to entire transaction
- Rules with thresholds → Must meet minimum to activate, capped at maximum

### Shared Earn Conditions Groups

Multiple earn factors can reference the same `earn_conditions_group`. This is intentional — a conditions group defines a reusable eligibility gate.

| Pattern | Valid? | Reason |
|---------|--------|--------|
| Rate + Multiplier, different windows | ✅ | Same eligibility gate, different temporal scope |
| Rate (points) + Rate (tickets) | ✅ | Same eligibility, different target currencies |
| Rate + Rate, same target currency | ❌ | Only one rate per currency applies — one is silently ignored |
| Rate + Multiplier, identical windows | ⚠️ | Works but semantically redundant |

**Operational risk:** Editing a shared conditions group affects all linked factors simultaneously. The admin UI should surface all earn factors linked to a conditions group before allowing edits.

---

## Calculation Rules (Affects What Admin Configures)

### Rate Selection — "Best Rate Wins"

- Only **ONE rate per currency type** can apply to a given scope
- If multiple rates qualify, the best rate (lowest THB per currency unit) wins
- For tickets: rate applies to the specific ticket type defined by `target_entity_id`
- Points always have `target_entity_id = NULL`

### Multiplier Stacking

**Stackable Groups** (`stackable = true`):
- All qualifying multipliers combine together
- Example: 2x for Gold tier + 1.5x for weekend = 3x total

**Non-Stackable Groups** (`stackable = false`):
- Only the best multiplier per scope applies
- **Exception:** Can have one product-specific AND one transaction-wide multiplier (they operate on mutually exclusive portions of the amount)

**Why product-specific and transaction-wide coexist in non-stackable:**
```
Total Transaction: 1,000 THB
├── Product-Specific (Shoes 300 THB): 300 × 3x = 9 points   ← consumed
└── Transaction-Wide (Birthday 700 THB): 700 × 5x = 35 points ← remainder only
Total: 44 points (no amount multiplied twice)
```

### Multiplier Calculation Mode (Merchant-Level)

The `multiplier_additive` setting on `merchant_master` determines how multiplier bonuses are calculated:

| Setting | Name | Formula | Example (5x on 10K base) |
|---------|------|---------|---------------------------|
| `false` (default) | **Total Rate** | bonus = base × (M - 1) | 10K + (10K × 4) = 50K total |
| `true` | **Additive** | bonus = base × M | 10K + (10K × 5) = 60K total |

### Public vs Private Earn Factors

| Type | `public` | Visibility | Assignment |
|------|----------|------------|------------|
| **Public** | `true` | Available to all eligible customers | Automatic via conditions |
| **Private** | `false` | Exclusive to assigned customers | Via `earn_factor_user` table |

When both public and private factors qualify, the system selects the best applicable combination.

---

## Database Schema (Component-Relevant Tables)

### earn_factor_group

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Group display name |
| `stackable` | BOOLEAN | Whether multipliers in this group can stack |
| `window_start` | TIMESTAMPTZ | Group validity start (inherited by factors) |
| `window_end` | TIMESTAMPTZ | Group validity end (inherited by factors) |
| `active_status` | BOOLEAN | Group active/inactive (inherited by factors) |
| `merchant_id` | UUID | Merchant FK |

### earn_factor

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Factor display name |
| `earn_factor_type` | ENUM | `rate` or `multiplier` |
| `earn_factor_amount` | NUMERIC | Rate value (THB per 1 currency) or multiplier value |
| `target_currency` | ENUM | `points` or `ticket` |
| `target_entity_id` | UUID | NULL for points, `ticket_type.id` for tickets |
| `public` | BOOLEAN | Public (true) or personalized offer (false) |
| `window_start` | TIMESTAMPTZ | Factor-level override for validity start |
| `window_end` | TIMESTAMPTZ | Factor-level override for validity end |
| `expiry_days` | INTEGER | Days until earned currency expires |
| `earn_factor_group_id` | UUID FK | Parent group |
| `earn_conditions_group_id` | UUID FK | Linked condition group (nullable) |

**Note:** `bff_get_earn_factors_by_group` does NOT return `earn_factor_group_id` in its response — the frontend injects it from the query context.

### earn_conditions_group

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Group display name |
| `merchant_id` | UUID | Merchant FK |

### earn_conditions

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `group_id` | UUID FK | Parent conditions group |
| `entity` | ENUM | Entity type (see Entity Types above) |
| `entity_ids` | UUID[] | Array of entity IDs matching this condition |
| `operator` | ENUM | `OR`, `AND`, or `EACH` |
| `threshold_unit` | TEXT | `quantity_primary`, `quantity_secondary`, `amount`, or NULL |
| `min_threshold` | NUMERIC | Minimum value to qualify |
| `max_threshold` | NUMERIC | Maximum value cap |
| `apply_to_excess_only` | BOOLEAN | Excess-only mode for multiplier |
| `exclude` | BOOLEAN | `false` = include, `true` = exclude |

### Enums

| Enum | Values |
|------|--------|
| `earn_factor_type` | `rate`, `multiplier` |
| `currency` | `points`, `ticket` |
| `earn_factor_entity_type` | `product_product`, `product_sku`, `product_brand`, `product_category`, `store`, `store_attribute_set`, `tier`, `persona`, and more |

---

## Business Rules Summary (Admin-Facing)

1. **One rate per currency type** — If multiple rates qualify for the same currency, only the best rate applies
2. **Multiplier stacking controlled by group** — `stackable` on the group determines if multipliers combine or compete
3. **Product-specific + transaction-wide coexist** — Even in non-stackable groups, one of each scope type can apply (they affect different portions of the amount)
4. **Inheritance simplifies config** — Factors inherit window and active status from their group; explicit values override
5. **Shared conditions groups are valid** — Multiple factors can reference the same conditions group when they have different target currencies
6. **Exclude conditions are subtractive** — They remove items from the eligible set, not gate the entire transaction
7. **Thresholds are optional** — NULL threshold = no quantity/amount check, just entity matching
8. **Threshold caps prevent abuse** — `max_threshold` limits how much of a purchase qualifies for bonus multipliers
9. **Excess-only mode rewards incremental purchases** — Only the amount above `min_threshold` gets the multiplier bonus

---

## Configuration Examples

### Example 1: Simple Points Rate
```
Earn Factor Group: "Standard Earning" (stackable: false)
└── Factor: rate, 100 THB = 1 point, no conditions, always-on
```
Customer spends 1,000 THB → earns 10 points.

### Example 2: Tiered Rates with Shared Conditions
```
Earn Factor Group: "Tiered Earning"
├── Factor: rate (points), 100 THB = 1pt  → conditions_group → tier=Gold
├── Factor: rate (points), 200 THB = 1pt  → conditions_group → tier=Silver
├── Factor: rate (ticket), 500 THB = 1    → conditions_group → tier=Gold     ← shared
└── Factor: rate (ticket), 1000 THB = 1   → conditions_group → tier=Silver   ← shared
```
Gold members earn points at 100:1 and tickets at 500:1 simultaneously.

### Example 3: Product-Specific Multiplier + Transaction-Wide Multiplier
```
Earn Factor Group: "Holiday Promo" (stackable: false)
├── Factor: rate, 100 THB = 1pt (base)
├── Factor: multiplier 3x → conditions_group → category=Shoes         (product-specific)
└── Factor: multiplier 5x → conditions_group → tier=Gold              (transaction-wide)
```
Gold member buys 300 THB shoes + 700 THB clothing:
- Shoes: 3pt × 3x = 9pt (product multiplier, 300 THB consumed)
- Clothing: 7pt × 5x = 35pt (transaction multiplier on 700 THB remainder)
- Total: 44 points

### Example 4: Exclusion Condition
```
conditions_group:
  → earn_condition: entity=product_category, entity_ids=[shoes_cat], exclude=false  (include)
  → earn_condition: entity=product_sku, entity_ids=[sale_sku_1, sale_sku_2], exclude=true  (exclude)
```
Earn on shoes, except sale items — Pass 1 includes shoes, Pass 2 removes sale SKUs.

### Example 5: Threshold with Excess-Only Mode
```
Condition: entity=product_sku, threshold_unit=quantity_primary, min=50, apply_to_excess_only=true
Factor: multiplier 5x
```
Customer buys 60 bags → 5x applies only to 10 excess bags (60 - 50).

---

*Sourced from: Currency (Points & Tickets) - Calculation & Award Engine v4.1, January 2026*
*Filtered for: Earn Studio component configuration UI relevance*
