<template>
  <div class="polaris-card">
    <div class="polaris-card__section">
      <div class="polaris-block-stack">
        <div class="polaris-inline polaris-inline--gap-tight">
          <div class="polaris-text-field polaris-text-field--flex">
            <label class="polaris-text-field__label polaris-text-field__label--required">Duration</label>
            <input
              class="polaris-text-field__input"
              type="number"
              min="1"
              :value="config?.duration || 1"
              @input="updateDuration($event.target.value)"
            />
          </div>
          <div class="polaris-text-field">
            <label class="polaris-text-field__label">Unit</label>
            <select
              class="polaris-select__input"
              :value="config?.unit || 'days'"
              @change="updateUnit($event.target.value)"
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </div>
        </div>

        <div class="polaris-banner">
          <div class="polaris-banner__icon">
            <svg class="polaris-icon" viewBox="0 0 20 20"><path d="M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm-1 4a1 1 0 0 1 2 0v3.586l1.707 1.707a1 1 0 0 1-1.414 1.414l-2-2A1 1 0 0 1 9 11V7z" fill="currentColor"/></svg>
          </div>
          <div class="polaris-banner__content">
            <p class="polaris-banner__message">{{ config?.label || 'Wait [duration] [unit]' }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WaitConfig',
  props: {
    config: { type: Object, required: true },
  },
  emits: ['update'],
  setup(props, { emit }) {
    const updateDuration = (value) => {
      const duration = parseInt(value) || 0;
      const unit = props.config?.unit || 'days';
      const label = duration > 0 ? `Wait ${duration} ${unit}` : 'Wait';
      emit('update', { ...props.config, duration, label });
    };

    const updateUnit = (unit) => {
      const duration = props.config?.duration || 1;
      const label = `Wait ${duration} ${unit}`;
      emit('update', { ...props.config, unit, label });
    };

    return { updateDuration, updateUnit };
  },
};
</script>

<style lang="scss" scoped>
@import 'polaris-weweb-styles';

.polaris-card { @include polaris-tokens; @include polaris-card; }
.polaris-card__section { @include polaris-card-section; }
.polaris-block-stack { @include polaris-block-stack; gap: var(--p-space-300); }

.polaris-inline {
  @include polaris-inline;
  &--gap-tight { gap: var(--p-space-200); }
}

.polaris-text-field {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-100);
  &--flex { flex: 1; }
}

.polaris-text-field__label {
  @include polaris-label;
  &--required::after { content: ' *'; color: var(--p-color-text-critical); }
}

.polaris-text-field__input { @include polaris-input; }
.polaris-select__input { @include polaris-select; }
.polaris-banner { @include polaris-banner-info; }
.polaris-banner__icon { @include polaris-icon; flex-shrink: 0; }
.polaris-banner__content { flex: 1; }
.polaris-banner__message { @include polaris-text-body; margin: 0; }
</style>
