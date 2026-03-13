<template>
  <div class="efg-section">
    <!-- Group Header -->
    <div class="efg-header">
      <div class="efg-header__left">
        <div class="efg-header__icon">
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="4" width="7" height="5" rx="1" fill="currentColor" opacity="0.8"/>
            <rect x="2" y="11" width="7" height="5" rx="1" fill="currentColor" opacity="0.6"/>
            <rect x="11" y="4" width="7" height="5" rx="1" fill="currentColor" opacity="0.4"/>
            <rect x="11" y="11" width="7" height="5" rx="1" fill="currentColor" opacity="0.3"/>
          </svg>
        </div>
        <span class="efg-header__name" :title="group?.name || 'Untitled Group'">{{ group?.name || 'Untitled Group' }}</span>
        <span v-if="linkedConditionCount > 0" class="efg-header__link-badge" :title="`${linkedConditionCount} condition group(s) linked`">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <path d="M8.5 11.5a4 4 0 005.657 0l2.828-2.828a4 4 0 00-5.657-5.657L10 4.343" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M11.5 8.5a4 4 0 00-5.657 0L3.015 11.328a4 4 0 005.657 5.657L10 15.657" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          {{ linkedConditionCount }}
        </span>
      </div>
      <div class="efg-header__right">
        <button class="efg-header__add" @click.stop="$emit('add-factor', group)">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          Add earn factor
        </button>
        <span class="efg-header__sep"></span>
        <button class="efg-header__icon-btn" @click.stop="$emit('edit-group', group)" title="Edit group">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" fill="currentColor"/></svg>
        </button>
        <button class="efg-header__icon-btn efg-header__icon-btn--chevron" @click.stop="toggleExpand" title="Toggle">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path v-if="isExpanded" d="M6 13l4-4 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path v-else d="M6 7l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Factor Cards -->
    <div v-if="isExpanded" class="efg-factors">
      <div
        v-for="factor in factors"
        :key="factor?.id"
        class="ef-card"
        :ref="el => registerRef(factor?.id, el)"
        :class="{ 'ef-card--active': selectedFactorId === factor?.id }"
        @click="$emit('select-factor', factor)"
      >
        <div class="ef-card__main">
          <div class="ef-card__icon" :class="factor?.target_currency === 'ticket' ? 'ef-card__icon--credit' : 'ef-card__icon--points'">
            <svg v-if="factor?.target_currency === 'ticket'" width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M4 4h12a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" stroke-width="1.5"/>
              <path d="M7 8h6M7 11h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <svg v-else width="14" height="14" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/>
              <path d="M10 6v8M8 8l2-2 2 2M8 12l2 2 2-2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="ef-card__content">
            <span class="ef-card__title">{{ getFactorTitle(factor) }}</span>
            <div class="ef-card__meta">
              <span class="ef-card__meta-item">{{ getFactorTypeLabel(factor) }}</span>
              <span class="ef-card__meta-sep"></span>
              <span class="ef-card__meta-item">{{ getFactorRateLabel(factor) }}</span>
              <template v-if="getFactorDateLabel(factor)">
                <span class="ef-card__meta-sep"></span>
                <span class="ef-card__meta-item">{{ getFactorDateLabel(factor) }}</span>
              </template>
            </div>
          </div>
        </div>
        <div class="ef-card__right">
          <div v-if="factor?.earn_factor_type === 'multiplier'" class="ef-card__multiplier">
            <span class="ef-card__mult-label">Total Multiplier :</span>
            <span class="ef-card__mult-value">{{ factor?.earn_factor_amount || 0 }}x</span>
          </div>
          <span class="ef-card__sep"></span>
          <button class="ef-card__icon-btn" @click.stop="$emit('edit-factor', factor)" title="Edit">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" fill="currentColor"/></svg>
          </button>
          <button class="ef-card__icon-btn ef-card__icon-btn--chevron" title="Expand">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M6 7l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="ef-card__connect-btn" @click.stop="$emit('connect-factor', factor, $event)" title="Link to condition group">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
          </button>
        </div>
        <div class="ef-card__connector"></div>
      </div>

      <div v-if="!factors?.length" class="efg-empty">No factors</div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  props: {
    group: { type: Object, default: () => ({}) },
    factors: { type: Array, default: () => [] },
    selectedFactorId: { type: String, default: null },
    expanded: { type: Boolean, default: true },
  },
  emits: ['add-factor', 'edit-group', 'edit-factor', 'select-factor', 'connect-factor', 'factor-ref', 'toggle-expand'],
  setup(props, { emit }) {
    const isExpanded = computed(() => props.expanded);

    function toggleExpand() {
      emit('toggle-expand', props.group?.id);
    }

    const linkedConditionCount = computed(() => {
      const ids = new Set();
      for (const f of props.factors || []) {
        if (f?.earn_conditions_group_id) ids.add(f.earn_conditions_group_id);
      }
      return ids.size;
    });

    function registerRef(factorId, el) {
      if (el && factorId) emit('factor-ref', { factorId, el });
    }

    function getFactorTitle(factor) {
      if (!factor) return 'Unnamed';
      const name = factor.name || factor.target_entity_name;
      if (name) return name;
      const currency = factor.target_currency === 'ticket' ? 'Credit' : 'Points';
      const type = factor.earn_factor_type === 'rate' ? 'Starter Rules' : 'Power Boost';
      return `${currency} ${type}`;
    }

    function getFactorTypeLabel(factor) {
      if (!factor) return '';
      const currency = factor.target_currency === 'ticket' ? 'Store credit' : 'Points';
      const type = factor.earn_factor_type === 'rate' ? '(Base rate)' : '(Multiplier)';
      return `${currency} ${type}`;
    }

    function getFactorRateLabel(factor) {
      if (!factor) return '';
      if (factor.earn_factor_type === 'rate') {
        return `Rate : ฿${factor.earn_factor_amount || 0} = 1 point`;
      }
      return `${factor.earn_factor_amount || 0}x multiplier`;
    }

    function getFactorDateLabel(factor) {
      if (!factor?.window_start && !factor?.window_end) return '';
      const fmt = (d) => {
        if (!d) return '—';
        try {
          const dt = new Date(d);
          return `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getFullYear()).slice(2)}`;
        } catch { return '—'; }
      };
      return `${fmt(factor.window_start)} - ${fmt(factor.window_end)}`;
    }

    return { isExpanded, toggleExpand, linkedConditionCount, registerRef, getFactorTitle, getFactorTypeLabel, getFactorRateLabel, getFactorDateLabel };
  },
};
</script>

<style scoped lang="scss">
@import 'polaris-weweb-styles';

.efg-section {
  @include polaris-card-bordered;
  padding: var(--p-space-300) var(--p-space-300) var(--p-space-300);
  margin-bottom: 0;
}

.efg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--p-space-200);
  padding: 0 var(--p-space-150);
  margin-bottom: var(--p-space-200);

  &__left {
    display: flex;
    align-items: center;
    gap: var(--p-space-200);
    min-width: 0;
    flex: 1;
  }

  &__icon {
    width: 25px;
    height: 25px;
    min-width: 25px;
    border-radius: var(--p-border-radius-100);
    background: #F54239;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__name {
    @include polaris-text-subtitle-sm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  &__link-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: var(--p-font-size-300);
    font-weight: var(--p-font-weight-medium);
    color: var(--p-color-text-info);
    background: var(--p-color-bg-fill-brand-secondary);
    padding: var(--p-space-100) 7px;
    border-radius: var(--p-border-radius-200);
    flex-shrink: 0;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: var(--p-space-100);
    flex-shrink: 0;
  }

  &__add {
    @include polaris-button-plain;
    font-size: var(--p-font-size-325);
    white-space: nowrap;
    padding: var(--p-space-100) var(--p-space-100);
    min-height: auto;
    gap: 2px;
  }

  &__sep {
    @include polaris-separator-dot;
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
    &:hover { background: var(--p-color-bg-surface-hover); }

    &--chevron {
      background: var(--p-color-border);
      border-radius: var(--p-border-radius-150);
      color: var(--p-color-icon);
      &:hover { background: var(--p-color-border-hover); }
    }
  }
}

.efg-factors {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-200);
}

.ef-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--p-space-200);
  padding: var(--p-space-300) var(--p-space-400);
  background: var(--p-color-bg-surface);
  border: 1px solid var(--p-color-border-info);
  border-radius: var(--p-border-radius-200);
  box-shadow: var(--p-shadow-card-sm);
  cursor: pointer;
  transition: box-shadow var(--p-motion-duration-100) var(--p-motion-ease),
              border-color var(--p-motion-duration-100) var(--p-motion-ease);

  &:hover {
    box-shadow: var(--p-shadow-card-hover);
  }

  &--active {
    border-color: var(--p-color-border-info);
    box-shadow: 0 0 0 1px var(--p-color-border-info), var(--p-shadow-card-sm);
  }

  &__main {
    display: flex;
    align-items: center;
    gap: var(--p-space-200);
    min-width: 0;
    flex: 1;
  }

  &__icon {
    width: 32px;
    height: 31px;
    min-width: 32px;
    border-radius: 5px;
    border: 0.7px solid var(--p-color-border);
    background: var(--p-color-bg-surface);
    display: flex;
    align-items: center;
    justify-content: center;

    &--points { color: var(--p-color-text-info); }
    &--credit { color: var(--p-color-text-success); }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__title {
    @include polaris-text-subtitle;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: var(--p-space-200);
  }

  &__meta-item {
    @include polaris-text-description;
    white-space: nowrap;
  }

  &__meta-sep {
    @include polaris-separator-dot;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: var(--p-space-300);
    flex-shrink: 0;
  }

  &__multiplier {
    display: flex;
    align-items: center;
    gap: var(--p-space-100);
  }

  &__mult-label {
    font-size: var(--p-font-size-300);
    font-weight: var(--p-font-weight-regular);
    color: var(--p-color-text-success);
  }

  &__mult-value {
    font-size: var(--p-font-size-400);
    font-weight: var(--p-font-weight-semibold);
    letter-spacing: -0.0125em;
    color: var(--p-color-text-success);
  }

  &__sep {
    @include polaris-separator-dot;
  }

  &__icon-btn {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: var(--p-border-radius-100);
    color: var(--p-color-icon);
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--p-motion-duration-100) var(--p-motion-ease);
    &:hover { background: var(--p-color-bg-fill-transparent-hover); }

    &--chevron {
      opacity: 1;
      background: var(--p-color-border);
      border-radius: var(--p-border-radius-150);
      &:hover { background: var(--p-color-border-hover); }
    }
  }

  &:hover &__icon-btn {
    opacity: 1;
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
    opacity: 0;
    transition: background var(--p-motion-duration-100) var(--p-motion-ease),
                opacity var(--p-motion-duration-100) var(--p-motion-ease);
    &:hover { background: var(--p-color-bg-fill-brand-hover); }
  }

  &:hover &__connect-btn {
    opacity: 1;
  }

  &__connector {
    position: absolute;
    left: 1px;
    top: 23px;
    width: 3px;
    height: 17.5px;
    background: var(--p-color-text-info);
    border-radius: 0 0 2px 2px;
    pointer-events: none;
  }
}

.efg-empty {
  @include polaris-text-description;
  text-align: center;
  padding: var(--p-space-300) var(--p-space-300);
  color: var(--p-color-text-disabled);
}
</style>
