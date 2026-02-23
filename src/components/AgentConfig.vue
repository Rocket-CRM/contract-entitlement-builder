<template>
  <div class="agent-config">
    <!-- Objective -->
    <PolarisSelect
      label="Objective"
      required
      :modelValue="config?.objective || ''"
      @update:modelValue="updateField('objective', $event)"
      :options="objectiveOptions"
      placeholder="Select objective..."
    />

    <!-- Tone -->
    <PolarisSelect
      label="Tone"
      required
      :modelValue="config?.tone || 'friendly'"
      @update:modelValue="updateField('tone', $event)"
      :options="toneOptions"
    />

    <!-- Allowed Actions -->
    <div class="polaris-form-field">
      <label class="polaris-form-field__label">Allowed Actions</label>
      <span class="polaris-form-field__help">Uncheck to restrict which actions the AI can take</span>
      <div class="checkbox-group">
        <label v-for="a in ALLOWED_ACTIONS" :key="a.value" class="checkbox-option">
          <input
            type="checkbox"
            :checked="isActionAllowed(a.value)"
            @change="toggleAction(a.value, $event.target.checked)"
          />
          <span>{{ a.label }}</span>
        </label>
      </div>
    </div>

    <!-- Limits -->
    <PolarisTextField
      label="Max Points Per User"
      type="number"
      :min="0"
      placeholder="No limit"
      :modelValue="config?.max_points_per_user ?? ''"
      @update:modelValue="updateField('max_points_per_user', $event ? parseInt($event) : null)"
      helpText="Leave empty for no limit"
    />

    <PolarisTextField
      label="Max Actions Per Execution"
      type="number"
      :min="1"
      placeholder="No limit"
      :modelValue="config?.max_actions ?? ''"
      @update:modelValue="updateField('max_actions', $event ? parseInt($event) : null)"
      helpText="How many actions the AI can take in a single run"
    />

    <!-- Constraints -->
    <div class="polaris-form-field">
      <label class="polaris-form-field__label">Constraints</label>
      <span class="polaris-form-field__help">Rules that limit what this specific node can do</span>
      <ConstraintBuilder
        :constraints="config?.constraints || []"
        @update="updateField('constraints', $event)"
      />
    </div>

    <!-- Context Hint -->
    <PolarisTextField
      label="Context Hint"
      multiline
      :rows="3"
      placeholder="e.g., These are lapsed VIP customers who used to spend heavily"
      :modelValue="config?.context_hint || ''"
      @update:modelValue="updateField('context_hint', $event)"
      helpText="Additional context passed to the AI to improve decisions"
    />

    <!-- Output Variables Reference -->
    <div class="variable-ref">
      <button class="variable-ref__toggle" @click="showVars = !showVars">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path v-if="showVars" d="M2 4l4 4 4-4"/>
          <path v-else d="M4 2l4 4-4 4"/>
        </svg>
        Agent output variables
      </button>
      <div v-if="showVars" class="variable-ref__list">
        <code v-for="v in AGENT_VARS" :key="v">{{ v }}</code>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import ConstraintBuilder from './ConstraintBuilder.vue';
import {
  PolarisTextField,
  PolarisSelect,
} from 'polaris-weweb-styles/components';

const OBJECTIVES = [
  { value: 're_engage', label: 'Re-engage' },
  { value: 'drive_purchase', label: 'Drive Purchase' },
  { value: 'redeem_points', label: 'Redeem Points' },
  { value: 'tier_upgrade', label: 'Tier Upgrade' },
  { value: 'win_back', label: 'Win Back' },
  { value: 'upsell', label: 'Upsell' },
];

const TONES = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'exclusive', label: 'Exclusive' },
  { value: 'celebratory', label: 'Celebratory' },
];

const ALLOWED_ACTIONS = [
  { value: 'award_points', label: 'Award Points' },
  { value: 'award_tickets', label: 'Award Tickets' },
  { value: 'assign_tag', label: 'Assign Tag' },
  { value: 'remove_tag', label: 'Remove Tag' },
  { value: 'assign_persona', label: 'Assign Persona' },
  { value: 'assign_earn_factor', label: 'Assign Earn Factor' },
  { value: 'send_line_message', label: 'Send LINE Message' },
  { value: 'send_sms', label: 'Send SMS' },
  { value: 'submit_form', label: 'Submit Form' },
];

const ALL_ACTION_VALUES = ALLOWED_ACTIONS.map(a => a.value);

const AGENT_VARS = [
  '{{agent.message}}', '{{agent.selected_asset_name}}',
  '{{agent.action}}', '{{agent.urgency}}', '{{agent.reasoning}}',
];

export default {
  name: 'AgentConfig',
  components: { ConstraintBuilder, PolarisTextField, PolarisSelect },
  props: {
    config: { type: Object, required: true },
  },
  emits: ['update'],
  setup(props, { emit }) {
    const showVars = ref(false);

    const objectiveOptions = OBJECTIVES;
    const toneOptions = TONES;

    const updateField = (field, value) => {
      emit('update', { ...props.config, [field]: value });
    };

    const isActionAllowed = (actionValue) => {
      const allowed = props.config?.allowed_action_types;
      if (!Array.isArray(allowed)) return true;
      return allowed.includes(actionValue);
    };

    const toggleAction = (actionValue, checked) => {
      const current = Array.isArray(props.config?.allowed_action_types)
        ? [...props.config.allowed_action_types]
        : [...ALL_ACTION_VALUES];

      if (checked && !current.includes(actionValue)) {
        current.push(actionValue);
      } else if (!checked) {
        const idx = current.indexOf(actionValue);
        if (idx !== -1) current.splice(idx, 1);
      }

      const allSelected = ALL_ACTION_VALUES.every(v => current.includes(v));
      emit('update', { ...props.config, allowed_action_types: allSelected ? null : current });
    };

    return {
      ALLOWED_ACTIONS, AGENT_VARS,
      objectiveOptions, toneOptions,
      showVars, updateField, isActionAllowed, toggleAction,
    };
  },
};
</script>

<style lang="scss" scoped>
@import 'polaris-weweb-styles';

.agent-config {
  @include polaris-tokens;
  display: flex;
  flex-direction: column;
  gap: var(--p-space-400);
}

// Custom patterns: checkbox group, variable ref
.polaris-form-field {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-100);

  &__label {
    font-size: var(--p-font-size-300);
    font-weight: var(--p-font-weight-medium);
    color: var(--p-color-text);
  }

  &__help { @include polaris-help-text; }
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-150);
  padding-top: var(--p-space-100);
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: var(--p-space-200);
  font-size: var(--p-font-size-300);
  color: var(--p-color-text);
  cursor: pointer;
  input { width: 16px; height: 16px; cursor: pointer; }
}

.variable-ref {
  border-top: 1px solid var(--p-color-border);
  padding-top: var(--p-space-300);
}

.variable-ref__toggle {
  display: flex;
  align-items: center;
  gap: var(--p-space-150);
  background: none;
  border: none;
  padding: 0;
  font-size: var(--p-font-size-275);
  font-weight: var(--p-font-weight-medium);
  color: var(--p-color-text-secondary);
  cursor: pointer;
  &:hover { color: var(--p-color-text); }
}

.variable-ref__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--p-space-100);
  padding-top: var(--p-space-200);
}

.variable-ref code {
  background: var(--p-color-bg-surface-secondary);
  padding: 2px 6px;
  border-radius: var(--p-border-radius-100);
  font-family: var(--p-font-family-mono);
  font-size: 11px;
  color: var(--p-color-text);
}
</style>
