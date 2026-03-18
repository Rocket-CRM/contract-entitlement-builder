<template>
  <div class="editor">
    <!-- Header -->
    <div class="editor__header">
      <div class="editor__header-left">
        <button class="editor__back-btn" @click="$emit('back')">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M12 16l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Back
        </button>
        <h2 class="editor__title">{{ form.group_name || 'New Contract' }}</h2>
        <span class="editor__status-badge" :class="'editor__status-badge--' + (form.contract_status || 'draft')">
          <span class="editor__status-dot"></span>
          {{ form.contract_status || 'draft' }}
        </span>
      </div>
      <div class="editor__header-right">
        <button class="editor__btn editor__btn--default" @click="$emit('back')">Cancel</button>

        <template v-if="form.contract_status === 'draft' || !form.contract_status">
          <button class="editor__btn editor__btn--default" :disabled="saving" @click="handleSave('draft')">Save Draft</button>
          <button class="editor__btn editor__btn--primary" :disabled="saving" @click="handleSave('pending')">Submit for Approval</button>
        </template>
        <template v-else-if="form.contract_status === 'pending'">
          <button class="editor__btn editor__btn--default" :disabled="saving" @click="handleSave('pending')">Save</button>
          <button class="editor__btn editor__btn--primary" :disabled="saving" @click="handleSave('active')">Approve</button>
        </template>
        <template v-else-if="form.contract_status === 'active'">
          <button class="editor__btn editor__btn--default" :disabled="saving" @click="handleSave('active')">Save</button>
          <button class="editor__btn editor__btn--critical" :disabled="saving" @click="handleSave('suspended')">Suspend</button>
        </template>
        <template v-else-if="form.contract_status === 'suspended'">
          <button class="editor__btn editor__btn--default" :disabled="saving" @click="handleSave('suspended')">Save</button>
          <button class="editor__btn editor__btn--primary" :disabled="saving" @click="handleSave('active')">Reactivate</button>
        </template>
        <template v-else>
          <button class="editor__btn editor__btn--primary" :disabled="saving" @click="handleSave(form.contract_status)">Save</button>
        </template>
      </div>
    </div>

    <!-- Tabs -->
    <div class="editor__tabs">
      <button class="editor__tab" :class="{ 'editor__tab--active': activeTab === 'details' }" @click="activeTab = 'details'">
        Contract Details
      </button>
      <button class="editor__tab" :class="{ 'editor__tab--active': activeTab === 'levels' }" @click="activeTab = 'levels'">
        Persona Levels & Entitlements
        <span v-if="form.levels?.length" class="editor__tab-count">{{ form.levels.length }}</span>
      </button>
    </div>

    <!-- Validation errors -->
    <div v-if="validationErrors.length" class="editor__errors">
      <div class="editor__error-banner">
        <div class="editor__error-header">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <path d="M10 6v5M10 13.5h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>Please fix the following errors</span>
          <button class="editor__error-dismiss" @click="validationErrors = []">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
        <ul class="editor__error-list">
          <li v-for="(err, idx) in validationErrors" :key="idx">{{ err }}</li>
        </ul>
      </div>
    </div>

    <!-- Content -->
    <div class="editor__content">
      <!-- Tab: Contract Details -->
      <template v-if="activeTab === 'details'">
        <div class="editor__card">
          <div class="editor__card-header">
            <div class="editor__card-title">Contract Information</div>
            <div class="editor__card-desc">Basic details about this contract agreement</div>
          </div>
          <div class="editor__card-section">
            <div class="editor__form-grid">
              <div class="editor__field editor__field--full">
                <label class="editor__label">Group Name <span class="editor__required">*</span></label>
                <input class="editor__input" type="text" v-model="form.group_name" placeholder="e.g. Company ABC" />
              </div>
              <div class="editor__field">
                <label class="editor__label">Contract Type</label>
                <select class="editor__select" v-model="form.contract_type">
                  <option value="">Select type...</option>
                  <option value="corporate">Corporate</option>
                  <option value="insurance">Insurance</option>
                  <option value="vip">VIP</option>
                  <option value="partner">Partner</option>
                </select>
              </div>
              <div class="editor__field">
                <label class="editor__label">Company Name</label>
                <input class="editor__input" type="text" v-model="form.company_name" placeholder="Legal entity name" />
              </div>
              <div class="editor__field">
                <label class="editor__label">Contact Person</label>
                <input class="editor__input" type="text" v-model="form.contact_person" placeholder="Primary contact" />
              </div>
              <div class="editor__field">
                <label class="editor__label">Contact Email</label>
                <input class="editor__input" type="email" v-model="form.contact_email" placeholder="email@company.com" />
              </div>
            </div>
          </div>
        </div>

        <div class="editor__card">
          <div class="editor__card-header">
            <div class="editor__card-title">Contract Period & Status</div>
            <div class="editor__card-desc">Effective dates and active status for this contract</div>
          </div>
          <div class="editor__card-section">
            <div class="editor__form-grid">
              <div class="editor__field">
                <label class="editor__label">Contract Start</label>
                <input class="editor__input editor__input--date" type="date" v-model="form.contract_start" />
              </div>
              <div class="editor__field">
                <label class="editor__label">Contract End</label>
                <input class="editor__input editor__input--date" type="date" v-model="form.contract_end" />
              </div>
              <div class="editor__field">
                <label class="editor__label">Active Status</label>
                <div class="editor__switch-row">
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="form.active_status" />
                    <span class="toggle-switch__slider"></span>
                  </label>
                  <span class="editor__switch-label">{{ form.active_status ? 'Active' : 'Inactive' }}</span>
                </div>
              </div>
              <div class="editor__field">
                <label class="editor__label">Contract Status</label>
                <span class="editor__status-display" :class="'editor__status-display--' + (form.contract_status || 'draft')">
                  {{ form.contract_status || 'draft' }}
                </span>
                <span class="editor__help-text">Managed by workflow buttons above</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Tab: Persona Levels & Entitlements -->
      <template v-if="activeTab === 'levels'">
        <div class="editor__levels-header">
          <div>
            <div class="editor__levels-title">Persona Levels</div>
            <div class="editor__levels-desc">Each level defines entitlements that auto-assign when a user joins this persona.</div>
          </div>
          <button class="editor__add-level-btn" @click="addLevel">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Add Level
          </button>
        </div>

        <div v-if="!form.levels?.length" class="editor__levels-empty">
          <div class="editor__levels-empty-icon">👥</div>
          <div class="editor__levels-empty-text">No persona levels yet</div>
          <div class="editor__levels-empty-hint">Add levels like "Executive", "General", "Other" and configure entitlements for each.</div>
          <button class="editor__add-level-btn" @click="addLevel">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Add First Level
          </button>
        </div>

        <LevelCard
          v-for="(lvl, idx) in form.levels"
          :key="lvl.persona?.id || lvl._tempId || idx"
          :level="{ ...lvl.persona, member_count: lvl.member_count }"
          :entitlements="enrichedEntitlements(lvl.entitlements)"
          :packages="packages"
          :rewards="rewards"
          @update-level="updateLevel(idx, $event)"
          @remove-level="removeLevel(idx)"
          @update-entitlement="updateEntitlement(idx, $event)"
          @remove-entitlement="removeEntitlement(idx, $event)"
          @add-entitlement="addEntitlement(idx, $event)"
        />
      </template>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue';
import LevelCard from './LevelCard.vue';

let tempIdCounter = 0;
const nextTempId = () => `_new_${++tempIdCounter}_${Date.now()}`;

export default {
  components: { LevelCard },
  props: {
    contract: { type: Object, default: null },
    packages: { type: Array, default: () => [] },
    rewards: { type: Array, default: () => [] },
    saving: { type: Boolean, default: false },
  },
  emits: ['back', 'save'],
  setup(props, { emit }) {
    const activeTab = ref('details');
    const validationErrors = ref([]);

    const createEmptyForm = () => ({
      group_id: null,
      group_name: '',
      contract_type: '',
      company_name: '',
      contact_person: '',
      contact_email: '',
      contract_start: '',
      contract_end: '',
      contract_status: 'draft',
      active_status: true,
      levels: [],
    });

    const form = ref(createEmptyForm());

    watch(
      () => props.contract,
      (c) => {
        if (!c) {
          form.value = createEmptyForm();
          return;
        }
        form.value = {
          group_id: c.id || null,
          group_name: c.group_name || '',
          contract_type: c.contract_type || '',
          company_name: c.company_name || '',
          contact_person: c.contact_person || '',
          contact_email: c.contact_email || '',
          contract_start: c.contract_start || '',
          contract_end: c.contract_end || '',
          contract_status: c.contract_status || 'draft',
          active_status: c.active_status !== false,
          levels: (c.levels || []).map((lvl) => ({
            persona: {
              id: lvl.id,
              persona_name: lvl.persona_name,
              active_status: lvl.active_status !== false,
            },
            member_count: lvl.member_count || 0,
            entitlements: (lvl.entitlements || []).map((e) => ({ ...e })),
            _tempId: nextTempId(),
          })),
        };
      },
      { immediate: true }
    );

    const enrichedEntitlements = (ents) => {
      return (ents || []).map((e) => {
        const enriched = { ...e };
        if (e.entitlement_type === 'package' && e.package_id) {
          const pkg = props.packages?.find((p) => p?.id === e.package_id);
          if (pkg) enriched._package_name = pkg.name;
        }
        if (e.entitlement_type === 'reward' && e.reward_id) {
          const rwd = props.rewards?.find((r) => r?.id === e.reward_id);
          if (rwd) enriched._reward_name = rwd.name;
        }
        return enriched;
      });
    };

    const addLevel = () => {
      form.value.levels.push({
        persona: { id: null, persona_name: 'New Level', active_status: true },
        member_count: 0,
        entitlements: [],
        _tempId: nextTempId(),
      });
    };

    const updateLevel = (idx, data) => {
      const lvl = form.value.levels[idx];
      if (!lvl) return;
      lvl.persona = {
        ...lvl.persona,
        persona_name: data.persona_name ?? lvl.persona.persona_name,
        active_status: data.active_status ?? lvl.persona.active_status,
      };
    };

    const removeLevel = (idx) => {
      form.value.levels.splice(idx, 1);
    };

    const updateEntitlement = (levelIdx, { index, data }) => {
      const ents = form.value.levels[levelIdx]?.entitlements;
      if (!ents || index < 0 || index >= ents.length) return;
      ents[index] = { ...ents[index], ...data };
    };

    const removeEntitlement = (levelIdx, entIdx) => {
      form.value.levels[levelIdx]?.entitlements?.splice(entIdx, 1);
    };

    const addEntitlement = (levelIdx, data) => {
      form.value.levels[levelIdx]?.entitlements?.push({ ...data });
    };

    const validate = () => {
      const errors = [];
      if (!form.value.group_name?.trim()) errors.push('Group name is required');
      form.value.levels.forEach((lvl, i) => {
        const label = lvl.persona?.persona_name || `Level ${i + 1}`;
        if (!lvl.persona?.persona_name?.trim()) errors.push(`${label}: Persona name is required`);
        (lvl.entitlements || []).forEach((ent, j) => {
          const elabel = `${label} → Entitlement ${j + 1}`;
          if (ent.entitlement_type === 'package' && !ent.package_id) errors.push(`${elabel}: Package must be selected`);
          if (ent.entitlement_type === 'reward' && !ent.reward_id) errors.push(`${elabel}: Reward must be selected`);
          if (ent.entitlement_type === 'reward' && (!ent.qty || ent.qty < 1)) errors.push(`${elabel}: Qty must be at least 1`);
          if (ent.entitlement_type === 'benefit') {
            if (!ent.category) errors.push(`${elabel}: Category is required`);
            if (!ent.benefit_type) errors.push(`${elabel}: Benefit type is required`);
            if (ent.value == null || ent.value === '') errors.push(`${elabel}: Value is required`);
          }
        });
      });
      return errors;
    };

    const handleSave = (newStatus) => {
      const errors = validate();
      validationErrors.value = errors;
      if (errors.length) {
        activeTab.value = errors[0]?.includes('Group name') ? 'details' : 'levels';
        return;
      }

      const payload = {
        p_group_id: form.value.group_id || null,
        p_group_name: form.value.group_name,
        p_contract_type: form.value.contract_type || null,
        p_company_name: form.value.company_name || null,
        p_contact_person: form.value.contact_person || null,
        p_contact_email: form.value.contact_email || null,
        p_contract_start: form.value.contract_start || null,
        p_contract_end: form.value.contract_end || null,
        p_contract_status: newStatus || form.value.contract_status || 'draft',
        p_active_status: form.value.active_status,
        p_levels: form.value.levels.map((lvl) => ({
          persona: {
            id: lvl.persona?.id || null,
            persona_name: lvl.persona?.persona_name,
            active_status: lvl.persona?.active_status !== false,
          },
          entitlements: (lvl.entitlements || []).map((ent, idx) => ({
            id: ent.id || null,
            entitlement_type: ent.entitlement_type,
            package_id: ent.entitlement_type === 'package' ? ent.package_id : null,
            reward_id: ent.entitlement_type === 'reward' ? ent.reward_id : null,
            qty: ent.entitlement_type === 'reward' ? (ent.qty || 1) : null,
            category: ent.entitlement_type === 'benefit' ? ent.category : null,
            benefit_type: ent.entitlement_type === 'benefit' ? ent.benefit_type : null,
            value: ent.entitlement_type === 'benefit' ? ent.value : null,
            active_status: ent.active_status !== false,
            ranking: idx,
          })),
        })),
      };

      emit('save', payload);
    };

    return {
      activeTab,
      validationErrors,
      form,
      enrichedEntitlements,
      addLevel,
      updateLevel,
      removeLevel,
      updateEntitlement,
      removeEntitlement,
      addEntitlement,
      handleSave,
    };
  },
};
</script>

<style scoped lang="scss">
@import 'polaris-weweb-styles';

.editor {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--p-space-300) var(--p-space-600);
    background: var(--p-color-bg-surface);
    border-bottom: 1px solid var(--p-color-border);
    box-shadow: 0 1px 0 0 rgba(0, 0, 0, 0.04);
    flex-shrink: 0;
    gap: var(--p-space-300);
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: var(--p-space-300);
    min-width: 0;
    flex: 1;
  }

  &__header-right {
    display: flex;
    align-items: center;
    gap: var(--p-space-200);
    flex-shrink: 0;
  }

  &__back-btn {
    @include polaris-button-plain;
    display: inline-flex;
    align-items: center;
    gap: var(--p-space-100);
    font-size: var(--p-font-size-325);
    flex-shrink: 0;
  }

  &__title {
    font-size: var(--p-font-size-400);
    font-weight: var(--p-font-weight-semibold);
    color: var(--p-color-text);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: var(--p-font-size-275);
    font-weight: var(--p-font-weight-medium);
    text-transform: capitalize;
    white-space: nowrap;
    flex-shrink: 0;

    &--active { background: var(--p-color-bg-fill-success-secondary); color: var(--p-color-text-success); }
    &--draft { background: var(--p-color-bg-surface-secondary); color: var(--p-color-text-secondary); }
    &--pending { background: #FEF3C7; color: #D97706; }
    &--suspended { background: #FEE2E2; color: #DC2626; }
    &--expired { background: var(--p-color-bg-surface-secondary); color: var(--p-color-text-disabled); }
  }

  &__status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;

    .editor__status-badge--active & { background: var(--p-color-icon-success); }
    .editor__status-badge--draft & { background: var(--p-color-icon-secondary); }
    .editor__status-badge--pending & { background: #D97706; }
    .editor__status-badge--suspended & { background: #DC2626; }
    .editor__status-badge--expired & { background: var(--p-color-icon-disabled); }
  }

  &__btn {
    font-family: var(--p-font-family-sans);
    cursor: pointer;
    white-space: nowrap;

    &--default { @include polaris-button-default; @include polaris-button-slim; }
    &--primary { @include polaris-button-primary; @include polaris-button-slim; }
    &--critical { @include polaris-button-critical; @include polaris-button-slim; }

    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  &__tabs {
    display: flex;
    background: var(--p-color-bg-surface);
    border-bottom: 1px solid var(--p-color-border);
    padding: 0 var(--p-space-600);
    flex-shrink: 0;
  }

  &__tab {
    display: flex;
    align-items: center;
    gap: var(--p-space-200);
    padding: var(--p-space-300) var(--p-space-400);
    border: none;
    background: transparent;
    cursor: pointer;
    font-family: var(--p-font-family-sans);
    font-size: var(--p-font-size-325);
    font-weight: var(--p-font-weight-medium);
    color: var(--p-color-text-secondary);
    border-bottom: 2px solid transparent;
    transition: all 0.15s;
    white-space: nowrap;

    &:hover { color: var(--p-color-text); background: var(--p-color-bg-surface-hover); }
    &--active { color: var(--p-color-text); border-bottom-color: var(--p-color-text); }
  }

  &__tab-count {
    background: var(--p-color-bg-fill-secondary);
    color: var(--p-color-text-secondary);
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 10px;
    font-weight: var(--p-font-weight-semibold);
  }

  &__errors {
    padding: var(--p-space-400) var(--p-space-600) 0;
    flex-shrink: 0;
    background: var(--p-color-bg-surface-secondary);
  }

  &__error-banner {
    @include polaris-banner-critical;
    border-radius: var(--p-border-radius-200);
    overflow: hidden;
  }

  &__error-header {
    display: flex;
    align-items: center;
    gap: var(--p-space-200);
    padding: var(--p-space-300) var(--p-space-400);
    font-weight: var(--p-font-weight-semibold);
    font-size: var(--p-font-size-325);

    span { flex: 1; }
  }

  &__error-dismiss {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    border-radius: var(--p-border-radius-100);
    opacity: 0.7;
    &:hover { opacity: 1; }
  }

  &__error-list {
    margin: 0;
    padding: 0 var(--p-space-400) var(--p-space-300) var(--p-space-800);
    font-size: var(--p-font-size-300);
    li { margin-bottom: var(--p-space-100); }
    li:last-child { margin-bottom: 0; }
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    padding: var(--p-space-600);
    background: var(--p-color-bg-surface-secondary);
    display: flex;
    flex-direction: column;
    gap: var(--p-space-400);
  }

  &__card {
    @include polaris-card;
  }

  &__card-header {
    padding: var(--p-space-400) var(--p-space-500);
    border-bottom: 1px solid var(--p-color-border);
  }

  &__card-title {
    font-size: var(--p-font-size-350);
    font-weight: var(--p-font-weight-semibold);
    color: var(--p-color-text);
  }

  &__card-desc {
    font-size: var(--p-font-size-300);
    color: var(--p-color-text-secondary);
    margin-top: var(--p-space-100);
  }

  &__card-section {
    padding: var(--p-space-400) var(--p-space-500);
  }

  &__form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--p-space-400);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--p-space-150);

    &--full { grid-column: 1 / -1; }
  }

  &__label {
    font-size: var(--p-font-size-300);
    font-weight: var(--p-font-weight-semibold);
    color: var(--p-color-text);
  }

  &__required { color: var(--p-color-text-critical); }

  &__input {
    @include polaris-input;

    &--date {
      color-scheme: light;
    }
  }

  &__select { @include polaris-select; }

  &__switch-row {
    display: flex;
    align-items: center;
    gap: var(--p-space-200);
    padding-top: var(--p-space-100);
  }

  &__switch-label {
    font-size: var(--p-font-size-325);
    color: var(--p-color-text);
  }

  &__status-display {
    display: inline-flex;
    align-items: center;
    padding: var(--p-space-100) var(--p-space-300);
    border-radius: var(--p-border-radius-200);
    font-size: var(--p-font-size-325);
    font-weight: var(--p-font-weight-medium);
    text-transform: capitalize;

    &--active { background: var(--p-color-bg-fill-success-secondary); color: var(--p-color-text-success); }
    &--draft { background: var(--p-color-bg-surface-secondary); color: var(--p-color-text-secondary); }
    &--pending { background: #FEF3C7; color: #D97706; }
    &--suspended { background: #FEE2E2; color: #DC2626; }
    &--expired { background: var(--p-color-bg-surface-secondary); color: var(--p-color-text-disabled); }
  }

  &__help-text {
    font-size: var(--p-font-size-275);
    color: var(--p-color-text-secondary);
    margin-top: var(--p-space-100);
  }

  &__levels-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--p-space-300);
  }

  &__levels-title {
    font-size: var(--p-font-size-350);
    font-weight: var(--p-font-weight-semibold);
    color: var(--p-color-text);
  }

  &__levels-desc {
    font-size: var(--p-font-size-300);
    color: var(--p-color-text-secondary);
    margin-top: var(--p-space-100);
  }

  &__add-level-btn {
    @include polaris-button-default;
    @include polaris-button-slim;
    display: inline-flex;
    align-items: center;
    gap: var(--p-space-150);
    white-space: nowrap;
  }

  &__levels-empty {
    text-align: center;
    padding: var(--p-space-800);
    border: 2px dashed var(--p-color-border);
    border-radius: var(--p-border-radius-300);
    background: var(--p-color-bg-surface);
  }

  &__levels-empty-icon { font-size: 36px; margin-bottom: var(--p-space-200); }

  &__levels-empty-text {
    font-size: var(--p-font-size-350);
    font-weight: var(--p-font-weight-semibold);
    color: var(--p-color-text);
    margin-bottom: var(--p-space-100);
  }

  &__levels-empty-hint {
    font-size: var(--p-font-size-300);
    color: var(--p-color-text-secondary);
    margin-bottom: var(--p-space-400);
  }
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
  cursor: pointer;

  input { opacity: 0; width: 0; height: 0; position: absolute; }

  &__slider {
    position: absolute;
    inset: 0;
    background: var(--p-color-bg-fill-disabled);
    border-radius: 10px;
    transition: background 0.15s;

    &::before {
      content: '';
      position: absolute;
      left: 2px;
      top: 2px;
      width: 16px;
      height: 16px;
      background: white;
      border-radius: 50%;
      transition: transform 0.15s;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
    }
  }

  input:checked + &__slider {
    background: var(--p-color-bg-fill-success);
    &::before { transform: translateX(16px); }
  }
}
</style>
