export default {
  editor: {
    label: {
      en: 'Earn Studio',
    },
    icon: 'star',
    customStylePropertiesOrder: [
      'leftColumnWidth',
      'rightColumnWidth',
      'connectionLineColor',
      'connectionLineActiveColor',
      'configPanelWidth',
    ],
    customSettingsPropertiesOrder: [
      'supabaseUrl',
      'supabaseAnonKey',
      'authToken',
    ],
  },
  actions: [
    {
      name: 'refreshData',
      label: { en: 'Refresh All Data' },
      action: 'refreshData',
      /* wwEditor:start */
      actionDescription: {
        en: 'Reloads all earn factor groups, factors, and condition groups from the database',
      },
      /* wwEditor:end */
    },
    {
      name: 'closePanel',
      label: { en: 'Close Config Panel' },
      action: 'closePanel',
      /* wwEditor:start */
      actionDescription: {
        en: 'Closes any open sidebar config panel',
      },
      /* wwEditor:end */
    },
  ],
  triggerEvents: [
    {
      name: 'earn-factor-group-saved',
      label: { en: 'On Earn Factor Group Saved' },
      event: { groupId: '', groupName: '', action: 'created' },
      default: true,
      /* wwEditor:start */
      getTestEvent: '() => ({ groupId: "uuid-123", groupName: "Standard Earning Rule", action: "created" })',
      /* wwEditor:end */
    },
    {
      name: 'earn-factor-saved',
      label: { en: 'On Earn Factor Saved' },
      event: { factorId: '', factorType: '', groupId: '' },
      default: true,
      /* wwEditor:start */
      getTestEvent: '() => ({ factorId: "uuid-456", factorType: "rate", groupId: "uuid-123" })',
      /* wwEditor:end */
    },
    {
      name: 'earn-condition-group-saved',
      label: { en: 'On Earn Condition Group Saved' },
      event: { groupId: '', groupName: '', action: 'created' },
      default: true,
      /* wwEditor:start */
      getTestEvent: '() => ({ groupId: "uuid-789", groupName: "Tier Perks", action: "created" })',
      /* wwEditor:end */
    },
    {
      name: 'connection-changed',
      label: { en: 'On Connection Changed' },
      event: { factorId: '', conditionGroupId: '', action: 'linked' },
      default: true,
      /* wwEditor:start */
      getTestEvent: '() => ({ factorId: "uuid-456", conditionGroupId: "uuid-789", action: "linked" })',
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
    {
      name: 'data-loaded',
      label: { en: 'On Data Loaded' },
      event: { factorGroupCount: 0, conditionGroupCount: 0 },
      default: true,
      /* wwEditor:start */
      getTestEvent: '() => ({ factorGroupCount: 3, conditionGroupCount: 5 })',
      /* wwEditor:end */
    },
  ],
  properties: {
    pageTitle: {
      label: { en: 'Page Title' },
      type: 'Text',
      section: 'settings',
      bindable: true,
      defaultValue: 'Conditional Currency Multipliers',
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Main heading text for the page',
      },
      propertyHelp: 'The page title displayed at the top of the component.',
      /* wwEditor:end */
    },
    pageDescription: {
      label: { en: 'Page Description' },
      type: 'Text',
      section: 'settings',
      bindable: true,
      defaultValue: 'Configure reward multipliers based on tier, products, and time conditions.',
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
      propertyHelp: 'The Supabase project URL for API calls. Defaults to the CRM project.',
      /* wwEditor:end */
    },
    supabaseAnonKey: {
      label: { en: 'Supabase Anon Key' },
      type: 'Text',
      section: 'settings',
      bindable: true,
      defaultValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZXZtc2VkY2hmdHp0b29sa21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTM2OTgsImV4cCI6MjA2NjA4OTY5OH0.bd8ELGtX8ACmk_WCxR_tIFljwyHgD3YD4PdBDpD-kSM',
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

    leftColumnWidth: {
      label: { en: 'Left Column Width' },
      type: 'Length',
      section: 'style',
      defaultValue: '580px',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Width of the earn factor groups column',
      },
      /* wwEditor:end */
    },
    rightColumnWidth: {
      label: { en: 'Right Column Width' },
      type: 'Length',
      section: 'style',
      defaultValue: '580px',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Width of the earn condition groups column',
      },
      /* wwEditor:end */
    },
    connectionLineColor: {
      label: { en: 'Connection Line Color' },
      type: 'Color',
      section: 'style',
      defaultValue: '#C9CCCF',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Color of connection lines between factors and condition groups',
      },
      /* wwEditor:end */
    },
    connectionLineActiveColor: {
      label: { en: 'Active Connection Color' },
      type: 'Color',
      section: 'style',
      defaultValue: '#005BD3',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Color of active/hovered connection lines',
      },
      /* wwEditor:end */
    },
    configPanelWidth: {
      label: { en: 'Config Panel Width' },
      type: 'Length',
      section: 'style',
      defaultValue: '380px',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Width of the sidebar config panel',
      },
      /* wwEditor:end */
    },
  },
};
