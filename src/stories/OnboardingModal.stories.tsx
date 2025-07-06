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

// Wrapper that shows the contact form
const ContactFormWrapper = () => {
  const [isOpen, setIsOpen] = useState(true);

  // Override fetch for mocking
  if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url === '/api/onboarding') {
        return mockFetch(mockApiResponses.success, 500);
      }
      return originalFetch(input, init);
    };
  }

  return (
    <OnboardingModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
    />
  );
};

// Wrapper that shows a specific step by pre-filling data and skipping to that step
const StepWrapper = ({ stepIndex }: {
  stepIndex: number;
}) => {
  // Override fetch for mocking
  if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url === '/api/onboarding') {
        return mockFetch(mockApiResponses.success, 500);
      }
      return originalFetch(input, init);
    };
  }

  // Create a modified component that bypasses contact form
  const ModifiedOnboardingModal = () => {
    const [currentStep, setCurrentStep] = useState(stepIndex);
    const [data, setData] = useState({
      name: 'John Doe',
      email: 'john@example.com',
      teamSize: '',
      designerType: '',
      teamLocation: '',
      techStack: '',
      githubAccess: false
    });
    const [error] = useState<string | null>(null);

    // Mock the steps data
    const ONBOARDING_STEPS = [
      {
        id: 'teamSize',
        title: 'Team Size',
        question: 'How huge is your team?',
        type: 'select',
        options: ['1-5 people', '6-10 people', '11-25 people', '26-50 people', '50+ people']
      },
      {
        id: 'designerType',
        title: 'Design Role',
        question: 'What kind of designer are you?',
        type: 'select',
        options: ['UI/UX Designer', 'Product Designer', 'Visual Designer', 'Interaction Designer', 'Design Systems Designer', 'Other']
      },
      {
        id: 'teamLocation',
        title: 'Team Location',
        question: 'Where is your team located?',
        type: 'select',
        options: ['United States', 'Europe', 'Asia', 'Remote/Global', 'Other']
      },
      {
        id: 'techStack',
        title: 'Tech Stack',
        question: 'What technologies do you primarily work with?',
        type: 'select',
        options: ['React/Next.js', 'Vue.js', 'Angular', 'Svelte', 'Vanilla JavaScript', 'Python/Django', 'Ruby on Rails', 'PHP/Laravel', 'Mobile (React Native/Flutter)', 'Other']
      },
      {
        id: 'githubAccess',
        title: 'GitHub Access',
        question: 'Would you like to connect your GitHub account for enhanced features?',
        type: 'github'
      },
      {
        id: 'final',
        title: 'Welcome!',
        question: 'You\'re all set up!',
        type: 'final'
      }
    ];

    const currentStepData = ONBOARDING_STEPS[currentStep];
    const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

    const handleInputChange = (value: string) => {
      setData(prev => ({ ...prev, [currentStepData.id]: value }));
    };

    const handleGitHubConnect = () => {
      setData(prev => ({ ...prev, githubAccess: true }));
      setCurrentStep(currentStep + 1);
    };

    const handleSkip = () => {
      setData(prev => ({ ...prev, githubAccess: false }));
      setCurrentStep(currentStep + 1);
    };

    const handleBack = () => {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    };

    const canProceed = () => {
      switch (currentStepData.id) {
        case 'teamSize':
        case 'designerType':
        case 'teamLocation':
        case 'techStack':
          return data[currentStepData.id as keyof typeof data] !== '';
        case 'githubAccess':
        case 'final':
          return true;
        default:
          return false;
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className="bg-[#040404] border border-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{currentStepData.title}</h2>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <p className="text-lg mb-6 text-white">{currentStepData.question}</p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
                {error}
              </div>
            )}

            {currentStepData.type === 'select' && currentStepData.options && (
              <div className="space-y-2">
                {currentStepData.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleInputChange(option)}
                    className={`w-full p-3 text-left border rounded-lg transition-colors ${
                      data[currentStepData.id as keyof typeof data] === option
                        ? 'border-[#FF3001] bg-[#FF3001]/10 text-[#FF3001]'
                        : 'border-gray-700 bg-[#111111] text-white hover:border-gray-600 hover:bg-[#1a1a1a]'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {currentStepData.type === 'github' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Connecting your GitHub account will allow us to provide personalized recommendations and access to your repositories.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={handleGitHubConnect}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg transition-colors"
                  >
                    Connect GitHub Account
                  </button>
                  <button
                    onClick={handleSkip}
                    className="w-full text-gray-400 hover:text-white p-3 rounded-lg border border-gray-700 hover:border-gray-600 bg-[#111111] hover:bg-[#1a1a1a] transition-colors"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            )}

            {currentStepData.type === 'final' && (
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-gray-300">
                  Welcome to Fiddle! We&apos;re excited to have you on board. You can now start exploring our platform and connecting with other designers.
                </p>
                <p className="text-sm text-gray-500">
                  You can always update your preferences and connect your GitHub account later from your profile settings.
                </p>
              </div>
            )}
          </div>

          {/* Footer with Progress */}
          <div className="p-6 border-t border-gray-800">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Step {currentStep + 1} of {ONBOARDING_STEPS.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-[#FF3001] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Back
              </button>
              
              {currentStepData.type !== 'github' && currentStepData.type !== 'final' && (
                <button
                  disabled={!canProceed()}
                  className="px-6 py-2 bg-[#FF3001] text-white rounded-lg hover:bg-[#FF3001]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              )}

              {currentStepData.type === 'final' && (
                <button className="px-6 py-2 bg-[#FF3001] text-white rounded-lg hover:bg-[#FF3001]/80 transition-colors">
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return <ModifiedOnboardingModal />;
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
          <p className="text-lg mb-6 text-white">What&apos;s your name and email?</p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <input
              type="text"
              defaultValue="John Doe"
              placeholder="Enter your full name"
              className="w-full p-3 border border-gray-700 bg-[#111111] text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-[#FF3001] focus:border-[#FF3001] outline-none transition-colors"
            />
            <input
              type="email"
              defaultValue="test@example.com"
              placeholder="Enter your email address"
              className="w-full p-3 border border-gray-700 bg-[#111111] text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-[#FF3001] focus:border-[#FF3001] outline-none transition-colors"
            />
          </div>
        </div>

        {/* Footer with Submit Button */}
        <div className="p-6 border-t border-gray-800">
          <button
            className="w-full px-6 py-3 bg-[#FF3001] text-white rounded-lg hover:bg-[#FF3001]/80 transition-colors"
          >
            Submit
          </button>
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
      control: { type: 'number', min: 0, max: 5 },
      description: 'Starting step index (0-5) for the onboarding steps (after contact form)'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Contact Form Story
export const ContactForm: Story = {
  render: () => <ContactFormWrapper />,
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
  render: () => <StepWrapper stepIndex={0} />,
  parameters: {
    docs: {
      description: {
        story: 'Team size selection step. User chooses from predefined team size options.'
      }
    }
  }
};

export const DesignerTypeStep: Story = {
  render: () => <StepWrapper stepIndex={1} />,
  parameters: {
    docs: {
      description: {
        story: 'Designer type selection step. User identifies their role in the design process.'
      }
    }
  }
};

export const TeamLocationStep: Story = {
  render: () => <StepWrapper stepIndex={2} />,
  parameters: {
    docs: {
      description: {
        story: 'Team location selection step. User specifies where their team is located.'
      }
    }
  }
};

export const TechStackStep: Story = {
  render: () => <StepWrapper stepIndex={3} />,
  parameters: {
    docs: {
      description: {
        story: 'Tech stack selection step. User chooses their primary technology stack.'
      }
    }
  }
};

export const GitHubAccessStep: Story = {
  render: () => <StepWrapper stepIndex={4} />,
  parameters: {
    docs: {
      description: {
        story: 'GitHub integration step. User can connect their GitHub account or skip this step.'
      }
    }
  }
};

export const FinalStep: Story = {
  render: () => <StepWrapper stepIndex={5} />,
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
