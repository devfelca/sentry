import {createContext, useContext} from 'react';

import {
  type TourContextType,
  type TourState,
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

export function useIssueDetailsTourReducer({
  initialState,
}: {
  initialState: TourState<IssueDetailsTour>;
}) {
  return useTourReducer<IssueDetailsTour>({
    initialState,
    allStepIds: [
      IssueDetailsTour.ISSUE_DETAILS_HEADER,
      IssueDetailsTour.ISSUE_DETAILS_WORKFLOWS,
      IssueDetailsTour.ISSUE_DETAILS_SIDEBAR,
      IssueDetailsTour.ISSUE_DETAILS_FILTERS,
      IssueDetailsTour.ISSUE_DETAILS_TRENDS,
      IssueDetailsTour.ISSUE_DETAILS_EVENT_DETAILS,
    ],
  });
}

export const IssueDetailsTourContext = createContext<TourContextType<IssueDetailsTour>>({
  tour: {
    currentStep: null,
    currentStepIndex: 0,
    totalSteps: 0,
    isAvailable: false,
    isComplete: false,
    isRegistered: false,
  },
  dispatch: () => {},
  registry: {
    [IssueDetailsTour.ISSUE_DETAILS_HEADER]: false,
    [IssueDetailsTour.ISSUE_DETAILS_WORKFLOWS]: false,
    [IssueDetailsTour.ISSUE_DETAILS_SIDEBAR]: false,
    [IssueDetailsTour.ISSUE_DETAILS_FILTERS]: false,
    [IssueDetailsTour.ISSUE_DETAILS_TRENDS]: false,
    [IssueDetailsTour.ISSUE_DETAILS_EVENT_DETAILS]: false,
  },
});

export function useIssueDetailsTour(): TourContextType<IssueDetailsTour> {
  return useContext(IssueDetailsTourContext);
}
