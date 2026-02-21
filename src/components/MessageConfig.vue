<template>
  <div class="polaris-card">
    <div class="polaris-card__section">
      <div class="polaris-block-stack">
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
          <label class="polaris-text-field__label">Template</label>
          <select
            class="polaris-select__input"
            :value="config?.template_id || ''"
            @change="updateField('template_id', $event.target.value)"
          >
            <option value="">No template</option>
            <option v-for="tpl in filteredTemplates" :key="tpl?.id" :value="tpl?.id">{{ tpl?.name }}</option>
          </select>
          <span class="polaris-text-field__help-text">Optional - select a pre-made template</span>
        </div>

        <div class="polaris-text-field" v-if="config?.channel === 'email'">
          <label class="polaris-text-field__label polaris-text-field__label--required">Subject</label>
          <input
            class="polaris-text-field__input"
            :value="config?.subject || ''"
            @input="updateField('subject', $event.target.value)"
          />
        </div>

        <div class="polaris-text-field">
          <label class="polaris-text-field__label polaris-text-field__label--required">
            Content {{ config?.template_id ? '(override)' : '' }}
          </label>
          <textarea
            class="polaris-text-field__input polaris-text-field__input--multiline"
            rows="6"
            :value="config?.content || ''"
            @input="updateField('content', $event.target.value)"
          />
          <span class="polaris-text-field__help-text">
            Use &#123;&#123;user.first_name&#125;&#125;, &#123;&#123;trigger.amount&#125;&#125;, &#123;&#123;agent.message&#125;&#125; for variables
          </span>
        </div>

        <div class="polaris-text-field" v-if="config?.channel === 'line'">
          <label class="polaris-text-field__label">LINE Flex JSON</label>
          <textarea
            class="polaris-text-field__input polaris-text-field__input--multiline polaris-text-field__input--monospace"
            rows="8"
            :value="jsonContentString"
            @input="handleJsonContentChange($event.target.value)"
          />
          <div v-if="jsonError" class="polaris-text-field__error">{{ jsonError }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue';

export default {
  name: 'MessageConfig',
  props: {
    config: { type: Object, required: true },
    channels: { type: Array, default: () => [] },
    templates: { type: Array, default: () => [] },
  },
  emits: ['update'],
  setup(props, { emit }) {
    const jsonError = ref('');

    const filteredTemplates = computed(() => {
      const channel = props.config?.channel;
      if (!channel) return props.templates || [];
      return (props.templates || []).filter(t => t?.channel === channel);
    });

    const jsonContentString = computed(() => {
      const content = props.config?.json_content;
      if (!content) return '';
      if (typeof content === 'object') return JSON.stringify(content, null, 2);
      return content;
    });

    const updateField = (field, value) => {
      emit('update', { ...props.config, [field]: value });
    };

    const handleJsonContentChange = (value) => {
      if (!value) {
        emit('update', { ...props.config, json_content: null });
        jsonError.value = '';
        return;
      }
      try {
        const parsed = JSON.parse(value);
        emit('update', { ...props.config, json_content: parsed });
        jsonError.value = '';
      } catch (e) {
        emit('update', { ...props.config, json_content: value });
        jsonError.value = 'Invalid JSON: ' + e.message;
      }
    };

    return {
      jsonError,
      filteredTemplates,
      jsonContentString,
      updateField,
      handleJsonContentChange,
    };
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
  &--monospace { font-family: var(--p-font-family-mono); font-size: var(--p-font-size-300); }
}

.polaris-text-field__help-text { @include polaris-help-text; }
.polaris-text-field__error { @include polaris-error-text; }
.polaris-select__input { @include polaris-select; }
</style>
