import {OrganizationFixture} from 'sentry-fixture/organization';
import {UserFixture} from 'sentry-fixture/user';

import {render, screen, userEvent, waitFor} from 'sentry-test/reactTestingLibrary';

import {OnboardingStatus} from 'sentry/components/sidebar/onboardingStatus';
import {SidebarPanelKey} from 'sentry/components/sidebar/types';
import {OnboardingTaskKey} from 'sentry/types/onboarding';
import type {Organization} from 'sentry/types/organization';

function renderMockRequests(organization: Organization) {
  const getOnboardingTasksMock = MockApiClient.addMockResponse({
    url: `/organizations/${organization.slug}/onboarding-tasks/`,
    method: 'GET',
    body: {
      onboardingTasks: organization.onboardingTasks,
    },
  });

  return {getOnboardingTasksMock};
}

describe('Onboarding Status', function () {
  it('panel is collapsed and has pending tasks to be seen', async function () {
    const organization = OrganizationFixture({
      features: ['onboarding'],
      onboardingTasks: [
        {
          task: OnboardingTaskKey.FIRST_PROJECT,
          status: 'complete',
          user: UserFixture(),
          completionSeen: undefined,
          dateCompleted: undefined,
        },
      ],
    });

    const {getOnboardingTasksMock} = renderMockRequests(organization);

    const handleShowPanel = jest.fn();

    render(
      <OnboardingStatus
        currentPanel=""
        onShowPanel={handleShowPanel}
        hidePanel={jest.fn()}
        collapsed
        orientation="left"
      />,
      {
        organization,
      }
    );

    expect(screen.getByText('1 completed task')).toBeInTheDocument();
    expect(screen.getByTestId('pending-seen-indicator')).toBeInTheDocument();

    // By hovering over the button, we should refetch the data
    await userEvent.hover(screen.getByRole('button', {name: 'Onboarding'}));
    await waitFor(() => expect(getOnboardingTasksMock).toHaveBeenCalled());

    // Open the panel
    await userEvent.click(screen.getByRole('button', {name: 'Onboarding'}));
    await waitFor(() => expect(getOnboardingTasksMock).toHaveBeenCalled());
    expect(handleShowPanel).toHaveBeenCalled();
  });

  it('panel is expanded and has no pending tasks to be seen', async function () {
    const organization = OrganizationFixture({
      features: ['onboarding'],
      onboardingTasks: [
        {
          task: OnboardingTaskKey.FIRST_PROJECT,
          status: 'complete',
          user: UserFixture(),
          completionSeen: '2024-12-16T14:52:01.385227Z',
          dateCompleted: '2024-12-13T09:35:05.010028Z',
        },
      ],
    });

    const {getOnboardingTasksMock} = renderMockRequests(organization);

    const handleHidePanel = jest.fn();

    render(
      <OnboardingStatus
        currentPanel={SidebarPanelKey.ONBOARDING_WIZARD}
        onShowPanel={jest.fn()}
        hidePanel={handleHidePanel}
        collapsed={false}
        orientation="left"
      />,
      {
        organization,
      }
    );

    expect(screen.getByText('1 completed task')).toBeInTheDocument();

    // Do not show the pending indicator
    expect(screen.queryByTestId('pending-seen-indicator')).not.toBeInTheDocument();

    // Shows the panel
    expect(screen.getByText('Quick Setup')).toBeInTheDocument();

    // Triggers a fetch request
    expect(getOnboardingTasksMock).toHaveBeenCalled();

    // Hide Panel
    await userEvent.click(screen.getByLabelText('Close Panel'));
    await waitFor(() => expect(handleHidePanel).toHaveBeenCalled());
  });
});
