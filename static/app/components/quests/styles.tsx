import {Fragment} from 'react';
import styled from '@emotion/styled';

import {Button} from 'sentry/components/button';
import {useIssueDetailsQuest} from 'sentry/components/quests/issueDetails';
import {IconClose} from 'sentry/icons';
import {t} from 'sentry/locale';
import {space} from 'sentry/styles/space';

export function QuestBlurContainer({children}: {children: React.ReactNode}) {
  const {quest, dispatch: questDispatch} = useIssueDetailsQuest();
  const isQuestActive = quest.currentStep !== null;

  return (
    <Fragment>
      <BlurContainer>
        {children}
        {isQuestActive && <BlurWindow />}
        {isQuestActive && (
          <CompleteQuestButton
            onClick={() => questDispatch({type: 'COMPLETE_QUEST'})}
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
