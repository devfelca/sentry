import {Fragment} from 'react';
import styled from '@emotion/styled';

import {Button} from 'sentry/components/button';
import {useIssueDetailsTour} from 'sentry/components/tours/issueDetails';
import {IconClose} from 'sentry/icons';
import {t} from 'sentry/locale';
import {space} from 'sentry/styles/space';

export function TourBlurContainer({children}: {children: React.ReactNode}) {
  const {tour, dispatch: tourDispatch} = useIssueDetailsTour();
  const isTourActive = tour.currentStep !== null;

  return (
    <Fragment>
      <BlurContainer>
        {children}
        {isTourActive && <BlurWindow />}
        {isTourActive && (
          <CompleteQuestButton
            onClick={() => tourDispatch({type: 'END_TOUR'})}
            icon={<IconClose />}
            aria-label={t('Close')}
            borderless
          />
        )}
      </BlurContainer>
    </Fragment>
  );
}

const BlurContainer = styled('div')`
  position: relative;
`;

const CompleteQuestButton = styled(Button)`
  position: fixed;
  z-index: ${p => p.theme.zIndex.tooltip};
  right: ${space(2)};
  top: ${space(1)};
`;

const BlurWindow = styled('div')`
  position: absolute;
  inset: 0;
  content: '';
  z-index: ${p => p.theme.zIndex.modal};
  user-select: none;
  user-zoom: none;
  backdrop-filter: blur(3px);
`;
