<template>
  <PolarisCard>
    <PolarisCardSection>
      <PolarisBlockStack gap="300">
        <PolarisInline gap="200" blockAlign="end">
          <div style="width: 120px; flex-shrink: 0;">
            <PolarisSelect
              label="Method"
              required
              :modelValue="config?.method || 'GET'"
              @update:modelValue="updateField('method', $event)"
              :options="methodOptions"
            />
          </div>
          <div style="flex: 1;">
            <PolarisTextField
              label="URL"
              required
              placeholder="https://api.example.com/endpoint"
              :modelValue="config?.url || ''"
              @update:modelValue="updateField('url', $event)"
            />
          </div>
        </PolarisInline>

        <PolarisBlockStack gap="200">
          <span class="headers-label">Headers</span>
          <div
            v-for="(header, hIdx) in headersArray"
            :key="hIdx"
            class="header-row"
          >
            <div style="flex: 1;">
              <PolarisTextField
                labelHidden
                label="Header name"
                placeholder="Header name"
                :modelValue="header.key"
                @update:modelValue="updateHeader(hIdx, 'key', $event)"
              />
            </div>
            <div style="flex: 1;">
              <PolarisTextField
                labelHidden
                label="Header value"
                placeholder="Header value"
                :modelValue="header.value"
                @update:modelValue="updateHeader(hIdx, 'value', $event)"
              />
            </div>
            <PolarisButton variant="plain" icon="close" iconOnly @click="removeHeader(hIdx)" />
          </div>
          <PolarisButton variant="plain" @click="addHeader">Add header</PolarisButton>
        </PolarisBlockStack>

        <PolarisTextField
          v-if="config?.method !== 'GET'"
          label="Body (JSON)"
          multiline
          monospace
          :rows="6"
          :modelValue="bodyString"
          @update:modelValue="handleBodyChange($event)"
          :error="bodyError || undefined"
        />

        <PolarisInline gap="200">
          <div style="flex: 1;">
            <PolarisTextField
              label="Timeout (seconds)"
              type="number"
              :min="1"
              :max="300"
              :modelValue="config?.timeout_seconds || 30"
              @update:modelValue="updateField('timeout_seconds', parseInt($event) || 30)"
            />
          </div>
          <div style="flex: 1;">
            <PolarisTextField
              label="Retry count"
              type="number"
              :min="0"
              :max="10"
              :modelValue="config?.retry_count || 0"
              @update:modelValue="updateField('retry_count', parseInt($event) || 0)"
            />
          </div>
        </PolarisInline>
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
  PolarisInline,
  PolarisTextField,
  PolarisSelect,
  PolarisButton,
} from 'polaris-weweb-styles/components';

const methodOptions = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
];

export default {
  name: 'ApiConfig',
  components: {
    PolarisCard,
    PolarisCardSection,
    PolarisBlockStack,
    PolarisInline,
    PolarisTextField,
    PolarisSelect,
    PolarisButton,
  },
  props: {
    config: { type: Object, required: true },
  },
  emits: ['update'],
  setup(props, { emit }) {
    const bodyError = ref('');

    const bodyString = computed(() => {
      const body = props.config?.body;
      if (!body) return '';
      if (typeof body === 'object') return JSON.stringify(body, null, 2);
      return body;
    });

    const headersArray = computed(() => {
      const headers = props.config?.headers || {};
      const entries = Object.entries(headers);
      if (entries.length === 0) return [{ key: '', value: '' }];
      return entries.map(([key, value]) => ({ key, value }));
    });

    const updateField = (field, value) => {
      emit('update', { ...props.config, [field]: value });
    };

    const handleBodyChange = (value) => {
      if (!value) {
        emit('update', { ...props.config, body: null });
        bodyError.value = '';
        return;
      }
      try {
        const parsed = JSON.parse(value);
        emit('update', { ...props.config, body: parsed });
        bodyError.value = '';
      } catch (e) {
        emit('update', { ...props.config, body: value });
        bodyError.value = 'Invalid JSON: ' + e.message;
      }
    };

    const updateHeader = (index, field, value) => {
      const headers = { ...(props.config?.headers || {}) };
      const entries = Object.entries(headers);
      if (entries[index]) {
        const oldKey = entries[index][0];
        if (field === 'key') {
          const oldValue = headers[oldKey];
          delete headers[oldKey];
          if (value) headers[value] = oldValue;
        } else {
          headers[oldKey] = value;
        }
      } else if (field === 'key' && value) {
        headers[value] = '';
      }
      emit('update', { ...props.config, headers });
    };

    const addHeader = () => {
      const headers = { ...(props.config?.headers || {}) };
      let newKey = '';
      let counter = 0;
      while (headers.hasOwnProperty(newKey)) {
        counter++;
        newKey = `header_${counter}`;
      }
      headers[newKey] = '';
      emit('update', { ...props.config, headers });
    };

    const removeHeader = (index) => {
      const headers = { ...(props.config?.headers || {}) };
      const entries = Object.entries(headers);
      if (entries[index]) delete headers[entries[index][0]];
      emit('update', { ...props.config, headers });
    };

    return {
      methodOptions,
      bodyError,
      bodyString,
      headersArray,
      updateField,
      handleBodyChange,
      updateHeader,
      addHeader,
      removeHeader,
    };
  },
};
</script>

<style lang="scss" scoped>
@import 'polaris-weweb-styles';

.headers-label {
  @include polaris-tokens;
  font-size: var(--p-font-size-300);
  font-weight: var(--p-font-weight-medium);
  color: var(--p-color-text);
}

.header-row {
  @include polaris-tokens;
  display: flex;
  gap: var(--p-space-200);
  align-items: flex-end;
}
</style>
