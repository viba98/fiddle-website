'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import OnboardingModal from '@/components/OnboardingModal';

// Import the onboarding steps from the modal component
const ONBOARDING_STEPS = [
  { id: 'email' },
  { id: 'teamSize' },
  { id: 'designerType' },
  { id: 'teamLocation' },
  { id: 'githubAccess' },
  { id: 'final' }
];

export default function GitHubAccess() {
  const [loading, setLoading] = useState(true);
  const [onboardingInitialStep, setOnboardingInitialStep] = useState(0);

  useEffect(() => {
    // Check if user is already authenticated
    const checkUser = async () => {
      if (!supabase) {
        console.error('Supabase client not initialized');
        setLoading(false);
        return;
      }

      await supabase.auth.getUser();
      setLoading(false);
      
      // Check URL params for onboarding
      const urlParams = new URLSearchParams(window.location.search);
      const stepParam = urlParams.get('step');
      
      // If step=final, we should show the final step
      if (stepParam === 'final') {
        // Find the index of the final step
        const finalStepIndex = ONBOARDING_STEPS.findIndex(step => step.id === 'final');
        setOnboardingInitialStep(finalStepIndex >= 0 ? finalStepIndex : 0);
      }
    };

    checkUser();

    // Listen for auth changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
        // We don't need to track user state for this flow
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const handleOnboardingClose = () => {
    // Onboarding completed, redirect to main app or dashboard
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <OnboardingModal 
        isOpen={true} 
        onClose={handleOnboardingClose} 
        initialStep={onboardingInitialStep}
      />
    </div>
  );
}
