export function useApi(props) {
  const getHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': props.content?.supabaseAnonKey || '',
    };
    const token = props.content?.authToken;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const baseUrl = () => props.content?.supabaseUrl || 'https://wkevmsedchftztoolkmi.supabase.co';

  const rpc = async (fnName, params = {}) => {
    const res = await fetch(`${baseUrl()}/rest/v1/rpc/${fnName}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`RPC ${fnName} failed: ${res.status} ${text}`);
    }
    return res.json();
  };

  const rest = async (path) => {
    const res = await fetch(`${baseUrl()}/rest/v1/${path}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`REST ${path} failed: ${res.status} ${text}`);
    }
    return res.json();
  };

  const fetchContractList = (status, type) =>
    rpc('bff_admin_get_contract_list', {
      p_status: status || null,
      p_type: type || null,
    });

  const fetchContractDetail = (groupId) =>
    rpc('bff_admin_get_contract_detail', { p_group_id: groupId });

  const upsertContract = (payload) =>
    rpc('bff_upsert_contract_with_levels', payload);

  const fetchPackageList = (search) =>
    rpc('bff_admin_get_package_list', {
      p_status: 'active',
      p_search: search || null,
    });

  const fetchRewards = () =>
    rest('reward_master?select=id,name,image,description_headline&active_status=eq.true&order=name.asc');

  return {
    fetchContractList,
    fetchContractDetail,
    upsertContract,
    fetchPackageList,
    fetchRewards,
  };
}
