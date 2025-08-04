import type { Meta, StoryObj } from '@storybook/nextjs';
import OnboardingModal from '../components/OnboardingModal';

// GLOBAL FETCH MOCK FOR STORYBOOK
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/api/onboarding')) {
      return Promise.resolve(new Response(JSON.stringify({ success: true, message: 'Data saved successfully' }), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
      }));
    }
    return originalFetch(input, init);
  };
}

const meta: Meta<typeof OnboardingModal> = {
  title: 'Components/OnboardingModal',
  component: OnboardingModal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A multi-step onboarding modal that starts with contact information collection, then guides users through team information, GitHub integration, and final welcome state.'
      }
    }
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls whether the modal is visible'
    },
    onClose: {
      action: 'closed',
      description: 'Callback when modal is closed'
    },
    initialStep: {
      control: { type: 'number', min: 0, max: 3 },
      description: 'Starting step index (0-3) for the onboarding steps (after contact form)'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Contact Form Story
export const ContactForm: Story = {
  render: () => (
    <OnboardingModal
      isOpen={true}
      onClose={() => {}}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Initial contact form that collects name and email before proceeding to onboarding steps.'
      }
    }
  }
};

// Individual Step Stories (after contact form)
export const TeamSizeStep: Story = {
  render: () => (
    <OnboardingModal
      isOpen={true}
      onClose={() => {}}
      initialStep={0}
      skipContactForm={true}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Team size selection step. User chooses from predefined team size options.'
      }
    }
  }
};

export const DesignerTypeStep: Story = {
  render: () => (
    <OnboardingModal
      isOpen={true}
      onClose={() => {}}
      initialStep={1}
      skipContactForm={true}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Designer type selection step. User identifies their role in the design process.'
      }
    }
  }
};

export const GitHubAccessStep: Story = {
  render: () => (
    <OnboardingModal
      isOpen={true}
      onClose={() => {}}
      initialStep={2}
      skipContactForm={true}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'GitHub integration step. User can connect their GitHub account or copy a request message.'
      }
    }
  }
};

export const FinalStep: Story = {
  render: () => (
    <OnboardingModal
      isOpen={true}
      onClose={() => {}}
      initialStep={3}
      skipContactForm={true}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Final welcome step. Confirms successful onboarding completion.'
      }
    }
  }
};

// Error States
// (Will be refactored in the next step)

// Error State Story
export const ErrorState: Story = {
  render: () => (
    <OnboardingModal
      isOpen={true}
      onClose={() => {}}
      injectedError="Network error occurred"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows error UI by injecting error state directly, no API call required.'
      }
    }
  }
};

export const ContactFormValidationError: Story = {
  render: () => (
    <OnboardingModal
      isOpen={true}
      onClose={() => {}}
      injectedError="Please enter a valid name and email address"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows the contact form with a validation error message (e.g., missing or invalid name/email).'
      }
    }
  }
};

// Loading State Story
export const LoadingState: Story = {
  render: () => (
    <OnboardingModal
      isOpen={true}
      onClose={() => {}}
      injectedLoadingState={true}
      injectedName="John Doe"
      injectedEmail="john@example.com"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows the contact form with pre-filled data and the submit button in its loading state, displaying the spinner and disabled button.'
      }
    }
  }
};
