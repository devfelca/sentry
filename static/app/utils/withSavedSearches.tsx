import type {SavedSearch} from 'sentry/types/group';
import type {RouteComponentProps} from 'sentry/types/legacyReactRouter';
import useOrganization from 'sentry/utils/useOrganization';
import {useParams} from 'sentry/utils/useParams';
import {useFetchGroupSearchViews} from 'sentry/views/issueList/queries/useFetchGroupSearchViews';
import {useFetchSavedSearchesForOrg} from 'sentry/views/issueList/queries/useFetchSavedSearchesForOrg';
import {useSelectedSavedSearch} from 'sentry/views/issueList/utils/useSelectedSavedSearch';

type InjectedSavedSearchesProps = {
  savedSearch: SavedSearch | null;
  savedSearchLoading: boolean;
  savedSearches: SavedSearch[];
  selectedSearchId: string | null;
} & RouteComponentProps<{searchId?: string}, {}>;

/**
 * HOC to provide saved search data to class components.
 * When possible, use the hooks directly instead.
 *
 * Note: this HOC will be completely removed when issue views is GA'd, but until then
 * we have to augment it to support both saved searches and issue views.
 */
function withSavedSearches<P extends InjectedSavedSearchesProps>(
  WrappedComponent: React.ComponentType<P>
) {
  return function (
    props: Omit<P, keyof InjectedSavedSearchesProps> & Partial<InjectedSavedSearchesProps>
  ) {
    const organization = useOrganization();
    const {data: savedSearches, isPending} = useFetchSavedSearchesForOrg(
      {
        orgSlug: organization.slug,
      },
      {enabled: !organization.features.includes('issue-stream-custom-views')}
    );
    const {data: groupSearchViews, isPending: areViewsPending} = useFetchGroupSearchViews(
      {
        orgSlug: organization.slug,
      },
      {enabled: organization.features.includes('issue-stream-custom-views')}
    );

    const params = useParams();
    const selectedSavedSearch = useSelectedSavedSearch();

    return (
      <WrappedComponent
        {...(props as P)}
        savedSearches={props.savedSearches ?? savedSearches}
        savedSearchLoading={
          organization.features.includes('issue-stream-custom-views')
            ? areViewsPending
            : props.savedSearchLoading ?? isPending
        }
        savedSearch={
          organization.features.includes('issue-stream-custom-views') && groupSearchViews
            ? groupSearchViews[0]
            : props.savedSearch ?? selectedSavedSearch
        }
        selectedSearchId={params.searchId ?? null}
      />
    );
  };
}

export default withSavedSearches;
