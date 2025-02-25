import {createContext, useContext} from 'react';

import {
  type TourContextType,
  type TourState,
  type TourStep,
  useRegisterTourStep,
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

const ORDERED_ISSUE_DETAILS_TOUR_STEP_IDS = [
  IssueDetailsTour.ISSUE_DETAILS_HEADER,
  IssueDetailsTour.ISSUE_DETAILS_WORKFLOWS,
  IssueDetailsTour.ISSUE_DETAILS_SIDEBAR,
  IssueDetailsTour.ISSUE_DETAILS_FILTERS,
  IssueDetailsTour.ISSUE_DETAILS_TRENDS,
  IssueDetailsTour.ISSUE_DETAILS_EVENT_DETAILS,
];

export function useIssueDetailsTourReducer(
  initialState: Partial<TourState<IssueDetailsTour>>
) {
  return useTourReducer<IssueDetailsTour>({
    initialState,
    orderedStepIds: ORDERED_ISSUE_DETAILS_TOUR_STEP_IDS,
  });
}

export const IssueDetailsTourContext = createContext<TourContextType<IssueDetailsTour>>({
  tour: {
    currentStep: null,
    orderedStepIds: ORDERED_ISSUE_DETAILS_TOUR_STEP_IDS,
    isAvailable: false,
    isActive: false,
    isRegistered: false,
  },
  dispatch: () => {},
  registry: {
    [IssueDetailsTour.ISSUE_DETAILS_HEADER]: null,
    [IssueDetailsTour.ISSUE_DETAILS_WORKFLOWS]: null,
    [IssueDetailsTour.ISSUE_DETAILS_SIDEBAR]: null,
    [IssueDetailsTour.ISSUE_DETAILS_FILTERS]: null,
    [IssueDetailsTour.ISSUE_DETAILS_TRENDS]: null,
    [IssueDetailsTour.ISSUE_DETAILS_EVENT_DETAILS]: null,
  },
});

export function useIssueDetailsTour(): TourContextType<IssueDetailsTour> {
  return useContext(IssueDetailsTourContext);
}

export function useRegisterIssueDetailsTourStep({
  step,
  focusedElement,
}: {
  focusedElement: React.ReactNode;
  step: TourStep<IssueDetailsTour>;
}) {
  const tourContext = useIssueDetailsTour();
  return useRegisterTourStep<IssueDetailsTour>({
    focusedElement,
    step,
    tourContext,
  });
}
