<template>
  <div class="efg-section">
    <!-- Group Header -->
    <div class="efg-header">
      <div class="efg-header__icon">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="4" width="7" height="5" rx="1" fill="currentColor" opacity="0.8"/>
          <rect x="2" y="11" width="7" height="5" rx="1" fill="currentColor" opacity="0.6"/>
          <rect x="11" y="4" width="7" height="5" rx="1" fill="currentColor" opacity="0.4"/>
          <rect x="11" y="11" width="7" height="5" rx="1" fill="currentColor" opacity="0.3"/>
        </svg>
      </div>
      <span class="efg-header__name" :title="group?.name || 'Untitled Group'">{{ group?.name || 'Untitled Group' }}</span>
      <button class="efg-header__add" @click.stop="$emit('add-factor', group)">+ Add earn factor</button>
      <button class="efg-header__icon-btn" @click.stop="$emit('edit-group', group)" title="Edit group">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" fill="currentColor"/></svg>
      </button>
    </div>

    <!-- Factor Pills -->
    <div class="efg-factors">
      <div
        v-for="factor in factors"
        :key="factor?.id"
        class="ef-pill"
        :ref="el => registerRef(factor?.id, el)"
        :class="{ 'ef-pill--active': selectedFactorId === factor?.id }"
        @click="$emit('select-factor', factor)"
      >
        <div class="ef-pill__left">
          <span class="ef-pill__type-dot" :class="factor?.earn_factor_type === 'rate' ? 'ef-pill__type-dot--rate' : 'ef-pill__type-dot--multiplier'"></span>
          <span class="ef-pill__name">{{ getFactorLabel(factor) }}</span>
          <span v-if="factor?.earn_factor_type === 'multiplier'" class="ef-pill__mult">{{ factor?.earn_factor_amount }}x</span>
        </div>
        <div class="ef-pill__right">
          <button class="ef-pill__icon-btn" @click.stop="$emit('edit-factor', factor)" title="Edit">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" fill="currentColor"/></svg>
          </button>
          <button class="ef-pill__connect-btn" @click.stop="$emit('connect-factor', factor, $event)" title="Link to condition group">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>

      <div v-if="!factors?.length" class="efg-empty">No factors</div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    group: { type: Object, default: () => ({}) },
    factors: { type: Array, default: () => [] },
    selectedFactorId: { type: String, default: null },
  },
  emits: ['add-factor', 'edit-group', 'edit-factor', 'select-factor', 'connect-factor', 'factor-ref'],
  setup(props, { emit }) {
    function registerRef(factorId, el) {
      if (el && factorId) emit('factor-ref', { factorId, el });
    }

    function getFactorLabel(factor) {
      if (!factor) return 'Unnamed';
      const currency = factor.target_currency === 'ticket' ? 'Credit' : 'Points';
      const type = factor.earn_factor_type === 'rate' ? 'Rate' : 'Mult';
      const amount = factor.earn_factor_type === 'rate' && factor.earn_factor_amount
        ? ` ฿${factor.earn_factor_amount}`
        : '';
      return `${currency} ${type}${amount}`;
    }

    return { registerRef, getFactorLabel };
  },
};
</script>

<style scoped lang="scss">
@import 'polaris-weweb-styles';

.efg-section {
  margin-bottom: var(--p-space-100);
}

.efg-header {
  display: flex;
  align-items: center;
  gap: var(--p-space-200);
  padding: var(--p-space-100) var(--p-space-200);
  margin-bottom: var(--p-space-050);

  &__icon {
    width: 24px;
    height: 24px;
    min-width: 24px;
    border-radius: var(--p-border-radius-100);
    background: var(--p-color-bg-fill-critical-secondary);
    color: var(--p-color-text-critical);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__name {
    font-size: var(--p-font-size-300);
    font-weight: var(--p-font-weight-semibold);
    color: var(--p-color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  &__add {
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
    &:hover { background: var(--p-color-bg-surface-hover); }
  }
}

.efg-factors {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-100);
}

.ef-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 var(--p-space-300);
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

  &__left {
    display: flex;
    align-items: center;
    gap: var(--p-space-200);
    min-width: 0;
    flex: 1;
  }

  &__type-dot {
    width: 8px;
    height: 8px;
    min-width: 8px;
    border-radius: var(--p-border-radius-full);

    &--rate { background: var(--p-color-text-info); }
    &--multiplier { background: var(--p-color-text-success); }
  }

  &__name {
    font-size: var(--p-font-size-325);
    font-weight: var(--p-font-weight-medium);
    color: var(--p-color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__mult {
    font-size: var(--p-font-size-275);
    font-weight: var(--p-font-weight-bold);
    color: var(--p-color-text-critical);
    background: var(--p-color-bg-fill-critical-secondary);
    padding: 1px 5px;
    border-radius: var(--p-border-radius-full);
    flex-shrink: 0;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: var(--p-space-100);
    flex-shrink: 0;
    opacity: 0;
    transition: opacity var(--p-motion-duration-100) var(--p-motion-ease);
  }

  &:hover &__right {
    opacity: 1;
  }

  &__icon-btn {
    width: 24px;
    height: 24px;
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

  &__connect-btn {
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--p-color-bg-fill-brand);
    color: var(--p-color-text-on-color);
    border: none;
    border-radius: var(--p-border-radius-full);
    cursor: pointer;
    transition: background var(--p-motion-duration-100) var(--p-motion-ease);
    &:hover { background: var(--p-color-bg-fill-brand-hover); }
  }
}

.efg-empty {
  font-size: var(--p-font-size-275);
  color: var(--p-color-text-disabled);
  padding: var(--p-space-200) var(--p-space-300);
  text-align: center;
}
</style>
