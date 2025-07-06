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
    question: 'How many designers are in your company?',
    type: 'select',
    options: ['1-5 designers', '6-10 designers', '11-25 designers', '26-50 designers', '50+ designers']
  },
  {
    id: 'designerType',
    title: 'Design Role',
    question: 'What best describes your job?',
    type: 'select',
    options: ['Design Engineer', 'UX/Product Designer', 'Visual/Graphic Designer', 'Interaction Designer', 'Engineer', 'Founder', 'Student', 'Other']
  },
  {
    id: 'teamLocation',
    title: 'Team Location',
    question: 'Where is your team located?',
    type: 'select',
    options: ['SF', 'NYC', 'US Other', 'Europe', 'Asia', 'Remote/Global', 'Other']
  },
  {
    id: 'techStack',
    title: 'Tech Stack',
    question: 'What is your primary tech stack?',
    type: 'select',
    options: ['React/Next.js', 'Svelte', 'Swift', 'Mobile (React Native/Flutter)', 'Other']
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
    teamLocation: '',
    techStack: '',
    githubAccess: false
  });
  const [error, setError] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(!skipContactForm);
  const [showJumpAhead, setShowJumpAhead] = useState(false);

  // Update current step when initialStep prop changes
  useEffect(() => {
    setCurrentStep(initialStep);
  }, [initialStep]);

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

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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

  const canProceed = () => {
    switch (currentStepData.id) {
      case 'teamSize':
      case 'designerType':
      case 'teamLocation':
      case 'techStack':
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
              Submit
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
                  className="w-full px-6 py-3 bg-[#FF3001] text-white rounded-lg hover:bg-[#FF3001]/80 transition-colors"
                >
                Jump Ahead
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canProceed()) {
                  handleNext();
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canProceed()) {
                  handleNext();
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
                  onClick={() => handleInputChange(option)}
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
            <div 
              className="text-center space-y-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNext();
                }
              }}
              tabIndex={0}
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

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Back
              </button>
              
              {currentStepData.type !== 'github' && (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="px-6 py-2 bg-[#FF3001] text-white rounded-lg hover:bg-[#FF3001]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 