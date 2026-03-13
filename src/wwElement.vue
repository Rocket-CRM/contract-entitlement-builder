<template>
  <div class="earn-studio" ref="rootRef">
    <div class="earn-studio__layout" ref="layoutRef">
      <!-- LEFT COLUMN -->
      <div class="earn-studio__col earn-studio__col--left">
        <div class="earn-studio__col-head">
          <h2 class="earn-studio__title">Earn factor group</h2>
          <button class="earn-studio__primary-btn" @click="openCreateFactorGroup">Create</button>
        </div>
        <div class="earn-studio__col-body" ref="leftColRef">
          <div v-if="loadingFactorGroups" class="earn-studio__loading"><div class="earn-studio__spinner"></div></div>
          <template v-else>
            <EarnFactorGroupCard
              v-for="g in factorGroups"
              :key="g?.id"
              :group="g"
              :factors="factorsByGroup[g?.id] || []"
              :expanded="expandedLeft[g?.id] !== false"
              @toggle-expand="id => { expandedLeft[id] = expandedLeft[id] === false ? true : false; scheduleLineUpdate(); }"
              @add-factor="handleAddFactor"
              @edit-group="handleEditFactorGroup"
              @edit-factor="handleEditFactor"
              @factor-ref="registerFactorRef"
            />
            <div v-if="!factorGroups?.length" class="earn-studio__empty">No earn factor groups yet.</div>
          </template>
        </div>
      </div>

      <!-- SVG CONNECTIONS (absolute overlay) -->
      <svg class="earn-studio__svg" ref="svgRef">
        <path
          v-for="ln in lines"
          :key="ln.key"
          :d="ln.d"
          fill="none"
          :stroke="hoveredLine === ln.key ? '#0262E0' : '#CCCCCC'"
          :stroke-width="hoveredLine === ln.key ? 2 : 1.5"
          :stroke-dasharray="ln.dashed ? '4 4' : ''"
          @mouseenter="hoveredLine = ln.key"
          @mouseleave="hoveredLine = null"
          style="cursor:pointer"
        />
      </svg>

      <!-- RIGHT COLUMN -->
      <div class="earn-studio__col earn-studio__col--right">
        <div class="earn-studio__col-head">
          <h2 class="earn-studio__title">Earn Conditions group</h2>
          <button class="earn-studio__primary-btn" @click="openCreateConditionGroup">Create</button>
        </div>
        <div class="earn-studio__col-body" ref="rightColRef">
          <div v-if="loadingConditionGroups" class="earn-studio__loading"><div class="earn-studio__spinner"></div></div>
          <template v-else>
            <EarnConditionGroupCard
              v-for="entry in rightEntries"
              :key="entry.dk"
              :group="entry.group"
              :conditions="entry.conditions"
              :linked-factor-count="entry.linkedCount"
              :is-active="!!expandedRight[entry.dk]"
              :display-key="entry.dk"
              @select-group="(g, dk) => { expandedRight[dk] = !expandedRight[dk]; scheduleLineUpdate(); }"
              @add-condition="g => handleEditConditionGroup(g)"
              @edit-group="handleEditConditionGroup"
              @pill-ref="registerPillRef"
              :ref="el => registerRightCardRef(entry.dk, el)"
            />
            <div v-if="!rightEntries?.length" class="earn-studio__empty">No condition groups yet.</div>
          </template>
        </div>
      </div>
    </div>

    <!-- Panels -->
    <transition name="slide">
      <EarnFactorConfig v-if="panel === 'factor'" :factor="editingFactor" :group-id="editingGroupId"
        :condition-groups="allCondGroups" :ticket-types="ticketTypes" :panel-width="content?.configPanelWidth || '380px'"
        @close="panel = null" @save="saveFactorConfig" />
    </transition>
    <transition name="slide">
      <EarnConditionGroupConfig v-if="panel === 'condition'" :group="editingCondGroup"
        :all-entity-options="entityOptions" :panel-width="content?.configPanelWidth || '380px'"
        @close="panel = null" @save="saveCondGroupConfig" />
    </transition>

    <CreateGroupModal v-if="showModal" :type="modalType" @close="showModal = false" @save="handleModalSave" />
    <ConnectPopup v-if="connectPopup.open" :condition-groups="allCondGroups" :position="connectPopup.pos"
      @close="connectPopup.open = false" @select="handleConnectSelect" />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue';
import { useApi } from './useApi.js';
import EarnFactorGroupCard from './components/EarnFactorGroupCard.vue';
import EarnConditionGroupCard from './components/EarnConditionGroupCard.vue';
import EarnFactorConfig from './components/EarnFactorConfig.vue';
import EarnConditionGroupConfig from './components/EarnConditionGroupConfig.vue';
import CreateGroupModal from './components/CreateGroupModal.vue';
import ConnectPopup from './components/ConnectPopup.vue';

export default {
  components: { EarnFactorGroupCard, EarnConditionGroupCard, EarnFactorConfig, EarnConditionGroupConfig, CreateGroupModal, ConnectPopup },
  props: {
    uid: { type: String, required: true },
    content: { type: Object, required: true },
    /* wwEditor:start */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
  },
  emits: ['trigger-event'],
  setup(props, { emit }) {
    const api = useApi(props);
    const rootRef = ref(null), layoutRef = ref(null), svgRef = ref(null);
    const leftColRef = ref(null), rightColRef = ref(null);

    const factorGroups = ref([]);
    const factorsByGroup = ref({});
    const allCondGroups = ref([]);
    const condCache = ref({});
    const entityOptions = ref([]);
    const ticketTypes = ref([]);
    const loadingFactorGroups = ref(false);
    const loadingConditionGroups = ref(false);

    const expandedLeft = ref({});
    const expandedRight = ref({});
    const panel = ref(null);
    const editingFactor = ref(null);
    const editingGroupId = ref(null);
    const editingCondGroup = ref(null);
    const showModal = ref(false);
    const modalType = ref('factor');
    const hoveredLine = ref(null);
    const connectPopup = ref({ open: false, pos: null, factorId: null, groupId: null });

    const factorRefs = {};
    const dotRefs = {};
    const rightCardRefs = {};

    const lines = ref([]);
    const svgW = ref(200);
    const svgH = ref(600);
    let lineTimer = null;
    let ro = null;

    const rightEntries = computed(() => {
      const groups = allCondGroups.value || [];
      const allF = Object.values(factorsByGroup.value || {}).flat();
      const out = [];
      const used = new Set();

      for (const f of allF) {
        const cid = f?.earn_conditions_group_id;
        if (!cid) continue;
        const g = groups.find(x => x?.id === cid);
        if (!g) continue;
        used.add(cid);
        out.push({
          dk: `${cid}__${f.id}`,
          group: g,
          conditions: condCache.value[cid]?.conditions || g?.conditions || [],
          linkedCount: allF.filter(x => x?.earn_conditions_group_id === cid).length,
          factorId: f.id,
        });
      }
      for (const g of groups) {
        if (!used.has(g?.id)) {
          out.push({ dk: g.id, group: g, conditions: condCache.value[g.id]?.conditions || g?.conditions || [], linkedCount: 0, factorId: null });
        }
      }
      return out;
    });

    async function loadAll() {
      await Promise.all([loadFactorGroups(), loadCondGroups(), loadEntities()]);
      emit('trigger-event', { name: 'data-loaded', event: { factorGroupCount: factorGroups.value?.length, conditionGroupCount: allCondGroups.value?.length } });
      scheduleLineUpdate();
      setTimeout(scheduleLineUpdate, 200);
      setTimeout(scheduleLineUpdate, 500);
    }

    async function loadFactorGroups() {
      loadingFactorGroups.value = true;
      try {
        factorGroups.value = await api.fetchEarnFactorGroups() || [];
        const m = {};
        for (const g of factorGroups.value) { if (g?.id) m[g.id] = await api.fetchFactorsByGroup(g.id) || []; }
        factorsByGroup.value = m;
      } catch (e) { err('Load factor groups failed', e); }
      finally { loadingFactorGroups.value = false; }
    }

    async function loadCondGroups() {
      loadingConditionGroups.value = true;
      try {
        allCondGroups.value = await api.fetchAllConditionGroups() || [];
        const c = {};
        for (const g of allCondGroups.value) { if (g?.id) try { c[g.id] = await api.fetchConditionGroupDetails(g.id); } catch {} }
        condCache.value = c;
      } catch (e) { err('Load condition groups failed', e); }
      finally { loadingConditionGroups.value = false; }
    }

    async function loadEntities() { try { entityOptions.value = await api.fetchEntityOptions() || []; } catch (e) { err('Load entities failed', e); } }
    function err(m, e) { console.error(m, e); emit('trigger-event', { name: 'error', event: { message: m, code: 'ERR' } }); }

    function registerFactorRef({ factorId, el }) {
      if (el && factorId) { factorRefs[factorId] = el; scheduleLineUpdate(); }
    }
    function registerPillRef({ groupId, displayKey, el }) {
      const key = displayKey || groupId;
      if (el && key) { dotRefs[key] = el; rightCardRefs[key] = el; scheduleLineUpdate(); }
    }
    function registerRightCardRef(dk, comp) {
      const el = comp?.$el || comp;
      if (el && dk) { rightCardRefs[dk] = el; scheduleLineUpdate(); }
    }

    function scheduleLineUpdate() {
      clearTimeout(lineTimer);
      lineTimer = setTimeout(() => nextTick(() => requestAnimationFrame(rebuildLines)), 50);
    }

    function rebuildLines() {
      const layout = layoutRef.value;
      const svg = svgRef.value;
      if (!layout || !svg) return;

      const layoutRect = layout.getBoundingClientRect();
      const newLines = [];
      const allF = Object.values(factorsByGroup.value || {}).flat();

      for (const f of allF) {
        const cid = f?.earn_conditions_group_id;
        if (!cid) continue;

        const fEl = factorRefs[f.id];
        if (!fEl) continue;

        const dk = `${cid}__${f.id}`;
        const rEl = rightCardRefs[dk] || dotRefs[dk];

        const fRect = fEl.getBoundingClientRect();
        const x1 = fRect.right - layoutRect.left;
        const y1 = fRect.top + fRect.height / 2 - layoutRect.top;

        let x2 = layoutRect.width;
        let y2 = y1;
        if (rEl) {
          const rRect = rEl.getBoundingClientRect();
          x2 = rRect.left - layoutRect.left;
          y2 = rRect.top + Math.min(rRect.height / 2, 24) - layoutRect.top;
        }

        const dx = x2 - x1;
        const cp = dx * 0.4;
        const d = `M ${x1} ${y1} C ${x1 + cp} ${y1}, ${x2 - cp} ${y2}, ${x2} ${y2}`;
        newLines.push({ key: `${f.id}__${cid}`, d, dashed: false });
      }

      lines.value = newLines;
    }

    function handleAddFactor(g) { editingFactor.value = { earn_factor_type: 'rate', public: true, target_currency: 'points', active_status: true }; editingGroupId.value = g?.id; panel.value = 'factor'; }
    function handleEditFactor(f) { editingFactor.value = { ...f }; editingGroupId.value = f?.earn_factor_group_id; panel.value = 'factor'; }
    function handleEditFactorGroup(g) { modalType.value = 'factor'; showModal.value = true; }
    async function handleEditConditionGroup(g) {
      try { editingCondGroup.value = g?.id ? await api.fetchConditionGroupDetails(g.id) : { id: null, name: '', conditions: [] }; }
      catch { editingCondGroup.value = { ...g, conditions: g?.conditions || [] }; }
      panel.value = 'condition';
    }
    function openCreateFactorGroup() { modalType.value = 'factor'; showModal.value = true; }
    function openCreateConditionGroup() { editingCondGroup.value = null; panel.value = 'condition'; }

    async function handleModalSave(p) {
      try {
        if (modalType.value === 'factor') {
          await api.upsertEarnFactorGroup({ name: p.name, stackable: p.stackable, window_start: p.window_start, window_end: p.window_end, factors: [] });
          await loadFactorGroups();
        }
      } catch (e) { err('Create failed', e); }
      showModal.value = false;
      scheduleLineUpdate();
    }

    async function saveFactorConfig({ groupId, factor }) {
      try {
        const det = await api.fetchEarnFactorGroupDetails(groupId);
        const ex = det?.factors || [];
        const up = factor.id ? ex.map(f => f.id === factor.id ? factor : f) : [...ex, factor];
        await api.upsertEarnFactorGroup({ id: groupId, factors: up });
        await loadFactorGroups();
        panel.value = null;
      } catch (e) { err('Save factor failed', e); }
      scheduleLineUpdate();
    }

    async function saveCondGroupConfig(payload) {
      try {
        await api.upsertConditionGroup(payload);
        await loadCondGroups();
        panel.value = null;
      } catch (e) { err('Save condition group failed', e); }
      scheduleLineUpdate();
    }

    function handleConnectFactor(f, ev) {
      const r = ev?.target?.getBoundingClientRect?.();
      connectPopup.value = { open: true, pos: r ? { x: r.right + 8, y: r.top } : { x: 400, y: 200 }, factorId: f.id, groupId: f.earn_factor_group_id };
    }

    async function handleConnectSelect(cg) {
      const { factorId, groupId } = connectPopup.value;
      connectPopup.value.open = false;
      try {
        const det = await api.fetchEarnFactorGroupDetails(groupId);
        const fs = (det?.factors || []).map(f => f.id === factorId ? { ...f, earn_conditions_group_id: cg.id } : f);
        await api.upsertEarnFactorGroup({ id: groupId, factors: fs });
        await loadFactorGroups();
      } catch (e) { err('Link failed', e); }
      scheduleLineUpdate();
    }

    onMounted(() => {
      if (props.content?.authToken) loadAll();
      ro = new ResizeObserver(scheduleLineUpdate);
      if (layoutRef.value) ro.observe(layoutRef.value);
    });
    onBeforeUnmount(() => { ro?.disconnect(); clearTimeout(lineTimer); });
    watch(() => props.content?.authToken, t => { if (t) loadAll(); });

    return {
      rootRef, layoutRef, svgRef, leftColRef, rightColRef,
      content: computed(() => props.content),
      factorGroups, factorsByGroup, allCondGroups, entityOptions, ticketTypes,
      loadingFactorGroups, loadingConditionGroups,
      expandedLeft, expandedRight, panel, editingFactor, editingGroupId, editingCondGroup,
      showModal, modalType, hoveredLine, connectPopup,
      rightEntries, lines,
      registerFactorRef, registerPillRef, registerRightCardRef,
      handleAddFactor, handleEditFactor, handleEditFactorGroup, handleEditConditionGroup,
      openCreateFactorGroup, openCreateConditionGroup, handleModalSave,
      saveFactorConfig, saveCondGroupConfig, handleConnectSelect,
      scheduleLineUpdate,
      refreshData: loadAll, closePanel: () => { panel.value = null; },
    };
  },
};
</script>

<style scoped lang="scss">
@import 'polaris-weweb-styles';

.earn-studio {
  @include polaris-tokens;
  font-family: var(--p-font-family-sans);
  color: var(--p-color-text);
  background: #F8FAFC;
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 0 var(--p-space-600) 64px;

  &__layout {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0;
    position: relative;
  }

  &__col {
    flex-shrink: 0;
    z-index: 2;
    position: relative;

    &--left { width: 580px; }
    &--right { width: 500px; }
  }

  &__col-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--p-space-600) 0 var(--p-space-500);
  }

  &__title {
    @include polaris-text-title;
    margin: 0;
  }

  &__primary-btn {
    @include polaris-button-primary;
    @include polaris-button-slim;
    font-size: var(--p-font-size-300);
  }

  &__col-body {
    display: flex;
    flex-direction: column;
    gap: var(--p-space-600);
  }

  &__svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    pointer-events: none;
    overflow: visible;

    path {
      pointer-events: stroke;
    }
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: var(--p-space-1200) 0;
  }

  &__spinner {
    @include polaris-spinner;
  }

  &__empty {
    @include polaris-text-description;
    text-align: center;
    padding: var(--p-space-1000) var(--p-space-400);
    border: 2px dashed var(--p-color-border);
    border-radius: var(--p-border-radius-200);
    color: var(--p-color-text-disabled);
  }
}

@keyframes polaris-spin { to { transform: rotate(360deg); } }

.slide-enter-active, .slide-leave-active { transition: transform var(--p-motion-duration-300) var(--p-motion-ease); }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
</style>
