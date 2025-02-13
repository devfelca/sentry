import {OrganizationFixture} from 'sentry-fixture/organization';

import {renderWithOnboardingLayout} from 'sentry-test/onboarding/renderWithOnboardingLayout';
import {screen} from 'sentry-test/reactTestingLibrary';
import {textWithMarkupMatcher} from 'sentry-test/utils';

import {ProductSolution} from 'sentry/components/onboarding/gettingStartedDoc/types';

import docs from './nestjs';

describe('Nest.js onboarding docs', function () {
  it('renders onboarding docs correctly', () => {
    renderWithOnboardingLayout(docs);

    // Renders main headings
    expect(screen.getByRole('heading', {name: 'Install'})).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Configure SDK'})).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Upload Source Maps'})).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Verify'})).toBeInTheDocument();

    // Includes import statement
    const allMatches = screen.getAllByText(
      textWithMarkupMatcher(/import \{ SentryModule } from '@sentry\/nestjs\/setup'/)
    );
    allMatches.forEach(match => {
      expect(match).toBeInTheDocument();
    });
  });

  it('includes root module', () => {
    renderWithOnboardingLayout(docs);

    expect(
      screen.getByText(textWithMarkupMatcher(/SentryModule\.forRoot\(\)/))
    ).toBeInTheDocument();
  });

  it('displays sample rates by default', () => {
    renderWithOnboardingLayout(docs, {
      selectedProducts: [
        ProductSolution.ERROR_MONITORING,
        ProductSolution.PERFORMANCE_MONITORING,
        ProductSolution.PROFILING,
      ],
    });

    expect(
      screen.getByText(textWithMarkupMatcher(/tracesSampleRate/))
    ).toBeInTheDocument();
    expect(
      screen.getByText(textWithMarkupMatcher(/profilesSampleRate/))
    ).toBeInTheDocument();
  });

  it('enables performance setting the tracesSampleRate to 1', () => {
    renderWithOnboardingLayout(docs, {
      selectedProducts: [
        ProductSolution.ERROR_MONITORING,
        ProductSolution.PERFORMANCE_MONITORING,
      ],
    });

    expect(
      screen.getByText(textWithMarkupMatcher(/tracesSampleRate: 1\.0/))
    ).toBeInTheDocument();
  });

  it('enables profiling by setting profiling samplerates', () => {
    renderWithOnboardingLayout(docs, {
      selectedProducts: [ProductSolution.ERROR_MONITORING, ProductSolution.PROFILING],
    });

    expect(
      screen.getByText(
        textWithMarkupMatcher(
          /import \{ nodeProfilingIntegration } from "@sentry\/profiling-node"/
        )
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(textWithMarkupMatcher(/profilesSampleRate: 1\.0/))
    ).toBeInTheDocument();
  });

  it('continuous profiling', () => {
    const organization = OrganizationFixture({
      features: ['continuous-profiling'],
    });

    renderWithOnboardingLayout(
      docs,
      {},
      {
        organization,
      }
    );

    expect(
      screen.getByText(
        textWithMarkupMatcher(
          /import \{ nodeProfilingIntegration } from "@sentry\/profiling-node"/
        )
      )
    ).toBeInTheDocument();

    // Profiles sample rate should not be set for continuous profiling
    expect(
      screen.queryByText(textWithMarkupMatcher(/profilesSampleRate: 1\.0/))
    ).not.toBeInTheDocument();

    // Should have start and stop profiling calls
    expect(
      screen.getByText(textWithMarkupMatcher(/Sentry.profiler.startProfiler/))
    ).toBeInTheDocument();
    expect(
      screen.getByText(textWithMarkupMatcher(/Sentry.profiler.stopProfiler/))
    ).toBeInTheDocument();
  });
});
