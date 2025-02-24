import {createContext, type Dispatch, useContext} from 'react';

import {
  type TourAction,
  type TourState,
  type TourStep,
  useTourReducer,
} from 'sentry/components/tours/tourContext';

export const enum IssueDetailsTour {
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

export type IssueDetailsTourStep = TourStep<IssueDetailsTour>;
export type IssueDetailsTourState = TourState<IssueDetailsTour>;
export type IssueDetailsTourAction = TourAction<IssueDetailsTour>;

const initialState: IssueDetailsTourState = {
  currentStep: null,
  isAvailable: true, // TODO: Check a flag in the organization to enable the quest
  isComplete: false,
};

export function useIssueDetailsTourReducer() {
  return useTourReducer<IssueDetailsTour>({initialState});
}

export interface IssueDetailsTourContextType {
  dispatch: Dispatch<IssueDetailsTourAction>;
  tour: IssueDetailsTourState;
}

export const IssueDetailsTourContext = createContext<IssueDetailsTourContextType>({
  tour: initialState,
  dispatch: () => {},
});

export function useIssueDetailsTour(): IssueDetailsTourContextType {
  return useContext(IssueDetailsTourContext);
}
