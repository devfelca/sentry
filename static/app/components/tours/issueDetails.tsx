import {createContext, useContext} from 'react';

import {
  type TourContextType,
  type TourState,
  useRegisterTourStep,
  type UseRegisterTourStepProps,
  useTourReducer,
} from 'sentry/components/tours/tourContext';

export const enum IssueDetailsTour {
  /** Onboarding for trends and aggregates, the graph, and tag distributions */
  ISSUE_DETAILS_AGGREGATES = 'issue-details-aggregates',
  /** Onboarding for date/time/environment filters */
  ISSUE_DETAILS_FILTERS = 'issue-details-filters',
  /** Onboarding for event details, event navigation, main page content */
  ISSUE_DETAILS_EVENT_DETAILS = 'issue-details-event-details',
  /** Onboarding for event navigation; next/previous, first/last/recommended events */
  ISSUE_DETAILS_NAVIGATION = 'issue-details-navigation',
  /** Onboarding for workflow actions; resolution, archival, assignment, priority, etc. */
  ISSUE_DETAILS_WORKFLOWS = 'issue-details-workflows',
  /** Onboarding for activity log, issue tracking, solutions hub area */
  ISSUE_DETAILS_SIDEBAR = 'issue-details-sidebar',
}

const ORDERED_ISSUE_DETAILS_TOUR_STEP_IDS = [
  IssueDetailsTour.ISSUE_DETAILS_AGGREGATES,
  IssueDetailsTour.ISSUE_DETAILS_FILTERS,
  IssueDetailsTour.ISSUE_DETAILS_EVENT_DETAILS,
  IssueDetailsTour.ISSUE_DETAILS_NAVIGATION,
  IssueDetailsTour.ISSUE_DETAILS_WORKFLOWS,
  IssueDetailsTour.ISSUE_DETAILS_SIDEBAR,
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
    isAvailable: false,
    orderedStepIds: ORDERED_ISSUE_DETAILS_TOUR_STEP_IDS,
  },
  dispatch: () => {},
  registry: {
    [IssueDetailsTour.ISSUE_DETAILS_AGGREGATES]: null,
    [IssueDetailsTour.ISSUE_DETAILS_FILTERS]: null,
    [IssueDetailsTour.ISSUE_DETAILS_EVENT_DETAILS]: null,
    [IssueDetailsTour.ISSUE_DETAILS_NAVIGATION]: null,
    [IssueDetailsTour.ISSUE_DETAILS_WORKFLOWS]: null,
    [IssueDetailsTour.ISSUE_DETAILS_SIDEBAR]: null,
  },
});

export function useIssueDetailsTour(): TourContextType<IssueDetailsTour> {
  return useContext(IssueDetailsTourContext);
}

export function useRegisterIssueDetailsTourStep(
  props: Omit<UseRegisterTourStepProps<IssueDetailsTour>, 'tourContext'>
) {
  const tourContext = useIssueDetailsTour();
  return useRegisterTourStep<IssueDetailsTour>({...props, tourContext});
}
