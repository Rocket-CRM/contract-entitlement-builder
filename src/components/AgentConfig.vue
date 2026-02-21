<template>
  <div class="polaris-card">
    <div class="polaris-card__section">
      <div class="polaris-block-stack">
        <div class="polaris-text-field">
          <label class="polaris-text-field__label polaris-text-field__label--required">Campaign Objective</label>
          <textarea
            class="polaris-text-field__input polaris-text-field__input--multiline"
            rows="3"
            placeholder="e.g., drive engagement, reduce churn, increase purchases"
            :value="config?.campaign_objective || ''"
            @input="updateField('campaign_objective', $event.target.value)"
          />
        </div>

        <div class="polaris-toggle-field">
          <label class="polaris-toggle-field__label">
            <input
              type="checkbox"
              class="polaris-toggle-field__input"
              :checked="config?.use_groq !== false"
              @change="updateField('use_groq', $event.target.checked)"
            />
            <span class="polaris-toggle-field__text">Use Groq AI</span>
          </label>
          <span class="polaris-text-field__help-text">Enable Groq/Llama for faster inference</span>
        </div>

        <div class="polaris-banner polaris-banner--info">
          <div class="polaris-banner__content">
            <p class="polaris-banner__title">Agent Output Variables</p>
            <p class="polaris-banner__message">
              Downstream nodes can use these variables in message templates:
            </p>
            <ul class="polaris-banner__list">
              <li><code>&#123;&#123;agent.message&#125;&#125;</code> — personalized message</li>
              <li><code>&#123;&#123;agent.selected_asset_name&#125;&#125;</code> — chosen offer/coupon</li>
              <li><code>&#123;&#123;agent.action&#125;&#125;</code> — recommended action type</li>
              <li><code>&#123;&#123;agent.urgency&#125;&#125;</code> — high/medium/low</li>
              <li><code>&#123;&#123;agent.reasoning&#125;&#125;</code> — AI reasoning</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AgentConfig',
  props: {
    config: { type: Object, required: true },
  },
  emits: ['update'],
  setup(props, { emit }) {
    const updateField = (field, value) => {
      emit('update', { ...props.config, [field]: value });
    };

    return { updateField };
  },
};
</script>

<style lang="scss" scoped>
@import 'polaris-weweb-styles';

.polaris-card { @include polaris-tokens; @include polaris-card; }
.polaris-card__section { @include polaris-card-section; }
.polaris-block-stack { @include polaris-block-stack; gap: var(--p-space-300); }

.polaris-text-field {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-100);
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

.polaris-toggle-field {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-100);
}

.polaris-toggle-field__label {
  display: flex;
  align-items: center;
  gap: var(--p-space-200);
  cursor: pointer;
}

.polaris-toggle-field__input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.polaris-toggle-field__text {
  @include polaris-label;
}

.polaris-banner {
  @include polaris-banner-base;
  &--info { @include polaris-banner-info; }
}

.polaris-banner__content { flex: 1; }
.polaris-banner__title { @include polaris-text-heading-sm; margin-bottom: var(--p-space-100); }
.polaris-banner__message { @include polaris-text-body; margin: 0; }
.polaris-banner__list { @include polaris-list-bulleted; margin-top: var(--p-space-100); }

code {
  background: var(--p-color-bg-surface-secondary);
  padding: 1px 4px;
  border-radius: var(--p-border-radius-050);
  font-family: var(--p-font-family-mono);
  font-size: var(--p-font-size-300);
}
</style>
