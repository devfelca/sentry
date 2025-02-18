import {render, screen, userEvent} from 'sentry-test/reactTestingLibrary';

import {sampleLatencyTimeSeries} from './fixtures/sampleLatencyTimeSeries';
import {sampleSpanDurationTimeSeries} from './fixtures/sampleSpanDurationTimeSeries';
import {BarChartWidget} from './barChartWidget';

describe('BarChartWidget', () => {
  describe('Layout', () => {
    it('Renders', () => {
      render(
        <BarChartWidget
          title="eps()"
          description="Number of events per second"
          timeSeries={[sampleLatencyTimeSeries, sampleSpanDurationTimeSeries]}
        />
      );
    });
  });

  describe('Visualization', () => {
    it('Explains missing data', () => {
      jest.spyOn(console, 'error').mockImplementation();
      render(<BarChartWidget />);

      expect(screen.getByText('No Data')).toBeInTheDocument();
      jest.resetAllMocks();
    });
  });

  describe('State', () => {
    it('Shows a loading placeholder', () => {
      render(<BarChartWidget isLoading />);

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('Loading state takes precedence over error state', () => {
      render(
        <BarChartWidget isLoading error={new Error('Parsing error of old value')} />
      );

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('Shows an error message', () => {
      render(<BarChartWidget error={new Error('Uh oh')} />);

      expect(screen.getByText('Error: Uh oh')).toBeInTheDocument();
    });

    it('Shows a retry button', async () => {
      const onRetry = jest.fn();

      render(<BarChartWidget error={new Error('Oh no!')} onRetry={onRetry} />);

      await userEvent.click(screen.getByRole('button', {name: 'Retry'}));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('Hides other actions if there is an error and a retry handler', () => {
      const onRetry = jest.fn();

      render(
        <BarChartWidget
          error={new Error('Oh no!')}
          onRetry={onRetry}
          actions={[
            {
              key: 'Open in Discover',
              to: '/discover',
            },
          ]}
        />
      );

      expect(screen.getByRole('button', {name: 'Retry'})).toBeInTheDocument();
      expect(
        screen.queryByRole('link', {name: 'Open in Discover'})
      ).not.toBeInTheDocument();
    });
  });
});
