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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);



  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleConnectGitHub = () => {
    if (!user) {
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
    if (!user) {
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
              <div className="mt-6 text-left bg-gray-100 p-4 rounded">
                <h3 className="font-bold mb-4">GitHub Access Test Results:</h3>
                
                {/* User Info */}
                {testResults.tests?.user && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-blue-600">👤 User Info:</h4>
                    <p>Username: {testResults.tests.user.login}</p>
                    <p>Name: {testResults.tests.user.name}</p>
                    <p>Email: {testResults.tests.user.email}</p>
                  </div>
                )}

                {/* Organizations */}
                <div className="mb-4">
                  <h4 className="font-semibold text-green-600">🏢 Organizations:</h4>
                  {testResults.tests?.organizations && testResults.tests.organizations.length > 0 ? (
                    <div>
                      <p>Found {testResults.tests.organizations.length} organization(s):</p>
                      <ul className="list-disc list-inside ml-4">
                        {testResults.tests.organizations.map((org, index) => (
                          <li key={index}>{org.login}</li>
                        ))}
                      </ul>
                      
                      {/* First Org Repos */}
                      {testResults.tests?.first_org_repos?.repos && (
                        <div className="mt-2">
                          <p className="font-medium">Repos in {testResults.tests.first_org_repos.org_name}:</p>
                          <ul className="list-disc list-inside ml-4">
                            {testResults.tests.first_org_repos.repos.map((repo, index) => (
                              <li key={index}>{repo.name} ({repo.private ? 'private' : 'public'})</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>No organizations found</p>
                  )}
                </div>

                {/* First Repo File Tree */}
                {testResults.tests?.first_repo_file_tree && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-purple-600">📁 File Tree ({testResults.tests.first_repo_details?.name}):</h4>
                    <div className="bg-white p-3 rounded border">
                      <pre className="text-xs overflow-auto max-h-64">
                        {JSON.stringify(testResults.tests.first_repo_file_tree, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Raw Results (collapsible) */}
                <details className="mt-4">
                  <summary className="cursor-pointer font-medium text-gray-600">📋 Raw Results</summary>
                  <pre className="text-xs overflow-auto max-h-64 mt-2 bg-white p-3 rounded border">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleOnboardingClose}
      />
    </div>
  );
}
