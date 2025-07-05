import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState, useEffect } from 'react';
import OnboardingModal from '../components/OnboardingModal';

// Type definitions
interface ApiResponse {
  success?: boolean;
  error?: string;
  message?: string;
}

// Mock API responses
const mockApiResponses: Record<string, ApiResponse> = {
  success: { success: true, message: 'Data saved successfully' },
  error: { error: 'Failed to save data', message: 'Network error occurred' },
  validationError: { error: 'Invalid email format', message: 'Please enter a valid email address' }
};

// Mock fetch function that returns a proper Response object
const mockFetch = (response: ApiResponse, delay: number = 500): Promise<Response> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockResponse = new Response(JSON.stringify(response), {
        status: response.error ? 400 : 200,
        statusText: response.error ? 'Bad Request' : 'OK',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      resolve(mockResponse);
    }, delay);
  });
};  

// Wrapper component to handle modal state
const OnboardingModalWrapper = ({ 
  initialStep = 0, 
  mockResponse = mockApiResponses.success,
  mockDelay = 500,
  showError = false 
}: {
  initialStep?: number;
  mockResponse?: ApiResponse;
  mockDelay?: number;
  showError?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  // Override fetch for mocking
  if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url === '/api/onboarding') {
        return mockFetch(showError ? mockApiResponses.error : mockResponse, mockDelay);
      }
      return originalFetch(input, init);
    };
  }

  return (
    <OnboardingModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      initialStep={initialStep}
    />
  );
};

// Wrapper component that shows error immediately
const ErrorModalWrapper = () => {
  const [error, setError] = useState<string | null>(null);

  // Override fetch to always return error
  if (typeof window !== 'undefined') {
    window.fetch = () => {
      return Promise.resolve(new Response(JSON.stringify({ 
        error: 'Network error occurred', 
        message: 'Failed to connect to server' 
      }), {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          'Content-Type': 'application/json',
        },
      }));
    };
  }

  // Show error immediately
  useEffect(() => {
    setError('Network error occurred');
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#040404] border border-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Contact Information</h2>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <p className="text-lg mb-6 text-white">What&apos;s your email address?</p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <input
            type="email"
            defaultValue="test@example.com"
            placeholder="Enter your email address"
            className="w-full p-3 border border-gray-700 bg-[#111111] text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-[#FF3001] focus:border-[#FF3001] outline-none transition-colors"
          />
        </div>

        {/* Footer with Progress */}
        <div className="p-6 border-t border-gray-800">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Step 1 of 7</span>
              <span>14%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-[#FF3001] h-2 rounded-full transition-all duration-300"
                style={{ width: '14%' }}
              />
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              disabled={true}
              className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Back
            </button>
            
            <button
              disabled={false}
              className="px-6 py-2 bg-[#FF3001] text-white rounded-lg hover:bg-[#FF3001]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof OnboardingModal> = {
  title: 'Components/OnboardingModal',
  component: OnboardingModal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A multi-step onboarding modal that guides users through the signup process. Includes email collection, team information, GitHub integration, and final welcome state.'
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
      control: { type: 'number', min: 0, max: 6 },
      description: 'Starting step index (0-6)'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;



// Individual Step Stories
export const EmailStep: Story = {
  render: () => <OnboardingModalWrapper initialStep={0} />,
  parameters: {
    docs: {
      description: {
        story: 'Email collection step with validation. User must enter a valid email address to proceed.'
      }
    }
  }
};

export const TeamSizeStep: Story = {
  render: () => <OnboardingModalWrapper initialStep={1} />,
  parameters: {
    docs: {
      description: {
        story: 'Team size selection step. User chooses from predefined team size options.'
      }
    }
  }
};

export const DesignerTypeStep: Story = {
  render: () => <OnboardingModalWrapper initialStep={2} />,
  parameters: {
    docs: {
      description: {
        story: 'Designer type selection step. User identifies their role in the design process.'
      }
    }
  }
};

export const TeamLocationStep: Story = {
  render: () => <OnboardingModalWrapper initialStep={3} />,
  parameters: {
    docs: {
      description: {
        story: 'Team location selection step. User specifies where their team is located.'
      }
    }
  }
};

export const TechStackStep: Story = {
  render: () => <OnboardingModalWrapper initialStep={4} />,
  parameters: {
    docs: {
      description: {
        story: 'Tech stack selection step. User chooses their primary technology stack.'
      }
    }
  }
};

export const GitHubAccessStep: Story = {
  render: () => <OnboardingModalWrapper initialStep={5} />,
  parameters: {
    docs: {
      description: {
        story: 'GitHub integration step. User can connect their GitHub account or skip this step.'
      }
    }
  }
};

export const FinalStep: Story = {
  render: () => <OnboardingModalWrapper initialStep={6} />,
  parameters: {
    docs: {
      description: {
        story: 'Final welcome step. Confirms successful onboarding completion.'
      }
    }
  }
};

// Error States
export const ErrorState: Story = {
  render: () => <ErrorModalWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Shows error handling when API calls fail. Displays error message to user immediately without requiring user interaction.'
      }
    }
  }
};
