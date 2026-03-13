<template>
  <div
    class="ec-pill"
    :class="{ 'ec-pill--active': isActive }"
    :ref="el => $emit('pill-ref', { groupId: group?.id, displayKey, el })"
    @click="$emit('select-group', group, displayKey)"
  >
    <div class="ec-pill__dot"></div>
    <div class="ec-pill__left">
      <div class="ec-pill__icon" :style="iconStyle">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="5" height="14" rx="1.5" fill="currentColor" opacity="0.7"/>
          <rect x="10" y="6" width="5" height="11" rx="1.5" fill="currentColor" opacity="0.5"/>
        </svg>
      </div>
      <span class="ec-pill__name" :title="group?.name || 'Untitled'">{{ group?.name || 'Untitled' }}</span>
      <span v-if="conditionCount > 0" class="ec-pill__badge">{{ conditionCount }}</span>
      <span v-if="linkedFactorCount > 0" class="ec-pill__link-badge" :title="`${linkedFactorCount} factor(s) linked`">
        <svg width="10" height="10" viewBox="0 0 20 20" fill="none">
          <path d="M8.5 11.5a4 4 0 005.657 0l2.828-2.828a4 4 0 00-5.657-5.657L10 4.343" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M11.5 8.5a4 4 0 00-5.657 0L3.015 11.328a4 4 0 005.657 5.657L10 15.657" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
        {{ linkedFactorCount }}
      </span>
    </div>
    <div class="ec-pill__right">
      <button class="ec-pill__action" @click.stop="$emit('add-condition', group)">+ Add Condition</button>
      <button class="ec-pill__icon-btn" @click.stop="$emit('edit-group', group)" title="Edit">
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" fill="currentColor"/></svg>
      </button>
    </div>
  </div>

  <!-- Detail popup below -->
  <transition name="expand">
    <div v-if="isActive && conditions?.length" class="ec-detail">
      <table class="ec-detail__table">
        <thead>
          <tr>
            <th>TYPE</th>
            <th>ITEMS</th>
            <th>LOGIC</th>
            <th>THRESHOLD TYPE</th>
            <th>EXCESS</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cond in conditions" :key="cond?.id">
            <td>{{ formatEntity(cond?.entity || cond?.filter_type) }}</td>
            <td><span class="ec-detail__items">{{ getItemCount(cond) }} <span class="ec-detail__items-dot"></span></span></td>
            <td>{{ cond?.operator || 'OR' }}</td>
            <td>{{ formatThreshold(cond?.threshold_unit) }}</td>
            <td>{{ cond?.apply_to_excess_only ? 'Yes' : 'No' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </transition>
</template>

<script>
import { computed } from 'vue';

const ENTITY_LABELS = {
  product_product: 'Product', product_sku: 'SKU', product_brand: 'Brand',
  product_category: 'Category', store: 'Store', store_attribute_set: 'Store Set',
  tier: 'Tier', persona: 'Persona',
};
const THRESHOLD_LABELS = { amount: 'Purchase amount', quantity_primary: 'Qty (primary)', quantity_secondary: 'Qty (secondary)' };

export default {
  props: {
    group: { type: Object, default: () => ({}) },
    conditions: { type: Array, default: () => [] },
    linkedFactorCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: false },
    displayKey: { type: String, default: '' },
  },
  emits: ['select-group', 'add-condition', 'edit-group', 'pill-ref'],
  setup(props) {
    const conditionCount = computed(() => props.conditions?.length || 0);

    const iconColors = ['#2C6ECB', '#D82C0D', '#8A6116', '#008060', '#6D28D9', '#0D9488'];
    const iconStyle = computed(() => {
      let hash = 0;
      const str = props.group?.id || '';
      for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
      const color = iconColors[Math.abs(hash) % iconColors.length];
      return { background: `${color}18`, color };
    });

    function formatEntity(e) { return ENTITY_LABELS[e] || e || '—'; }
    function getItemCount(c) { const ids = c?.entity_ids || c?.filter_ids || []; return Array.isArray(ids) ? ids.length : 0; }
    function formatThreshold(u) { return THRESHOLD_LABELS[u] || '—'; }

    return { conditionCount, iconStyle, formatEntity, getItemCount, formatThreshold };
  },
};
</script>

<style scoped lang="scss">
@import 'polaris-weweb-styles';

.ec-pill {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 var(--p-space-300) 0 var(--p-space-400);
  background: var(--p-color-bg-surface);
  border: 1px solid var(--p-color-border);
  border-radius: var(--p-border-radius-200);
  cursor: pointer;
  transition: box-shadow var(--p-motion-duration-100) var(--p-motion-ease),
              border-color var(--p-motion-duration-100) var(--p-motion-ease);

  &:hover {
    box-shadow: var(--p-shadow-card-hover);
    border-color: var(--p-color-border-hover);
  }

  &--active {
    border-color: var(--p-color-focus-ring);
    box-shadow: 0 0 0 1px var(--p-color-focus-ring);
  }

  &__dot {
    position: absolute;
    left: -6px;
    top: 50%;
    transform: translateY(-50%);
    width: 10px;
    height: 10px;
    border-radius: var(--p-border-radius-full);
    background: var(--p-color-border);
    border: 2px solid var(--p-color-bg);
  }

  &__left {
    display: flex;
    align-items: center;
    gap: var(--p-space-200);
    min-width: 0;
    flex: 1;
  }

  &__icon {
    width: 24px;
    height: 24px;
    min-width: 24px;
    border-radius: var(--p-border-radius-100);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__name {
    font-size: var(--p-font-size-325);
    font-weight: var(--p-font-weight-medium);
    color: var(--p-color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__badge {
    font-size: 10px;
    font-weight: var(--p-font-weight-bold);
    color: var(--p-color-text-info);
    background: var(--p-color-bg-fill-info-secondary);
    padding: 1px 5px;
    border-radius: var(--p-border-radius-full);
    flex-shrink: 0;
  }

  &__link-badge {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 10px;
    font-weight: var(--p-font-weight-medium);
    color: var(--p-color-text-secondary);
    background: var(--p-color-bg-fill);
    padding: 1px 5px;
    border-radius: var(--p-border-radius-full);
    flex-shrink: 0;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: var(--p-space-100);
    flex-shrink: 0;
  }

  &__action {
    @include polaris-button-plain;
    font-size: 11px;
    white-space: nowrap;
    padding: 2px 6px;
    min-height: auto;
  }

  &__icon-btn {
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: var(--p-border-radius-100);
    color: var(--p-color-icon);
    cursor: pointer;
    &:hover { background: var(--p-color-bg-fill-transparent-hover); }
  }
}

.ec-detail {
  margin-top: var(--p-space-050);
  margin-left: var(--p-space-400);
  background: var(--p-color-bg-surface);
  border: 1px solid var(--p-color-border);
  border-radius: var(--p-border-radius-200);
  overflow: hidden;

  &__table {
    @include polaris-table;
    font-size: var(--p-font-size-275);

    th {
      padding: var(--p-space-150) var(--p-space-200);
      font-size: 10px;
      font-weight: var(--p-font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--p-color-text-secondary);
      background: var(--p-color-bg-surface-secondary);
      border-bottom: 1px solid var(--p-color-border);
      text-align: left;
    }

    td {
      padding: var(--p-space-150) var(--p-space-200);
      color: var(--p-color-text);
      border-bottom: 1px solid var(--p-color-border);
      font-size: var(--p-font-size-275);
    }

    tr:last-child td { border-bottom: none; }
  }

  &__items {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: var(--p-color-text-critical);
    font-weight: var(--p-font-weight-medium);
  }

  &__items-dot {
    width: 6px;
    height: 6px;
    border-radius: var(--p-border-radius-full);
    border: 1.5px solid var(--p-color-text-critical);
  }
}

.expand-enter-active, .expand-leave-active {
  transition: all var(--p-motion-duration-200) var(--p-motion-ease);
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to, .expand-leave-from {
  opacity: 1;
  max-height: 300px;
}
</style>
