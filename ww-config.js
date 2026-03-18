export default {
  editor: {
    label: {
      en: 'Contract & Entitlement Builder',
    },
    icon: 'briefcase',
    customSettingsPropertiesOrder: [
      'supabaseUrl',
      'supabaseAnonKey',
      'authToken',
      'pageTitle',
      'pageDescription',
    ],
  },
  actions: [
    {
      name: 'refreshData',
      label: { en: 'Refresh All Data' },
      action: 'refreshData',
      /* wwEditor:start */
      actionDescription: {
        en: 'Reloads the contract list and picker data (packages, rewards) from the database',
      },
      /* wwEditor:end */
    },
    {
      name: 'navigateToList',
      label: { en: 'Navigate to List View' },
      action: 'navigateToList',
      /* wwEditor:start */
      actionDescription: {
        en: 'Returns to the contract list view',
      },
      /* wwEditor:end */
    },
    {
      name: 'navigateToEditor',
      label: { en: 'Navigate to Editor' },
      action: 'navigateToEditor',
      args: [
        {
          name: 'groupId',
          type: 'Text',
          label: { en: 'Group ID (optional — blank for new)' },
          /* wwEditor:start */
          bindable: true,
          /* wwEditor:end */
        },
      ],
      /* wwEditor:start */
      actionDescription: {
        en: 'Opens the contract editor, optionally loading an existing contract by group ID',
      },
      /* wwEditor:end */
    },
  ],
  triggerEvents: [
    {
      name: 'contract-saved',
      label: { en: 'On Contract Saved' },
      event: { groupId: '', action: 'created' },
      default: true,
      /* wwEditor:start */
      getTestEvent: '() => ({ groupId: "uuid-123", action: "created", levels_created: 2, entitlements_created: 5 })',
      /* wwEditor:end */
    },
    {
      name: 'view-changed',
      label: { en: 'On View Changed' },
      event: { view: 'list', itemId: '' },
      default: true,
      /* wwEditor:start */
      getTestEvent: '() => ({ view: "editor", itemId: "uuid-123" })',
      /* wwEditor:end */
    },
    {
      name: 'data-loaded',
      label: { en: 'On Data Loaded' },
      event: { contractCount: 0 },
      default: true,
      /* wwEditor:start */
      getTestEvent: '() => ({ contractCount: 5 })',
      /* wwEditor:end */
    },
    {
      name: 'error',
      label: { en: 'On Error' },
      event: { message: '', code: '' },
      default: true,
      /* wwEditor:start */
      getTestEvent: '() => ({ message: "Failed to save", code: "SAVE_ERROR" })',
      /* wwEditor:end */
    },
  ],
  properties: {
    pageTitle: {
      label: { en: 'Page Title' },
      type: 'Text',
      section: 'settings',
      bindable: true,
      defaultValue: 'Contracts & Persona Entitlements',
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Main heading text for the list view',
      },
      propertyHelp: 'The page title displayed at the top of the contract list.',
      /* wwEditor:end */
    },
    pageDescription: {
      label: { en: 'Page Description' },
      type: 'Text',
      section: 'settings',
      bindable: true,
      defaultValue: 'Configure persona groups as contracts with auto-assigned packages, rewards, and benefits per level.',
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Subtitle description text below the page title',
      },
      propertyHelp: 'The page description displayed below the title.',
      /* wwEditor:end */
    },
    supabaseUrl: {
      label: { en: 'Supabase URL' },
      type: 'Text',
      section: 'settings',
      bindable: true,
      defaultValue: 'https://wkevmsedchftztoolkmi.supabase.co',
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Supabase project URL',
      },
      propertyHelp: 'The Supabase project URL for API calls.',
      /* wwEditor:end */
    },
    supabaseAnonKey: {
      label: { en: 'Supabase Anon Key' },
      type: 'Text',
      section: 'settings',
      bindable: true,
      defaultValue:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZXZtc2VkY2hmdHp0b29sa21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTM2OTgsImV4cCI6MjA2NjA4OTY5OH0.bd8ELGtX8ACmk_WCxR_tIFljwyHgD3YD4PdBDpD-kSM',
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Supabase publishable/anon key',
      },
      propertyHelp: 'The publishable anon key. Safe to hardcode as it is public.',
      /* wwEditor:end */
    },
    authToken: {
      label: { en: 'Auth Token (JWT)' },
      type: 'Text',
      section: 'settings',
      bindable: true,
      defaultValue: '',
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Current admin user JWT from Supabase auth session',
      },
      propertyHelp:
        "Bind to the current admin user's JWT from the Supabase auth session. Used for Authorization header in RPC calls.",
      /* wwEditor:end */
    },
  },
};
