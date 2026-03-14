<template>
  <div class="sidebar" :style="{ width: panelWidth }">
    <div class="sidebar__head">
      <h3 class="sidebar__title">{{ isNew ? 'Add earn factor' : 'Edit earn factor' }}</h3>
      <button class="sidebar__x" @click="$emit('close')">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>

    <div class="sidebar__body">
      <label class="sidebar__label">Earning rule name</label>
      <input class="sidebar__input" v-model="form.name" placeholder="Enter name..." />

      <label class="sidebar__label">Earn factor type</label>
      <div class="sidebar__radios">
        <label class="sidebar__radio"><input type="radio" v-model="form.earn_factor_type" value="rate" /><span>Base rate</span></label>
        <label class="sidebar__radio"><input type="radio" v-model="form.earn_factor_type" value="multiplier" /><span>Multiplier</span></label>
      </div>

      <label class="sidebar__label">Amount</label>
      <input class="sidebar__input" type="number" v-model.number="form.earn_factor_amount" placeholder="e.g. 100 or 3" step="any" min="0" />

      <div class="sidebar__row">
        <div class="sidebar__col">
          <label class="sidebar__label">Target currency</label>
          <select class="sidebar__select" v-model="form.target_currency">
            <option value="points">Points</option>
            <option value="ticket">Store credit</option>
          </select>
        </div>
        <div class="sidebar__col">
          <label class="sidebar__label sidebar__label--muted">Target currency type</label>
          <select class="sidebar__select" v-model="form.target_entity_id" :disabled="form.target_currency !== 'ticket'">
            <option :value="null">—</option>
            <option v-for="tt in ticketTypes" :key="tt.id" :value="tt.id">{{ tt.name }}</option>
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

      <label class="sidebar__label">Currency expiry (days)</label>
      <div class="sidebar__input-wrap">
        <input class="sidebar__input" type="number" v-model.number="form.window_end_ttl_days" placeholder="e.g. 30" min="0" />
        <span class="sidebar__input-suffix">Day</span>
      </div>

      <label class="sidebar__label">Is this rule public or private?</label>
      <div class="sidebar__radios">
        <label class="sidebar__radio"><input type="radio" v-model="form.public" :value="true" /><span>Public</span></label>
        <label class="sidebar__radio"><input type="radio" v-model="form.public" :value="false" /><span>Private</span></label>
      </div>

      <label class="sidebar__label">Assign earn condition group</label>
      <select class="sidebar__select sidebar__select--icon" v-model="form.earn_conditions_group_id">
        <option :value="null">— None —</option>
        <option v-for="cg in conditionGroups" :key="cg.id" :value="cg.id">{{ cg.name || 'Untitled' }}</option>
      </select>
    </div>

    <div class="sidebar__foot">
      <button class="sidebar__btn sidebar__btn--ghost" @click="$emit('close')">Cancel</button>
      <button class="sidebar__btn sidebar__btn--primary" @click="handleSave" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
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
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const saving = ref(false);
    const isNew = computed(() => !props.factor?.id);
    const defaultForm = () => ({ id: null, name: '', earn_factor_type: 'rate', earn_factor_amount: null, target_currency: 'points', target_entity_id: null, window_start: '', window_end: '', window_end_ttl_days: null, public: true, earn_conditions_group_id: null, active_status: true });
    const form = ref(defaultForm());

    function toDateStr(val) { if (!val) return ''; try { return new Date(val).toISOString().split('T')[0]; } catch { return ''; } }

    watch(() => props.factor, (f) => {
      if (f) {
        form.value = { id: f.id || null, name: f.name || '', earn_factor_type: f.earn_factor_type || 'rate', earn_factor_amount: f.earn_factor_amount ?? null, target_currency: f.target_currency || 'points', target_entity_id: f.target_entity_id || null, window_start: toDateStr(f.window_start), window_end: toDateStr(f.window_end), window_end_ttl_days: f.window_end_ttl_days ?? null, public: f.public !== false, earn_conditions_group_id: f.earn_conditions_group_id || null, active_status: f.active_status !== false };
      } else { form.value = defaultForm(); }
    }, { immediate: true });

    async function handleSave() {
      saving.value = true;
      try {
        const p = { ...form.value };
        if (!p.id) delete p.id;
        if (p.window_start) p.window_start = new Date(p.window_start).toISOString(); else p.window_start = null;
        if (p.window_end) p.window_end = new Date(p.window_end).toISOString(); else p.window_end = null;
        if (p.target_currency !== 'ticket') p.target_entity_id = null;
        emit('save', { groupId: props.groupId, factor: p });
      } finally { saving.value = false; }
    }

    return { form, isNew, saving, handleSave };
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
    padding: 20px 24px 16px;
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
    padding: 0 24px 24px;
  }

  &__label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--p-color-text);
    margin-bottom: 6px;
    margin-top: 20px;

    &--muted { color: var(--p-color-text-secondary); }

    &:first-child { margin-top: 0; }
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

    &--icon {
      padding-left: 32px;
      background-position: left 8px center, right 8px center;
      background-size: 16px, 20px;
    }
  }

  &__row {
    display: flex;
    gap: 10px;
    align-items: flex-end;
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
    gap: 6px;
    cursor: pointer;
    font-size: 13px;
    color: var(--p-color-text);

    input[type="radio"] {
      @include polaris-radio;
    }
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

    &--ghost {
      background: none;
      color: var(--p-color-text);
      &:hover:not(:disabled) { background: var(--p-color-bg-surface-hover); }
    }
  }
}
</style>
