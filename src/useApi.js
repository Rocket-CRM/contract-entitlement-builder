import { ref } from 'vue';

export function useApi(props) {
  const loading = ref(false);
  const error = ref(null);

  function getHeaders() {
    const token = props.content?.authToken;
    const anonKey = props.content?.supabaseAnonKey;
    return {
      'Content-Type': 'application/json',
      'apikey': anonKey || '',
      'Authorization': `Bearer ${token || anonKey || ''}`,
    };
  }

  function baseUrl() {
    return props.content?.supabaseUrl || 'https://wkevmsedchftztoolkmi.supabase.co';
  }

  async function rpc(fnName, payload = {}) {
    const url = `${baseUrl()}/rest/v1/rpc/${fnName}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`RPC ${fnName} failed: ${res.status} ${text}`);
    }
    const data = await res.json();
    if (data && typeof data === 'object' && 'success' in data && data.success === false) {
      throw new Error(data.title || data.description || `${fnName} failed`);
    }
    return data;
  }

  async function restGet(table, query = '') {
    const url = `${baseUrl()}/rest/v1/${table}${query ? '?' + query : ''}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { ...getHeaders(), 'Prefer': 'return=representation' },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GET ${table} failed: ${res.status} ${text}`);
    }
    return res.json();
  }

  async function fetchEarnFactorGroups() {
    return restGet('earn_factor_group', 'select=id,name,stackable,window_start,window_end,active_status,created_at&order=created_at.desc');
  }

  async function fetchEarnFactorGroupDetails(groupId) {
    return rpc('bff_get_earn_factor_group_details', {
      p_mode: 'edit',
      p_earn_factor_group_id: groupId,
    });
  }

  async function fetchFactorsByGroup(groupId) {
    return rpc('bff_get_earn_factors_by_group', {
      p_earn_factor_group_id: groupId,
    });
  }

  async function upsertEarnFactorGroup(groupData) {
    return rpc('bff_upsert_earn_factor_group', {
      p_group_data: groupData,
    });
  }

  async function deleteEarnFactorGroup(groupId) {
    return rpc('admin_delete_earn_factor_group', {
      p_group_id: groupId,
    });
  }

  async function deleteEarnFactor(factorId) {
    return rpc('admin_delete_earn_factor', {
      p_earn_factor_id: factorId,
    });
  }

  async function fetchAllConditionGroups() {
    return rpc('bff_get_all_earn_conditions_groups');
  }

  async function fetchConditionGroupDetails(groupId) {
    return rpc('bff_get_earn_conditions_group', {
      p_mode: 'edit',
      p_group_id: groupId,
    });
  }

  async function fetchConditionGroupsWithStats(params = {}) {
    return rpc('api_get_earn_conditions_groups', { params });
  }

  async function upsertConditionGroup(config) {
    return rpc('bff_upsert_earn_conditions_group', {
      p_config: config,
    });
  }

  async function deleteConditionGroup(groupId) {
    return rpc('admin_delete_earn_conditions_group', {
      p_group_id: groupId,
    });
  }

  async function deleteCondition(conditionId) {
    return rpc('admin_delete_earn_condition', {
      p_condition_id: conditionId,
    });
  }

  async function fetchEntityOptions() {
    return rpc('get_all_entity_options');
  }

  async function fetchTicketTypes() {
    return restGet('ticket_type', 'select=id,name,ticket_code,is_credit,credit_platform&order=name.asc');
  }

  return {
    loading,
    error,
    rpc,
    restGet,
    fetchEarnFactorGroups,
    fetchEarnFactorGroupDetails,
    fetchFactorsByGroup,
    upsertEarnFactorGroup,
    deleteEarnFactorGroup,
    deleteEarnFactor,
    fetchAllConditionGroups,
    fetchConditionGroupDetails,
    fetchConditionGroupsWithStats,
    upsertConditionGroup,
    deleteConditionGroup,
    deleteCondition,
    fetchEntityOptions,
    fetchTicketTypes,
  };
}
