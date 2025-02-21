import {Fragment, useEffect, useState} from 'react';
import styled from '@emotion/styled';
import {Reorder} from 'framer-motion';
import type {Location} from 'history';
import isEqual from 'lodash/isEqual';

import {useNavContext} from 'sentry/components/nav/context';
import IssueViewNavEditableTitle from 'sentry/components/nav/issueViews/issueViewNavEditableTitle';
import {IssueViewNavEllipsisMenu} from 'sentry/components/nav/issueViews/issueViewNavEllipsisMenu';
import {constructViewLink} from 'sentry/components/nav/issueViews/issueViewNavItems';
import {IssueViewNavQueryCount} from 'sentry/components/nav/issueViews/issueViewNavQueryCount';
import IssueViewProjectIcons from 'sentry/components/nav/issueViews/issueViewProjectIcons';
import {SecondaryNav} from 'sentry/components/nav/secondary';
import {normalizeDateTimeParams} from 'sentry/components/organizations/pageFilters/parse';
import {Tooltip} from 'sentry/components/tooltip';
import {t} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import {defined} from 'sentry/utils';
import oxfordizeArray from 'sentry/utils/oxfordizeArray';
import {useLocation} from 'sentry/utils/useLocation';
import {useNavigate} from 'sentry/utils/useNavigate';
import useOrganization from 'sentry/utils/useOrganization';
import useProjects from 'sentry/utils/useProjects';
import {normalizeProjectsEnvironments} from 'sentry/views/issueList/issueViewsHeaderPF';
import type {
  IssueViewPF,
  IssueViewPFParams,
} from 'sentry/views/issueList/issueViewsPF/issueViewsPF';
import {IssueSortOptions} from 'sentry/views/issueList/utils';

export interface IssueViewNavItemContentProps {
  /**
   * A callback function that deletes the view.
   */
  deleteView: () => void;
  /**
   * A callback function that duplicates the view.
   */
  duplicateView: () => void;
  /**
   * Whether the item is active.
   */
  isActive: boolean;
  /**
   * A callback function that updates the view with new params.
   */
  updateView: (updatedView: IssueViewPF) => void;
  /**
   * The issue view to display
   */
  view: IssueViewPF;
  /**
   * Ref to the body of the section that contains the reorderable items.
   * This is used as the portal container for the ellipsis menu, and as
   * the dragging constraint for each nav item.
   */
  sectionRef?: React.RefObject<HTMLDivElement>;
}

export function IssueViewNavItemContent({
  view,
  sectionRef,
  isActive,
  updateView,
  deleteView,
  duplicateView,
}: IssueViewNavItemContentProps) {
  const organization = useOrganization();
  const location = useLocation();
  const navigate = useNavigate();

  const baseUrl = `/organizations/${organization.slug}/issues`;
  const [isEditing, setIsEditing] = useState(false);

  const {projects} = useProjects();

  useEffect(() => {
    if (isActive) {
      if (Object.keys(location.query).length === 0) {
        navigate(constructViewLink(baseUrl, view), {replace: true});
        return;
      }
      const unsavedChanges = hasUnsavedChanges(view, location.query);

      if (unsavedChanges && !isEqual(unsavedChanges, view.unsavedChanges)) {
        updateView({
          ...view,
          unsavedChanges,
        });
      } else if (!unsavedChanges && view.unsavedChanges) {
        updateView({
          ...view,
          unsavedChanges: undefined,
        });
      }
    }
    return;
  }, [view, isActive, location.query, navigate, baseUrl, updateView]);

  const projectPlatforms = projects
    .filter(p => view.projects.map(String).includes(p.id))
    .map(p => p.platform)
    .filter(defined);

  const {isInteracting, setisInteracting} = useNavContext();

  return (
    <Reorder.Item
      as="div"
      dragConstraints={sectionRef}
      dragElastic={0.03}
      dragTransition={{bounceStiffness: 400, bounceDamping: 40}}
      value={view}
      whileDrag={{
        cursor: 'grabbing',
      }}
      onDragStart={() => {
        setisInteracting(true);
      }}
      onDragEnd={() => {
        setisInteracting(false);
      }}
    >
      <StyledSecondaryNavItem
        to={constructViewLink(baseUrl, view)}
        isActive={isActive}
        leadingItems={<IssueViewProjectIcons projectPlatforms={projectPlatforms} />}
        trailingItems={
          <TrailingItemsWrapper
            onClickCapture={e => {
              e.preventDefault();
            }}
          >
            <IssueViewNavQueryCount view={view} />
            <IssueViewNavEllipsisMenu
              setIsEditing={setIsEditing}
              view={view}
              updateView={updateView}
              deleteView={deleteView}
              duplicateView={duplicateView}
              baseUrl={baseUrl}
              sectionRef={sectionRef}
            />
          </TrailingItemsWrapper>
        }
        onPointerDown={e => {
          e.preventDefault();
        }}
        onPointerUp={e => {
          if (isInteracting) {
            e.preventDefault();
          }
        }}
      >
        <IssueViewNavEditableTitle
          label={view.label}
          isEditing={isEditing}
          isSelected={isActive}
          onChange={value => {
            updateView({...view, label: value});
          }}
          setIsEditing={setIsEditing}
        />
        {view.unsavedChanges && (
          <Tooltip
            title={constructUnsavedTooltipTitle(view.unsavedChanges)}
            position="top"
            skipWrapper
          >
            <UnsavedChangesIndicator
              role="presentation"
              data-test-id="unsaved-changes-indicator"
              isActive={isActive}
            />
          </Tooltip>
        )}
      </StyledSecondaryNavItem>
    </Reorder.Item>
  );
}

const READABLE_PARAM_MAPPING = {
  query: t('query'),
  querySort: t('sort'),
  projects: t('projects'),
  environments: t('environments'),
  timeFilters: t('time range'),
};

const constructUnsavedTooltipTitle = (unsavedChanges: Partial<IssueViewPFParams>) => {
  const changedParams = Object.keys(unsavedChanges)
    .filter(k => unsavedChanges[k as keyof IssueViewPFParams] !== undefined)
    .map(k => READABLE_PARAM_MAPPING[k as keyof IssueViewPFParams]);

  return (
    <Fragment>
      {t(
        "This view's %s filters are not saved.",
        <BoldTooltipText>{oxfordizeArray(changedParams)}</BoldTooltipText>
      )}
    </Fragment>
  );
};

// TODO(msun): Once nuqs supports native array query params, we can use that here and replace this absurd function
const hasUnsavedChanges = (
  view: IssueViewPF,
  queryParams: Location['query']
): false | Partial<IssueViewPFParams> => {
  const {
    query: originalQuery,
    querySort: originalSort,
    projects: originalProjects,
    environments: originalEnvironments,
    timeFilters: originalTimeFilters,
  } = view;
  const {
    query: queryQuery,
    sort: querySort,
    project,
    environment,
    start,
    end,
    statsPeriod,
    utc,
  } = queryParams;

  const queryTimeFilters =
    start || end || statsPeriod || utc
      ? {
          start: statsPeriod ? null : start?.toString() ?? null,
          end: statsPeriod ? null : end?.toString() ?? null,
          period: statsPeriod?.toString() ?? null,
          utc: statsPeriod ? null : utc?.toString() === 'true',
        }
      : undefined;

  const {queryEnvs, queryProjects} = normalizeProjectsEnvironments(
    project ?? [],
    environment ?? []
  );

  const issueSortOption = Object.values(IssueSortOptions).includes(
    querySort?.toString() as IssueSortOptions
  )
    ? (querySort as IssueSortOptions)
    : undefined;

  const newUnsavedChanges: Partial<IssueViewPFParams> = {
    query:
      queryQuery !== null &&
      queryQuery !== undefined &&
      queryQuery.toString() !== originalQuery
        ? queryQuery.toString()
        : undefined,
    querySort:
      querySort && issueSortOption !== originalSort ? issueSortOption : undefined,
    projects: !isEqual(queryProjects?.sort(), originalProjects.sort())
      ? queryProjects
      : undefined,
    environments: !isEqual(queryEnvs?.sort(), originalEnvironments.sort())
      ? queryEnvs
      : undefined,
    timeFilters:
      queryTimeFilters &&
      !isEqual(
        normalizeDateTimeParams(originalTimeFilters),
        normalizeDateTimeParams(queryTimeFilters)
      )
        ? queryTimeFilters
        : undefined,
  };

  const hasNoChanges = Object.values(newUnsavedChanges).every(
    value => value === undefined
  );
  if (hasNoChanges) {
    return false;
  }

  return newUnsavedChanges;
};

const TrailingItemsWrapper = styled('div')`
  display: flex;
  align-items: center;
  gap: ${space(0.5)};
  margin-right: ${space(0.5)};
`;

const StyledSecondaryNavItem = styled(SecondaryNav.Item)`
  position: relative;
  padding-right: ${space(0.5)};

  :hover {
    [data-ellipsis-menu-trigger] {
      display: flex;
    }
    [data-issue-view-query-count] {
      display: none;
    }
  }

  [data-ellipsis-menu-trigger][aria-expanded='true'] {
    display: flex;
  }
  &:has([data-ellipsis-menu-trigger][aria-expanded='true'])
    [data-issue-view-query-count] {
    display: none;
  }
`;

const BoldTooltipText = styled('span')`
  font-weight: ${p => p.theme.fontWeightBold};
`;

const UnsavedChangesIndicator = styled('div')<{isActive: boolean}>`
  opacity: ${p => (p.isActive ? 1 : 0)};

  ${StyledSecondaryNavItem}:hover & {
    opacity: ${p => (p.isActive ? 1 : 0.75)};
  }

  border-radius: 50%;
  background: ${p => p.theme.purple400};
  border: solid 2px ${p => p.theme.background};
  position: absolute;
  width: 12px;
  height: 12px;
  top: -3px;
  right: -3px;
`;
