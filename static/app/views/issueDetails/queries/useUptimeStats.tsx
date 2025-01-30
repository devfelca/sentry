import type {TimeWindowConfig} from 'sentry/components/checkInTimeline/types';
import {useApiQuery} from 'sentry/utils/queryClient';
import useOrganization from 'sentry/utils/useOrganization';
import type {UptimeBucket} from 'sentry/views/monitors/types';

interface Options {
  /**
   * The window configuration object
   */
  timeWindowConfig: TimeWindowConfig;
  /**
   * The list of uptime rule IDs to fetch stats for
   */
  uptimeRuleIds: string[];
}

/**
 * Fetches Uptime stats
 */
export function useUptimeStats({uptimeRuleIds, timeWindowConfig}: Options) {
  const {start, end, timelineWidth} = timeWindowConfig;
  console.log({start, end, timelineWidth});

  const selectionQuery = {
    since: Math.floor(start.getTime() / 1000),
    until: Math.floor(end.getTime() / 1000),
    // TODO(leander): Update to use dynamic resolution when possible
  };

  const organization = useOrganization();

  const uptimeStatsQueryKey = `/organizations/${organization.slug}/uptime-stats/`;

  return useApiQuery<Record<string, UptimeBucket[]>>(
    [
      uptimeStatsQueryKey,
      {
        query: {
          projectUptimeSubscriptionId: uptimeRuleIds,
          ...selectionQuery,
        },
      },
    ],
    {
      staleTime: 0,
      enabled: timelineWidth > 0,
    }
  );
}
