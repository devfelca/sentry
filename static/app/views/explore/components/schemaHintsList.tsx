import {useCallback, useMemo} from 'react';
import styled from '@emotion/styled';

import {Button} from 'sentry/components/button';
import {getHasTag} from 'sentry/components/events/searchBar';
import {getFunctionTags} from 'sentry/components/performance/spanSearchQueryBuilder';
import {t, tct} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import type {Tag, TagCollection} from 'sentry/types/group';
import {type AggregationKey, FieldKind} from 'sentry/utils/fields';
import {
  useExploreQuery,
  useSetExploreQuery,
} from 'sentry/views/explore/contexts/pageParamsContext';

interface SchemaHintsListProps {
  numberTags: TagCollection;
  stringTags: TagCollection;
  supportedAggregates: AggregationKey[];
}

function SchemaHintsList({
  supportedAggregates,
  numberTags,
  stringTags,
}: SchemaHintsListProps) {
  const query = useExploreQuery();
  const setQuery = useSetExploreQuery();

  const functionTags = useMemo(() => {
    return getFunctionTags(supportedAggregates);
  }, [supportedAggregates]);

  const filterTags: TagCollection = useMemo(() => {
    const tags: TagCollection = {...functionTags, ...numberTags, ...stringTags};
    tags.has = getHasTag({...stringTags});
    return tags;
  }, [numberTags, stringTags, functionTags]);

  // TODO: need to sort them by section to have same order as in the query builder

  const filterTagsWithoutTagPrefix = useMemo(() => {
    return Object.keys(filterTags)
      .map(tag => filterTags[tag])
      .filter(tag => !tag?.key.startsWith('tags['));
  }, [filterTags]);

  // only show 8 tags for now until we have a better way to decide to display them
  const first8Tags = useMemo(() => {
    return filterTagsWithoutTagPrefix.slice(0, 8);
  }, [filterTagsWithoutTagPrefix]);

  const handleHintSelected = useCallback(
    (hint: Tag | undefined) => {
      if (!hint) {
        return;
      }
      if (hint.kind === FieldKind.MEASUREMENT) {
        setQuery(`${query} ${hint.key}:>0`);
      } else {
        setQuery(`${query} ${hint.key}:""`);
      }
    },
    [query, setQuery]
  );

  return (
    <SchemaHintsContainer>
      <HintsWrapper>
        {first8Tags.map(tag => (
          <SchemaHintOption key={tag?.key} onClick={() => handleHintSelected(tag)}>
            {tct(`[tag] [operator] ...`, {
              tag: tag?.key,
              operator: tag?.kind === FieldKind.MEASUREMENT ? '>' : 'is',
            })}
          </SchemaHintOption>
        ))}
      </HintsWrapper>
      <SchemaHintOption style={{flexShrink: 0}}>{t('See full list')}</SchemaHintOption>
    </SchemaHintsContainer>
  );
}

export default SchemaHintsList;

const SchemaHintsContainer = styled('div')`
  gap: ${space(1)};
  max-width: 100%;
  display: grid;
  grid-template-columns: 1fr auto;
`;

const HintsWrapper = styled('div')`
  display: flex;
  flex-direction: row;
  gap: ${space(1)};
  overflow: hidden;
`;

const SchemaHintOption = styled(Button)`
  border: 1px solid ${p => p.theme.innerBorder};
  border-radius: 4px;
  font-size: ${p => p.theme.fontSizeSmall};
  font-weight: ${p => p.theme.fontWeightNormal};
  display: flex;
  padding: ${space(0.5)} ${space(1)};
  align-content: center;
  min-height: 0;
  height: 24px;
  flex-wrap: wrap;

  /* Ensures that filters do not grow outside of the container */
  min-width: min-content;

  &[aria-selected='true'] {
    background-color: ${p => p.theme.gray100};
  }
`;
