import pick from 'lodash/pick';
import * as qs from 'query-string';

import {URL_PARAM} from 'sentry/constants/pageFilters';

const DEFAULT_STATUS = 'unresolved';

/**
 * Get query for API given the current location.search string
 */
export function getQuery(search: string) {
  const query = qs.parse(search);

  const status = typeof query.status === 'undefined' ? DEFAULT_STATUS : query.status;

  const queryParams = {
    status,
    ...pick(query, ['cursor', ...Object.values(URL_PARAM)]),
  };

  return queryParams;
}
