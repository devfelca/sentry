import {type CSSProperties, forwardRef, Fragment, useCallback, useEffect} from 'react';
import {css, type SerializedStyles, useTheme} from '@emotion/react';
import styled from '@emotion/styled';

import {Button, LinkButton} from 'sentry/components/button';
import DropdownButton from 'sentry/components/dropdownButton';
import {DropdownMenu} from 'sentry/components/dropdownMenu';
import {useActionableItems} from 'sentry/components/events/interfaces/crashContent/exception/useActionableItems';
import ExternalLink from 'sentry/components/links/externalLink';
import {ScrollCarousel} from 'sentry/components/scrollCarousel';
import TimeSince from 'sentry/components/timeSince';
import {IconWarning} from 'sentry/icons';
import {t} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import type {Event} from 'sentry/types/event';
import type {Group} from 'sentry/types/group';
import {trackAnalytics} from 'sentry/utils/analytics';
import {
  getAnalyticsDataForEvent,
  getAnalyticsDataForGroup,
  getShortEventId,
} from 'sentry/utils/events';
import normalizeUrl from 'sentry/utils/url/normalizeUrl';
import useCopyToClipboard from 'sentry/utils/useCopyToClipboard';
import useOrganization from 'sentry/utils/useOrganization';
import {useSyncedLocalStorageState} from 'sentry/utils/useSyncedLocalStorageState';
import {Divider} from 'sentry/views/issueDetails/divider';
import EventCreatedTooltip from 'sentry/views/issueDetails/eventCreatedTooltip';
import {
  type SectionConfig,
  SectionKey,
  useIssueDetails,
} from 'sentry/views/issueDetails/streamline/context';
import {getFoldSectionKey} from 'sentry/views/issueDetails/streamline/foldSection';

type EventNavigationProps = {
  event: Event;
  group: Group;
  className?: string;
  /**
   * Data property to help style the component when it's sticky
   */
  'data-stuck'?: boolean;
  style?: CSSProperties;
};

/**
 * Ordered array of sections that matches the order in EventDetailsContent.
 * See: static/app/views/issueDetails/groupEventDetails/groupEventDetailsContent.tsx
 */
export const ORDERED_SECTIONS: SectionKey[] = [
  SectionKey.HIGHLIGHTS,
  SectionKey.USER_FEEDBACK,
  SectionKey.LLM_MONITORING,
  SectionKey.UPTIME,
  SectionKey.CRON_TIMELINE,
  SectionKey.CORRELATED_ISSUES,
  SectionKey.EVIDENCE,
  SectionKey.MESSAGE,
  SectionKey.EXCEPTION,
  SectionKey.STACKTRACE,
  SectionKey.THREADS,
  SectionKey.SUSPECT_ROOT_CAUSE,
  SectionKey.SPAN_EVIDENCE,
  SectionKey.REGRESSION_SUMMARY,
  SectionKey.REGRESSION_BREAKPOINT_CHART,
  SectionKey.REGRESSION_FLAMEGRAPH,
  SectionKey.HYDRATION_DIFF,
  SectionKey.REPLAY,
  SectionKey.HPKP,
  SectionKey.CSP,
  SectionKey.EXPECTCT,
  SectionKey.EXPECTSTAPLE,
  SectionKey.TEMPLATE,
  SectionKey.BREADCRUMBS,
  SectionKey.TRACE,
  SectionKey.REQUEST,
  SectionKey.TAGS,
  SectionKey.CONTEXTS,
  SectionKey.FEATURE_FLAGS,
  SectionKey.EXTRA,
  SectionKey.PACKAGES,
  SectionKey.DEVICE,
  SectionKey.VIEW_HIERARCHY,
  SectionKey.ATTACHMENTS,
  SectionKey.SDK,
  SectionKey.PROCESSING_ERROR,
  SectionKey.GROUPING_INFO,
  SectionKey.RRWEB,
];

const sectionLabels: Partial<Record<SectionKey, string>> = {
  [SectionKey.HIGHLIGHTS]: t('Highlights'),
  [SectionKey.STACKTRACE]: t('Stack Trace'),
  [SectionKey.EXCEPTION]: t('Stack Trace'),
  [SectionKey.THREADS]: t('Stack Trace'),
  [SectionKey.REPLAY]: t('Replay'),
  [SectionKey.BREADCRUMBS]: t('Breadcrumbs'),
  [SectionKey.TRACE]: t('Trace'),
  [SectionKey.TAGS]: t('Tags'),
  [SectionKey.CONTEXTS]: t('Context'),
  [SectionKey.USER_FEEDBACK]: t('User Feedback'),
  [SectionKey.FEATURE_FLAGS]: t('Flags'),
};

export const MIN_NAV_HEIGHT = 44;

/**
 * A hook that manages which section is currently "active" in the navigation based on scroll position.
 *
 * The hook works by:
 * 1. Comparing each section's distance from a fixed activation offset (default 100px from viewport top)
 * 2. Setting the section closest to this offset as active
 * 3. Special handling for when user scrolls near bottom of page to force last section active
 *
 * This provides more stable navigation highlighting compared to intersection observers since it:
 * - Uses a single point of comparison (distance from activation offset) rather than complex intersection ratios
 * - Prevents rapid section changes when scrolling quickly
 * - Ensures the last section becomes active when reaching bottom of page
 *
 * @param sectionKeys - Array of section identifiers that can be activated
 * @param activationOffset - Distance from top of viewport to check section positions against (default 100px)
 */
function useActiveSectionUpdater(sectionKeys: SectionKey[], activationOffset = 100) {
  const {dispatch} = useIssueDetails();

  const handleScroll = useCallback(() => {
    // Special case: When near bottom of page, force the last section to be active
    // This ensures users can see they've reached the end of content
    const bottomThreshold = 50;
    const isNearBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - bottomThreshold;

    if (isNearBottom && sectionKeys.length > 0) {
      const lastSectionKey = sectionKeys[sectionKeys.length - 1];
      if (lastSectionKey) {
        dispatch({
          type: 'UPDATE_SECTION_VISIBILITY',
          sectionId: lastSectionKey,
          ratio: 1,
        });
        return;
      }
    }

    // Normal case: Find section closest to activation offset
    // Track minimum distance found so far and corresponding section
    let activeKey = null;
    let minDiff = Infinity;

    // Compare each section's distance from activation offset
    sectionKeys.forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        const {top} = element.getBoundingClientRect();
        // Calculate absolute distance from activation offset
        const diff = Math.abs(top - activationOffset);
        // Update active section if this one is closer
        if (diff < minDiff) {
          minDiff = diff;
          activeKey = key;
        }
      }
    });

    // If we found a closest section, dispatch update to mark it active
    if (activeKey) {
      dispatch({
        type: 'UPDATE_SECTION_VISIBILITY',
        sectionId: activeKey,
        ratio: 1, // Using ratio=1 to indicate this section should be active
      });
    }
  }, [sectionKeys, activationOffset, dispatch]);

  useEffect(() => {
    // Check initial section on mount
    handleScroll();

    // Add passive scroll listener for performance
    window.addEventListener('scroll', handleScroll, {passive: true});
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
}

export const EventTitle = forwardRef<HTMLDivElement, EventNavigationProps>(
  function EventNavigation({event, group, ...props}, ref) {
    const organization = useOrganization();
    const theme = useTheme();

    const {sectionData} = useIssueDetails();
    // Filter sections based on the ordered array and ensure they have labels
    const eventSectionConfigs = ORDERED_SECTIONS.map(key => sectionData[key]).filter(
      (config): config is SectionConfig => Boolean(config && sectionLabels[config.key])
    );

    const [_isEventErrorCollapsed, setEventErrorCollapsed] = useSyncedLocalStorageState(
      getFoldSectionKey(SectionKey.PROCESSING_ERROR),
      true
    );

    const {data: actionableItems} = useActionableItems({
      eventId: event.id,
      orgSlug: organization.slug,
      projectSlug: group.project.slug,
    });

    const hasEventError = actionableItems?.errors && actionableItems.errors.length > 0;

    const baseEventsPath = `/organizations/${organization.slug}/issues/${group.id}/events/`;

    const grayText = css`
      color: ${theme.subText};
      font-weight: ${theme.fontWeightNormal};
    `;

    const host = organization.links.regionUrl;
    const jsonUrl = `${host}/api/0/projects/${organization.slug}/${group.project.slug}/events/${event.id}/json/`;

    const downloadJson = () => {
      window.open(jsonUrl);
      trackAnalytics('issue_details.event_json_clicked', {
        organization,
        group_id: parseInt(`${event.groupID}`, 10),
        streamline: true,
      });
    };

    const {onClick: copyLink} = useCopyToClipboard({
      successMessage: t('Event URL copied to clipboard'),
      text: window.location.origin + normalizeUrl(`${baseEventsPath}${event.id}/`),
      onCopy: () =>
        trackAnalytics('issue_details.copy_event_link_clicked', {
          organization,
          ...getAnalyticsDataForGroup(group),
          ...getAnalyticsDataForEvent(event),
          streamline: true,
        }),
    });

    const {onClick: copyEventId} = useCopyToClipboard({
      successMessage: t('Event ID copied to clipboard'),
      text: event.id,
      onCopy: () =>
        trackAnalytics('issue_details.copy_event_id_clicked', {
          organization,
          ...getAnalyticsDataForGroup(group),
          ...getAnalyticsDataForEvent(event),
          streamline: true,
        }),
    });

    // Get section keys from configs, they are guaranteed to be SectionKey
    const eventSectionKeys = eventSectionConfigs.map(config => config.key);
    useActiveSectionUpdater(eventSectionKeys);

    return (
      <div {...props} ref={ref}>
        <EventInfoJumpToWrapper>
          <EventInfo>
            <DropdownMenu
              trigger={(triggerProps, isOpen) => (
                <EventIdDropdownButton
                  {...triggerProps}
                  aria-label={t('Event actions')}
                  size="sm"
                  borderless
                  isOpen={isOpen}
                >
                  {getShortEventId(event.id)}
                </EventIdDropdownButton>
              )}
              position="bottom-start"
              offset={4}
              size="xs"
              items={[
                {
                  key: 'copy-event-id',
                  label: t('Copy Event ID'),
                  onAction: copyEventId,
                },
                {
                  key: 'copy-event-link',
                  label: t('Copy Event Link'),
                  onAction: copyLink,
                },
                {
                  key: 'view-json',
                  label: t('View JSON'),
                  onAction: downloadJson,
                  className: 'hidden-sm hidden-md hidden-lg',
                },
              ]}
            />
            <StyledTimeSince
              tooltipBody={<EventCreatedTooltip event={event} />}
              tooltipProps={{maxWidth: 300, isHoverable: true}}
              date={event.dateCreated ?? event.dateReceived}
              css={grayText}
              aria-label={t('Event timestamp')}
            />
            <JsonLinkWrapper className="hidden-xs">
              <Divider />
              <JsonLink
                href={jsonUrl}
                onClick={() =>
                  trackAnalytics('issue_details.event_json_clicked', {
                    organization,
                    group_id: parseInt(`${event.groupID}`, 10),
                    streamline: true,
                  })
                }
              >
                {t('JSON')}
              </JsonLink>
            </JsonLinkWrapper>
            {hasEventError && (
              <Fragment>
                <Divider />
                <ProcessingErrorButton
                  title={t(
                    'Sentry has detected configuration issues with this event. Click for more info.'
                  )}
                  borderless
                  size="zero"
                  icon={<IconWarning color="red300" />}
                  onClick={() => {
                    document
                      .getElementById(SectionKey.PROCESSING_ERROR)
                      ?.scrollIntoView({block: 'start', behavior: 'smooth'});
                    setEventErrorCollapsed(false);
                  }}
                >
                  {t('Processing Error')}
                </ProcessingErrorButton>
              </Fragment>
            )}
          </EventInfo>
          {eventSectionConfigs.length > 0 && (
            <JumpTo>
              <div aria-hidden>{t('Jump to:')}</div>
              <ScrollCarousel gap={0.25} aria-label={t('Jump to section links')}>
                {eventSectionConfigs.map(config => (
                  <EventNavigationLink
                    key={config.key}
                    config={config}
                    propCss={grayText}
                  />
                ))}
              </ScrollCarousel>
            </JumpTo>
          )}
        </EventInfoJumpToWrapper>
      </div>
    );
  }
);

function EventNavigationLink({
  config,
  propCss,
}: {
  config: SectionConfig;
  propCss: SerializedStyles;
}) {
  const theme = useTheme();
  const [_isCollapsed, setIsCollapsed] = useSyncedLocalStorageState(
    getFoldSectionKey(config.key),
    config?.initialCollapse ?? false
  );
  const {activeSection} = useIssueDetails();

  const activeCss = css`
    color: ${theme.activeText} !important;
    font-weight: ${theme.fontWeightBold};
  `;

  const isActive = activeSection === config.key;

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      setIsCollapsed(false);

      const targetElement = document.getElementById(config.key);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const targetTop = rect.top + window.scrollY;
        window.scrollTo({
          top: targetTop - 100, // 100px activation offset
          behavior: 'smooth',
        });
      }
    },
    [config.key, setIsCollapsed]
  );

  return (
    <LinkButton
      to={{
        ...location,
        hash: `#${config.key}`,
      }}
      onClick={handleClick}
      borderless
      size="xs"
      css={[propCss, isActive && activeCss]}
      data-active={isActive ? 'true' : 'false'}
      analyticsEventName="Issue Details: Jump To Clicked"
      analyticsEventKey="issue_details.jump_to_clicked"
      analyticsParams={{section: config.key}}
    >
      {sectionLabels[config.key]}
    </LinkButton>
  );
}

const StyledTimeSince = styled(TimeSince)`
  color: ${p => p.theme.subText};
  font-weight: ${p => p.theme.fontWeightNormal};
  white-space: nowrap;
`;

const EventInfoJumpToWrapper = styled('div')`
  display: flex;
  gap: ${space(1)};
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0 ${space(2)} 0 ${space(0.5)};
  flex-wrap: wrap;
  min-height: ${MIN_NAV_HEIGHT}px;
  @media (min-width: ${p => p.theme.breakpoints.small}) {
    flex-wrap: nowrap;
  }
  border-bottom: 1px solid ${p => p.theme.translucentBorder};
`;

const EventIdDropdownButton = styled(DropdownButton)`
  padding-right: ${space(0.5)};
`;

const EventInfo = styled('div')`
  display: flex;
  gap: ${space(0.5)};
  flex-direction: row;
  align-items: center;
  line-height: 1.2;
`;

const JumpTo = styled('div')`
  display: flex;
  gap: ${space(1)};
  flex-direction: row;
  align-items: center;
  color: ${p => p.theme.subText};
  font-size: ${p => p.theme.fontSizeSmall};
  white-space: nowrap;
  max-width: 100%;
  @media (min-width: ${p => p.theme.breakpoints.small}) {
    max-width: 50%;
  }
`;

const ProcessingErrorButton = styled(Button)`
  color: ${p => p.theme.red300};
  font-weight: ${p => p.theme.fontWeightNormal};
  font-size: ${p => p.theme.fontSizeSmall};
  :hover {
    color: ${p => p.theme.red300};
  }
`;

const JsonLinkWrapper = styled('div')`
  display: flex;
  gap: ${space(0.5)};
`;

const JsonLink = styled(ExternalLink)`
  color: ${p => p.theme.gray300};
  text-decoration: underline;
  text-decoration-color: ${p => p.theme.translucentGray200};

  :hover {
    color: ${p => p.theme.gray300};
  }
`;
