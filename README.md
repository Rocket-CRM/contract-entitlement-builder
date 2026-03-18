# Contract & Entitlement Builder

A WeWeb custom component for managing **persona group contracts** with **persona levels** and **entitlements** (packages, rewards, standing benefits). Built with [Polaris WeWeb Styles](https://github.com/rangwan-rocket/polaris-weweb-styles) and following [Polaris Structural Patterns](https://github.com/Rocket-CRM/polaris-guide).

## Overview

This component provides a full admin interface for:

- **Contracts** — persona groups with governance metadata (company, dates, status, type)
- **Persona Levels** — named tiers within each contract (e.g. Executive, General)
- **Entitlements** — what each level auto-grants when a user is assigned:
  - `package` — auto-issues a package bundle
  - `reward` — directly issues a reward with quantity
  - `benefit` — standing privilege (discount, free access, priority)

All three levels save atomically via `bff_upsert_contract_with_levels`.

## Data Hierarchy

```
Persona Group (contract)        ← top level, has contract metadata
  └── Persona Level             ← child, each group has 1-N levels
        └── Entitlements        ← grandchild, each level has 0-N entitlements
              (type: package | reward | benefit)
```

## Workflow States

| Status | Description |
|--------|-------------|
| `draft` | Being configured, not active |
| `pending` | Submitted for approval |
| `active` | Live, users can be assigned |
| `suspended` | Temporarily paused |
| `expired` | Past contract end date |

## Development

```bash
npm install
npm run serve --port=8080
```

Then add the custom element in the WeWeb editor developer popup.

## Build

```bash
npm run build --name=contract-entitlement-builder
```

## Backend (Supabase)

All API calls go directly to Supabase RPC functions:

| Action | Function |
|--------|----------|
| List contracts | `bff_admin_get_contract_list(p_status, p_type)` |
| Get contract detail | `bff_admin_get_contract_detail(p_group_id)` |
| Upsert contract + levels + entitlements | `bff_upsert_contract_with_levels(...)` |
| List packages | `bff_admin_get_package_list(p_status, p_search)` |
| Get rewards | REST: `reward_master?active_status=eq.true` |

## Props (ww-config)

| Prop | Type | Description |
|------|------|-------------|
| `pageTitle` | Text | List view heading |
| `pageDescription` | Text | List view subtitle |
| `supabaseUrl` | Text | Supabase project URL |
| `supabaseAnonKey` | Text | Supabase publishable anon key |
| `authToken` | Text | JWT from admin auth session |

## Trigger Events

- `contract-saved` — after successful save
- `view-changed` — when navigating between list and editor
- `data-loaded` — when contract list loads
- `error` — on any API error

## Actions

- `refreshData` — reload all data
- `navigateToList` — return to list view
- `navigateToEditor` — open editor (optionally with a group ID)
