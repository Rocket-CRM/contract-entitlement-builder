<template>
  <div class="sidebar" :style="{ width: panelWidth }">
    <div class="sidebar__head">
      <h3 class="sidebar__title">{{ isNew ? 'Add earn factor' : 'Edit earn factor' }}</h3>
      <button class="sidebar__x" @click="$emit('close')">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>

    <div class="sidebar__body">
      <div class="sidebar__field">
        <label class="sidebar__label">Earning rule name</label>
        <input class="sidebar__input" v-model="form.name" placeholder="Enter name..." />
      </div>

      <div class="sidebar__field">
        <label class="sidebar__label">Earn factor type</label>
        <div class="sidebar__radios">
          <label class="sidebar__radio"><input type="radio" v-model="form.earn_factor_type" value="rate" /><span>Base rate</span></label>
          <label class="sidebar__radio"><input type="radio" v-model="form.earn_factor_type" value="multiplier" /><span>Multiplier</span></label>
        </div>
      </div>

      <div class="sidebar__field">
        <label class="sidebar__label">Amount</label>
        <input class="sidebar__input" type="number" v-model.number="form.earn_factor_amount" placeholder="e.g. 100 or 3" step="any" min="0" />
      </div>

      <div class="sidebar__row">
        <div class="sidebar__col">
          <label class="sidebar__label">Target currency</label>
          <select class="sidebar__select" v-model="form.target_currency">
            <option value="points">Points</option>
            <option value="ticket">Tickets</option>
            <option value="store_credit">Store Credits</option>
          </select>
        </div>
        <div class="sidebar__col" v-if="form.target_currency === 'ticket'">
          <label class="sidebar__label">Ticket type</label>
          <select class="sidebar__select" v-model="form.target_entity_id">
            <option :value="null">— Select —</option>
            <option v-for="tt in nonCreditTicketTypes" :key="tt.id" :value="tt.id">{{ tt.name }}</option>
          </select>
        </div>
      </div>

      <div class="sidebar__row">
        <div class="sidebar__col">
          <label class="sidebar__label">Window start</label>
          <input class="sidebar__input sidebar__input--date" type="date" v-model="form.window_start" placeholder="dd/mm/yyyy" />
        </div>
        <span class="sidebar__row-sep">To</span>
        <div class="sidebar__col">
          <label class="sidebar__label">Window end</label>
          <input class="sidebar__input sidebar__input--date" type="date" v-model="form.window_end" placeholder="dd/mm/yyyy" />
        </div>
      </div>

      <div class="sidebar__field">
        <label class="sidebar__label">Is this factor public or private?</label>
        <div class="sidebar__radios">
          <label class="sidebar__radio"><input type="radio" v-model="form.public" :value="true" /><span>Public</span></label>
          <label class="sidebar__radio"><input type="radio" v-model="form.public" :value="false" /><span>Private</span></label>
        </div>
      </div>

      <div class="sidebar__field" v-if="form.public === false">
        <label class="sidebar__label">Expiry TTL (days)</label>
        <div class="sidebar__input-wrap">
          <input class="sidebar__input" type="number" v-model.number="form.window_end_ttl_days" placeholder="e.g. 30" min="0" />
          <span class="sidebar__input-suffix">Day</span>
        </div>
      </div>

      <div class="sidebar__field">
        <label class="sidebar__label">Assign earn condition group</label>
        <select class="sidebar__select" v-model="form.earn_conditions_group_id">
          <option :value="null">— None —</option>
          <option v-for="cg in conditionGroups" :key="cg.id" :value="cg.id">{{ cg.name || 'Untitled' }}</option>
        </select>
      </div>

      <div v-if="!isNew" class="sidebar__delete-section">
        <button class="sidebar__btn sidebar__btn--danger" @click="showDeleteConfirm = true">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M6 6h8v10H6V6zM4 6h12M8 4h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Delete earn factor
        </button>
      </div>
    </div>

    <div class="sidebar__foot">
      <button class="sidebar__btn sidebar__btn--secondary" @click="$emit('close')">Cancel</button>
      <button class="sidebar__btn sidebar__btn--primary" @click="handleSave" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
    </div>

    <div v-if="showDeleteConfirm" class="sidebar__confirm-overlay" @click.self="showDeleteConfirm = false">
      <div class="sidebar__confirm-modal">
        <h4 class="sidebar__confirm-title">Delete earn factor?</h4>
        <p class="sidebar__confirm-desc">This action cannot be undone. Are you sure you want to delete "{{ form.name || 'this factor' }}"?</p>
        <div class="sidebar__confirm-actions">
          <button class="sidebar__btn sidebar__btn--secondary" @click="showDeleteConfirm = false">Cancel</button>
          <button class="sidebar__btn sidebar__btn--danger" @click="handleDelete" :disabled="deleting">{{ deleting ? 'Deleting...' : 'Delete' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, computed } from 'vue';

export default {
  props: {
    factor: { type: Object, default: null },
    groupId: { type: String, default: null },
    conditionGroups: { type: Array, default: () => [] },
    ticketTypes: { type: Array, default: () => [] },
    panelWidth: { type: String, default: '400px' },
  },
  emits: ['close', 'save', 'delete'],
  setup(props, { emit }) {
    const saving = ref(false);
    const deleting = ref(false);
    const showDeleteConfirm = ref(false);
    const isNew = computed(() => !props.factor?.id);

    const nonCreditTicketTypes = computed(() =>
      (props.ticketTypes || []).filter(tt => !tt?.is_credit)
    );

    const creditTicketType = computed(() =>
      (props.ticketTypes || []).find(tt => tt?.is_credit)
    );

    const defaultForm = () => ({
      id: null, name: '', earn_factor_type: 'rate', earn_factor_amount: null,
      target_currency: 'points', target_entity_id: null,
      window_start: '', window_end: '', window_end_ttl_days: null,
      public: true, earn_conditions_group_id: null, active_status: true,
    });
    const form = ref(defaultForm());

    function toDateStr(val) { if (!val) return ''; try { return new Date(val).toISOString().split('T')[0]; } catch { return ''; } }

    function inferUiCurrency(f) {
      if (f?.target_currency === 'ticket') {
        const ttId = f?.target_entity_id;
        const tt = (props.ticketTypes || []).find(t => t?.id === ttId);
        if (tt?.is_credit) return 'store_credit';
        return 'ticket';
      }
      return 'points';
    }

    watch(() => props.factor, (f) => {
      if (f) {
        form.value = {
          id: f.id || null,
          name: f.name || '',
          earn_factor_type: f.earn_factor_type || 'rate',
          earn_factor_amount: f.earn_factor_amount ?? null,
          target_currency: inferUiCurrency(f),
          target_entity_id: f.target_entity_id || null,
          window_start: toDateStr(f.window_start),
          window_end: toDateStr(f.window_end),
          window_end_ttl_days: f.window_end_ttl_days ?? null,
          public: f.public !== false,
          earn_conditions_group_id: f.earn_conditions_group_id || null,
          active_status: f.active_status !== false,
        };
      } else { form.value = defaultForm(); }
      showDeleteConfirm.value = false;
    }, { immediate: true });

    async function handleSave() {
      saving.value = true;
      try {
        const p = { ...form.value };
        if (!p.id) delete p.id;
        if (p.window_start) p.window_start = new Date(p.window_start).toISOString(); else p.window_start = null;
        if (p.window_end) p.window_end = new Date(p.window_end).toISOString(); else p.window_end = null;

        if (p.target_currency === 'store_credit') {
          p.target_currency = 'ticket';
          p.target_entity_id = creditTicketType.value?.id || null;
        } else if (p.target_currency !== 'ticket') {
          p.target_entity_id = null;
        }

        if (p.public !== false) {
          p.window_end_ttl_days = null;
        }

        emit('save', { groupId: props.groupId, factor: p });
      } finally { saving.value = false; }
    }

    async function handleDelete() {
      deleting.value = true;
      try {
        emit('delete', { factorId: form.value.id, groupId: props.groupId });
      } finally {
        deleting.value = false;
        showDeleteConfirm.value = false;
      }
    }

    return { form, isNew, saving, deleting, showDeleteConfirm, nonCreditTicketTypes, handleSave, handleDelete };
  },
};
</script>

<style scoped lang="scss">
@import 'polaris-weweb-styles';

.sidebar {
  position: absolute;
  top: 0; right: 0; bottom: 0;
  background: var(--p-color-bg-surface);
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.12);
  z-index: 300;
  display: flex;
  flex-direction: column;
  font-family: var(--p-font-family-sans);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--p-space-400);
    border-bottom: 1px solid var(--p-color-border);
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--p-color-text);
    margin: 0;
  }

  &__x {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    background: none; border: none; border-radius: 6px;
    color: var(--p-color-icon); cursor: pointer;
    &:hover { background: var(--p-color-bg-surface-hover); }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: var(--p-space-400) 24px;
  }

  &__field {
    margin-bottom: var(--p-space-400);
  }

  &__label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--p-color-text);
    margin-bottom: 6px;
  }

  &__input {
    @include polaris-input;
    font-size: 13px;

    &--date {
      @include polaris-date-field;
      font-size: 13px;
    }
  }

  &__select {
    @include polaris-select;
    font-size: 13px;
  }

  &__row {
    display: flex;
    gap: 10px;
    align-items: flex-end;
    margin-bottom: var(--p-space-400);
  }

  &__col { flex: 1; min-width: 0; }

  &__row-sep {
    font-size: 13px;
    color: var(--p-color-text-secondary);
    padding-bottom: 8px;
    flex-shrink: 0;
  }

  &__input-wrap {
    position: relative;
  }

  &__input-suffix {
    position: absolute;
    right: 12px; top: 50%; transform: translateY(-50%);
    font-size: 13px; color: var(--p-color-text-secondary);
    pointer-events: none;
  }

  &__radios {
    display: flex;
    gap: 24px;
  }

  &__radio {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 13px;
    color: var(--p-color-text);

    input[type="radio"] {
      @include polaris-radio;
      box-sizing: border-box;
    }
  }

  &__delete-section {
    margin-top: var(--p-space-200);
    padding-top: var(--p-space-400);
    border-top: 1px solid var(--p-color-border);
  }

  &__foot {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 16px 24px;
    border-top: 1px solid var(--p-color-border);
  }

  &__btn {
    @include polaris-button-base;
    font-size: 13px;
    padding: 6px 16px;
    min-height: 32px;

    &--primary {
      background: var(--p-color-bg-fill-brand);
      color: #fff;
      box-shadow: var(--p-shadow-button-primary);
      &:hover:not(:disabled) { background: var(--p-color-bg-fill-brand-hover); }
    }

    &--secondary {
      @include polaris-button-default;
      font-size: 13px;
      padding: 6px 16px;
      min-height: 32px;
    }

    &--danger {
      @include polaris-button-critical;
      font-size: 13px;
      padding: 6px 16px;
      min-height: 32px;
      gap: 6px;
    }
  }

  &__confirm-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 400;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__confirm-modal {
    background: var(--p-color-bg-surface);
    border-radius: var(--p-border-radius-300);
    box-shadow: var(--p-shadow-popover);
    padding: var(--p-space-500);
    max-width: 320px;
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
