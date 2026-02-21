<template>
  <div class="polaris-card">
    <div class="polaris-card__section">
      <div class="polaris-block-stack">
        <div class="polaris-inline polaris-inline--gap-tight polaris-inline--align-end">
          <div class="polaris-text-field" style="width: 120px; flex-shrink: 0;">
            <label class="polaris-text-field__label polaris-text-field__label--required">Method</label>
            <select
              class="polaris-select__input"
              :value="config?.method || 'GET'"
              @change="updateField('method', $event.target.value)"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div class="polaris-text-field polaris-text-field--flex">
            <label class="polaris-text-field__label polaris-text-field__label--required">URL</label>
            <input
              class="polaris-text-field__input"
              placeholder="https://api.example.com/endpoint"
              :value="config?.url || ''"
              @input="updateField('url', $event.target.value)"
            />
          </div>
        </div>

        <div class="polaris-block-stack polaris-block-stack--tight">
          <label class="polaris-text-field__label">Headers</label>
          <div
            v-for="(header, hIdx) in headersArray"
            :key="hIdx"
            class="polaris-inline polaris-inline--gap-tight polaris-inline--align-end"
          >
            <div class="polaris-text-field polaris-text-field--flex">
              <input class="polaris-text-field__input" placeholder="Header name" :value="header.key" @input="updateHeader(hIdx, 'key', $event.target.value)" />
            </div>
            <div class="polaris-text-field polaris-text-field--flex">
              <input class="polaris-text-field__input" placeholder="Header value" :value="header.value" @input="updateHeader(hIdx, 'value', $event.target.value)" />
            </div>
            <button class="polaris-button polaris-button--plain polaris-button--icon-only" @click="removeHeader(hIdx)">✕</button>
          </div>
          <button class="polaris-button polaris-button--plain" @click="addHeader">Add header</button>
        </div>

        <div class="polaris-text-field" v-if="config?.method !== 'GET'">
          <label class="polaris-text-field__label">Body (JSON)</label>
          <textarea
            class="polaris-text-field__input polaris-text-field__input--multiline polaris-text-field__input--monospace"
            rows="6"
            :value="bodyString"
            @input="handleBodyChange($event.target.value)"
          />
          <div v-if="bodyError" class="polaris-text-field__error">{{ bodyError }}</div>
        </div>

        <div class="polaris-inline polaris-inline--gap-tight">
          <div class="polaris-text-field polaris-text-field--flex">
            <label class="polaris-text-field__label">Timeout (seconds)</label>
            <input class="polaris-text-field__input" type="number" min="1" max="300" :value="config?.timeout_seconds || 30" @input="updateField('timeout_seconds', parseInt($event.target.value) || 30)" />
          </div>
          <div class="polaris-text-field polaris-text-field--flex">
            <label class="polaris-text-field__label">Retry count</label>
            <input class="polaris-text-field__input" type="number" min="0" max="10" :value="config?.retry_count || 0" @input="updateField('retry_count', parseInt($event.target.value) || 0)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue';

export default {
  name: 'ApiConfig',
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

.polaris-card { @include polaris-tokens; @include polaris-card; }
.polaris-card__section { @include polaris-card-section; }
.polaris-block-stack { @include polaris-block-stack; gap: var(--p-space-300); &--tight { gap: var(--p-space-200); } }

.polaris-inline {
  @include polaris-inline;
  &--gap-tight { gap: var(--p-space-200); }
  &--align-end { align-items: flex-end; }
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
  &--monospace { font-family: var(--p-font-family-mono); font-size: var(--p-font-size-300); }
}

.polaris-text-field__error { @include polaris-error-text; }
.polaris-select__input { @include polaris-select; }
.polaris-button { @include polaris-button-base; &--plain { @include polaris-button-plain; } &--icon-only { @include polaris-button-icon-only; } }
</style>
