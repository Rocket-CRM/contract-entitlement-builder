<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal__header">
        <h3 class="modal__title">{{ title }}</h3>
        <button class="modal__close" @click="$emit('close')">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <div class="modal__body">
        <div class="modal__field">
          <label class="modal__label">Group name</label>
          <input class="modal__input" v-model="form.name" :placeholder="namePlaceholder" />
        </div>

        <template v-if="type === 'factor'">
          <div class="modal__field">
            <label class="modal__label">Stackable</label>
            <label class="modal__switch-wrapper">
              <input type="checkbox" class="modal__switch" v-model="form.stackable" />
              <span class="modal__switch-label">{{ form.stackable ? 'Yes — multipliers stack' : 'No — best multiplier wins' }}</span>
            </label>
          </div>

          <div class="modal__field-row">
            <div class="modal__field modal__field--half">
              <label class="modal__label">Window start</label>
              <input class="modal__date-input" type="date" v-model="form.window_start" />
            </div>
            <div class="modal__field modal__field--half">
              <label class="modal__label">Window end</label>
              <input class="modal__date-input" type="date" v-model="form.window_end" />
            </div>
          </div>
        </template>

        <div v-if="isEdit" class="modal__delete-section">
          <button class="modal__delete-link" @click="showDeleteConfirm = true">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M6 6h8v10H6V6zM4 6h12M8 4h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Delete earn factor group
          </button>
        </div>
      </div>

      <div class="modal__footer">
        <button class="modal__btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="modal__btn-primary" @click="handleSave" :disabled="saving || !form.name?.trim()">
          {{ saving ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save' : 'Create') }}
        </button>
      </div>
    </div>

    <div v-if="showDeleteConfirm" class="modal__confirm-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal__confirm-modal">
        <h4 class="modal__confirm-title">Delete earn factor group?</h4>
        <p class="modal__confirm-desc">This will delete the group and all its factors. This action cannot be undone.</p>
        <div class="modal__confirm-actions">
          <button class="modal__btn-secondary" @click="showDeleteConfirm = false">Cancel</button>
          <button class="modal__btn-danger" @click="handleDelete" :disabled="deleting">{{ deleting ? 'Deleting...' : 'Delete' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';

export default {
  props: {
    type: { type: String, default: 'factor' },
    group: { type: Object, default: null },
  },
  emits: ['close', 'save', 'delete'],
  setup(props, { emit }) {
    const saving = ref(false);
    const deleting = ref(false);
    const showDeleteConfirm = ref(false);
    const isEdit = computed(() => !!props.group?.id);

    const title = computed(() => {
      if (isEdit.value) return 'Edit Earn Factor Group';
      return props.type === 'factor' ? 'Create Earn Factor Group' : 'Create Earn Condition Group';
    });

    const namePlaceholder = computed(() =>
      props.type === 'factor' ? 'e.g. Standard Earning Rule' : 'e.g. Tier Perks'
    );

    const form = ref({
      name: '',
      stackable: true,
      window_start: '',
      window_end: '',
    });

    function toDateStr(val) { if (!val) return ''; try { return new Date(val).toISOString().split('T')[0]; } catch { return ''; } }

    watch(() => props.group, (g) => {
      if (g?.id) {
        form.value = {
          name: g.name || '',
          stackable: g.stackable !== false,
          window_start: toDateStr(g.window_start),
          window_end: toDateStr(g.window_end),
        };
      } else {
        form.value = { name: '', stackable: true, window_start: '', window_end: '' };
      }
      showDeleteConfirm.value = false;
    }, { immediate: true });

    async function handleSave() {
      if (!form.value.name?.trim()) return;
      saving.value = true;
      try {
        const payload = { name: form.value.name.trim() };
        if (isEdit.value) payload.id = props.group.id;
        if (props.type === 'factor') {
          payload.stackable = form.value.stackable;
          payload.window_start = form.value.window_start || null;
          payload.window_end = form.value.window_end || null;
          if (payload.window_start) payload.window_start = new Date(payload.window_start).toISOString();
          if (payload.window_end) payload.window_end = new Date(payload.window_end).toISOString();
        }
        emit('save', payload);
      } finally {
        saving.value = false;
      }
    }

    async function handleDelete() {
      deleting.value = true;
      try {
        emit('delete', { groupId: props.group?.id });
      } finally {
        deleting.value = false;
        showDeleteConfirm.value = false;
      }
    }

    return { form, title, namePlaceholder, saving, deleting, isEdit, showDeleteConfirm, handleSave, handleDelete };
  },
};
</script>

<style scoped lang="scss">
@import 'polaris-weweb-styles';

.modal-backdrop {
  @include polaris-modal-backdrop;
}

.modal {
  @include polaris-modal;
  max-width: 480px;

  &__header { @include polaris-modal-header; }
  &__title { @include polaris-text-heading-sm; margin: 0; }
  &__close {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    background: transparent; border: none; border-radius: var(--p-border-radius-100);
    color: var(--p-color-icon); cursor: pointer;
    &:hover { background: var(--p-color-bg-surface-hover); }
  }
  &__body { @include polaris-modal-content; }
  &__field {
    margin-bottom: var(--p-space-400);
    &--half { flex: 1; min-width: 0; }
  }
  &__field-row { display: flex; gap: var(--p-space-300); margin-bottom: var(--p-space-400); }
  &__label { @include polaris-label; display: block; margin-bottom: var(--p-space-100); }
  &__input { @include polaris-input; }
  &__date-input { @include polaris-date-field; }
  &__switch-wrapper { @include polaris-switch-wrapper; }
  &__switch { @include polaris-switch; }
  &__switch-label { @include polaris-text-body; }
  &__footer { @include polaris-modal-footer; }
  &__btn-primary { @include polaris-button-primary; }
  &__btn-secondary { @include polaris-button-default; }
  &__delete-link { @include polaris-link-destructive; }
  &__btn-danger {
    @include polaris-button-critical;
    font-size: var(--p-font-size-350);
    gap: 6px;
  }

  &__delete-section {
    margin-top: var(--p-space-200);
    padding-top: var(--p-space-400);
    border-top: 1px solid var(--p-color-border);
  }

  &__confirm-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__confirm-modal {
    background: var(--p-color-bg-surface);
    border-radius: var(--p-border-radius-300);
    box-shadow: var(--p-shadow-popover);
    padding: var(--p-space-500);
    max-width: 340px;
    width: 90%;
  }

  &__confirm-title {
    @include polaris-text-heading-sm;
    margin: 0 0 var(--p-space-200);
  }

  &__confirm-desc {
    @include polaris-text-body;
    color: var(--p-color-text-secondary);
    margin: 0 0 var(--p-space-400);
  }

  &__confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--p-space-200);
  }
}
</style>
