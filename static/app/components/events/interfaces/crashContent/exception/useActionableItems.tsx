import type {Organization, SharedViewOrganization} from 'sentry/types/organization';
import {defined} from 'sentry/utils';
import type {ApiQueryKey} from 'sentry/utils/queryClient';
import {useApiQuery} from 'sentry/utils/queryClient';

import type {ActionableItemErrors} from './actionableItemsUtils';

const actionableItemsQuery = ({
  orgSlug,
  projectSlug,
  eventId,
}: UseActionableItemsProps): ApiQueryKey => [
  `/projects/${orgSlug}/${projectSlug}/events/${eventId}/actionable-items/`,
];

export interface ActionableItemsResponse {
  errors: ActionableItemErrors[];
}

interface UseActionableItemsProps {
  eventId: string;
  orgSlug: string;
  projectSlug: string;
}

export function useActionableItems(props?: UseActionableItemsProps) {
  return useApiQuery<ActionableItemsResponse>(
    props ? actionableItemsQuery(props) : [''],
    {
      staleTime: Infinity,
      retry: false,
      refetchOnWindowFocus: false,
      notifyOnChangeProps: ['data'],
      enabled: defined(props),
    }
  );
}

/**
 * Check we have all required props
 */
export function actionableItemsEnabled({
  eventId,
  organization,
  projectSlug,
}: {
  eventId?: string;
  organization?: Organization | SharedViewOrganization | null;
  projectSlug?: string;
}) {
  if (!organization?.features || !projectSlug || !eventId) {
    return false;
  }
  return true;
}
