'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function GitHubAccess() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignInWithGitHub = async () => {
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/github-access`,
        },
      });
      
      if (error) {
        console.error('GitHub sign in error:', error);
        alert('GitHub sign in failed. Please try again.');
      }
      // User will be redirected to GitHub for authorization
    } catch (error) {
      console.error('GitHub sign in error:', error);
      alert('GitHub sign in failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleConnectGitHub = () => {
    if (!user) {
      alert('Please sign in first');
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
      <div className="text-center">
        <h1 className="text-2xl mb-4">GitHub Access</h1>
        
        {!user ? (
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">Sign in with GitHub to connect your account</p>
            <button 
              onClick={handleSignInWithGitHub} 
              disabled={authLoading}
              className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded disabled:opacity-50"
            >
              {authLoading ? 'Connecting...' : 'Sign in with GitHub'}
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
            
            <button 
              onClick={handleConnectGitHub} 
              className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded"
            >
              Connect GitHub (Get Repo Access)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
