'use client';

import { useState, useEffect } from 'react';
import type { OnboardingData } from '@/types/database';

interface OnboardingStep {
  id: string;
  title: string;
  question: string;
  type: 'email' | 'select' | 'text' | 'github' | 'final' | 'contact';
  options?: string[];
  placeholder?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'teamSize',
    title: 'Team Size',
    question: 'How many designers + engineers are in your company?',
    type: 'select',
    options: ['1-5', '6-10', '11-25', '26-50', '50+']
  },
  {
    id: 'designerType',
    title: 'Role',
    question: 'What is your role?',
    type: 'select',
    options: ['UX/UI Designer', 'Engineer', 'PM', 'Founder', 'Interaction Designer', 'Other']
  },
  {
    id: 'githubAccess',
    title: 'GitHub Access',
    question: 'Connect Github Repo',
    type: 'github'
  },
  {
    id: 'final',
    title: 'Welcome!',
    question: 'You\'re all set up!',
    type: 'final'
  }
];

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: number;
  skipContactForm?: boolean;
}

export default function OnboardingModal({ isOpen, onClose, initialStep = 0, skipContactForm = false }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    email: '',
    teamSize: '',
    designerType: '',
    githubAccess: false
  });
  const [error, setError] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(!skipContactForm);
  const [showJumpAhead, setShowJumpAhead] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Update current step when initialStep prop changes
  useEffect(() => {
    setCurrentStep(initialStep);
  }, [initialStep]);

  // Listen for injectState events
  useEffect(() => {
    const handleInjectState = (event: CustomEvent) => {
      const { isOpen, skipContactForm: skipContact, initialStep: step, data: injectedData, error: injectedError } = event.detail;
      
      if (isOpen) {
        if (injectedData) {
          setData(injectedData);
        }
        if (injectedError) {
          setError(injectedError);
        }
        setShowContactForm(!skipContact);
        setCurrentStep(step || 0);
        setShowJumpAhead(false);
      }
    };

    // Add event listener
    document.addEventListener('injectState', handleInjectState as EventListener);
    
    // Cleanup
    return () => {
      document.removeEventListener('injectState', handleInjectState as EventListener);
    };
  }, []);

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const saveOnboardingData = async (currentData: OnboardingData, stepName: string) => {
    try {
      
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to save onboarding data');
      }

      return true;
    } catch (error) {
      console.error(`Save failed: ${stepName}`, error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  };

  const handleContactSubmit = async () => {
    setError(null);
    
    if (!data.name || data.name.trim().length === 0 || !data.email || !data.email.includes('@')) {
      setError('Please enter a valid name and email address');
      return;
    }

    const saveSuccess = await saveOnboardingData(data, 'contact');
    
    if (saveSuccess) {
      setShowContactForm(false);
      setShowJumpAhead(true);
    }
  };

  const handleJumpAhead = () => {
    setShowJumpAhead(false);
    setCurrentStep(0); // Start with the first step (teamSize)
  };

  const handleNext = async () => {
    setError(null); // Clear previous errors
    
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      const stepName = ONBOARDING_STEPS[currentStep].id;
      
      // Skip API call for GitHub access step since it doesn't need Loops update
      if (stepName === 'githubAccess') {
        setCurrentStep(currentStep + 1);
        return;
      }
      
      const saveSuccess = await saveOnboardingData(data, stepName);
      
      if (saveSuccess) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      const saveSuccess = await saveOnboardingData(data, 'final');
      if (saveSuccess) {
        onClose();
      }
    }
  };

  const handleSkip = () => {
    if (currentStepData.id === 'githubAccess') {
      setData(prev => ({ ...prev, githubAccess: false }));
      // Skip API call for GitHub access step since it doesn't need Loops update
      setCurrentStep(currentStep + 1);
      return;
    }
    handleNext();
  };

  const handleInputChange = (value: string) => {
    setData(prev => ({ ...prev, [currentStepData.id]: value }));
  };

  const handleGitHubConnect = () => {
    setData(prev => ({ ...prev, githubAccess: true }));
    
    // Skip API call for GitHub access step since it doesn't need Loops update
    // Just proceed to next step
    setCurrentStep(currentStep + 1);
    
    // Start GitHub OAuth flow
    const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/github/callback?returnTo=onboarding`;
    const scope = 'repo user';
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
    
    window.location.href = githubAuthUrl;
  };

  const handleCopyRequestMessage = async () => {
    const message = `Hey!

I'd like to try Fiddle for Design QA. That way I can submit design QA as PRs instead of Jira tickets. We won't waste hours of Engineering time on small visual bugs!

📋 What we need: GitHub repo access 

Can you complete the flow for the private beta here -> https://fiddle.is/? Thanks! 🙏`;

    try {
      await navigator.clipboard.writeText(message);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = message;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }
  };

  const canProceed = () => {
    switch (currentStepData.id) {
      case 'teamSize':
      case 'designerType':
        return data[currentStepData.id as keyof OnboardingData] !== '';
      case 'githubAccess':
      case 'final':
        return true;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  // Show contact form first
  if (showContactForm) {
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
                value={data.name}
                onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && data.name && data.email && data.email.includes('@')) {
                    handleContactSubmit();
                  }
                }}
                placeholder="Enter your full name"
                className="w-full p-3 border border-gray-700 bg-[#111111] text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-[#FF3001] focus:border-[#FF3001] outline-none transition-colors"
              />
              <input
                type="email"
                value={data.email}
                onChange={(e) => setData(prev => ({ ...prev, email: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && data.name && data.email && data.email.includes('@')) {
                    handleContactSubmit();
                  }
                }}
                placeholder="Enter your email address"
                className="w-full p-3 border border-gray-700 bg-[#111111] text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-[#FF3001] focus:border-[#FF3001] outline-none transition-colors"
              />
            </div>
          </div>

          {/* Footer with Submit Button */}
          <div className="p-6 border-t border-gray-800">
            <button
              onClick={handleContactSubmit}
              disabled={!data.name || !data.email || !data.email.includes('@')}
              className="w-full px-6 py-3 bg-[#FF3001] text-white rounded-lg hover:bg-[#FF3001]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Submit <span style={{ opacity: '0.6' }}>↵</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show jump ahead prompt
  if (showJumpAhead) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className="bg-[#040404] border border-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Welcome!</h2>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="text-center space-y-4">
              <p className="text-lg text-white">Want faster access?</p>
              <button
                onClick={handleJumpAhead}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleJumpAhead();
                  }
                }}
                tabIndex={0}
                autoFocus
                className="w-full px-6 py-3 bg-[#FF3001] text-white rounded-lg hover:bg-[#FF3001]/80 transition-colors"
              >
                Jump Ahead <span style={{ opacity: '0.6' }}>↵</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

          {currentStepData.type === 'text' && (
            <input
              type="text"
              value={data.name}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && canProceed()) {
                  await handleNext();
                }
              }}
              placeholder={currentStepData.placeholder}
              className="w-full p-3 border border-gray-700 bg-[#111111] text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-[#FF3001] focus:border-[#FF3001] outline-none transition-colors"
            />
          )}

          {currentStepData.type === 'email' && (
            <input
              type="email"
              value={data.email}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && canProceed()) {
                  await handleNext();
                }
              }}
              placeholder={currentStepData.placeholder}
              className="w-full p-3 border border-gray-700 bg-[#111111] text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-[#FF3001] focus:border-[#FF3001] outline-none transition-colors"
            />
          )}

          {currentStepData.type === 'select' && currentStepData.options && (
            <div className="space-y-2">
              {currentStepData.options.map((option) => (
                <button
                  key={option}
                  onClick={async () => {
                    handleInputChange(option);
                    setTimeout(async () => {
                      await handleNext();
                    }, 100); // slight delay to ensure state update
                  }}
                  className={`w-full p-3 text-left border rounded-lg transition-colors ${
                    data[currentStepData.id as keyof OnboardingData] === option
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
              <div className="space-y-3">
                <button
                  onClick={handleGitHubConnect}
                  className="w-full bg-[#FF3001] hover:bg-[#FF3001]/70 text-white p-3 rounded-lg transition-colors"
                >
                  Connect GitHub Account
                </button>
                
                <div className="relative">
                  <div className="relative p-4 rounded-lg">
                    <p className="text-sm text-gray-300 mb-3">
                      Don&apos;t have GitHub access? Request it from your team:
                    </p>
                    <button
                      onClick={handleCopyRequestMessage}
                      className={`w-full p-3 rounded-lg transition-colors ${
                        copiedToClipboard 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                    >
                      {copiedToClipboard ? '✓ Copied to clipboard!' : '📋 Copy request message'}
                    </button>
                  </div>
                </div>
                
                <p
                  onClick={handleSkip}
                  className="w-full text-gray-400 hover:text-white p-3 rounded-lg hover:border-gray-600 transition-colors cursor-pointer text-center"
                >
                  Skip for now
                </p>
              </div>
            </div>
          )}

          {currentStepData.type === 'final' && (
            <div 
              className="text-center space-y-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNext();
                }
              }}
              tabIndex={0}
              autoFocus
            >
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-sm text-gray-500">
                While you wait for access, we made a ball for you to fiddle with (get it?) on your mac!
              </p>
              <div className="pt-4">
                <a
                  href="/ball.dmg"
                  download
                  className="inline-block px-6 py-3 bg-[#FF3001] text-white rounded-lg hover:bg-[#FF3001]/80 transition-colors"
                >
                  Download Fiddle Ball
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Progress - Hidden on final step */}
        {currentStepData.type !== 'final' && (
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
          </div>
        )}
      </div>
    </div>
  );
} 