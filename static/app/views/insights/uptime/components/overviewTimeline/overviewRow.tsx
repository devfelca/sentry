import {css} from '@emotion/react';
import styled from '@emotion/styled';
import pick from 'lodash/pick';

import {CheckInPlaceholder} from 'sentry/components/checkInTimeline/checkInPlaceholder';
import {CheckInTimeline} from 'sentry/components/checkInTimeline/checkInTimeline';
import type {TimeWindowConfig} from 'sentry/components/checkInTimeline/types';
import ActorBadge from 'sentry/components/idBadge/actorBadge';
import ProjectBadge from 'sentry/components/idBadge/projectBadge';
import Link from 'sentry/components/links/link';
import {IconTimer, IconUser} from 'sentry/icons';
import {t} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import getDuration from 'sentry/utils/duration/getDuration';
import {useLocation} from 'sentry/utils/useLocation';
import useOrganization from 'sentry/utils/useOrganization';
import useProjectFromSlug from 'sentry/utils/useProjectFromSlug';
import type {UptimeAlert} from 'sentry/views/alerts/types';

import {checkStatusPrecedent, statusToText, tickStyle} from '../../timelineConfig';
import {useUptimeMonitorStats} from '../../utils/useUptimeMonitorStats';

interface Props {
  timeWindowConfig: TimeWindowConfig;
  uptimeAlert: UptimeAlert;
}

export function OverviewRow({uptimeAlert, timeWindowConfig}: Props) {
  const organization = useOrganization();
  const project = useProjectFromSlug({
    organization,
    projectSlug: uptimeAlert.projectSlug,
  });

  const location = useLocation();
  const query = pick(location.query, ['start', 'end', 'statsPeriod', 'environment']);

  const {data: uptimeStats, isPending} = useUptimeMonitorStats({
    ruleIds: [uptimeAlert.id],
    timeWindowConfig,
  });

  return (
    <TimelineRow key={uptimeAlert.id}>
      <DetailsArea>
        <DetailsLink
          to={{
            pathname: `/organizations/${organization.slug}/alerts/rules/uptime/${uptimeAlert.projectSlug}/${uptimeAlert.id}/details/`,
            query,
          }}
        >
          <DetailsHeadline>
            <Name>{uptimeAlert.name}</Name>
          </DetailsHeadline>
          <DetailsContainer>
            <OwnershipDetails>
              {project && <ProjectBadge project={project} avatarSize={12} disableLink />}
              {uptimeAlert.owner ? (
                <ActorBadge actor={uptimeAlert.owner} avatarSize={12} />
              ) : (
                <UnassignedLabel>
                  <IconUser size="xs" />
                  {t('Unassigned')}
                </UnassignedLabel>
              )}
            </OwnershipDetails>
            <ScheduleDetails>
              <IconTimer size="xs" />
              {t('Checked every %s', getDuration(uptimeAlert.intervalSeconds))}
            </ScheduleDetails>
          </DetailsContainer>
        </DetailsLink>
      </DetailsArea>
      <TimelineContainer>
        {isPending ? (
          <CheckInPlaceholder />
        ) : (
          <CheckInTimeline
            bucketedData={uptimeStats?.[uptimeAlert.id] ?? []}
            statusLabel={statusToText}
            statusStyle={tickStyle}
            statusPrecedent={checkStatusPrecedent}
            timeWindowConfig={timeWindowConfig}
          />
        )}
      </TimelineContainer>
    </TimelineRow>
  );
}

const DetailsLink = styled(Link)`
  display: block;
  padding: ${space(3)};
  color: ${p => p.theme.textColor};

  &:focus-visible {
    outline: none;
  }
`;

const DetailsArea = styled('div')`
  border-right: 1px solid ${p => p.theme.border};
  border-radius: 0;
  position: relative;
`;

const DetailsHeadline = styled('div')`
  display: grid;
  gap: ${space(1)};
  grid-template-columns: 1fr minmax(30px, max-content);
`;

const DetailsContainer = styled('div')`
  display: flex;
  flex-direction: column;
  gap: ${space(0.5)};
`;

const OwnershipDetails = styled('div')`
  display: flex;
  gap: ${space(0.75)};
  align-items: center;
  color: ${p => p.theme.subText};
  font-size: ${p => p.theme.fontSizeSmall};
`;

const UnassignedLabel = styled('div')`
  display: flex;
  gap: ${space(0.5)};
  align-items: center;
`;

const Name = styled('h3')`
  font-size: ${p => p.theme.fontSizeLarge};
  word-break: break-word;
  margin-bottom: ${space(0.5)};
`;

const ScheduleDetails = styled('small')`
  display: flex;
  gap: ${space(0.5)};
  align-items: center;
  color: ${p => p.theme.subText};
  font-size: ${p => p.theme.fontSizeSmall};
`;

interface TimelineRowProps {
  isDisabled?: boolean;
  singleMonitorView?: boolean;
}

const TimelineRow = styled('li')<TimelineRowProps>`
  grid-column: 1/-1;
  display: grid;
  grid-template-columns: subgrid;

  ${p =>
    !p.singleMonitorView &&
    css`
      transition: background 50ms ease-in-out;

      &:nth-child(odd) {
        background: ${p.theme.backgroundSecondary};
      }
      &:hover {
        background: ${p.theme.backgroundTertiary};
      }
      &:has(*:focus-visible) {
        background: ${p.theme.backgroundTertiary};
      }
    `}

  /* Disabled monitors become more opaque */
  --disabled-opacity: ${p => (p.isDisabled ? '0.6' : 'unset')};

  &:last-child {
    border-bottom-left-radius: ${p => p.theme.borderRadius};
    border-bottom-right-radius: ${p => p.theme.borderRadius};
  }
`;

const TimelineContainer = styled('div')`
  display: flex;
  align-items: center;
  padding: ${space(3)} 0;
  grid-column: 2/-1;
  opacity: var(--disabled-opacity);
`;
