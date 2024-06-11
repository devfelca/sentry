export type InsightEventParameters = {
  'insight.app_start.select_start_type': {type: string};
  'insight.app_start.spans.filter_by_device_class': {filter: string};
  'insight.app_start.spans.filter_by_operation': {filter: string};
  'insight.app_start.spans.toggle_sample_type': {type: string};
  'insight.asset.filter_by_blocking': {filter: string};
  // Don't specify filter because page filter are arbitrary values
  'insight.asset.filter_by_page': {};
  'insight.asset.filter_by_type': {filter: string};
  'insight.general.chart_zoom': {chart_name: string; source: string};
  'insight.general.search': {query: string; source: string};
  'insight.general.select_action_value': {source: string; value: string};
  // Don't specify domain because domains are arbitrary values
  'insight.general.select_domain_value': {source: string};
  'insight.general.table_paginate': {direction: string; source: string};
  'insight.general.table_sort': {
    direction: string;
    field: string;
    source: string;
  };
  'insight.screen_load.spans.filter_by_device_class': {filter: string};
  'insight.screen_load.spans.filter_by_operation': {filter: string};
  'insight.vital.overview.open_full_waterfall': {};
  'insight.vital.overview.open_transaction_summary': {};
  'insight.vital.overview.toggle_data_type': {type: string};
  'insight.vital.overview.toggle_tab': {tab: string};
  'insight.vital.vital_sidebar_opened': {vital: string};
};

export type InsightEventKey = keyof InsightEventParameters;

export const insightEventMap: Record<InsightEventKey, string | null> = {
  'insight.app_start.select_start_type': 'Insights: App Start - select app start type',
  'insight.app_start.spans.filter_by_device_class':
    'Insights: App Start - filter device class',
  'insight.app_start.spans.filter_by_operation': 'Insights: App Start - filter operation',
  'insight.app_start.spans.toggle_sample_type':
    'Insights: App Start - toggle sample type',
  'insight.asset.filter_by_blocking': 'Insights: Assets - filter blocking',
  'insight.asset.filter_by_page': 'Insights: Assets - filter page',
  'insight.asset.filter_by_type': 'Insights: Assets - filter asset type',
  'insight.general.chart_zoom': 'Insights: chart zoom',
  'insight.general.search': 'Insights: search in modules',
  'insight.general.select_action_value': 'Insights: select actionSelector dropdown value',
  'insight.general.select_domain_value': 'Insights: select domainSelector dropdown value',
  'insight.general.table_paginate': 'Insights: paginate',
  'insight.general.table_sort': 'Insights: sort table',
  'insight.screen_load.spans.filter_by_device_class':
    'Insights: Screen Loads - filter device class',
  'insight.screen_load.spans.filter_by_operation':
    'Insights: Screen Loads - filter operation',
  'insight.vital.vital_sidebar_opened': 'Insights: Web Vitals - vital sidebar opened',
  'insight.vital.overview.toggle_tab': 'Insights: Web Vitals Overview - toggle tab',
  'insight.vital.overview.open_transaction_summary':
    'Insights: Web Vitals Overview - open transaction summary',
  'insight.vital.overview.open_full_waterfall':
    'Insights: Web Vitals Overview - open full waterfall',
  'insight.vital.overview.toggle_data_type':
    'Insights: Web Vitals Overview - toggle data type',
};
