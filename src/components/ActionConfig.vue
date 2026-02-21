<template>
  <div class="action-config">
    <!-- Loading state -->
    <div v-if="optionsLoading" class="loading-state">
      <span class="loading-state__spinner"></span>
      <span class="loading-state__text">Loading options...</span>
    </div>

    <template v-else>
      <!-- Action Type Selector -->
      <div class="polaris-form-field">
        <label class="polaris-form-field__label polaris-form-field__label--required">Action Type</label>
        <select
          class="polaris-form-field__select"
          :value="config?.action_type || config?.channel || ''"
          @change="handleActionTypeChange($event.target.value)"
        >
          <option value="" disabled>Select action...</option>
          <optgroup v-for="group in ACTION_GROUPS" :key="group.label" :label="group.label">
            <option v-for="action in group.actions" :key="action.value" :value="action.value">{{ action.label }}</option>
          </optgroup>
        </select>
      </div>

      <!-- ═══ AWARD CURRENCY ═══ -->
      <template v-if="config?.action_type === 'award_currency'">
        <div class="polaris-form-field">
          <label class="polaris-form-field__label">Currency</label>
          <div class="segmented-toggle">
            <button
              class="segmented-toggle__btn"
              :class="{ 'segmented-toggle__btn--active': (config?.currency || 'points') === 'points' }"
              @click="updateField('currency', 'points')"
            >Points</button>
            <button
              class="segmented-toggle__btn"
              :class="{ 'segmented-toggle__btn--active': config?.currency === 'ticket' }"
              @click="updateField('currency', 'ticket')"
            >Ticket</button>
          </div>
        </div>

        <div v-if="config?.currency === 'ticket'" class="polaris-form-field">
          <label class="polaris-form-field__label polaris-form-field__label--required">Ticket Type</label>
          <select
            class="polaris-form-field__select"
            :value="config?.ticket_type_id || ''"
            @change="updateField('ticket_type_id', $event.target.value)"
          >
            <option value="" disabled>Select ticket type...</option>
            <option v-for="t in ticketTypes" :key="t?.id" :value="t?.id">{{ t?.name }}{{ t?.description ? ` — ${t.description}` : '' }}</option>
          </select>
        </div>

        <div class="polaris-form-field">
          <label class="polaris-form-field__label polaris-form-field__label--required">Amount</label>
          <input
            class="polaris-form-field__input"
            type="number"
            min="1"
            :value="config?.amount || 0"
            @input="updateField('amount', parseInt($event.target.value) || 0)"
          />
        </div>

        <div class="polaris-form-field">
          <label class="polaris-form-field__label">Description</label>
          <input
            class="polaris-form-field__input"
            placeholder="e.g. Bonus for {{trigger.event}}"
            :value="config?.description || ''"
            @input="updateField('description', $event.target.value)"
          />
          <span class="polaris-form-field__help">Supports &#123;&#123;variable&#125;&#125; substitution</span>
        </div>
      </template>

      <!-- ═══ ASSIGN TAG / REMOVE TAG ═══ -->
      <template v-if="config?.action_type === 'assign_tag' || config?.action_type === 'remove_tag'">
        <div class="polaris-form-field">
          <label class="polaris-form-field__label polaris-form-field__label--required">Tag</label>
          <select
            class="polaris-form-field__select"
            :value="config?.tag_id || ''"
            @change="updateField('tag_id', $event.target.value)"
          >
            <option value="" disabled>Select tag...</option>
            <option v-for="tag in tags" :key="tag?.id" :value="tag?.id">{{ tag?.tag_name }}</option>
          </select>
        </div>
      </template>

      <!-- ═══ ASSIGN PERSONA ═══ -->
      <template v-if="config?.action_type === 'assign_persona'">
        <div class="polaris-form-field">
          <label class="polaris-form-field__label polaris-form-field__label--required">Persona</label>
          <select
            class="polaris-form-field__select"
            :value="config?.persona_id || ''"
            @change="updateField('persona_id', $event.target.value)"
          >
            <option value="" disabled>Select persona...</option>
            <optgroup v-for="group in personaGroups" :key="group?.id" :label="group?.group_name || 'Ungrouped'">
              <option v-for="p in (group?.personas || [])" :key="p?.id" :value="p?.id">{{ p?.persona_name }}</option>
            </optgroup>
          </select>
        </div>
      </template>

      <!-- ═══ SUBMIT FORM ═══ -->
      <template v-if="config?.action_type === 'submit_form'">
        <div class="polaris-form-field">
          <label class="polaris-form-field__label polaris-form-field__label--required">Form Template</label>
          <select
            class="polaris-form-field__select"
            :value="config?.form_id || ''"
            @change="handleFormSelect($event.target.value)"
          >
            <option value="" disabled>Select form...</option>
            <option v-for="f in forms" :key="f?.id" :value="f?.id">{{ f?.name }}{{ f?.form_category ? ` (${f.form_category})` : '' }}</option>
          </select>
        </div>

        <!-- Form field loading -->
        <div v-if="formFieldsLoading" class="loading-state loading-state--inline">
          <span class="loading-state__spinner loading-state__spinner--small"></span>
          <span class="loading-state__text">Loading form fields...</span>
        </div>

        <!-- Dynamic Form Fields -->
        <div v-else-if="formFields.length" class="form-fields-section">
          <label class="polaris-form-field__label">Field Values</label>
          <div
            v-for="field in formFields"
            :key="field?.id || field?.field_key"
            class="polaris-form-field"
          >
            <label class="polaris-form-field__label" :class="{ 'polaris-form-field__label--required': field?.is_required }">
              {{ field?.label || field?.field_key }}
            </label>
            <span v-if="field?.help_text" class="polaris-form-field__help">{{ field.help_text }}</span>

            <!-- Text (with text_format support) -->
            <input
              v-if="field?.field_type === 'text'"
              class="polaris-form-field__input"
              :type="getInputType(field?.text_format)"
              :placeholder="field?.placeholder || ''"
              :value="getFieldValue(field.field_key)"
              @input="setFieldValue(field.field_key, $event.target.value)"
            />

            <!-- Number -->
            <input
              v-else-if="field?.field_type === 'number'"
              class="polaris-form-field__input"
              type="number"
              :min="field?.min_value"
              :max="field?.max_value"
              :placeholder="field?.placeholder || ''"
              :value="getFieldValue(field.field_key)"
              @input="setFieldValue(field.field_key, parseFloat($event.target.value) || 0)"
            />

            <!-- Date -->
            <input
              v-else-if="field?.field_type === 'date'"
              class="polaris-form-field__input"
              type="date"
              :value="getFieldValue(field.field_key)"
              @input="setFieldValue(field.field_key, $event.target.value)"
            />

            <!-- Select -->
            <select
              v-else-if="field?.field_type === 'select'"
              class="polaris-form-field__select"
              :value="getFieldValue(field.field_key)"
              @change="setFieldValue(field.field_key, $event.target.value)"
            >
              <option value="">{{ field?.placeholder || 'Select...' }}</option>
              <option
                v-for="opt in safeOptions(field)"
                :key="opt?.value"
                :value="opt?.value"
              >{{ opt?.label || opt?.value }}</option>
            </select>

            <!-- Radio -->
            <div v-else-if="field?.field_type === 'radio'" class="radio-group">
              <label
                v-for="opt in safeOptions(field)"
                :key="opt?.value"
                class="radio-option"
              >
                <input
                  type="radio"
                  :name="`field_${field.field_key}`"
                  :value="opt?.value"
                  :checked="getFieldValue(field.field_key) === opt?.value"
                  @change="setFieldValue(field.field_key, opt?.value)"
                />
                <span>{{ opt?.label || opt?.value }}</span>
              </label>
            </div>

            <!-- Multiselect (checkboxes) -->
            <div v-else-if="field?.field_type === 'multiselect'" class="multiselect-group">
              <label
                v-for="opt in safeOptions(field)"
                :key="opt?.value"
                class="multiselect-option"
              >
                <input
                  type="checkbox"
                  :checked="isMultiselectChecked(field.field_key, opt?.value)"
                  @change="toggleMultiselectValue(field.field_key, opt?.value, $event.target.checked)"
                />
                <span>{{ opt?.label || opt?.value }}</span>
              </label>
              <span v-if="field?.min_selections || field?.max_selections" class="polaris-form-field__help">
                {{ field?.min_selections ? `Min ${field.min_selections}` : '' }}{{ field?.min_selections && field?.max_selections ? ', ' : '' }}{{ field?.max_selections ? `Max ${field.max_selections}` : '' }} selections
              </span>
            </div>

            <!-- Checkbox / Toggle -->
            <label v-else-if="field?.field_type === 'checkbox'" class="toggle-field">
              <input
                type="checkbox"
                :checked="getFieldValue(field.field_key) === true"
                @change="setFieldValue(field.field_key, $event.target.checked)"
              />
              <span>{{ field?.placeholder || 'Enabled' }}</span>
            </label>

            <!-- Textarea -->
            <textarea
              v-else-if="field?.field_type === 'textarea'"
              class="polaris-form-field__textarea"
              rows="3"
              :placeholder="field?.placeholder || ''"
              :value="getFieldValue(field.field_key)"
              @input="setFieldValue(field.field_key, $event.target.value)"
            />

            <!-- Fallback -->
            <input
              v-else
              class="polaris-form-field__input"
              :placeholder="field?.placeholder || ''"
              :value="getFieldValue(field.field_key)"
              @input="setFieldValue(field.field_key, $event.target.value)"
            />
          </div>
        </div>
      </template>

      <!-- ═══ SEND LINE MESSAGE ═══ -->
      <template v-if="activeType === 'send_line'">
        <div class="polaris-form-field">
          <label class="polaris-form-field__label polaris-form-field__label--required">Message Content</label>
          <textarea
            class="polaris-form-field__textarea"
            rows="4"
            placeholder="Hello {{user.firstname}}!"
            :value="config?.content || ''"
            @input="updateField('content', $event.target.value)"
          />
          <span class="polaris-form-field__help">Supports &#123;&#123;variable&#125;&#125; substitution</span>
        </div>

        <div class="polaris-form-field">
          <label class="polaris-form-field__label">LINE Flex JSON (optional)</label>
          <textarea
            class="polaris-form-field__textarea polaris-form-field__textarea--mono"
            rows="6"
            placeholder='{"type": "flex", ...}'
            :value="jsonContentString"
            @input="handleJsonChange($event.target.value)"
          />
          <span v-if="jsonError" class="polaris-form-field__error">{{ jsonError }}</span>
        </div>
      </template>

      <!-- ═══ SEND SMS ═══ -->
      <template v-if="activeType === 'send_sms'">
        <div class="polaris-form-field">
          <label class="polaris-form-field__label polaris-form-field__label--required">Message</label>
          <textarea
            class="polaris-form-field__textarea"
            rows="3"
            placeholder="Your code is {{trigger.code}}"
            :value="config?.message || ''"
            @input="updateField('message', $event.target.value)"
          />
          <span class="polaris-form-field__help">Supports &#123;&#123;variable&#125;&#125; substitution</span>
        </div>
      </template>

      <!-- ═══ API CALL ═══ -->
      <template v-if="config?.action_type === 'api_call'">
        <div class="polaris-form-field__row">
          <div class="polaris-form-field" style="width: 120px; flex-shrink: 0;">
            <label class="polaris-form-field__label polaris-form-field__label--required">Method</label>
            <select class="polaris-form-field__select" :value="config?.method || 'POST'" @change="updateField('method', $event.target.value)">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div class="polaris-form-field" style="flex: 1;">
            <label class="polaris-form-field__label polaris-form-field__label--required">URL</label>
            <input
              class="polaris-form-field__input"
              placeholder="https://api.example.com/endpoint"
              :value="config?.url || ''"
              @input="updateField('url', $event.target.value)"
            />
          </div>
        </div>

        <div v-if="config?.method !== 'GET'" class="polaris-form-field">
          <label class="polaris-form-field__label">Body (JSON)</label>
          <textarea
            class="polaris-form-field__textarea polaris-form-field__textarea--mono"
            rows="5"
            :value="bodyString"
            @input="handleBodyChange($event.target.value)"
          />
          <span v-if="bodyError" class="polaris-form-field__error">{{ bodyError }}</span>
        </div>
      </template>

      <!-- ═══ VARIABLE REFERENCE ═══ -->
      <div v-if="activeType" class="variable-ref">
        <button class="variable-ref__toggle" @click="showVariables = !showVariables">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path v-if="showVariables" d="M2 4l4 4 4-4"/>
            <path v-else d="M4 2l4 4-4 4"/>
          </svg>
          Available variables
        </button>
        <div v-if="showVariables" class="variable-ref__list">
          <div class="variable-ref__group">
            <span class="variable-ref__group-label">User</span>
            <code v-for="v in VARS_USER" :key="v">{{ v }}</code>
          </div>
          <div class="variable-ref__group">
            <span class="variable-ref__group-label">Trigger</span>
            <code v-for="v in VARS_TRIGGER" :key="v">{{ v }}</code>
          </div>
          <div class="variable-ref__group">
            <span class="variable-ref__group-label">Agent (after AI node)</span>
            <code v-for="v in VARS_AGENT" :key="v">{{ v }}</code>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { computed, ref, watch, onMounted } from 'vue';

const ACTION_GROUPS = [
  {
    label: 'Loyalty',
    actions: [
      { value: 'award_currency', label: 'Award Currency' },
      { value: 'assign_tag', label: 'Assign Tag' },
      { value: 'remove_tag', label: 'Remove Tag' },
      { value: 'assign_persona', label: 'Assign Persona' },
      { value: 'submit_form', label: 'Submit Form' },
    ],
  },
  {
    label: 'Messaging',
    actions: [
      { value: 'send_line', label: 'Send LINE Message' },
      { value: 'send_sms', label: 'Send SMS' },
    ],
  },
  {
    label: 'Integration',
    actions: [
      { value: 'api_call', label: 'API Call / Webhook' },
    ],
  },
];

const ACTION_DEFAULTS = {
  award_currency: { currency: 'points', amount: 100, description: '' },
  assign_tag: { tag_id: '' },
  remove_tag: { tag_id: '' },
  assign_persona: { persona_id: '' },
  submit_form: { form_id: '', field_values: {} },
  send_line: { channel: 'line', content: '', json_content: null },
  send_sms: { channel: 'sms', message: '' },
  api_call: { method: 'POST', url: '', body: null },
};

const VARS_USER = [
  '{{user.firstname}}', '{{user.lastname}}', '{{user.fullname}}',
  '{{user.email}}', '{{user.tel}}',
  '{{user.points_balance}}', '{{user.tier_id}}', '{{user.persona_id}}',
];
const VARS_TRIGGER = [
  '{{trigger.amount}}', '{{trigger.source}}', '{{trigger.transaction_type}}',
];
const VARS_AGENT = [
  '{{agent.message}}', '{{agent.selected_asset_name}}',
  '{{agent.action}}', '{{agent.urgency}}',
];

export default {
  name: 'ActionConfig',
  props: {
    config: { type: Object, required: true },
    supabaseUrl: { type: String, default: '' },
    supabaseAnonKey: { type: String, default: '' },
    authToken: { type: String, default: '' },
  },
  emits: ['update'],
  setup(props, { emit }) {
    const jsonError = ref('');
    const bodyError = ref('');
    const showVariables = ref(false);

    // Data fetched from Supabase
    const optionsLoading = ref(false);
    const ticketTypes = ref([]);
    const tags = ref([]);
    const personaGroups = ref([]);
    const forms = ref([]);

    const formFieldsLoading = ref(false);
    const formFields = ref([]);

    const activeType = computed(() => props.config?.action_type || props.config?.channel || '');

    const jsonContentString = computed(() => {
      const c = props.config?.json_content;
      if (!c) return '';
      return typeof c === 'object' ? JSON.stringify(c, null, 2) : c;
    });

    const bodyString = computed(() => {
      const b = props.config?.body;
      if (!b) return '';
      return typeof b === 'object' ? JSON.stringify(b, null, 2) : b;
    });

    // ─── Supabase RPC helpers ────────────────────────────────────

    const rpc = async (functionName, body = {}) => {
      const url = props.supabaseUrl?.replace(/\/+$/, '');
      if (!url || !props.authToken) return null;

      const res = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${props.authToken}`,
          'apikey': props.supabaseAnonKey || props.authToken,
        },
        body: JSON.stringify(body),
      });
      return res.json();
    };

    const fetchActionOptions = async () => {
      if (!props.supabaseUrl || !props.authToken) return;
      optionsLoading.value = true;
      try {
        const data = await rpc('bff_get_amp_action_options');
        if (data?.success !== false) {
          ticketTypes.value = data?.ticket_types || [];
          tags.value = data?.tags || [];
          personaGroups.value = data?.persona_groups || [];
          forms.value = data?.forms || [];
        }
      } catch (err) {
        console.error('[ActionConfig] Failed to fetch options:', err);
      } finally {
        optionsLoading.value = false;
      }
    };

    const fetchFormFields = async (formId) => {
      if (!formId || !props.supabaseUrl) return;
      formFieldsLoading.value = true;
      formFields.value = [];
      try {
        const data = await rpc('bff_get_amp_form_fields', { p_form_id: formId });
        if (data?.success !== false) {
          formFields.value = data?.fields || [];
        }
      } catch (err) {
        console.error('[ActionConfig] Failed to fetch form fields:', err);
      } finally {
        formFieldsLoading.value = false;
      }
    };

    onMounted(async () => {
      await fetchActionOptions();
      if (props.config?.action_type === 'submit_form' && props.config?.form_id) {
        await fetchFormFields(props.config.form_id);
      }
    });

    // ─── Field update helpers ────────────────────────────────────

    const updateField = (field, value) => {
      emit('update', { ...props.config, [field]: value });
    };

    const handleActionTypeChange = (actionType) => {
      const defaults = ACTION_DEFAULTS[actionType] || {};
      emit('update', {
        label: props.config?.label || 'Action',
        action_type: actionType,
        ...defaults,
      });
    };

    const handleFormSelect = async (formId) => {
      emit('update', { ...props.config, form_id: formId, field_values: {} });
      await fetchFormFields(formId);
    };

    // Form field value accessors
    const getFieldValue = (fieldKey) => props.config?.field_values?.[fieldKey] ?? '';

    const setFieldValue = (fieldKey, value) => {
      const fieldValues = { ...(props.config?.field_values || {}), [fieldKey]: value };
      emit('update', { ...props.config, field_values: fieldValues });
    };

    const safeOptions = (field) => {
      const opts = field?.options;
      if (Array.isArray(opts)) return opts;
      if (typeof opts === 'string') {
        try { return JSON.parse(opts); } catch { return []; }
      }
      return [];
    };

    const getInputType = (textFormat) => {
      const map = { email: 'email', phone: 'tel', url: 'url' };
      return map[textFormat] || 'text';
    };

    const isMultiselectChecked = (fieldKey, optValue) => {
      const current = props.config?.field_values?.[fieldKey];
      return Array.isArray(current) && current.includes(optValue);
    };

    const toggleMultiselectValue = (fieldKey, optValue, checked) => {
      const current = Array.isArray(props.config?.field_values?.[fieldKey])
        ? [...props.config.field_values[fieldKey]]
        : [];
      if (checked && !current.includes(optValue)) current.push(optValue);
      else if (!checked) {
        const idx = current.indexOf(optValue);
        if (idx !== -1) current.splice(idx, 1);
      }
      setFieldValue(fieldKey, current);
    };

    // JSON handlers
    const handleJsonChange = (value) => {
      if (!value) { emit('update', { ...props.config, json_content: null }); jsonError.value = ''; return; }
      try { emit('update', { ...props.config, json_content: JSON.parse(value) }); jsonError.value = ''; }
      catch (e) { emit('update', { ...props.config, json_content: value }); jsonError.value = 'Invalid JSON: ' + e.message; }
    };

    const handleBodyChange = (value) => {
      if (!value) { emit('update', { ...props.config, body: null }); bodyError.value = ''; return; }
      try { emit('update', { ...props.config, body: JSON.parse(value) }); bodyError.value = ''; }
      catch (e) { emit('update', { ...props.config, body: value }); bodyError.value = 'Invalid JSON: ' + e.message; }
    };

    return {
      ACTION_GROUPS,
      VARS_USER,
      VARS_TRIGGER,
      VARS_AGENT,
      optionsLoading,
      ticketTypes,
      tags,
      personaGroups,
      forms,
      formFieldsLoading,
      formFields,
      activeType,
      jsonContentString,
      jsonError,
      bodyString,
      bodyError,
      showVariables,
      updateField,
      handleActionTypeChange,
      handleFormSelect,
      getFieldValue,
      setFieldValue,
      safeOptions,
      getInputType,
      isMultiselectChecked,
      toggleMultiselectValue,
      handleJsonChange,
      handleBodyChange,
    };
  },
};
</script>

<style lang="scss" scoped>
@import 'polaris-weweb-styles';

.action-config {
  @include polaris-tokens;
  display: flex;
  flex-direction: column;
  gap: var(--p-space-400);
}

.polaris-form-field {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-100);

  &__label {
    @include polaris-label;
    &--required::after { content: ' *'; color: var(--p-color-text-critical); }
  }

  &__input { @include polaris-input; }
  &__select { @include polaris-select; }
  &__textarea {
    @include polaris-textarea;
    &--mono { font-family: var(--p-font-family-mono); font-size: var(--p-font-size-300); }
  }

  &__help { @include polaris-help-text; }
  &__error { @include polaris-error-text; }

  &__row {
    display: flex;
    gap: var(--p-space-200);
    align-items: flex-end;
  }
}

.segmented-toggle {
  display: flex;
  border-radius: var(--p-border-radius-200);
  overflow: hidden;
  border: 1px solid var(--p-color-border);

  &__btn {
    flex: 1;
    padding: var(--p-space-150) var(--p-space-300);
    border: none;
    background: var(--p-color-bg-surface);
    color: var(--p-color-text);
    font-size: var(--p-font-size-300);
    font-weight: var(--p-font-weight-medium);
    cursor: pointer;
    transition: all 0.1s ease;

    & + & { border-left: 1px solid var(--p-color-border); }

    &--active {
      background: var(--p-color-bg-surface-selected);
      color: var(--p-color-text-brand);
      font-weight: var(--p-font-weight-semibold);
    }

    &:hover:not(&--active) { background: var(--p-color-bg-surface-hover); }
  }
}

.form-fields-section {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-300);
  padding: var(--p-space-300);
  background: var(--p-color-bg-surface-secondary);
  border: 1px solid var(--p-color-border);
  border-radius: var(--p-border-radius-200);
}

.radio-group, .multiselect-group {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-150);
}

.radio-option, .multiselect-option {
  display: flex;
  align-items: center;
  gap: var(--p-space-200);
  font-size: var(--p-font-size-300);
  color: var(--p-color-text);
  cursor: pointer;

  input { width: 16px; height: 16px; cursor: pointer; }
}

.toggle-field {
  display: flex;
  align-items: center;
  gap: var(--p-space-200);
  font-size: var(--p-font-size-300);
  color: var(--p-color-text);
  cursor: pointer;

  input { width: 16px; height: 16px; cursor: pointer; }
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--p-space-200);
  padding: var(--p-space-500);
  color: var(--p-color-text-secondary);

  &--inline {
    justify-content: flex-start;
    padding: var(--p-space-300) 0;
  }

  &__text { font-size: var(--p-font-size-300); }

  &__spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--p-color-border);
    border-top-color: var(--p-color-text-brand);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;

    &--small { width: 14px; height: 14px; }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Variable reference panel
.variable-ref {
  border-top: 1px solid var(--p-color-border);
  padding-top: var(--p-space-300);
  margin-top: var(--p-space-200);
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

  svg { transition: transform 0.15s ease; }
}

.variable-ref__list {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-300);
  padding-top: var(--p-space-200);
}

.variable-ref__group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--p-space-100);
  align-items: center;
}

.variable-ref__group-label {
  font-size: var(--p-font-size-275);
  font-weight: var(--p-font-weight-semibold);
  color: var(--p-color-text-secondary);
  width: 100%;
  margin-bottom: 2px;
}

.variable-ref code {
  background: var(--p-color-bg-surface-secondary);
  padding: 2px 6px;
  border-radius: var(--p-border-radius-100);
  font-family: var(--p-font-family-mono);
  font-size: 11px;
  color: var(--p-color-text);
  white-space: nowrap;
  cursor: pointer;

  &:hover { background: var(--p-color-bg-surface-hover); }
}

.polaris-banner {
  @include polaris-banner-base;
  &--info { @include polaris-banner-info; }
}
.polaris-banner__content { flex: 1; }
.polaris-banner__message { @include polaris-text-body; margin: 0; }
</style>
