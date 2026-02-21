<template>
  <div class="polaris-card">
    <div class="polaris-card__section">
      <div class="polaris-block-stack">
        <div class="polaris-text-field">
          <label class="polaris-text-field__label polaris-text-field__label--required">Action Type</label>
          <select
            class="polaris-select__input"
            :value="config?.action_type || ''"
            @change="handleActionTypeChange($event.target.value)"
          >
            <option value="" disabled>Select action...</option>
            <option value="award_points">Award Points</option>
            <option value="assign_tag">Assign Tag</option>
            <option value="send_message">Send Message</option>
          </select>
        </div>

        <!-- Award Points -->
        <template v-if="config?.action_type === 'award_points'">
          <div class="polaris-inline polaris-inline--gap-tight">
            <div class="polaris-text-field polaris-text-field--flex">
              <label class="polaris-text-field__label polaris-text-field__label--required">Amount</label>
              <input
                class="polaris-text-field__input"
                type="number"
                min="1"
                :value="config?.amount || 0"
                @input="updateField('amount', parseInt($event.target.value) || 0)"
              />
            </div>
            <div class="polaris-text-field">
              <label class="polaris-text-field__label">Currency</label>
              <select
                class="polaris-select__input"
                :value="config?.currency_type || 'points'"
                @change="updateField('currency_type', $event.target.value)"
              >
                <option value="points">Points</option>
                <option value="coins">Coins</option>
                <option value="credits">Credits</option>
              </select>
            </div>
          </div>
        </template>

        <!-- Assign Tag -->
        <template v-if="config?.action_type === 'assign_tag'">
          <div class="polaris-text-field">
            <label class="polaris-text-field__label polaris-text-field__label--required">Tag ID</label>
            <input
              class="polaris-text-field__input"
              placeholder="UUID of the tag to assign"
              :value="config?.tag_id || ''"
              @input="updateField('tag_id', $event.target.value)"
            />
          </div>
        </template>

        <!-- Send Message -->
        <template v-if="config?.action_type === 'send_message'">
          <div class="polaris-text-field">
            <label class="polaris-text-field__label polaris-text-field__label--required">Channel</label>
            <select
              class="polaris-select__input"
              :value="config?.channel || ''"
              @change="updateField('channel', $event.target.value)"
            >
              <option value="" disabled>Select channel...</option>
              <option v-for="ch in channels" :key="ch?.value" :value="ch?.value">{{ ch?.label }}</option>
            </select>
          </div>
          <div class="polaris-text-field">
            <label class="polaris-text-field__label polaris-text-field__label--required">Message</label>
            <textarea
              class="polaris-text-field__input polaris-text-field__input--multiline"
              rows="4"
              :value="config?.message || ''"
              @input="updateField('message', $event.target.value)"
            />
            <span class="polaris-text-field__help-text">
              Use &#123;&#123;user.first_name&#125;&#125;, &#123;&#123;trigger.amount&#125;&#125;, &#123;&#123;agent.message&#125;&#125; for variables
            </span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ActionConfig',
  props: {
    config: { type: Object, required: true },
    channels: { type: Array, default: () => [] },
  },
  emits: ['update'],
  setup(props, { emit }) {
    const updateField = (field, value) => {
      emit('update', { ...props.config, [field]: value });
    };

    const handleActionTypeChange = (actionType) => {
      const base = { label: props.config?.label || 'Action', action_type: actionType };
      const defaults = {
        award_points: { ...base, amount: 100, currency_type: 'points' },
        assign_tag: { ...base, tag_id: '' },
        send_message: { ...base, channel: '', message: '' },
      };
      emit('update', defaults[actionType] || base);
    };

    return { updateField, handleActionTypeChange };
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

.polaris-text-field__input {
  @include polaris-input;
  &--multiline { @include polaris-textarea; }
}

.polaris-text-field__help-text { @include polaris-help-text; }
.polaris-select__input { @include polaris-select; }
</style>
