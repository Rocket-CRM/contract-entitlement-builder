<template>
  <div class="ceb" ref="rootRef">
    <!-- Toast notifications -->
    <div class="ceb__toasts">
      <div v-for="toast in toasts" :key="toast.id" class="ceb__toast" :class="'ceb__toast--' + toast.type">
        <div class="ceb__toast-header">
          <svg v-if="toast.type === 'success'" width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <path d="M10 6v5M10 13.5h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span class="ceb__toast-title">{{ toast.title }}</span>
          <button class="ceb__toast-close" @click="removeToast(toast.id)">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div v-if="toast.message" class="ceb__toast-body">{{ toast.message }}</div>
      </div>
    </div>

    <ContractListView
      v-if="currentViewValue === 'list'"
      :title="content?.pageTitle || 'Contracts & Persona Entitlements'"
      :description="content?.pageDescription || 'Configure persona groups as contracts with auto-assigned packages, rewards, and benefits per level.'"
      :contracts="contracts"
      :loading="loadingList"
      :filter-status="filterStatus"
      :filter-type="filterType"
      @update:filterStatus="onFilterStatus"
      @update:filterType="onFilterType"
      @create="handleCreate"
      @select="handleSelect"
    />

    <ContractEditorView
      v-else
      :contract="selectedContract"
      :packages="packages"
      :rewards="rewards"
      :saving="saving"
      @back="handleBackToList"
      @save="handleSave"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useApi } from './useApi.js';
import ContractListView from './components/ContractListView.vue';
import ContractEditorView from './components/ContractEditorView.vue';

let toastId = 0;

export default {
  components: { ContractListView, ContractEditorView },
  props: {
    uid: { type: String, required: true },
    content: { type: Object, required: true },
    /* wwEditor:start */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
  },
  emits: ['trigger-event'],
  setup(props, { emit, expose }) {
    const api = useApi(props);
    const rootRef = ref(null);

    const { value: currentView, setValue: setCurrentView } =
      typeof wwLib !== 'undefined'
        ? wwLib.wwVariable.useComponentVariable({
            uid: props.uid,
            name: 'currentView',
            type: 'string',
            defaultValue: 'list',
          })
        : { value: ref('list'), setValue: (v) => { currentView.value = v; } };

    const currentViewValue = computed(() =>
      typeof currentView?.value === 'string' ? currentView.value : currentView?.value?.value || 'list'
    );

    const { value: selectedContractId, setValue: setSelectedContractId } =
      typeof wwLib !== 'undefined'
        ? wwLib.wwVariable.useComponentVariable({
            uid: props.uid,
            name: 'selectedContractId',
            type: 'string',
            defaultValue: '',
          })
        : { value: ref(''), setValue: (v) => { selectedContractId.value = v; } };

    const contracts = ref([]);
    const selectedContract = ref(null);
    const packages = ref([]);
    const rewards = ref([]);
    const loadingList = ref(false);
    const loadingDetail = ref(false);
    const saving = ref(false);
    const filterStatus = ref('');
    const filterType = ref('');
    const toasts = ref([]);

    function addToast(type, title, message) {
      const id = ++toastId;
      toasts.value.push({ id, type, title, message });
      setTimeout(() => removeToast(id), 5000);
    }
    function removeToast(id) {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }

    async function loadContracts() {
      loadingList.value = true;
      try {
        const res = await api.fetchContractList(
          filterStatus.value || null,
          filterType.value || null
        );
        contracts.value = res?.data || [];
        emit('trigger-event', {
          name: 'data-loaded',
          event: { contractCount: contracts.value.length },
        });
      } catch (e) {
        console.error('Failed to load contracts', e);
        addToast('error', 'Load Failed', e?.message || 'Could not load contracts');
        emit('trigger-event', { name: 'error', event: { message: e?.message, code: 'LOAD_ERROR' } });
      } finally {
        loadingList.value = false;
      }
    }

    async function loadContractDetail(groupId) {
      loadingDetail.value = true;
      try {
        const res = await api.fetchContractDetail(groupId);
        if (!res?.success) throw new Error(res?.title || 'Not found');
        selectedContract.value = res.data;
      } catch (e) {
        console.error('Failed to load contract detail', e);
        addToast('error', 'Load Failed', e?.message || 'Could not load contract details');
        selectedContract.value = null;
      } finally {
        loadingDetail.value = false;
      }
    }

    async function loadPickerData() {
      try {
        const [pkgRes, rwdRes] = await Promise.all([
          api.fetchPackageList(),
          api.fetchRewards(),
        ]);
        packages.value = pkgRes?.data || [];
        rewards.value = rwdRes || [];
      } catch (e) {
        console.error('Failed to load picker data', e);
      }
    }

    function onFilterStatus(val) {
      filterStatus.value = val;
      loadContracts();
    }

    function onFilterType(val) {
      filterType.value = val;
      loadContracts();
    }

    function handleCreate() {
      selectedContract.value = null;
      setCurrentView('editor');
      emit('trigger-event', { name: 'view-changed', event: { view: 'editor', itemId: '' } });
    }

    async function handleSelect(contract) {
      if (!contract?.id) return;
      setSelectedContractId(contract.id);
      await loadContractDetail(contract.id);
      setCurrentView('editor');
      emit('trigger-event', { name: 'view-changed', event: { view: 'editor', itemId: contract.id } });
    }

    function handleBackToList() {
      selectedContract.value = null;
      setCurrentView('list');
      loadContracts();
      emit('trigger-event', { name: 'view-changed', event: { view: 'list', itemId: '' } });
    }

    async function handleSave(payload) {
      saving.value = true;
      try {
        const res = await api.upsertContract(payload);
        if (!res?.success) throw new Error(res?.title || 'Save failed');

        const isNew = !payload.p_group_id;
        const groupId = res.data?.group_id;
        const action = isNew ? 'created' : 'updated';

        addToast('success', `Contract ${action}`, `Contract "${payload.p_group_name}" ${action} successfully`);
        emit('trigger-event', {
          name: 'contract-saved',
          event: { groupId, action, ...res.data },
        });

        if (groupId) {
          await loadContractDetail(groupId);
          setSelectedContractId(groupId);
        }
      } catch (e) {
        console.error('Save failed', e);
        addToast('error', 'Save Failed', e?.message || 'Could not save contract');
        emit('trigger-event', { name: 'error', event: { message: e?.message, code: 'SAVE_ERROR' } });
      } finally {
        saving.value = false;
      }
    }

    onMounted(() => {
      if (props.content?.authToken) {
        loadContracts();
        loadPickerData();
      }
    });

    watch(
      () => props.content?.authToken,
      (t) => {
        if (t) {
          loadContracts();
          loadPickerData();
        }
      }
    );

    expose({
      refreshData: () => {
        loadContracts();
        loadPickerData();
      },
      navigateToList: () => handleBackToList(),
      navigateToEditor: (data) => {
        if (data?.groupId) {
          handleSelect({ id: data.groupId });
        } else {
          handleCreate();
        }
      },
    });

    return {
      rootRef,
      content: computed(() => props.content),
      currentViewValue,
      contracts,
      selectedContract,
      packages,
      rewards,
      loadingList,
      saving,
      filterStatus,
      filterType,
      toasts,
      removeToast,
      onFilterStatus,
      onFilterType,
      handleCreate,
      handleSelect,
      handleBackToList,
      handleSave,
    };
  },
};
</script>

<style scoped lang="scss">
@import 'polaris-weweb-styles';

.ceb {
  @include polaris-tokens;
  font-family: var(--p-font-family-sans);
  color: var(--p-color-text);
  background: var(--p-color-bg-surface-secondary);
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  :deep(input[type="radio"]),
  :deep(input[type="checkbox"]:not(.toggle-switch input)) {
    accent-color: var(--p-color-bg-fill-brand, #2C6ECB);
  }

  &__toasts { @include polaris-toast-container; }

  &__toast {
    @include polaris-toast;

    &--success .ceb__toast-header { @include polaris-toast-header-success; }
    &--success .ceb__toast-body   { @include polaris-toast-body; }
    &--error .ceb__toast-header   { @include polaris-toast-header-error; }
    &--error .ceb__toast-body     { @include polaris-toast-body; }
  }

  &__toast-header { @include polaris-toast-header; }
  &__toast-title { flex: 1; }
  &__toast-close { @include polaris-toast-close; }
  &__toast-body { @include polaris-toast-body; }
}
</style>
