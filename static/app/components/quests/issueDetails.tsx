import {createContext, type Dispatch, useContext} from 'react';

import {
  type QuestAction,
  type QuestState,
  type QuestStep,
  useQuestReducer,
} from 'sentry/components/quests/questContext';

export const enum IssueDetailsQuestLine {
  /** Onboarding for issue name, type, culprit, message, area */
  ISSUE_DETAILS_HEADER = 'issue-details-header',
  /** Onboarding for workflow actions; resolution, archival, assignment, priority, etc. */
  ISSUE_DETAILS_WORKFLOWS = 'issue-details-workflows',
  /** Onboarding for activity log, issue tracking, solutions hub area */
  ISSUE_DETAILS_SIDEBAR = 'issue-details-sidebar',
  /** Onboarding for date/time/environment filters */
  ISSUE_DETAILS_FILTERS = 'issue-details-filters',
  /** Onboarding for trends and aggregates, the graph, and tag distributions */
  ISSUE_DETAILS_TRENDS = 'issue-details-trends',
  /** Onboarding for event details, event navigation, main page content */
  ISSUE_DETAILS_EVENT_DETAILS = 'issue-details-event-details',
}

export type IssueDetailsQuestStep = QuestStep<IssueDetailsQuestLine>;
export type IssueDetailsQuestState = QuestState<IssueDetailsQuestLine>;
export type IssueDetailsQuestAction = QuestAction<IssueDetailsQuestLine>;

const initialState: IssueDetailsQuestState = {
  currentStep: null,
  isAvailable: true, // TODO: Check a flag in the organization to enable the quest
  isComplete: false,
};

export function useIssueDetailsQuestReducer() {
  return useQuestReducer<IssueDetailsQuestLine>({initialState});
}

export interface IssueDetailsQuestContextType {
  dispatch: Dispatch<IssueDetailsQuestAction>;
  quest: IssueDetailsQuestState;
}

export const IssueDetailsQuestContext = createContext<IssueDetailsQuestContextType>({
  quest: initialState,
  dispatch: () => {},
});

export function useIssueDetailsQuest(): IssueDetailsQuestContextType {
  return useContext(IssueDetailsQuestContext);
}
