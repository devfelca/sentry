import {useEffect, useMemo, useRef, useState} from 'react';
import styled from '@emotion/styled';
import debounce from 'lodash/debounce';

import {Button} from 'sentry/components/button';
import {getHasTag} from 'sentry/components/events/searchBar';
import {getFunctionTags} from 'sentry/components/performance/spanSearchQueryBuilder';
import {space} from 'sentry/styles/space';
import type {TagCollection} from 'sentry/types/group';
import type {AggregationKey} from 'sentry/utils/fields';

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
  const schemaHintsContainerRef = useRef<HTMLDivElement>(null);

  const functionTags = useMemo(() => {
    return getFunctionTags(supportedAggregates);
  }, [supportedAggregates]);

  const filterTags: TagCollection = useMemo(() => {
    const tags: TagCollection = {...functionTags, ...numberTags, ...stringTags};
    tags.has = getHasTag({...stringTags});
    return tags;
  }, [numberTags, stringTags, functionTags]);

  const filterTagsList = useMemo(() => {
    return Object.keys(filterTags).map(tag => filterTags[tag]);
  }, [filterTags]);

  const [visibleHints, setVisibleHints] = useState(filterTagsList);

  useEffect(() => {
    // debounce calculation to prevent 'flickering' when resizing
    const calculateVisibleHints = debounce(() => {
      if (!schemaHintsContainerRef.current) {
        return;
      }

      const containerWidth = schemaHintsContainerRef.current.clientWidth;
      let currentWidth = 0;
      const gap = 8;
      const averageHintWidth = 250;

      const visibleItems = filterTagsList.filter((_hint, index) => {
        const element = schemaHintsContainerRef.current?.children[index] as HTMLElement;
        if (!element) {
          // add in a new hint if there is enough space
          if (containerWidth - currentWidth >= averageHintWidth) {
            currentWidth += averageHintWidth + (index > 0 ? gap : 0);
            return true;
          }
          return false;
        }

        const itemWidth = element.offsetWidth;
        currentWidth += itemWidth + (index > 0 ? gap : 0);

        return currentWidth <= containerWidth;
      });

      setVisibleHints(visibleItems);
    }, 100);

    // initial calculation
    calculateVisibleHints();

    const resizeObserver = new ResizeObserver(calculateVisibleHints);
    if (schemaHintsContainerRef.current) {
      resizeObserver.observe(schemaHintsContainerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [filterTagsList]);

  return (
    <SchemaHintsContainer ref={schemaHintsContainerRef}>
      {visibleHints.map((hint, index) => (
        <SchemaHintOption
          key={index}
          data-type={hint?.key}
        >{`${hint?.key} is ...`}</SchemaHintOption>
      ))}
    </SchemaHintsContainer>
  );
}

export default SchemaHintsList;

const SchemaHintsContainer = styled('div')`
  display: flex;
  flex-direction: row;
  gap: ${space(1)};
  flex-wrap: nowrap;
  overflow: hidden;

  > * {
    flex-shrink: 0;
  }
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
  min-width: 0;

  &[aria-selected='true'] {
    background-color: ${p => p.theme.gray100};
  }
`;
