<template>
  <div class="level-card" :class="{ 'level-card--expanded': isExpanded }">
    <div class="level-card__header" @click="isExpanded = !isExpanded">
      <button class="level-card__expand-btn" :class="{ 'level-card__expand-btn--open': isExpanded }">
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
          <path d="M8 6l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <div class="level-card__title-area">
        <template v-if="isEditingName">
          <input
            ref="nameInputRef"
            class="level-card__name-input"
            :value="level?.persona_name || ''"
            @input="$emit('update-level', { ...level, persona_name: $event.target.value })"
            @blur="isEditingName = false"
            @keydown.enter="isEditingName = false"
            @click.stop
          />
        </template>
        <template v-else>
          <span class="level-card__name" @click.stop="startEditName">
            {{ level?.persona_name || 'Untitled Level' }}
          </span>
        </template>
        <span v-if="typeof level?.member_count === 'number'" class="level-card__member-count">
          {{ level.member_count }} member{{ level.member_count !== 1 ? 's' : '' }}
        </span>
      </div>

      <div class="level-card__right" @click.stop>
        <label class="toggle-switch">
          <input type="checkbox" :checked="level?.active_status !== false"
            @change="$emit('update-level', { ...level, active_status: $event.target.checked })" />
          <span class="toggle-switch__slider"></span>
        </label>
        <button class="level-card__remove-btn" @click="$emit('remove-level')" title="Remove level">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-if="isExpanded" class="level-card__body">
      <div class="level-card__entitlements">
        <div v-if="!entitlements?.length && editingEntIdx === -1" class="level-card__empty">
          No entitlements configured. Add packages, rewards, or benefits.
        </div>

        <EntitlementRow
          v-for="(ent, idx) in entitlements"
          :key="ent.id || ent._tempId || idx"
          :entitlement="ent"
          :is-editing="editingEntIdx === idx"
          :form-data="editingEntIdx === idx ? editFormData : {}"
          :packages="packages"
          :rewards="rewards"
          @edit="startEditEntitlement(idx)"
          @remove="$emit('remove-entitlement', idx)"
          @cancel-edit="cancelEditEntitlement"
          @save-edit="saveEntitlement"
          @update-field="handleFieldUpdate"
        />

        <div v-if="editingEntIdx === -2" class="level-card__new-ent">
          <EntitlementRow
            :entitlement="{}"
            :is-editing="true"
            :form-data="editFormData"
            :packages="packages"
            :rewards="rewards"
            @cancel-edit="cancelEditEntitlement"
            @save-edit="saveNewEntitlement"
            @update-field="handleFieldUpdate"
          />
        </div>
      </div>

      <button v-if="editingEntIdx === -1" class="level-card__add-btn" @click="startAddEntitlement">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Add entitlement
      </button>
    </div>
  </div>
</template>

<script>
import { ref, nextTick } from 'vue';
import EntitlementRow from './EntitlementRow.vue';

export default {
  components: { EntitlementRow },
  props: {
    level: { type: Object, default: () => ({}) },
    entitlements: { type: Array, default: () => [] },
    packages: { type: Array, default: () => [] },
    rewards: { type: Array, default: () => [] },
  },
  emits: ['update-level', 'remove-level', 'update-entitlement', 'remove-entitlement', 'add-entitlement'],
  setup(props, { emit }) {
    const isExpanded = ref(true);
    const isEditingName = ref(false);
    const nameInputRef = ref(null);
    const editingEntIdx = ref(-1);
    const editFormData = ref({});

    const startEditName = () => {
      isEditingName.value = true;
      nextTick(() => nameInputRef.value?.focus());
    };

    const startEditEntitlement = (idx) => {
      editingEntIdx.value = idx;
      editFormData.value = { ...props.entitlements[idx] };
    };

    const startAddEntitlement = () => {
      editingEntIdx.value = -2;
      editFormData.value = {
        entitlement_type: 'benefit',
        package_id: null,
        reward_id: null,
        qty: null,
        category: '',
        benefit_type: '',
        value: null,
        active_status: true,
        ranking: props.entitlements?.length || 0,
      };
    };

    const cancelEditEntitlement = () => {
      editingEntIdx.value = -1;
      editFormData.value = {};
    };

    const saveEntitlement = (data) => {
      emit('update-entitlement', { index: editingEntIdx.value, data });
      editingEntIdx.value = -1;
      editFormData.value = {};
    };

    const saveNewEntitlement = (data) => {
      emit('add-entitlement', data);
      editingEntIdx.value = -1;
      editFormData.value = {};
    };

    const handleFieldUpdate = ({ field, value }) => {
      const updated = { ...editFormData.value, [field]: value };
      if (field === 'entitlement_type') {
        if (value === 'package') {
          updated.reward_id = null;
          updated.qty = null;
          updated.category = null;
          updated.benefit_type = null;
          updated.value = null;
        } else if (value === 'reward') {
          updated.package_id = null;
          updated.category = null;
          updated.benefit_type = null;
          updated.value = null;
          updated.qty = updated.qty || 1;
        } else {
          updated.package_id = null;
          updated.reward_id = null;
          updated.qty = null;
        }
      }
      editFormData.value = updated;
    };

    return {
      isExpanded,
      isEditingName,
      nameInputRef,
      editingEntIdx,
      editFormData,
      startEditName,
      startEditEntitlement,
      startAddEntitlement,
      cancelEditEntitlement,
      saveEntitlement,
      saveNewEntitlement,
      handleFieldUpdate,
    };
  },
};
</script>

<style scoped lang="scss">
@import 'polaris-weweb-styles';

.level-card {
  background: var(--p-color-bg-surface);
  border: 1px solid var(--p-color-border);
  border-radius: var(--p-border-radius-300);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: var(--p-space-300);
    padding: var(--p-space-300) var(--p-space-400);
    cursor: pointer;
    transition: background 0.15s;

    &:hover { background: var(--p-color-bg-surface-hover); }
  }

  &__expand-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: var(--p-color-icon);
    cursor: pointer;
    flex-shrink: 0;
    border-radius: var(--p-border-radius-100);
    transition: transform 0.2s;

    &--open { transform: rotate(90deg); }
  }

  &__title-area {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--p-space-200);
  }

  &__name {
    font-size: var(--p-font-size-350);
    font-weight: var(--p-font-weight-semibold);
    color: var(--p-color-text);
    cursor: text;

    &:hover { text-decoration: underline; text-decoration-style: dashed; }
  }

  &__name-input {
    @include polaris-input;
    font-size: var(--p-font-size-350);
    font-weight: var(--p-font-weight-semibold);
    height: 32px;
    max-width: 250px;
  }

  &__member-count {
    font-size: var(--p-font-size-275);
    color: var(--p-color-text-secondary);
    flex-shrink: 0;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: var(--p-space-200);
    flex-shrink: 0;
  }

  &__remove-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    border-radius: var(--p-border-radius-100);
    color: var(--p-color-icon);
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s, background 0.1s;

    &:hover { background: var(--p-color-bg-fill-transparent-hover); color: var(--p-color-text-critical); }
  }
  &__header:hover &__remove-btn { opacity: 1; }

  &__body {
    border-top: 1px solid var(--p-color-border);
    padding: var(--p-space-400);
    background: var(--p-color-bg-surface-secondary);
    display: flex;
    flex-direction: column;
    gap: var(--p-space-200);
  }

  &__entitlements {
    display: flex;
    flex-direction: column;
    gap: var(--p-space-150);
  }

  &__empty {
    font-size: var(--p-font-size-300);
    color: var(--p-color-text-secondary);
    text-align: center;
    padding: var(--p-space-400) var(--p-space-200);
    border: 2px dashed var(--p-color-border);
    border-radius: var(--p-border-radius-200);
  }

  &__add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--p-space-150);
    padding: var(--p-space-200);
    background: none;
    border: 2px dashed var(--p-color-border);
    border-radius: var(--p-border-radius-200);
    font-family: var(--p-font-family-sans);
    font-size: var(--p-font-size-300);
    font-weight: var(--p-font-weight-medium);
    color: var(--p-color-text-secondary);
    cursor: pointer;
    transition: all 0.15s;
    width: 100%;

    &:hover {
      border-color: var(--p-color-border-focus);
      color: var(--p-color-text);
      background: var(--p-color-bg-surface);
    }
  }
}

.toggle-switch {
  @include polaris-toggle-switch;

  &__slider { @include polaris-toggle-switch-track; }

  input:checked + &__slider { @include polaris-toggle-switch-track-checked; }
}
</style>
