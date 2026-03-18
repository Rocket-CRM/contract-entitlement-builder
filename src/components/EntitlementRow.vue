<template>
  <div class="ent-row" :class="{ 'ent-row--editing': isEditing }">
    <template v-if="!isEditing">
      <div class="ent-row__icon" :style="iconStyle">
        <svg v-if="entitlement?.entitlement_type === 'package'" width="14" height="14" viewBox="0 0 20 20" fill="none">
          <path d="M2 6l8-4 8 4-8 4-8-4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M2 10l8 4 8-4" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M2 14l8 4 8-4" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
        <svg v-else-if="entitlement?.entitlement_type === 'reward'" width="14" height="14" viewBox="0 0 20 20" fill="none">
          <path d="M10 2l2.09 4.26L17 7.27l-3.5 3.41.82 4.82L10 13.27 5.68 15.5l.82-4.82L3 7.27l4.91-1.01L10 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
        <svg v-else width="14" height="14" viewBox="0 0 20 20" fill="none">
          <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </div>
      <div class="ent-row__info">
        <span class="ent-row__type-badge" :class="'ent-row__type-badge--' + (entitlement?.entitlement_type || 'benefit')">
          {{ entitlement?.entitlement_type || 'benefit' }}
        </span>
        <span class="ent-row__label">{{ displayLabel }}</span>
      </div>
      <div class="ent-row__actions">
        <button class="ent-row__action-btn" @click="$emit('edit')" title="Edit">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" fill="currentColor"/></svg>
        </button>
        <button class="ent-row__action-btn ent-row__action-btn--danger" @click="$emit('remove')" title="Remove">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
    </template>

    <template v-else>
      <div class="ent-form">
        <div class="ent-form__row">
          <div class="ent-form__field">
            <label class="ent-form__label">Type</label>
            <select class="ent-form__select" :value="formData.entitlement_type" @change="updateField('entitlement_type', $event.target.value)">
              <option value="package">Package</option>
              <option value="reward">Reward</option>
              <option value="benefit">Benefit</option>
            </select>
          </div>
        </div>

        <template v-if="formData.entitlement_type === 'package'">
          <div class="ent-form__row">
            <div class="ent-form__field ent-form__field--full">
              <label class="ent-form__label">Package</label>
              <select class="ent-form__select" :value="formData.package_id || ''" @change="updateField('package_id', $event.target.value || null)">
                <option value="">Select a package...</option>
                <option v-for="pkg in packages" :key="pkg?.id" :value="pkg?.id">
                  {{ pkg?.name }} ({{ pkg?.item_count || 0 }} items)
                </option>
              </select>
            </div>
          </div>
        </template>

        <template v-else-if="formData.entitlement_type === 'reward'">
          <div class="ent-form__row">
            <div class="ent-form__field ent-form__field--grow">
              <label class="ent-form__label">Reward</label>
              <select class="ent-form__select" :value="formData.reward_id || ''" @change="updateField('reward_id', $event.target.value || null)">
                <option value="">Select a reward...</option>
                <option v-for="r in rewards" :key="r?.id" :value="r?.id">
                  {{ r?.name }}
                </option>
              </select>
            </div>
            <div class="ent-form__field ent-form__field--narrow">
              <label class="ent-form__label">Qty</label>
              <input class="ent-form__input" type="number" min="1" :value="formData.qty || 1"
                @input="updateField('qty', parseInt($event.target.value) || 1)" />
            </div>
          </div>
        </template>

        <template v-else>
          <div class="ent-form__row">
            <div class="ent-form__field">
              <label class="ent-form__label">Category</label>
              <select class="ent-form__select" :value="formData.category || ''" @change="updateField('category', $event.target.value)">
                <option value="">Select...</option>
                <option value="opd">OPD</option>
                <option value="ipd">IPD</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="dental">Dental</option>
                <option value="parking">Parking</option>
                <option value="wellness">Wellness</option>
                <option value="lab">Lab</option>
                <option value="imaging">Imaging</option>
              </select>
            </div>
            <div class="ent-form__field">
              <label class="ent-form__label">Benefit Type</label>
              <select class="ent-form__select" :value="formData.benefit_type || ''" @change="updateField('benefit_type', $event.target.value)">
                <option value="">Select...</option>
                <option value="discount_percent">Discount %</option>
                <option value="discount_fixed">Discount Fixed</option>
                <option value="free_access">Free Access</option>
                <option value="priority">Priority</option>
              </select>
            </div>
            <div class="ent-form__field ent-form__field--narrow">
              <label class="ent-form__label">Value</label>
              <input class="ent-form__input" type="number" min="0" :value="formData.value || 0"
                @input="updateField('value', parseFloat($event.target.value) || 0)" />
            </div>
          </div>
        </template>

        <div class="ent-form__footer">
          <button class="ent-form__btn ent-form__btn--cancel" @click="$emit('cancel-edit')">Cancel</button>
          <button class="ent-form__btn ent-form__btn--save" @click="$emit('save-edit', formData)">
            {{ entitlement?.id ? 'Update' : 'Add' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  props: {
    entitlement: { type: Object, default: () => ({}) },
    isEditing: { type: Boolean, default: false },
    formData: { type: Object, default: () => ({}) },
    packages: { type: Array, default: () => [] },
    rewards: { type: Array, default: () => [] },
  },
  emits: ['edit', 'remove', 'cancel-edit', 'save-edit', 'update-field'],
  setup(props, { emit }) {
    const iconStyle = computed(() => {
      const type = props.entitlement?.entitlement_type;
      if (type === 'package') return { background: '#E0E7FF', color: '#4F46E5' };
      if (type === 'reward') return { background: '#FEF3C7', color: '#D97706' };
      return { background: '#D1FAE5', color: '#059669' };
    });

    const displayLabel = computed(() => {
      const ent = props.entitlement;
      if (!ent) return 'Unknown';
      if (ent.entitlement_type === 'package') {
        return ent._package_name || `Package (${(ent.package_id || '').substring(0, 8)}...)`;
      }
      if (ent.entitlement_type === 'reward') {
        const name = ent._reward_name || `Reward`;
        return `${name} × ${ent.qty || 1}`;
      }
      const cat = (ent.category || '').toUpperCase();
      const bt = (ent.benefit_type || '').replace(/_/g, ' ');
      const val = ent.value || 0;
      if (ent.benefit_type === 'discount_percent') return `${val}% discount on ${cat}`;
      if (ent.benefit_type === 'discount_fixed') return `฿${val} off ${cat}`;
      if (ent.benefit_type === 'free_access') return `Free ${cat} access`;
      if (ent.benefit_type === 'priority') return `Priority ${cat}`;
      return `${bt} ${val} — ${cat}`;
    });

    const updateField = (field, value) => {
      emit('update-field', { field, value });
    };

    return { iconStyle, displayLabel, updateField };
  },
};
</script>

<style scoped lang="scss">
@import 'polaris-weweb-styles';

.ent-row {
  display: flex;
  align-items: center;
  gap: var(--p-space-300);
  padding: var(--p-space-200) var(--p-space-300);
  background: var(--p-color-bg-surface);
  border: var(--p-border-width-025) solid var(--p-color-border);
  border-radius: var(--p-border-radius-200);
  transition: border-color 0.15s ease;

  &:hover {
    border-color: var(--p-color-border-hover);
    .ent-row__actions { opacity: 1; }
  }

  &--editing {
    padding: 0;
    border-color: var(--p-color-border-focus);
  }

  &__icon {
    width: 32px;
    height: 32px;
    min-width: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--p-border-radius-200);
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--p-space-200);
  }

  &__type-badge {
    font-size: 11px;
    font-weight: var(--p-font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.3px;
    padding: 2px 6px;
    border-radius: var(--p-border-radius-100);
    flex-shrink: 0;

    &--package { background: #E0E7FF; color: #4F46E5; }
    &--reward { background: #FEF3C7; color: #D97706; }
    &--benefit { background: #D1FAE5; color: #059669; }
  }

  &__label {
    font-size: var(--p-font-size-325);
    color: var(--p-color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__actions {
    display: flex;
    gap: var(--p-space-100);
    opacity: 0;
    transition: opacity 0.15s;
    flex-shrink: 0;
  }

  &__action-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    border-radius: var(--p-border-radius-100);
    color: var(--p-color-icon);
    cursor: pointer;
    transition: background 0.1s;

    &:hover { background: var(--p-color-bg-fill-transparent-hover); }
    &--danger:hover { color: var(--p-color-text-critical); }
  }
}

.ent-form {
  width: 100%;
  padding: var(--p-space-300);
  display: flex;
  flex-direction: column;
  gap: var(--p-space-300);

  &__row {
    display: flex;
    gap: var(--p-space-200);
    align-items: flex-end;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--p-space-100);
    flex: 1;

    &--full { flex: 1 1 100%; }
    &--grow { flex: 2; }
    &--narrow { flex: 0 0 90px; }
  }

  &__label {
    font-size: var(--p-font-size-275);
    font-weight: var(--p-font-weight-medium);
    color: var(--p-color-text);
  }

  &__select {
    @include polaris-select;
    height: 36px;
    font-size: var(--p-font-size-300);
  }

  &__input {
    @include polaris-input;
    height: 36px;
    font-size: var(--p-font-size-300);
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--p-space-200);
    padding-top: var(--p-space-100);
  }

  &__btn {
    font-family: var(--p-font-family-sans);
    font-size: var(--p-font-size-300);
    cursor: pointer;
    border-radius: var(--p-border-radius-200);
    padding: var(--p-space-100) var(--p-space-300);
    border: none;
    font-weight: var(--p-font-weight-medium);

    &--cancel {
      @include polaris-button-default;
      @include polaris-button-slim;
    }
    &--save {
      @include polaris-button-primary;
      @include polaris-button-slim;
    }
  }
}
</style>
