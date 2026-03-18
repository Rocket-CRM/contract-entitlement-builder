<template>
  <div class="list-view">
    <div class="list-view__header">
      <div>
        <h1 class="list-view__title">{{ title }}</h1>
        <p class="list-view__desc">{{ description }}</p>
      </div>
      <div class="list-view__actions">
        <div class="list-view__filters">
          <select class="list-view__filter-select" :value="filterStatus" @change="$emit('update:filterStatus', $event.target.value)">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="expired">Expired</option>
          </select>
          <select class="list-view__filter-select" :value="filterType" @change="$emit('update:filterType', $event.target.value)">
            <option value="">All types</option>
            <option value="corporate">Corporate</option>
            <option value="insurance">Insurance</option>
            <option value="vip">VIP</option>
            <option value="partner">Partner</option>
          </select>
        </div>
        <button class="list-view__create-btn" @click="$emit('create')">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          New contract
        </button>
      </div>
    </div>

    <div v-if="loading" class="list-view__loading">
      <div class="list-view__spinner"></div>
    </div>

    <div v-else-if="!contracts?.length" class="list-view__empty-wrap">
      <div class="list-view__empty">
        <div class="list-view__empty-icon">📋</div>
        <div class="list-view__empty-heading">No contracts yet</div>
        <div class="list-view__empty-text">
          Create your first contract to start configuring persona groups with entitlements.
        </div>
        <button class="list-view__empty-btn" @click="$emit('create')">Create contract</button>
      </div>
    </div>

    <div v-else class="list-view__table-wrap">
      <table class="list-view__table">
        <thead>
          <tr>
            <th class="th--first">Contract</th>
            <th>Type</th>
            <th>Company</th>
            <th>Period</th>
            <th>Levels</th>
            <th>Members</th>
            <th>Status</th>
            <th class="th--last">Active</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in contracts" :key="c?.id" class="list-view__row" @click="$emit('select', c)">
            <td class="list-view__name-cell">
              <span class="list-view__contract-name">{{ c?.group_name || 'Untitled' }}</span>
            </td>
            <td>
              <span class="list-view__type-chip" :class="'list-view__type-chip--' + (c?.contract_type || '')">
                {{ c?.contract_type || '—' }}
              </span>
            </td>
            <td>{{ c?.company_name || '—' }}</td>
            <td class="list-view__period-cell">
              <template v-if="c?.contract_start || c?.contract_end">
                {{ formatDate(c?.contract_start) }} → {{ formatDate(c?.contract_end) }}
              </template>
              <template v-else>—</template>
            </td>
            <td class="list-view__num-cell">{{ c?.level_count ?? 0 }}</td>
            <td class="list-view__num-cell">{{ c?.member_count ?? 0 }}</td>
            <td>
              <span class="list-view__status-badge" :class="'list-view__status-badge--' + (c?.contract_status || 'draft')">
                <span class="list-view__status-dot"></span>
                {{ c?.contract_status || 'draft' }}
              </span>
            </td>
            <td>
              <span :class="c?.active_status ? 'list-view__active--yes' : 'list-view__active--no'">
                {{ c?.active_status ? 'Yes' : 'No' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: { type: String, default: 'Contracts & Persona Entitlements' },
    description: { type: String, default: 'Configure persona groups as contracts with auto-assigned packages, rewards, and benefits per level.' },
    contracts: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    filterStatus: { type: String, default: '' },
    filterType: { type: String, default: '' },
  },
  emits: ['create', 'select', 'update:filterStatus', 'update:filterType'],
  setup() {
    const formatDate = (d) => {
      if (!d) return '—';
      try {
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      } catch { return d; }
    };
    return { formatDate };
  },
};
</script>

<style scoped lang="scss">
@import 'polaris-weweb-styles';

.list-view {
  flex: 1;
  padding: var(--p-space-600) var(--p-space-500);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--p-space-400);

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--p-space-400);
  }

  &__title {
    @include polaris-text-heading-md;
    margin: 0 0 var(--p-space-100);
  }

  &__desc {
    font-size: var(--p-font-size-325);
    color: var(--p-color-text-secondary);
    margin: 0;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--p-space-200);
    flex-shrink: 0;
  }

  &__filters {
    display: flex;
    gap: var(--p-space-200);
  }

  &__filter-select {
    @include polaris-select;
    height: 36px;
    font-size: var(--p-font-size-300);
    min-width: 130px;
  }

  &__create-btn {
    @include polaris-button-primary;
    @include polaris-button-slim;
    display: inline-flex;
    align-items: center;
    gap: var(--p-space-150);
    white-space: nowrap;
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: var(--p-space-1200) 0;
  }

  &__spinner { @include polaris-spinner; }

  &__empty-wrap {
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--p-color-bg-surface);
    border: 1px solid var(--p-color-border);
    border-radius: var(--p-border-radius-300);
  }

  &__empty {
    text-align: center;
    padding: var(--p-space-800);
    max-width: 360px;
  }

  &__empty-icon { font-size: 40px; margin-bottom: var(--p-space-300); }

  &__empty-heading {
    font-size: var(--p-font-size-400);
    font-weight: var(--p-font-weight-semibold);
    color: var(--p-color-text);
    margin-bottom: var(--p-space-200);
  }

  &__empty-text {
    font-size: var(--p-font-size-325);
    color: var(--p-color-text-secondary);
    margin-bottom: var(--p-space-400);
    line-height: 1.5;
  }

  &__empty-btn {
    @include polaris-button-primary;
  }

  &__table-wrap {
    overflow-x: auto;
    background: var(--p-color-bg-surface);
    border: 1px solid var(--p-color-border);
    border-radius: var(--p-border-radius-300);
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--p-font-size-325);
    font-family: var(--p-font-family-sans);

    th {
      text-align: left;
      padding: var(--p-space-300) var(--p-space-400);
      font-weight: var(--p-font-weight-semibold);
      font-size: var(--p-font-size-275);
      color: var(--p-color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid var(--p-color-border);
      background: var(--p-color-bg-surface-secondary);
      white-space: nowrap;
    }

    .th--first { border-top-left-radius: var(--p-border-radius-300); }
    .th--last { border-top-right-radius: var(--p-border-radius-300); }

    td {
      padding: var(--p-space-300) var(--p-space-400);
      border-bottom: 1px solid var(--p-color-border);
      color: var(--p-color-text);
      vertical-align: middle;
    }
  }

  &__row {
    cursor: pointer;
    transition: background 0.15s;
    &:hover { background: var(--p-color-bg-surface-hover); }
    &:last-child td { border-bottom: none; }
  }

  &__contract-name {
    font-weight: var(--p-font-weight-semibold);
    color: var(--p-color-text);
  }

  &__type-chip {
    font-size: 11px;
    font-weight: var(--p-font-weight-semibold);
    text-transform: capitalize;
    padding: 2px 8px;
    border-radius: var(--p-border-radius-full);
    white-space: nowrap;

    &--corporate { background: #E0E7FF; color: #4338CA; }
    &--insurance { background: #DBEAFE; color: #1D4ED8; }
    &--vip { background: #FEF3C7; color: #D97706; }
    &--partner { background: #D1FAE5; color: #059669; }
  }

  &__period-cell {
    font-size: var(--p-font-size-275);
    color: var(--p-color-text-secondary);
    white-space: nowrap;
  }

  &__num-cell { text-align: center; }

  &__status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: var(--p-font-size-275);
    font-weight: var(--p-font-weight-medium);
    text-transform: capitalize;
    white-space: nowrap;

    &--active {
      background: var(--p-color-bg-fill-success-secondary);
      color: var(--p-color-text-success);
    }
    &--draft {
      background: var(--p-color-bg-surface-secondary);
      color: var(--p-color-text-secondary);
    }
    &--pending {
      background: #FEF3C7;
      color: #D97706;
    }
    &--suspended {
      background: #FEE2E2;
      color: #DC2626;
    }
    &--expired {
      background: var(--p-color-bg-surface-secondary);
      color: var(--p-color-text-disabled);
    }
  }

  &__status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;

    .list-view__status-badge--active & { background: var(--p-color-icon-success); }
    .list-view__status-badge--draft & { background: var(--p-color-icon-secondary); }
    .list-view__status-badge--pending & { background: #D97706; }
    .list-view__status-badge--suspended & { background: #DC2626; }
    .list-view__status-badge--expired & { background: var(--p-color-icon-disabled); }
  }

  &__active--yes { color: var(--p-color-text-success); font-weight: var(--p-font-weight-medium); }
  &__active--no { color: var(--p-color-text-secondary); }
}
</style>
