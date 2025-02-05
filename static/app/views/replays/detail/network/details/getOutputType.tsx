import {isRequestFrame} from 'sentry/utils/replays/resourceFrame';
import type {SectionProps} from 'sentry/views/replays/detail/network/details/sections';
import type {TabKey} from 'sentry/views/replays/detail/network/details/tabs';

export enum Output {
  SETUP = 'setup',
  UNSUPPORTED = 'unsupported',
  URL_SKIPPED = 'url_skipped',
  BODY_SKIPPED = 'body_skipped',
  DATA = 'data',
}

type Args = {
  isSetup: boolean;
  item: SectionProps['item'];
  visibleTab: TabKey;
};

export default function getOutputType({isSetup, item, visibleTab}: Args): Output {
  if (!isRequestFrame(item)) {
    return Output.UNSUPPORTED;
  }

  if (!isSetup) {
    return Output.SETUP;
  }

  const request = item.data.request;
  const response = item.data.response;

  const hasHeaders =
    Object.keys(request?.headers ?? {}).length ||
    Object.keys(response?.headers ?? {}).length;
  if (hasHeaders && visibleTab === 'details') {
    return Output.DATA;
  }

  const hasBody = request?.body || response?.body;
  if (hasBody && ['request', 'response'].includes(visibleTab)) {
    return Output.DATA;
  }

  const reqWarnings = request?._meta?.warnings ?? [];
  const respWarnings = response?._meta?.warnings ?? [];
  const isReqUrlSkipped =
    !request?._meta?.warnings || reqWarnings.includes('URL_SKIPPED');
  const isRespUrlSkipped =
    !response?._meta?.warnings || respWarnings.includes('URL_SKIPPED');

  if (isReqUrlSkipped || isRespUrlSkipped) {
    return Output.URL_SKIPPED;
  }

  if (['request', 'response'].includes(visibleTab)) {
    // @ts-expect-error TS(2345): Argument of type '"BODY_SKIPPED"' is not assignabl... Remove this comment to see the full error message
    const isReqBodySkipped = reqWarnings.includes('BODY_SKIPPED');
    // @ts-expect-error TS(2345): Argument of type '"BODY_SKIPPED"' is not assignabl... Remove this comment to see the full error message
    const isRespBodySkipped = respWarnings.includes('BODY_SKIPPED');
    if (isReqBodySkipped || isRespBodySkipped) {
      return Output.BODY_SKIPPED;
    }
  }

  return Output.DATA;
}
