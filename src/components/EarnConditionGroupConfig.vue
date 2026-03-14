<template>
  <div class="config-panel" :style="{ width: panelWidth }">
    <div class="config-panel__header">
      <h3 class="config-panel__title">{{ isNew ? 'Add Earn Condition Group' : 'Edit Earn Condition Group' }}</h3>
      <button class="config-panel__close" @click="$emit('close')">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <div class="config-panel__body">
      <div class="config-panel__field">
        <label class="config-panel__label">Earn condition group name</label>
        <input class="config-panel__input" v-model="form.name" placeholder="e.g. Tier Perks, Product Picks..." />
      </div>

      <div class="config-panel__section-title">
        <span class="config-panel__section-bar"></span>
        Condition Lists
      </div>

      <div v-for="(cond, idx) in form.conditions" :key="cond._key" class="condition-entry">
        <div class="condition-entry__header">
          <span class="condition-entry__title">Entity : {{ formatEntityType(cond.entity) }}</span>
          <div class="condition-entry__actions">
            <button class="condition-entry__action-btn" @click="moveCondition(idx, -1)" :disabled="idx === 0" title="Move up">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 4l-6 6h12l-6-6z" fill="currentColor"/></svg>
            </button>
            <button class="condition-entry__action-btn" @click="moveCondition(idx, 1)" :disabled="idx === form.conditions.length - 1" title="Move down">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 16l6-6H4l6 6z" fill="currentColor"/></svg>
            </button>
            <button class="condition-entry__action-btn condition-entry__action-btn--delete" @click="removeCondition(idx)" title="Delete">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M6 6h8v10H6V6zM4 6h12M8 4h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>

        <div class="condition-entry__body">
          <div class="config-panel__field">
            <label class="config-panel__label">Entity type</label>
            <select class="config-panel__select" v-model="cond.entity">
              <option v-for="et in entityTypeOptions" :key="et.value" :value="et.value">{{ et.label }}</option>
            </select>
          </div>

          <div class="config-panel__field">
            <label class="config-panel__label">Entities</label>
            <div class="entity-tags">
              <span v-for="eid in cond.entity_ids" :key="eid" class="entity-tags__tag">
                {{ getEntityName(eid, cond.entity) }}
                <button class="entity-tags__remove" @click="removeEntityId(cond, eid)">×</button>
              </span>
              <button class="entity-tags__add" @click="openEntityPicker(idx)">+ Add</button>
            </div>
          </div>

          <div class="config-panel__field">
            <label class="config-panel__label">Operator</label>
            <div class="operator-toggle">
              <button
                v-for="op in ['OR', 'AND', 'EACH']"
                :key="op"
                class="operator-toggle__btn"
                :class="{ 'operator-toggle__btn--active': cond.operator === op }"
                @click="cond.operator = op"
              >{{ op }}</button>
            </div>
          </div>

          <div class="config-panel__field">
            <label class="config-panel__label">Threshold type</label>
            <select class="config-panel__select" v-model="cond.threshold_unit">
              <option :value="null">None</option>
              <option value="amount">Purchase amount</option>
              <option value="quantity_primary">Quantity (primary UOM)</option>
              <option value="quantity_secondary">Quantity (secondary UOM)</option>
            </select>
          </div>

          <div class="config-panel__field" v-if="cond.threshold_unit">
            <label class="config-panel__label config-panel__label--with-toggle">
              Apply to excess only
              <span class="config-panel__tooltip-icon" title="When enabled, multiplier applies only to quantity/value above minimum threshold">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5" fill="none"/>
                  <path d="M10 9v4M10 7h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </span>
            </label>
            <label class="config-panel__switch-wrapper">
              <input type="checkbox" class="config-panel__switch" v-model="cond.apply_to_excess_only" />
            </label>
          </div>

          <div class="config-panel__field-row" v-if="cond.threshold_unit">
            <div class="config-panel__field config-panel__field--half">
              <label class="config-panel__label">Minimum required</label>
              <div class="config-panel__input-suffix">
                <input class="config-panel__input" type="number" v-model.number="cond.min_threshold" placeholder="Min amount" min="0" step="any" />
                <span class="config-panel__suffix">฿</span>
              </div>
            </div>
            <div class="config-panel__field-separator">To</div>
            <div class="config-panel__field config-panel__field--half">
              <label class="config-panel__label">Maximum cap</label>
              <div class="config-panel__input-suffix">
                <input class="config-panel__input" type="number" v-model.number="cond.max_threshold" placeholder="Max amount" min="0" step="any" />
                <span class="config-panel__suffix">฿</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button class="config-panel__add-condition" @click="addCondition">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5" fill="none"/>
          <path d="M10 7v6M7 10h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        Add another earn condition
      </button>
    </div>

    <div class="config-panel__footer">
      <button class="config-panel__btn-secondary" @click="$emit('close')">Cancel</button>
      <button class="config-panel__btn-primary" @click="handleSave" :disabled="saving">
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
    </div>

    <div v-if="entityPickerOpen" class="entity-picker-overlay" @click.self="entityPickerOpen = false">
      <div class="entity-picker">
        <div class="entity-picker__header">
          <input class="entity-picker__search" v-model="entitySearch" placeholder="Search entities..." />
          <button class="entity-picker__close-btn" @click="entityPickerOpen = false">×</button>
        </div>
        <div class="entity-picker__list">
          <label
            v-for="ent in filteredEntities"
            :key="ent.id"
            class="entity-picker__item"
          >
            <input
              type="checkbox"
              :checked="isEntitySelected(ent.id)"
              @change="toggleEntity(ent.id)"
            />
            <span>{{ ent.name }}</span>
          </label>
          <div v-if="!filteredEntities.length" class="entity-picker__empty">No matching entities</div>
        </div>
        <div class="entity-picker__footer">
          <button class="config-panel__btn-primary" @click="entityPickerOpen = false">Done</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, computed } from 'vue';

const ENTITY_TYPE_OPTIONS = [
  { label: 'Product', value: 'product_product' },
  { label: 'SKU', value: 'product_sku' },
  { label: 'Brand', value: 'product_brand' },
  { label: 'Category', value: 'product_category' },
  { label: 'Store', value: 'store' },
  { label: 'Store Attribute Set', value: 'store_attribute_set' },
  { label: 'Tier', value: 'tier' },
  { label: 'Persona', value: 'persona' },
];

const ENTITY_TYPE_LABELS = {};
ENTITY_TYPE_OPTIONS.forEach(e => { ENTITY_TYPE_LABELS[e.value] = e.label; });

let keyCounter = 0;

export default {
  props: {
    group: { type: Object, default: null },
    allEntityOptions: { type: Array, default: () => [] },
    panelWidth: { type: String, default: '380px' },
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const saving = ref(false);
    const isNew = computed(() => !props.group?.id);
    const entityPickerOpen = ref(false);
    const entityPickerIdx = ref(null);
    const entitySearch = ref('');

    const entityTypeOptions = ENTITY_TYPE_OPTIONS;

    const defaultCondition = () => ({
      _key: `cond_${++keyCounter}`,
      id: null,
      entity: 'tier',
      entity_ids: [],
      operator: 'OR',
      threshold_unit: null,
      min_threshold: null,
      max_threshold: null,
      apply_to_excess_only: false,
    });

    const form = ref({
      id: null,
      name: '',
      conditions: [defaultCondition()],
    });

    watch(() => props.group, (g) => {
      if (g && g.id) {
        form.value = {
          id: g.id,
          name: g.name || '',
          conditions: (g.conditions || []).map(c => ({
            _key: `cond_${++keyCounter}`,
            id: c.id || null,
            entity: c.entity || c.filter_type || 'tier',
            entity_ids: Array.isArray(c.entity_ids) ? [...c.entity_ids] : (Array.isArray(c.filter_ids) ? [...c.filter_ids] : []),
            operator: c.operator || 'OR',
            threshold_unit: c.threshold_unit || null,
            min_threshold: c.min_threshold ?? null,
            max_threshold: c.max_threshold ?? null,
            apply_to_excess_only: c.apply_to_excess_only || false,
          })),
        };
        if (!form.value.conditions.length) {
          form.value.conditions.push(defaultCondition());
        }
      } else {
        form.value = { id: null, name: '', conditions: [defaultCondition()] };
      }
    }, { immediate: true });

    function addCondition() {
      form.value.conditions.push(defaultCondition());
    }

    function removeCondition(idx) {
      if (form.value.conditions.length > 1) {
        form.value.conditions.splice(idx, 1);
      }
    }

    function moveCondition(idx, dir) {
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= form.value.conditions.length) return;
      const arr = form.value.conditions;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    }

    function openEntityPicker(idx) {
      entityPickerIdx.value = idx;
      entitySearch.value = '';
      entityPickerOpen.value = true;
    }

    const filteredEntities = computed(() => {
      const idx = entityPickerIdx.value;
      if (idx === null || !form.value.conditions[idx]) return [];
      const entityType = form.value.conditions[idx].entity;
      let opts = (props.allEntityOptions || []).filter(e => e?.entity_type === entityType);
      const q = entitySearch.value?.toLowerCase()?.trim();
      if (q) {
        opts = opts.filter(e => e?.name?.toLowerCase()?.includes(q));
      }
      return opts;
    });

    function isEntitySelected(entityId) {
      const idx = entityPickerIdx.value;
      if (idx === null || !form.value.conditions[idx]) return false;
      return form.value.conditions[idx].entity_ids?.includes(entityId);
    }

    function toggleEntity(entityId) {
      const idx = entityPickerIdx.value;
      if (idx === null || !form.value.conditions[idx]) return;
      const ids = form.value.conditions[idx].entity_ids;
      const i = ids.indexOf(entityId);
      if (i >= 0) ids.splice(i, 1);
      else ids.push(entityId);
    }

    function removeEntityId(cond, eid) {
      const i = cond.entity_ids.indexOf(eid);
      if (i >= 0) cond.entity_ids.splice(i, 1);
    }

    function getEntityName(entityId, entityType) {
      const ent = (props.allEntityOptions || []).find(e => e?.id === entityId);
      return ent?.name || entityId?.substring?.(0, 8) || '?';
    }

    function formatEntityType(val) {
      return ENTITY_TYPE_LABELS[val] || val || '—';
    }

    async function handleSave() {
      saving.value = true;
      try {
        const payload = {
          id: form.value.id || undefined,
          name: form.value.name,
          conditions: form.value.conditions.map(c => ({
            id: c.id || undefined,
            entity: c.entity,
            entity_ids: c.entity_ids || [],
            operator: c.operator || 'OR',
            threshold_unit: c.threshold_unit || null,
            min_threshold: c.min_threshold ?? null,
            max_threshold: c.max_threshold ?? null,
            apply_to_excess_only: c.apply_to_excess_only || false,
          })),
        };
        emit('save', payload);
      } finally {
        saving.value = false;
      }
    }

    return {
      form,
      isNew,
      saving,
      entityTypeOptions,
      entityPickerOpen,
      entitySearch,
      filteredEntities,
      addCondition,
      removeCondition,
      moveCondition,
      openEntityPicker,
      isEntitySelected,
      toggleEntity,
      removeEntityId,
      getEntityName,
      formatEntityType,
      handleSave,
    };
  },
};
</script>

<style scoped lang="scss">
@import 'polaris-weweb-styles';

.config-panel {
  position: absolute;
  top: 0; right: 0; bottom: 0;
  background: var(--p-color-bg-surface);
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.12);
  z-index: 300;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__header { @include polaris-modal-header; }
  &__title { @include polaris-text-heading-sm; margin: 0; }
  &__close {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    background: transparent; border: none; border-radius: var(--p-border-radius-100);
    color: var(--p-color-icon); cursor: pointer;
    &:hover { background: var(--p-color-bg-surface-hover); }
  }
  &__body { flex: 1; overflow-y: auto; padding: var(--p-space-400); }
  &__field {
    margin-bottom: var(--p-space-400);
    &--half { flex: 1; min-width: 0; }
  }
  &__field-row { display: flex; gap: var(--p-space-200); align-items: flex-end; margin-bottom: var(--p-space-400); }
  &__field-separator { @include polaris-text-body-subdued; padding-bottom: var(--p-space-200); flex-shrink: 0; }
  &__label {
    @include polaris-label; display: block; margin-bottom: var(--p-space-100);
    &--with-toggle { display: flex; align-items: center; gap: var(--p-space-100); }
  }
  &__tooltip-icon { color: var(--p-color-icon); cursor: help; display: inline-flex; }
  &__input { @include polaris-input; }
  &__select { @include polaris-select; }
  &__date-input { @include polaris-date-field; }
  &__input-suffix { position: relative; }
  &__suffix { position: absolute; right: var(--p-space-300); top: 50%; transform: translateY(-50%); color: var(--p-color-text-secondary); font-size: var(--p-font-size-300); pointer-events: none; }
  &__switch-wrapper { @include polaris-switch-wrapper; }
  &__switch { @include polaris-switch; }
  &__radio-group { display: flex; gap: var(--p-space-400); }
  &__radio-item {
    @include polaris-radio-wrapper; font-size: var(--p-font-size-350);
    input[type="radio"] { @include polaris-radio; }
  }
  &__footer { @include polaris-modal-footer; }
  &__btn-primary { @include polaris-button-primary; }
  &__btn-secondary { @include polaris-button-default; }

  &__section-title {
    @include polaris-text-body;
    font-weight: var(--p-font-weight-semibold);
    margin-bottom: var(--p-space-300);
    display: flex;
    align-items: center;
    gap: var(--p-space-200);
  }

  &__section-bar {
    width: 3px;
    height: 16px;
    background: var(--p-color-bg-fill-brand);
    border-radius: 2px;
  }

  &__add-condition {
    @include polaris-button-plain;
    font-size: var(--p-font-size-300);
    gap: var(--p-space-100);
    margin-top: var(--p-space-200);
  }
}

.condition-entry {
  border: 1px solid var(--p-color-border);
  border-radius: var(--p-border-radius-200);
  margin-bottom: var(--p-space-300);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--p-space-200) var(--p-space-300);
    background: var(--p-color-bg-surface-secondary);
    border-bottom: 1px solid var(--p-color-border);
  }

  &__title {
    @include polaris-text-body;
    font-weight: var(--p-font-weight-semibold);
    font-size: var(--p-font-size-300);
  }

  &__actions {
    display: flex;
    gap: var(--p-space-100);
  }

  &__action-btn {
    width: 24px; height: 24px;
    display: flex; align-items: center; justify-content: center;
    background: transparent; border: none; border-radius: var(--p-border-radius-100);
    color: var(--p-color-icon); cursor: pointer;
    &:hover { background: var(--p-color-bg-surface-hover); }
    &:disabled { opacity: 0.3; cursor: not-allowed; }
    &--delete:hover { color: var(--p-color-text-critical); background: var(--p-color-bg-fill-critical-secondary); }
  }

  &__body {
    padding: var(--p-space-300);
  }
}

.entity-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--p-space-100);
  padding: var(--p-space-200);
  border: 1px solid var(--p-color-border);
  border-radius: var(--p-border-radius-200);
  min-height: 36px;

  &__tag {
    @include polaris-chip-removable;
    background: var(--p-color-bg-fill-info-secondary);
    color: var(--p-color-text-info);
  }

  &__remove {
    background: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    padding: 0 2px;
    opacity: 0.7;
    &:hover { opacity: 1; }
  }

  &__add {
    @include polaris-button-plain;
    font-size: var(--p-font-size-300);
    padding: 0 var(--p-space-100);
    min-height: auto;
  }
}

.operator-toggle {
  @include polaris-segmented-pill;

  &__btn {
    @include polaris-segmented-pill-btn;

    &--active {
      @include polaris-segmented-pill-btn-active;
    }
  }
}

.entity-picker-overlay {
  @include polaris-modal-backdrop;
  z-index: 400;
}

.entity-picker {
  background: var(--p-color-bg-surface);
  border-radius: var(--p-border-radius-300);
  box-shadow: var(--p-shadow-popover);
  width: 90%;
  max-width: 400px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    align-items: center;
    gap: var(--p-space-200);
    padding: var(--p-space-300);
    border-bottom: 1px solid var(--p-color-border);
  }

  &__search {
    @include polaris-search-field;
    flex: 1;
  }

  &__close-btn {
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    background: transparent; border: none; color: var(--p-color-icon); cursor: pointer;
    font-size: 18px;
    &:hover { background: var(--p-color-bg-surface-hover); border-radius: var(--p-border-radius-100); }
  }

  &__list {
    flex: 1;
    overflow-y: auto;
    padding: var(--p-space-200);
  }

  &__item {
    @include polaris-checkbox-wrapper;
    padding: var(--p-space-200) var(--p-space-300);
    border-radius: var(--p-border-radius-100);
    font-size: var(--p-font-size-350);

    &:hover { background: var(--p-color-bg-surface-hover); }

    input[type="checkbox"] { @include polaris-checkbox; }
  }

  &__empty {
    @include polaris-text-body-subdued;
    text-align: center;
    padding: var(--p-space-400);
  }

  &__footer {
    padding: var(--p-space-300);
    border-top: 1px solid var(--p-color-border);
    display: flex;
    justify-content: flex-end;
  }
}
</style>
