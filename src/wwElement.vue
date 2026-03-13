<template>
  <div class="earn-studio" ref="rootRef">
    <div class="earn-studio__layout" ref="layoutRef">

      <!-- LEFT COLUMN: Earn Factor Groups + Factor Pills -->
      <div class="earn-studio__col earn-studio__col--left" :style="{ width: content?.leftColumnWidth || '380px' }">
        <div class="earn-studio__col-header">
          <h2 class="earn-studio__col-title">Earn factor group</h2>
          <button class="earn-studio__create-btn" @click="openCreateFactorGroup">Create</button>
        </div>
        <div class="earn-studio__col-scroll" ref="leftScrollRef">
          <div v-if="loadingFactorGroups" class="earn-studio__loading"><div class="earn-studio__spinner"></div></div>
          <template v-else>
            <EarnFactorGroupCard
              v-for="group in factorGroups"
              :key="group?.id"
              :group="group"
              :factors="factorsByGroup[group?.id] || []"
              :selected-factor-id="selectedFactorId"
              @add-factor="handleAddFactor"
              @edit-group="handleEditFactorGroup"
              @edit-factor="handleEditFactor"
              @select-factor="handleSelectFactor"
              @connect-factor="handleConnectFactor"
              @factor-ref="registerFactorRef"
            />
            <div v-if="!factorGroups?.length" class="earn-studio__empty">
              No earn factor groups yet.
            </div>
          </template>
        </div>
      </div>

      <!-- MIDDLE: Connection Lines -->
      <svg class="earn-studio__svg" ref="svgRef" :viewBox="`0 0 ${svgWidth} ${svgHeight}`" :width="svgWidth" :height="svgHeight">
        <path
          v-for="line in connectionLines"
          :key="line.key"
          :d="line.path"
          fill="none"
          :stroke="hoveredLineKey === line.key ? (content?.connectionLineActiveColor || '#005BD3') : (content?.connectionLineColor || '#C9CCCF')"
          :stroke-width="hoveredLineKey === line.key ? 2.5 : 1.5"
          :stroke-dasharray="line.dashed ? '5 3' : 'none'"
          class="earn-studio__line"
          @mouseenter="hoveredLineKey = line.key"
          @mouseleave="hoveredLineKey = null"
        />
      </svg>

      <!-- RIGHT COLUMN: Earn Condition Group Pills -->
      <div class="earn-studio__col earn-studio__col--right" :style="{ width: content?.rightColumnWidth || '380px' }">
        <div class="earn-studio__col-header">
          <h2 class="earn-studio__col-title">Earn Conditions group</h2>
          <button class="earn-studio__create-btn" @click="openCreateConditionGroup">Create</button>
        </div>
        <div class="earn-studio__col-scroll" ref="rightScrollRef">
          <div v-if="loadingConditionGroups" class="earn-studio__loading"><div class="earn-studio__spinner"></div></div>
          <template v-else>
            <template v-for="entry in rightColumnEntries" :key="entry.displayKey">
              <EarnConditionGroupCard
                :group="entry.group"
                :conditions="entry.conditions"
                :linked-factor-count="entry.linkedFactorCount"
                :is-active="activeConditionKey === entry.displayKey"
                :display-key="entry.displayKey"
                @select-group="(g, dk) => toggleConditionDetail(dk)"
                @add-condition="handleAddCondition"
                @edit-group="handleEditConditionGroup"
                @pill-ref="registerConditionPillRef"
              />
            </template>
            <div v-if="!rightColumnEntries?.length" class="earn-studio__empty">
              No earn condition groups yet.
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Sidebar Panels -->
    <transition name="slide-right">
      <EarnFactorConfig
        v-if="activePanel === 'factor-config'"
        :factor="editingFactor"
        :group-id="editingFactorGroupId"
        :condition-groups="allConditionGroupsList"
        :ticket-types="ticketTypes"
        :panel-width="content?.configPanelWidth || '380px'"
        @close="closePanel"
        @save="saveFactorConfig"
      />
    </transition>
    <transition name="slide-right">
      <EarnConditionGroupConfig
        v-if="activePanel === 'condition-config'"
        :group="editingConditionGroup"
        :all-entity-options="allEntityOptions"
        :panel-width="content?.configPanelWidth || '380px'"
        @close="closePanel"
        @save="saveConditionGroupConfig"
      />
    </transition>

    <!-- Modals -->
    <CreateGroupModal
      v-if="showCreateModal"
      :type="createModalType"
      @close="showCreateModal = false"
      @save="handleCreateGroupSave"
    />
    <ConnectPopup
      v-if="connectPopup.open"
      :condition-groups="allConditionGroupsList"
      :position="connectPopup.position"
      @close="connectPopup.open = false"
      @select="handleConnectSelect"
    />
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

    const rootRef = ref(null);
    const layoutRef = ref(null);
    const svgRef = ref(null);
    const leftScrollRef = ref(null);
    const rightScrollRef = ref(null);

    const factorGroups = ref([]);
    const factorsByGroup = ref({});
    const allConditionGroupsList = ref([]);
    const conditionDetailsCache = ref({});
    const allEntityOptions = ref([]);
    const ticketTypes = ref([]);
    const loadingFactorGroups = ref(false);
    const loadingConditionGroups = ref(false);

    const activePanel = ref(null);
    const editingFactor = ref(null);
    const editingFactorGroupId = ref(null);
    const editingConditionGroup = ref(null);
    const showCreateModal = ref(false);
    const createModalType = ref('factor');
    const selectedFactorId = ref(null);
    const activeConditionKey = ref(null);
    const hoveredLineKey = ref(null);
    const connectPopup = ref({ open: false, position: null, factorId: null, factorGroupId: null });

    const factorPillRefs = ref({});
    const conditionPillRefs = ref({});

    const connectionLines = ref([]);
    const svgWidth = ref(120);
    const svgHeight = ref(600);

    let resizeObserver = null;

    // ─── Right column: build entries with duplication rule ───
    const rightColumnEntries = computed(() => {
      const groups = allConditionGroupsList.value || [];
      const allFactors = Object.values(factorsByGroup.value || {}).flat();
      const result = [];
      const usedGroupIds = new Set();

      for (const factor of allFactors) {
        const cgId = factor?.earn_conditions_group_id;
        if (!cgId) continue;
        const group = groups.find(g => g?.id === cgId);
        if (!group) continue;
        usedGroupIds.add(cgId);
        const details = conditionDetailsCache.value[cgId];
        result.push({
          displayKey: `${cgId}__${factor.id}`,
          group,
          conditions: details?.conditions || group?.conditions || [],
          linkedFactorCount: allFactors.filter(f => f?.earn_conditions_group_id === cgId).length,
          factorId: factor.id,
        });
      }

      for (const group of groups) {
        if (!usedGroupIds.has(group?.id)) {
          result.push({
            displayKey: group.id,
            group,
            conditions: conditionDetailsCache.value[group.id]?.conditions || group?.conditions || [],
            linkedFactorCount: 0,
            factorId: null,
          });
        }
      }
      return result;
    });

    // ─── Data Loading ───
    async function loadAll() {
      await Promise.all([loadFactorGroups(), loadConditionGroups(), loadEntityOptions()]);
      emit('trigger-event', {
        name: 'data-loaded',
        event: { factorGroupCount: factorGroups.value?.length || 0, conditionGroupCount: allConditionGroupsList.value?.length || 0 },
      });
      nextTick(() => { requestAnimationFrame(rebuildLines); });
    }

    async function loadFactorGroups() {
      loadingFactorGroups.value = true;
      try {
        factorGroups.value = await api.fetchEarnFactorGroups() || [];
        const newMap = {};
        for (const g of factorGroups.value) {
          if (g?.id) newMap[g.id] = await api.fetchFactorsByGroup(g.id) || [];
        }
        factorsByGroup.value = newMap;
      } catch (e) { emitError('Failed to load earn factor groups', e); }
      finally { loadingFactorGroups.value = false; }
    }

    async function loadConditionGroups() {
      loadingConditionGroups.value = true;
      try {
        allConditionGroupsList.value = await api.fetchAllConditionGroups() || [];
        const newCache = {};
        for (const g of allConditionGroupsList.value) {
          if (g?.id) { try { newCache[g.id] = await api.fetchConditionGroupDetails(g.id); } catch {} }
        }
        conditionDetailsCache.value = newCache;
      } catch (e) { emitError('Failed to load condition groups', e); }
      finally { loadingConditionGroups.value = false; }
    }

    async function loadEntityOptions() {
      try { allEntityOptions.value = await api.fetchEntityOptions() || []; } catch (e) { emitError('Failed to load entity options', e); }
    }

    function emitError(msg, err) {
      console.error(msg, err);
      emit('trigger-event', { name: 'error', event: { message: msg, code: 'LOAD_ERROR' } });
    }

    // ─── Connection Lines ───
    function registerFactorRef({ factorId, el }) {
      factorPillRefs.value[factorId] = el;
      nextTick(() => requestAnimationFrame(rebuildLines));
    }

    function registerConditionPillRef({ groupId, displayKey, el }) {
      if (el) conditionPillRefs.value[displayKey] = el;
      nextTick(() => requestAnimationFrame(rebuildLines));
    }

    function rebuildLines() {
      const layout = layoutRef.value;
      if (!layout) return;
      const layoutRect = layout.getBoundingClientRect();

      const leftCol = leftScrollRef.value;
      const rightCol = rightScrollRef.value;
      if (!leftCol || !rightCol) return;

      const leftColRect = leftCol.getBoundingClientRect();
      const rightColRect = rightCol.getBoundingClientRect();

      const gapLeft = leftColRect.right - layoutRect.left;
      const gapRight = rightColRect.left - layoutRect.left;
      const gapW = gapRight - gapLeft;

      svgWidth.value = Math.max(gapW, 40);

      const lines = [];
      const allFactors = Object.values(factorsByGroup.value || {}).flat();
      let maxY = 0;

      for (const factor of allFactors) {
        const cgId = factor?.earn_conditions_group_id;
        if (!cgId) continue;

        const factorEl = factorPillRefs.value[factor.id];
        const displayKey = `${cgId}__${factor.id}`;
        const condEl = conditionPillRefs.value[displayKey];

        if (!factorEl) continue;

        const fRect = factorEl.getBoundingClientRect();
        const y1 = fRect.top + fRect.height / 2 - layoutRect.top;

        let y2 = y1;
        if (condEl) {
          const cRect = condEl.getBoundingClientRect();
          y2 = cRect.top + cRect.height / 2 - layoutRect.top;
        }

        const x1 = 0;
        const x2 = svgWidth.value;
        const cpx1 = x1 + gapW * 0.4;
        const cpx2 = x2 - gapW * 0.4;
        const path = `M ${x1} ${y1} C ${cpx1} ${y1}, ${cpx2} ${y2}, ${x2} ${y2}`;

        lines.push({ key: `${factor.id}__${cgId}`, path, factorId: factor.id, conditionGroupId: cgId, dashed: false });
        maxY = Math.max(maxY, y1, y2);
      }

      connectionLines.value = lines;
      svgHeight.value = Math.max(maxY + 40, layoutRect.height);
    }

    // ─── UI handlers ───
    function handleSelectFactor(factor) {
      selectedFactorId.value = selectedFactorId.value === factor?.id ? null : factor?.id;
    }

    function toggleConditionDetail(displayKey) {
      activeConditionKey.value = activeConditionKey.value === displayKey ? null : displayKey;
      nextTick(() => requestAnimationFrame(rebuildLines));
    }

    function closePanel() {
      activePanel.value = null;
      editingFactor.value = null;
      editingFactorGroupId.value = null;
      editingConditionGroup.value = null;
    }

    function handleAddFactor(group) {
      editingFactor.value = { earn_factor_type: 'rate', public: true, target_currency: 'points', active_status: true };
      editingFactorGroupId.value = group?.id;
      activePanel.value = 'factor-config';
    }

    function handleEditFactor(factor) {
      editingFactor.value = { ...factor };
      editingFactorGroupId.value = factor?.earn_factor_group_id || null;
      activePanel.value = 'factor-config';
    }

    function handleEditFactorGroup(group) {
      createModalType.value = 'factor';
      showCreateModal.value = true;
    }

    function handleAddCondition(group) { handleEditConditionGroup(group); }

    async function handleEditConditionGroup(group) {
      try {
        editingConditionGroup.value = group?.id ? await api.fetchConditionGroupDetails(group.id) : { id: null, name: '', conditions: [] };
      } catch { editingConditionGroup.value = { ...group, conditions: group?.conditions || [] }; }
      activePanel.value = 'condition-config';
    }

    function openCreateFactorGroup() { createModalType.value = 'factor'; showCreateModal.value = true; }
    function openCreateConditionGroup() { editingConditionGroup.value = null; activePanel.value = 'condition-config'; }

    async function handleCreateGroupSave(payload) {
      try {
        if (createModalType.value === 'factor') {
          const result = await api.upsertEarnFactorGroup({ name: payload.name, stackable: payload.stackable, window_start: payload.window_start, window_end: payload.window_end, factors: [] });
          emit('trigger-event', { name: 'earn-factor-group-saved', event: { groupId: result?.group_id, groupName: payload.name, action: 'created' } });
          await loadFactorGroups();
        }
      } catch (e) { emitError('Failed to create group', e); }
      showCreateModal.value = false;
      nextTick(() => requestAnimationFrame(rebuildLines));
    }

    async function saveFactorConfig({ groupId, factor }) {
      try {
        const groupDetails = await api.fetchEarnFactorGroupDetails(groupId);
        const existing = groupDetails?.factors || [];
        const updated = factor.id ? existing.map(f => f.id === factor.id ? factor : f) : [...existing, factor];
        await api.upsertEarnFactorGroup({ id: groupId, factors: updated });
        emit('trigger-event', { name: 'earn-factor-saved', event: { factorId: factor.id, factorType: factor.earn_factor_type, groupId } });
        await loadFactorGroups();
        closePanel();
      } catch (e) { emitError('Failed to save earn factor', e); }
      nextTick(() => requestAnimationFrame(rebuildLines));
    }

    async function saveConditionGroupConfig(payload) {
      try {
        const result = await api.upsertConditionGroup(payload);
        emit('trigger-event', { name: 'earn-condition-group-saved', event: { groupId: result?.group?.id || payload.id, groupName: payload.name, action: payload.id ? 'updated' : 'created' } });
        await loadConditionGroups();
        closePanel();
      } catch (e) { emitError('Failed to save condition group', e); }
      nextTick(() => requestAnimationFrame(rebuildLines));
    }

    function handleConnectFactor(factor, event) {
      const rect = event?.target?.getBoundingClientRect?.();
      connectPopup.value = {
        open: true,
        position: rect ? { x: rect.right + 8, y: rect.top - 4 } : { x: 400, y: 200 },
        factorId: factor.id,
        factorGroupId: factor.earn_factor_group_id,
      };
    }

    async function handleConnectSelect(conditionGroup) {
      const { factorId, factorGroupId } = connectPopup.value;
      connectPopup.value.open = false;
      try {
        const groupDetails = await api.fetchEarnFactorGroupDetails(factorGroupId);
        const factors = (groupDetails?.factors || []).map(f => f.id === factorId ? { ...f, earn_conditions_group_id: conditionGroup.id } : f);
        await api.upsertEarnFactorGroup({ id: factorGroupId, factors });
        emit('trigger-event', { name: 'connection-changed', event: { factorId, conditionGroupId: conditionGroup.id, action: 'linked' } });
        await loadFactorGroups();
      } catch (e) { emitError('Failed to link factor', e); }
      nextTick(() => requestAnimationFrame(rebuildLines));
    }

    // ─── Lifecycle ───
    onMounted(() => {
      if (props.content?.authToken) loadAll();

      resizeObserver = new ResizeObserver(() => requestAnimationFrame(rebuildLines));
      if (layoutRef.value) resizeObserver.observe(layoutRef.value);
    });

    onBeforeUnmount(() => { resizeObserver?.disconnect(); });

    watch(() => props.content?.authToken, (t) => { if (t) loadAll(); });

    return {
      rootRef, layoutRef, svgRef, leftScrollRef, rightScrollRef,
      content: computed(() => props.content),
      factorGroups, factorsByGroup, allConditionGroupsList, allEntityOptions, ticketTypes,
      loadingFactorGroups, loadingConditionGroups,
      rightColumnEntries, connectionLines, svgWidth, svgHeight, hoveredLineKey,
      activePanel, editingFactor, editingFactorGroupId, editingConditionGroup,
      showCreateModal, createModalType, selectedFactorId, activeConditionKey, connectPopup,
      registerFactorRef, registerConditionPillRef,
      handleAddFactor, handleEditFactor, handleEditFactorGroup, handleSelectFactor,
      handleAddCondition, handleEditConditionGroup, handleConnectFactor, handleConnectSelect,
      openCreateFactorGroup, openCreateConditionGroup, handleCreateGroupSave,
      saveFactorConfig, saveConditionGroupConfig, toggleConditionDetail, closePanel,
      refreshData: loadAll,
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
  background: var(--p-color-bg);
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: var(--p-space-500);

  &__layout {
    display: flex;
    align-items: flex-start;
    position: relative;
    min-height: 300px;
  }

  &__col {
    flex-shrink: 0;
    z-index: 2;
  }

  &__col-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--p-space-300);
    padding: 0 var(--p-space-100);
  }

  &__col-title {
    @include polaris-text-heading-sm;
    margin: 0;
  }

  &__create-btn {
    @include polaris-button-primary;
    @include polaris-button-slim;
    font-size: var(--p-font-size-300);
  }

  &__col-scroll {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  &__svg {
    flex-shrink: 0;
    overflow: visible;
    z-index: 1;
    min-width: 60px;
    max-width: 180px;
    flex: 1;
  }

  &__line {
    cursor: pointer;
    transition: stroke var(--p-motion-duration-100) var(--p-motion-ease),
                stroke-width var(--p-motion-duration-100) var(--p-motion-ease);
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--p-space-800);
  }

  &__spinner {
    @include polaris-spinner;
  }

  &__empty {
    @include polaris-text-body-subdued;
    text-align: center;
    padding: var(--p-space-600) var(--p-space-400);
    border: 2px dashed var(--p-color-border);
    border-radius: var(--p-border-radius-200);
    font-size: var(--p-font-size-300);
  }
}

.slide-right-enter-active, .slide-right-leave-active {
  transition: transform var(--p-motion-duration-300) var(--p-motion-ease);
}
.slide-right-enter-from, .slide-right-leave-to {
  transform: translateX(100%);
}
</style>
