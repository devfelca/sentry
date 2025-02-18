import styled from '@emotion/styled';

import Count from 'sentry/components/count';
import {Tooltip} from 'sentry/components/tooltip';
import {t, tct} from 'sentry/locale';
import type {Confidence} from 'sentry/types/organization';
import {defined} from 'sentry/utils';

type Props = {
  confidence?: Confidence;
  sampleCount?: number;
  topEvents?: number;
};

export function ConfidenceFooter(props: Props) {
  return <Container>{confidenceMessage(props)}</Container>;
}

function confidenceMessage({sampleCount, confidence, topEvents}: Props) {
  const isTopN = defined(topEvents) && topEvents > 0;
  if (!defined(sampleCount)) {
    return isTopN
      ? t('* Chart for top %s groups extrapolated from \u2026', topEvents)
      : t('* Chart extrapolated from \u2026');
  }

  if (confidence === 'low') {
    return isTopN
      ? tct(
          '* Chart for top [topEvents] groups extrapolated from [sampleCount] sample(s) ([lowAccuracy])',
          {
            topEvents,
            sampleCount: <Count value={sampleCount} />,
            lowAccuracy: <LowAccuracy />,
          }
        )
      : tct('* Chart extrapolated from [sampleCount] sample(s) ([lowAccuracy])', {
          sampleCount: <Count value={sampleCount} />,
          lowAccuracy: <LowAccuracy />,
        });
  }

  return isTopN
    ? tct(
        '* Chart for top [topEvents] groups extrapolated from [sampleCount] sample(s)',
        {
          topEvents,
          sampleCount: <Count value={sampleCount} />,
        }
      )
    : tct('* Chart extrapolated from [sampleCount] sample(s)', {
        sampleCount: <Count value={sampleCount} />,
      });
}

function LowAccuracy() {
  return (
    <Tooltip
      title={t(
        'Increase your sampling rates to get more samples and more accurate trends.'
      )}
    >
      <InsufficientSamples>
        {t('Sampling rate may be low for accuracy')}
      </InsufficientSamples>
    </Tooltip>
  );
}

const InsufficientSamples = styled('span')`
  text-decoration: underline dotted ${p => p.theme.gray300};
`;

const Container = styled('span')`
  color: ${p => p.theme.gray300};
  font-size: ${p => p.theme.fontSizeSmall};
`;
