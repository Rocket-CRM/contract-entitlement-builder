<template>
  <PolarisCard>
    <PolarisCardSection>
      <PolarisBlockStack gap="300">
        <PolarisSelect
          label="Channel"
          required
          :modelValue="config?.channel || ''"
          @update:modelValue="updateField('channel', $event)"
          :options="channelOptions"
          placeholder="Select channel..."
        />

        <PolarisSelect
          label="Template"
          :modelValue="config?.template_id || ''"
          @update:modelValue="updateField('template_id', $event)"
          :options="templateOptions"
          helpText="Optional - select a pre-made template"
        />

        <PolarisTextField
          v-if="config?.channel === 'email'"
          label="Subject"
          required
          :modelValue="config?.subject || ''"
          @update:modelValue="updateField('subject', $event)"
        />

        <PolarisTextField
          :label="config?.template_id ? 'Content (override)' : 'Content'"
          required
          multiline
          :rows="6"
          :modelValue="config?.content || ''"
          @update:modelValue="updateField('content', $event)"
          helpText="Use {{user.first_name}}, {{trigger.amount}}, {{agent.message}} for variables"
        />

        <PolarisTextField
          v-if="config?.channel === 'line'"
          label="LINE Flex JSON"
          multiline
          monospace
          :rows="8"
          :modelValue="jsonContentString"
          @update:modelValue="handleJsonContentChange($event)"
          :error="jsonError || undefined"
        />
      </PolarisBlockStack>
    </PolarisCardSection>
  </PolarisCard>
</template>

<script>
import { computed, ref } from 'vue';
import {
  PolarisCard,
  PolarisCardSection,
  PolarisBlockStack,
  PolarisTextField,
  PolarisSelect,
} from 'polaris-weweb-styles/components';

export default {
  name: 'MessageConfig',
  components: {
    PolarisCard,
    PolarisCardSection,
    PolarisBlockStack,
    PolarisTextField,
    PolarisSelect,
  },
  props: {
    config: { type: Object, required: true },
    channels: { type: Array, default: () => [] },
    templates: { type: Array, default: () => [] },
  },
  emits: ['update'],
  setup(props, { emit }) {
    const jsonError = ref('');

    const channelOptions = computed(() => {
      return (props.channels || []).map(ch => ({
        value: ch?.value,
        label: ch?.label,
      }));
    });

    const filteredTemplates = computed(() => {
      const channel = props.config?.channel;
      if (!channel) return props.templates || [];
      return (props.templates || []).filter(t => t?.channel === channel);
    });

    const templateOptions = computed(() => {
      return [
        { value: '', label: 'No template' },
        ...filteredTemplates.value.map(tpl => ({
          value: tpl?.id,
          label: tpl?.name,
        })),
      ];
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
      channelOptions,
      templateOptions,
      jsonContentString,
      updateField,
      handleJsonContentChange,
    };
  },
};
</script>

<style lang="scss" scoped>
@import 'polaris-weweb-styles';

:deep(.polaris-card) {
  @include polaris-tokens;
}
</style>
