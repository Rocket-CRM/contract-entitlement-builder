<template>
  <div class="polaris-card">
    <div class="polaris-card__section">
      <!-- Header -->
      <div class="polaris-inline polaris-inline--space-between">
        <span class="polaris-text polaris-text--heading-sm">Condition Builder</span>
        <div class="polaris-button-group polaris-button-group--segmented polaris-button-group--small">
          <button
            class="polaris-button polaris-button--segmented"
            :class="{ 'polaris-button--segmented-selected': config?.match === 'all' }"
            @click="emitUpdate({ ...config, match: 'all' })"
          >All (AND)</button>
          <button
            class="polaris-button polaris-button--segmented"
            :class="{ 'polaris-button--segmented-selected': config?.match === 'any' }"
            @click="emitUpdate({ ...config, match: 'any' })"
          >Any (OR)</button>
        </div>
      </div>

      <!-- Groups -->
      <div class="polaris-condition-list" v-if="config?.groups?.length">
        <div
          v-for="(group, gIdx) in config.groups"
          :key="group?.id || gIdx"
          class="polaris-card polaris-card--subdued"
        >
          <div class="polaris-card__section">
            <!-- Group header -->
            <div class="polaris-inline polaris-inline--space-between">
              <span class="polaris-text polaris-text--body-md">Group {{ gIdx + 1 }}</span>
              <div class="polaris-inline polaris-inline--gap-tight">
                <button
                  class="polaris-button polaris-button--plain"
                  :class="{ 'polaris-button--segmented-selected': group?.operator === 'AND' }"
                  @click="updateGroupOperator(group.id, 'AND')"
                >AND</button>
                <button
                  class="polaris-button polaris-button--plain"
                  :class="{ 'polaris-button--segmented-selected': group?.operator === 'OR' }"
                  @click="updateGroupOperator(group.id, 'OR')"
                >OR</button>
                <button
                  class="polaris-button polaris-button--plain polaris-button--critical polaris-button--icon-only"
                  @click="removeGroup(group.id)"
                > ✕ </button>
              </div>
            </div>

            <!-- Collection select -->
            <div class="polaris-text-field">
              <label class="polaris-text-field__label">Collection</label>
              <select
                class="polaris-select__input"
                :value="group?.collection || ''"
                @change="updateGroupCollection(group.id, $event.target.value)"
              >
                <option value="" disabled>Select collection...</option>
                <option v-for="col in safeCollections" :key="col?.name" :value="col?.name">{{ col?.label || col?.name }}</option>
              </select>
            </div>

            <!-- Mode toggle (only if collection supports aggregate) -->
            <div v-if="collectionSupportsAggregate(group?.collection)" class="condition-mode-toggle">
              <button
                class="polaris-button polaris-button--segmented"
                :class="{ 'polaris-button--segmented-selected': getGroupType(group) === 'simple' }"
                @click="updateGroupType(group.id, 'simple')"
              >Check single record</button>
              <button
                class="polaris-button polaris-button--segmented"
                :class="{ 'polaris-button--segmented-selected': getGroupType(group) === 'aggregate' }"
                @click="updateGroupType(group.id, 'aggregate')"
              >Check aggregate</button>
            </div>

            <!-- ═══ SIMPLE MODE ═══ -->
            <template v-if="getGroupType(group) === 'simple'">
              <div class="polaris-condition-list">
                <template v-for="(condition, cIdx) in (group?.conditions || [])" :key="condition?.id || cIdx">
                  <div class="polaris-condition-item">
                    <div v-if="cIdx > 0" class="polaris-condition-operator">
                      <span class="polaris-text polaris-text--body-md">{{ group?.operator || 'AND' }}</span>
                    </div>

                    <div class="polaris-condition-fields">
                      <div class="polaris-text-field polaris-text-field--flex">
                        <label class="polaris-text-field__label">Field</label>
                        <select
                          class="polaris-select__input"
                          :value="condition?.field || ''"
                          @change="updateConditionField(group.id, condition.id, $event.target.value)"
                        >
                          <option value="" disabled>Select field...</option>
                          <option v-for="f in getFieldsForCollection(group?.collection)" :key="f?.name" :value="f?.name">{{ f?.label || f?.name }}</option>
                        </select>
                      </div>

                      <div class="polaris-text-field polaris-text-field--operator">
                        <label class="polaris-text-field__label">Operator</label>
                        <select
                          class="polaris-select__input"
                          :value="condition?.operator || 'equals'"
                          @change="updateConditionOperator(group.id, condition.id, $event.target.value)"
                        >
                          <option v-for="op in getOperatorsForField(group?.collection, condition?.field)" :key="op?.value" :value="op?.value">{{ op?.label }}</option>
                        </select>
                      </div>

                      <div class="polaris-text-field polaris-text-field--flex" v-if="isValueRequired(condition?.operator)">
                        <label class="polaris-text-field__label">Value</label>
                        <input
                          class="polaris-text-field__input"
                          :value="condition?.value || ''"
                          @input="updateConditionValue(group.id, condition.id, $event.target.value)"
                        />
                      </div>

                      <button
                        class="polaris-button polaris-button--plain polaris-button--critical polaris-button--icon-only"
                        @click="removeCondition(group.id, condition.id)"
                      > ✕ </button>
                    </div>
                  </div>
                </template>
              </div>

              <button class="polaris-button polaris-button--plain polaris-button--full-width" @click="addCondition(group.id)">
                + Add Condition
              </button>
            </template>

            <!-- ═══ AGGREGATE MODE ═══ -->
            <template v-if="getGroupType(group) === 'aggregate'">
              <!-- Function + Field -->
              <div class="polaris-condition-fields">
                <div class="polaris-text-field polaris-text-field--flex">
                  <label class="polaris-text-field__label">Function</label>
                  <select
                    class="polaris-select__input"
                    :value="group?.aggregate || 'sum'"
                    @change="updateGroupField(group.id, 'aggregate', $event.target.value)"
                  >
                    <option v-for="fn in AGGREGATE_FUNCTIONS" :key="fn.value" :value="fn.value">{{ fn.label }}</option>
                  </select>
                </div>
                <div class="polaris-text-field polaris-text-field--flex">
                  <label class="polaris-text-field__label">Field</label>
                  <select
                    class="polaris-select__input"
                    :value="group?.field || ''"
                    @change="updateGroupField(group.id, 'field', $event.target.value)"
                  >
                    <option value="" disabled>Select field...</option>
                    <option
                      v-for="f in getAggregateFields(group?.collection)"
                      :key="f?.name"
                      :value="f?.name"
                    >{{ f?.label || f?.name }}</option>
                  </select>
                </div>
              </div>

              <!-- Filters -->
              <div class="aggregate-section">
                <label class="polaris-text-field__label">Filters (optional)</label>
                <div class="polaris-condition-list" v-if="group?.filters?.length">
                  <div
                    v-for="(filter, fIdx) in group.filters"
                    :key="filter?.id || fIdx"
                    class="polaris-condition-fields"
                  >
                    <div class="polaris-text-field polaris-text-field--flex">
                      <select
                        class="polaris-select__input"
                        :value="filter?.field || ''"
                        @change="updateAggFilter(group.id, filter.id, 'field', $event.target.value)"
                      >
                        <option value="" disabled>Field...</option>
                        <option v-for="f in getFieldsForCollection(group?.collection)" :key="f?.name" :value="f?.name">{{ f?.label || f?.name }}</option>
                      </select>
                    </div>
                    <div class="polaris-text-field polaris-text-field--operator">
                      <select
                        class="polaris-select__input"
                        :value="filter?.operator || 'equals'"
                        @change="updateAggFilter(group.id, filter.id, 'operator', $event.target.value)"
                      >
                        <option v-for="op in getOperatorsForField(group?.collection, filter?.field)" :key="op?.value" :value="op?.value">{{ op?.label }}</option>
                      </select>
                    </div>
                    <div class="polaris-text-field polaris-text-field--flex" v-if="isValueRequired(filter?.operator)">
                      <input
                        class="polaris-text-field__input"
                        :value="filter?.value || ''"
                        @input="updateAggFilter(group.id, filter.id, 'value', $event.target.value)"
                      />
                    </div>
                    <button
                      class="polaris-button polaris-button--plain polaris-button--critical polaris-button--icon-only"
                      @click="removeAggFilter(group.id, filter.id)"
                    > ✕ </button>
                  </div>
                </div>
                <button class="polaris-button polaris-button--plain" @click="addAggFilter(group.id)">+ Add Filter</button>
              </div>

              <!-- Time range -->
              <div class="polaris-text-field">
                <label class="polaris-text-field__label">Time range</label>
                <select
                  class="polaris-select__input"
                  :value="group?.time_range || ''"
                  @change="updateGroupField(group.id, 'time_range', $event.target.value || null)"
                >
                  <option v-for="tr in TIME_RANGES" :key="tr.value" :value="tr.value || ''">{{ tr.label }}</option>
                </select>
              </div>

              <!-- Threshold -->
              <div class="polaris-condition-fields">
                <div class="polaris-text-field polaris-text-field--operator">
                  <label class="polaris-text-field__label">Threshold</label>
                  <select
                    class="polaris-select__input"
                    :value="group?.operator || 'gte'"
                    @change="updateGroupField(group.id, 'operator', $event.target.value)"
                  >
                    <option v-for="op in THRESHOLD_OPERATORS" :key="op.value" :value="op.value">{{ op.label }}</option>
                  </select>
                </div>
                <div class="polaris-text-field polaris-text-field--flex">
                  <label class="polaris-text-field__label">Value</label>
                  <input
                    class="polaris-text-field__input"
                    type="number"
                    :value="group?.value || ''"
                    @input="updateGroupField(group.id, 'value', parseFloat($event.target.value) || 0)"
                  />
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="polaris-text polaris-text--body-md" style="text-align: center; padding: 12px 0; color: var(--p-color-text-secondary);">
        No condition groups yet
      </div>

      <button class="polaris-button polaris-button--outline polaris-button--full-width" @click="addGroup">
        + Add Group
      </button>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

const OPERATORS_BY_TYPE = {
  string: [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'not equals' },
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'not contains' },
    { value: 'starts_with', label: 'starts with' },
    { value: 'ends_with', label: 'ends with' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  number: [
    { value: 'equals', label: '=' },
    { value: 'not_equals', label: '≠' },
    { value: 'greater_than', label: '>' },
    { value: 'greater_than_or_equals', label: '≥' },
    { value: 'less_than', label: '<' },
    { value: 'less_than_or_equals', label: '≤' },
    { value: 'between', label: 'between' },
  ],
  boolean: [
    { value: 'is_true', label: 'is true' },
    { value: 'is_false', label: 'is false' },
  ],
  date: [
    { value: 'equals', label: 'equals' },
    { value: 'before', label: 'before' },
    { value: 'after', label: 'after' },
    { value: 'between', label: 'between' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  array: [
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
};

const AGGREGATE_FUNCTIONS = [
  { value: 'sum', label: 'Sum' },
  { value: 'count', label: 'Count' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
];

const TIME_RANGES = [
  { value: '1 month', label: 'Past 1 month' },
  { value: '3 months', label: 'Past 3 months' },
  { value: '6 months', label: 'Past 6 months' },
  { value: '12 months', label: 'Past 12 months' },
  { value: '24 months', label: 'Past 24 months' },
  { value: '', label: 'All time' },
];

const THRESHOLD_OPERATORS = [
  { value: 'gte', label: '>=' },
  { value: 'gt', label: '>' },
  { value: 'eq', label: '=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
];

export default {
  name: 'ConditionConfig',
  props: {
    config: { type: Object, required: true },
    collections: { type: Array, default: () => [] },
  },
  emits: ['update'],
  setup(props, { emit }) {
    const safeCollections = computed(() => {
      return Array.isArray(props.collections) ? props.collections : [];
    });

    const emitUpdate = (newConfig) => {
      emit('update', newConfig);
    };

    const getCollectionMeta = (collectionName) => {
      return safeCollections.value.find(c => c?.name === collectionName) || null;
    };

    const collectionSupportsAggregate = (collectionName) => {
      return getCollectionMeta(collectionName)?.supports_aggregate === true;
    };

    const getGroupType = (group) => {
      return group?.type || 'simple';
    };

    const getFieldsForCollection = (collectionName) => {
      return getCollectionMeta(collectionName)?.fields || [];
    };

    const getAggregateFields = (collectionName) => {
      return getCollectionMeta(collectionName)?.aggregate_fields || [];
    };

    const getFieldType = (collectionName, fieldName) => {
      const fields = getFieldsForCollection(collectionName);
      const field = fields.find(f => f?.name === fieldName);
      return field?.type || 'string';
    };

    const getOperatorsForField = (collectionName, fieldName) => {
      const fieldType = getFieldType(collectionName, fieldName);
      return OPERATORS_BY_TYPE[fieldType] || OPERATORS_BY_TYPE.string;
    };

    const isValueRequired = (operator) => {
      return !['is_empty', 'is_not_empty', 'is_true', 'is_false'].includes(operator);
    };

    // ─── Group CRUD ──────────────────────────────────────────────

    const addGroup = () => {
      const groups = [...(props.config?.groups || [])];
      groups.push({
        id: `group-${Date.now()}`,
        type: 'simple',
        collection: '',
        operator: 'AND',
        conditions: [{
          id: `cond-${Date.now()}`,
          field: '',
          operator: 'equals',
          value: '',
        }],
      });
      emitUpdate({ ...props.config, groups });
    };

    const removeGroup = (groupId) => {
      const groups = (props.config?.groups || []).filter(g => g?.id !== groupId);
      emitUpdate({ ...props.config, groups });
    };

    const updateGroupCollection = (groupId, collection) => {
      const meta = getCollectionMeta(collection);
      const groups = (props.config?.groups || []).map(g => {
        if (g?.id !== groupId) return g;

        const base = { ...g, collection, type: 'simple' };
        if (meta?.supports_aggregate && g?.type === 'aggregate') {
          const joinMeta = meta?.joinable_to || {};
          return {
            ...base,
            type: 'aggregate',
            aggregate: 'sum',
            field: '',
            join: joinMeta.table ? { table: joinMeta.table, on: joinMeta.on } : undefined,
            time_field: joinMeta.time_field || 'created_at',
            time_range: '12 months',
            filters: [],
            operator: 'gte',
            value: 0,
          };
        }
        return {
          ...base,
          conditions: [{
            id: `cond-${Date.now()}`,
            field: '',
            operator: 'equals',
            value: '',
          }],
        };
      });
      emitUpdate({ ...props.config, groups });
    };

    const updateGroupType = (groupId, type) => {
      const groups = (props.config?.groups || []).map(g => {
        if (g?.id !== groupId) return g;
        if (getGroupType(g) === type) return g;

        const collection = g?.collection || '';
        const meta = getCollectionMeta(collection);
        const joinMeta = meta?.joinable_to || {};

        if (type === 'aggregate') {
          return {
            id: g.id,
            type: 'aggregate',
            collection,
            aggregate: 'sum',
            field: '',
            join: joinMeta.table ? { table: joinMeta.table, on: joinMeta.on } : undefined,
            time_field: joinMeta.time_field || 'created_at',
            time_range: '12 months',
            filters: [],
            operator: 'gte',
            value: 0,
          };
        }
        return {
          id: g.id,
          type: 'simple',
          collection,
          operator: 'AND',
          conditions: [{
            id: `cond-${Date.now()}`,
            field: '',
            operator: 'equals',
            value: '',
          }],
        };
      });
      emitUpdate({ ...props.config, groups });
    };

    const updateGroupOperator = (groupId, operator) => {
      const groups = (props.config?.groups || []).map(g => {
        if (g?.id === groupId) return { ...g, operator };
        return g;
      });
      emitUpdate({ ...props.config, groups });
    };

    const updateGroupField = (groupId, field, value) => {
      const groups = (props.config?.groups || []).map(g => {
        if (g?.id === groupId) return { ...g, [field]: value };
        return g;
      });
      emitUpdate({ ...props.config, groups });
    };

    // ─── Simple condition CRUD ───────────────────────────────────

    const addCondition = (groupId) => {
      const groups = (props.config?.groups || []).map(g => {
        if (g?.id === groupId) {
          return {
            ...g,
            conditions: [
              ...(g?.conditions || []),
              { id: `cond-${Date.now()}`, field: '', operator: 'equals', value: '' },
            ],
          };
        }
        return g;
      });
      emitUpdate({ ...props.config, groups });
    };

    const removeCondition = (groupId, conditionId) => {
      const groups = (props.config?.groups || []).map(g => {
        if (g?.id === groupId) {
          return { ...g, conditions: (g?.conditions || []).filter(c => c?.id !== conditionId) };
        }
        return g;
      });
      emitUpdate({ ...props.config, groups });
    };

    const updateConditionField = (groupId, conditionId, field) => {
      const groups = (props.config?.groups || []).map(g => {
        if (g?.id === groupId) {
          return {
            ...g,
            conditions: (g?.conditions || []).map(c => {
              if (c?.id === conditionId) return { ...c, field, operator: 'equals', value: '' };
              return c;
            }),
          };
        }
        return g;
      });
      emitUpdate({ ...props.config, groups });
    };

    const updateConditionOperator = (groupId, conditionId, operator) => {
      const groups = (props.config?.groups || []).map(g => {
        if (g?.id === groupId) {
          return {
            ...g,
            conditions: (g?.conditions || []).map(c => {
              if (c?.id === conditionId) return { ...c, operator };
              return c;
            }),
          };
        }
        return g;
      });
      emitUpdate({ ...props.config, groups });
    };

    const updateConditionValue = (groupId, conditionId, value) => {
      const groups = (props.config?.groups || []).map(g => {
        if (g?.id === groupId) {
          return {
            ...g,
            conditions: (g?.conditions || []).map(c => {
              if (c?.id === conditionId) return { ...c, value };
              return c;
            }),
          };
        }
        return g;
      });
      emitUpdate({ ...props.config, groups });
    };

    // ─── Aggregate filter CRUD ───────────────────────────────────

    const addAggFilter = (groupId) => {
      const groups = (props.config?.groups || []).map(g => {
        if (g?.id === groupId) {
          return {
            ...g,
            filters: [
              ...(g?.filters || []),
              { id: `flt-${Date.now()}`, field: '', operator: 'equals', value: '' },
            ],
          };
        }
        return g;
      });
      emitUpdate({ ...props.config, groups });
    };

    const removeAggFilter = (groupId, filterId) => {
      const groups = (props.config?.groups || []).map(g => {
        if (g?.id === groupId) {
          return { ...g, filters: (g?.filters || []).filter(f => f?.id !== filterId) };
        }
        return g;
      });
      emitUpdate({ ...props.config, groups });
    };

    const updateAggFilter = (groupId, filterId, field, value) => {
      const groups = (props.config?.groups || []).map(g => {
        if (g?.id === groupId) {
          return {
            ...g,
            filters: (g?.filters || []).map(f => {
              if (f?.id !== filterId) return f;
              if (field === 'field') return { ...f, field: value, operator: 'equals', value: '' };
              return { ...f, [field]: value };
            }),
          };
        }
        return g;
      });
      emitUpdate({ ...props.config, groups });
    };

    return {
      safeCollections,
      AGGREGATE_FUNCTIONS,
      TIME_RANGES,
      THRESHOLD_OPERATORS,
      emitUpdate,
      getGroupType,
      collectionSupportsAggregate,
      getFieldsForCollection,
      getAggregateFields,
      getOperatorsForField,
      isValueRequired,
      addGroup,
      removeGroup,
      updateGroupCollection,
      updateGroupType,
      updateGroupOperator,
      updateGroupField,
      addCondition,
      removeCondition,
      updateConditionField,
      updateConditionOperator,
      updateConditionValue,
      addAggFilter,
      removeAggFilter,
      updateAggFilter,
    };
  },
};
</script>

<style lang="scss" scoped>
@import 'polaris-weweb-styles';

.polaris-card {
  @include polaris-tokens;
  @include polaris-card;
  &--subdued {
    background: var(--p-color-bg-surface-secondary);
    box-shadow: none;
    border: 1px solid var(--p-color-border);
  }
  &__section { @include polaris-card-section; }
}

.polaris-inline {
  @include polaris-inline;
  &--space-between { justify-content: space-between; }
  &--gap-tight { gap: var(--p-space-200); }
}

.polaris-text {
  &--body-md { @include polaris-text-body; }
  &--heading-sm { @include polaris-text-heading-sm; }
}

.polaris-button {
  @include polaris-button-base;
  &--plain { @include polaris-button-plain; }
  &--critical { color: var(--p-color-text-critical); }
  &--outline { @include polaris-button-outline; }
  &--icon-only { @include polaris-button-icon-only; }
  &--full-width { @include polaris-button-full-width; }
  &--slim { @include polaris-button-slim; }
  &--segmented {
    border-radius: 0;
    background: var(--p-color-bg-surface);
    color: var(--p-color-text);
    box-shadow: inset 0 0 0 1px var(--p-color-border);
    &:first-child { border-radius: var(--p-border-radius-200) 0 0 var(--p-border-radius-200); }
    &:last-child { border-radius: 0 var(--p-border-radius-200) var(--p-border-radius-200) 0; }
  }
  &--segmented-selected {
    background: var(--p-color-bg-surface-selected);
    color: var(--p-color-text-brand);
    box-shadow: inset 0 0 0 2px var(--p-color-border-brand);
  }
}

.polaris-button-group {
  @include polaris-button-group;
  &--segmented { @include polaris-button-group-segmented; }
  &--small .polaris-button { @include polaris-button-slim; }
}

.polaris-text-field {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-100);
  &--flex { flex: 1; }
  &--operator { width: 120px; flex-shrink: 0; }
}

.polaris-text-field__label { @include polaris-label; }
.polaris-text-field__input { @include polaris-input; }
.polaris-select__input { @include polaris-select; }

.polaris-condition-list {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-200);
  margin-top: var(--p-space-300);
}

.polaris-condition-item {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-200);
}

.polaris-condition-operator {
  display: flex;
  justify-content: center;
  padding: var(--p-space-100) 0;
}

.polaris-condition-fields {
  display: flex;
  gap: var(--p-space-200);
  align-items: flex-end;
}

.condition-mode-toggle {
  display: flex;
  margin-top: var(--p-space-300);

  .polaris-button--segmented {
    flex: 1;
    justify-content: center;
    font-size: var(--p-font-size-275);
  }
}

.aggregate-section {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-200);
  margin-top: var(--p-space-300);

  .polaris-condition-list {
    margin-top: var(--p-space-100);
  }
}

.polaris-card + .polaris-card { margin-top: var(--p-space-300); }
.polaris-card--subdued + .polaris-card--subdued { margin-top: var(--p-space-300); }
.polaris-text-field + .polaris-text-field { margin-top: var(--p-space-300); }
</style>
