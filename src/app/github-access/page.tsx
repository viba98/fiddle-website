'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import OnboardingModal from '@/components/OnboardingModal';

// Define types for test results
interface GitHubTestResults {
  tests?: {
    user?: {
      login: string;
      name: string;
      email: string;
    };
    organizations?: Array<{
      login: string;
    }>;
    first_org_repos?: {
      org_name: string;
      repos: Array<{
        name: string;
        private: boolean;
      }>;
    };
    first_repo_file_tree?: Record<string, unknown>;
    first_repo_details?: {
      name: string;
    };
  };
  error?: string;
}

export default function GitHubAccess() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [testResults, setTestResults] = useState<GitHubTestResults | null>(null);
  const [testing, setTesting] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const checkUser = async () => {
      if (!supabase) {
        console.error('Supabase client not initialized');
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
      
      // Check URL params for onboarding
      const urlParams = new URLSearchParams(window.location.search);
      const showOnboardingParam = urlParams.get('showOnboarding');
      
      // If no user, show onboarding immediately
      if (!user) {
        setShowOnboarding(true);
      } else if (showOnboardingParam === 'true') {
        // User is authenticated and wants to continue onboarding
        setShowOnboarding(true);
      }
    };

    checkUser();

    // Listen for auth changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  const handleConnectGitHub = () => {
    if (!user || !supabase) {
      return;
    }
    
    // User is already authenticated with GitHub, so we can proceed
    // to get additional GitHub permissions (like repo access)
    try {
      // Redirect to our custom GitHub OAuth flow for additional permissions
      const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      const redirectUri = `${window.location.origin}/auth/github/callback`;
      const scope = 'repo user';
      
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
      
      window.location.href = githubAuthUrl;
    } catch (error) {
      console.error('GitHub Access - OAuth error:', error);
    }
  };

  const handleTestGitHubAccess = async () => {
    if (!user || !supabase) {
      return;
    }

    setTesting(true);
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No session token available');
      }

      const response = await fetch('/api/github/test', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults({ error: 'Test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleStartOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
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
      <div className="text-center max-w-2xl">
        <h1 className="text-2xl mb-4">GitHub Access</h1>
        
        {!user ? (
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">Welcome! Let&apos;s get you started with onboarding.</p>
            <button 
              onClick={handleStartOnboarding} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
            >
              Start Onboarding
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-4">
              <p className="text-green-600 mb-2">Signed in as: {user.email || user.user_metadata?.github_username}</p>
              <button 
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Sign Out
              </button>
            </div>
            
            <div className="space-y-2">
              <button 
                onClick={handleStartOnboarding}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded mr-2"
              >
                Start Onboarding
              </button>
              
              <button 
                onClick={handleConnectGitHub} 
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded mr-2"
              >
                Connect GitHub (Get Repo Access)
              </button>
              
              <button 
                onClick={handleTestGitHubAccess}
                disabled={testing}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50"
              >
                {testing ? 'Testing...' : 'Test GitHub Access'}
              </button>
            </div>

            {testResults && (
              <div className="mt-8 p-4 bg-gray-100 rounded">
                <h3 className="font-semibold mb-2">Test Results:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        <OnboardingModal 
          isOpen={showOnboarding} 
          onClose={handleOnboardingClose} 
        />
      </div>
    </div>
  );
}
