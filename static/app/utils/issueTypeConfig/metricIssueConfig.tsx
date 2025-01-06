import type {IssueCategoryConfigMapping} from 'sentry/utils/issueTypeConfig/types';

const metricIssueConfig: IssueCategoryConfigMapping = {
  _categoryDefaults: {
    actions: {
      archiveUntilOccurrence: {enabled: false},
      delete: {enabled: false},
      deleteAndDiscard: {enabled: false},
      merge: {enabled: false},
      ignore: {enabled: true},
      resolve: {enabled: false},
      resolveInRelease: {enabled: false},
      share: {enabled: true},
    },
    customCopy: {
      resolution: 'Back to baseline',
    },
    attachments: {enabled: false},
    resources: null,
    autofix: false,
    events: {enabled: false},
    mergedIssues: {enabled: false},
    replays: {enabled: false},
    similarIssues: {enabled: false},
    userFeedback: {enabled: false},
    usesIssuePlatform: true,
    stats: {enabled: false},
    tagsTab: {enabled: false},
    issueSummary: {enabled: false},
  },
};

export default metricIssueConfig;
