import {useTheme} from '@emotion/react';
import styled from '@emotion/styled';

import * as Layout from 'sentry/components/layouts/thirds';
import {
  IssueDetailsTour,
  IssueDetailsTourContext,
  useIssueDetailsTourReducer,
  useRegisterIssueDetailsTourStep,
} from 'sentry/components/tours/issueDetails';
import {TourBlurContainer} from 'sentry/components/tours/styles';
import {t} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import type {Event} from 'sentry/types/event';
import type {Group} from 'sentry/types/group';
import type {Project} from 'sentry/types/project';
import {getConfigForIssueType} from 'sentry/utils/issueTypeConfig';
import useMedia from 'sentry/utils/useMedia';
import {
  IssueDetailsContext,
  useIssueDetailsReducer,
} from 'sentry/views/issueDetails/streamline/context';
import {EventDetailsHeader} from 'sentry/views/issueDetails/streamline/eventDetailsHeader';
import {IssueEventNavigation} from 'sentry/views/issueDetails/streamline/eventNavigation';
import StreamlinedGroupHeader from 'sentry/views/issueDetails/streamline/header/header';
import StreamlinedSidebar from 'sentry/views/issueDetails/streamline/sidebar/sidebar';
import {ToggleSidebar} from 'sentry/views/issueDetails/streamline/sidebar/toggleSidebar';
import {getGroupReprocessingStatus} from 'sentry/views/issueDetails/utils';

interface GroupDetailsLayoutProps {
  children: React.ReactNode;
  event: Event | undefined;
  group: Group;
  project: Project;
}

export function GroupDetailsLayout({
  group,
  event,
  project,
  children,
}: GroupDetailsLayoutProps) {
  const theme = useTheme();
  const {issueDetails, dispatch: issueDetailsDispatch} = useIssueDetailsReducer();
  const tourContext = useIssueDetailsTourReducer({
    // TODO(Leander): Use a flag, something like this:
    // isAvailable: organization.features.includes('issue-details-tour'),
    isAvailable: true,
  });
  const isScreenSmall = useMedia(`(max-width: ${theme.breakpoints.large})`);
  const shouldDisplaySidebar = issueDetails.isSidebarOpen || isScreenSmall;
  const groupReprocessingStatus = getGroupReprocessingStatus(group);

  return (
    <IssueDetailsContext.Provider
      value={{...issueDetails, dispatch: issueDetailsDispatch}}
    >
      <IssueDetailsTourContext.Provider value={tourContext}>
        <TourBlurContainer>
          <StreamlinedGroupHeader
            group={group}
            event={event ?? null}
            project={project}
            groupReprocessingStatus={groupReprocessingStatus}
          />
          <StyledLayoutBody
            data-test-id="group-event-details"
            sidebarOpen={issueDetails.isSidebarOpen}
          >
            <GroupDetailsContent event={event} group={group} project={project}>
              {children}
            </GroupDetailsContent>
            {shouldDisplaySidebar ? (
              <StreamlinedSidebar group={group} event={event} project={project} />
            ) : null}
          </StyledLayoutBody>
        </TourBlurContainer>
      </IssueDetailsTourContext.Provider>
    </IssueDetailsContext.Provider>
  );
}

function GroupDetailsContent({event, group, project, children}: GroupDetailsLayoutProps) {
  const issueTypeConfig = getConfigForIssueType(group, group.project);
  const hasFilterBar = issueTypeConfig.header.filterBar.enabled;

  const filterComponent = (
    <EventDetailsHeader event={event} group={group} project={project} />
  );

  const {element: tourAggregate} = useRegisterIssueDetailsTourStep({
    focusedElement: filterComponent,
    step: {
      id: IssueDetailsTour.ISSUE_DETAILS_AGGREGATES,
      title: t('View data in aggregate'),
      description: t(
        'The top section of the page always displays data in aggregate, including trends over time or tag value distributions.'
      ),
    },
    position: 'bottom',
  });

  const eventDetailsComponent = (
    <GroupContent>
      <NavigationSidebarWrapper hasToggleSidebar={!hasFilterBar}>
        <IssueEventNavigation event={event} group={group} />
        {/* Since the event details header is disabled, display the sidebar toggle here */}
        {!hasFilterBar && <ToggleSidebar size="sm" />}
      </NavigationSidebarWrapper>
      <ContentPadding>{children}</ContentPadding>
    </GroupContent>
  );

  const {element: tourContent} = useRegisterIssueDetailsTourStep({
    focusedElement: eventDetailsComponent,
    step: {
      id: IssueDetailsTour.ISSUE_DETAILS_EVENT_DETAILS,
      title: t('Explore event details'),
      description: t(
        'Here we capture everything we know about this error event, including the stack trace, breadcrumbs, replay, trace, context, and tags.'
      ),
    },
  });

  return (
    <div>
      {tourAggregate}
      {tourContent}
    </div>
  );
}

const StyledLayoutBody = styled(Layout.Body)<{
  sidebarOpen: boolean;
}>`
  padding: 0 !important;
  gap: 0 !important;
  @media (min-width: ${p => p.theme.breakpoints.large}) {
    align-content: stretch;
    grid-template-columns: minmax(100px, auto) ${p => (p.sidebarOpen ? '325px' : '0px')};
  }
`;

const GroupContent = styled('section')`
  background: ${p => p.theme.backgroundSecondary};
  display: flex;
  flex-direction: column;
  @media (min-width: ${p => p.theme.breakpoints.large}) {
    border-right: 1px solid ${p => p.theme.translucentBorder};
  }
  @media (max-width: ${p => p.theme.breakpoints.large}) {
    border-bottom-width: 1px solid ${p => p.theme.translucentBorder};
  }
`;

const NavigationSidebarWrapper = styled('div')<{
  hasToggleSidebar: boolean;
}>`
  position: relative;
  display: flex;
  padding: ${p =>
    p.hasToggleSidebar
      ? `${space(1)} 0 ${space(0.5)} ${space(1.5)}`
      : `10px ${space(1.5)} ${space(0.25)} ${space(1.5)}`};
`;

const ContentPadding = styled('div')`
  min-height: 100vh;
  padding: 0 ${space(1.5)} ${space(1.5)} ${space(1.5)};
`;
