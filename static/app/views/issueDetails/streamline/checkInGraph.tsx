import {type CSSProperties, useRef} from 'react';
import styled from '@emotion/styled';

import {CheckInPlaceholder} from 'sentry/components/checkInTimeline/checkInPlaceholder';
import {CheckInTimeline} from 'sentry/components/checkInTimeline/checkInTimeline';
import {useTimeWindowConfig} from 'sentry/components/checkInTimeline/hooks/useTimeWindowConfig';
import type {CheckInBucket, JobTickData} from 'sentry/components/checkInTimeline/types';
import {generateJobTickFromBucketWithStats} from 'sentry/components/checkInTimeline/utils/mergeBuckets';
import type {Event} from 'sentry/types/event';
import type {Group} from 'sentry/types/group';
import type {Project} from 'sentry/types/project';
import {useDimensions} from 'sentry/utils/useDimensions';
import {useUptimeStats} from 'sentry/views/issueDetails/queries/useUptimeStats';
import {
  type CheckInStatus,
  type UptimeBucket,
  UptimeCheckInStatus,
} from 'sentry/views/monitors/types';
import {
  checkInStatusPrecedent,
  statusToText,
  tickStyle,
} from 'sentry/views/monitors/utils';

interface CheckInGraphProps {
  group: Group;
  project: Project;
  className?: string;
  event?: Event;
  style?: CSSProperties;
}

export function CheckInGraph({group, event, project, ...styleProps}: CheckInGraphProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const {width: timelineWidth} = useDimensions<HTMLDivElement>({elementRef});
  const timeWindowConfig = useTimeWindowConfig({timelineWidth});
  const environment = event?.tags?.find(({key}) => key === 'environment')?.value;
  const uptimeRuleId = event?.tags?.find(({key}) => key === 'uptime_rule')?.value;

  const {data: uptimeStats} = useUptimeStats({
    timeWindowConfig,
    uptimeRuleIds: uptimeRuleId ? [uptimeRuleId] : [],
  });

  if (!uptimeStats || !environment || !uptimeRuleId) {
    return <CheckInPlaceholder />;
  }

  const bucketedData = mapUptimeStatsToBucketedData(uptimeStats?.[uptimeRuleId] ?? []);
  const jobTicks: Array<JobTickData<CheckInStatus>> = bucketedData.map<
    JobTickData<CheckInStatus>
  >(generateJobTickFromBucketWithStats);

  return (
    <GraphContainer {...styleProps} ref={elementRef}>
      <CheckInTimeline
        statusLabel={statusToText}
        statusStyle={tickStyle}
        statusPrecedent={checkInStatusPrecedent}
        timeWindowConfig={timeWindowConfig}
        bucketedData={bucketedData}
        jobTicks={jobTicks}
      />
    </GraphContainer>
  );
}

function mapUptimeStatsToBucketedData(
  uptimeBuckets: UptimeBucket[]
): Array<CheckInBucket<CheckInStatus>> {
  return uptimeBuckets.map(([ts, bucket]) => [
    ts,
    {
      in_progress: 0,
      ok: bucket[UptimeCheckInStatus.SUCCESS] ?? 0,
      error: bucket[UptimeCheckInStatus.FAILURE] ?? 0,
      missed: bucket[UptimeCheckInStatus.MISSED_WINDOW] ?? 0,
      timeout: 0,
      unknown: 0,
    },
  ]);
}

const GraphContainer = styled('div')`
  height: 100px;
  width: 100%;
`;
