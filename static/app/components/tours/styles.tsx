import {ClassNames, useTheme} from '@emotion/react';
import styled from '@emotion/styled';

import {Button} from 'sentry/components/button';
import {Hovercard} from 'sentry/components/hovercard';
import {useIssueDetailsTour} from 'sentry/components/tours/issueDetails';
import type {
  TourContextType,
  TourEnumType,
  TourStep,
} from 'sentry/components/tours/tourContext';
import {IconClose} from 'sentry/icons';
import {t} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import type {UseHoverOverlayProps} from 'sentry/utils/useHoverOverlay';

export function TourBlurContainer({children}: {children: React.ReactNode}) {
  const {tour} = useIssueDetailsTour();
  const isTourActive = tour.currentStep !== null;

  return (
    <BlurContainer>
      {children}
      {isTourActive && <BlurWindow />}
    </BlurContainer>
  );
}

export interface TourElementProps<T extends TourEnumType> {
  children: React.ReactNode;
  step: TourStep<T>;
  tourContext: TourContextType<T>;
  position?: UseHoverOverlayProps['position'];
}

export function TourElement<T extends TourEnumType>({
  children,
  step,
  tourContext,
  position,
}: TourElementProps<T>) {
  const theme = useTheme();
  const {tour, dispatch} = tourContext;
  const {orderedStepIds} = tour;
  const currentStepIndex = tour.currentStep
    ? orderedStepIds.indexOf(tour.currentStep.id)
    : -1;
  const hasPreviousStep = currentStepIndex > 0;
  const hasNextStep = currentStepIndex < orderedStepIds.length - 1;
  return (
    <ClassNames>
      {({css}) => (
        <TourHovercard
          skipWrapper
          forceVisible
          tipColor={'black'}
          bodyClassName={css`
            padding: ${space(1.5)} ${space(2)};
          `}
          position={position}
          body={
            <TourContent>
              <TopRow>
                <div>
                  {currentStepIndex + 1}/{orderedStepIds.length}
                </div>
                <div>
                  <TourCloseButton
                    onClick={() => dispatch({type: 'END_TOUR'})}
                    icon={<IconClose style={{color: theme.inverted.textColor}} />}
                    aria-label={t('Close')}
                    borderless
                    size="sm"
                  />
                </div>
              </TopRow>
              <TitleRow>{step.title}</TitleRow>
              <DescriptionRow>{step.description}</DescriptionRow>
              <ActionRow>
                {hasPreviousStep && (
                  <ActionButton
                    size="xs"
                    onClick={() => dispatch({type: 'PREVIOUS_STEP'})}
                  >
                    {t('Previous')}
                  </ActionButton>
                )}
                {hasNextStep ? (
                  <ActionButton size="xs" onClick={() => dispatch({type: 'NEXT_STEP'})}>
                    {t('Next')}
                  </ActionButton>
                ) : (
                  <ActionButton size="xs" onClick={() => dispatch({type: 'END_TOUR'})}>
                    {t('Finish tour')}
                  </ActionButton>
                )}
              </ActionRow>
            </TourContent>
          }
        >
          <TourWrapper>{children}</TourWrapper>
        </TourHovercard>
      )}
    </ClassNames>
  );
}

const BlurContainer = styled('div')`
  position: relative;
`;

const BlurWindow = styled('div')`
  position: absolute;
  inset: 0;
  content: '';
  z-index: ${p => p.theme.zIndex.modal};
  user-select: none;
  backdrop-filter: blur(3px);
  overscroll-behavior: none;
`;

const TourWrapper = styled('div')`
  position: relative;
  z-index: ${p => p.theme.zIndex.tooltip};
  &:after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: ${p => p.theme.borderRadius};
    box-shadow: inset 0 0 0 3px ${p => p.theme.subText};
  }
`;

const TourHovercard = styled(Hovercard)`
  background: ${p => p.theme.inverted.surface400};
  color: ${p => p.theme.inverted.textColor};
`;

const TourContent = styled('div')`
  display: flex;
  flex-direction: column;
  gap: ${space(0.75)};
`;

const TourCloseButton = styled(Button)`
  padding: 0;
  height: 14px;
  min-height: 14px;
`;

const TopRow = styled('div')`
  display: flex;
  height: 18px;
  justify-content: space-between;
  align-items: center;
  color: ${p => p.theme.inverted.textColor};
  font-size: ${p => p.theme.fontSizeSmall};
  font-weight: ${p => p.theme.fontWeightBold};
  opacity: 0.6;
`;

const TitleRow = styled('div')`
  display: flex;
  font-size: ${p => p.theme.fontSizeExtraLarge};
  font-weight: ${p => p.theme.fontWeightBold};
`;

const DescriptionRow = styled('div')`
  display: flex;
`;

const ActionRow = styled('div')`
  display: flex;
  justify-content: flex-end;
  gap: ${space(1)};
`;

const ActionButton = styled(Button)`
  font-size: ${p => p.theme.fontSizeSmall};
  border: 0;
`;
