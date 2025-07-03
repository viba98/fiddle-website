'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { addGitHubToken } from '@/lib/supabase/authServices';

function GitHubCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState<string | null>(null);
  const [returnTo, setReturnTo] = useState<string | null>(null);

  useEffect(() => {
    const handleGitHubAuth = async (code: string) => {
      try {
        const tokenResponse = await fetch('/api/github/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        
        const tokenData = await tokenResponse.json();
        
        if (tokenData.error) {
          throw new Error(tokenData.error);
        }
        
        // Save GitHub token to the authenticated user
        const result = await addGitHubToken(tokenData.access_token);
        if (result.success) {
          setStatus('success');
          // Automatically redirect after a short delay
          setTimeout(() => {
            if (returnTo === 'onboarding') {
              window.location.href = '/github-access?showOnboarding=true&step=final';
            } else {
              window.location.href = '/github-access';
            }
          }, 1000); // 1 second delay to show success briefly
        } else {
          throw new Error(result.message);
        }
        
      } catch (error) {
        console.error('GitHub auth error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setStatus('error');
        // Auto-redirect on error too
        setTimeout(() => {
          if (returnTo === 'onboarding') {
            window.location.href = '/github-access?showOnboarding=true&step=final';
          } else {
            window.location.href = '/github-access';
          }
        }, 2000); // 2 second delay on error
      }
    };

    const code = searchParams.get('code');
    const oauthError = searchParams.get('error');
    const returnToParam = searchParams.get('returnTo');
    
    setReturnTo(returnToParam);
    
    if (oauthError) {
      setError(`OAuth Error: ${oauthError}`);
      setStatus('error');
      // Auto-redirect on OAuth error
      setTimeout(() => {
        if (returnToParam === 'onboarding') {
          window.location.href = '/github-access?showOnboarding=true&step=final';
        } else {
          window.location.href = '/github-access';
        }
      }, 2000);
    } else if (code) {
      handleGitHubAuth(code);
    } else {
      setError('No authorization code found');
      setStatus('error');
      // Auto-redirect on missing code
      setTimeout(() => {
        if (returnToParam === 'onboarding') {
          window.location.href = '/github-access?showOnboarding=true&step=final';
        } else {
          window.location.href = '/github-access';
        }
      }, 2000);
    }
  }, [searchParams, returnTo]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl mb-4">Connecting GitHub...</h1>
        
        {status === 'processing' && (
          <p>Processing GitHub authorization...</p>
        )}
        
        {status === 'success' && (
          <div>
            <p className="text-green-500 mb-2">Success! GitHub account connected.</p>
            <p className="text-sm text-gray-500">Redirecting back to onboarding...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div>
            <p className="text-red-500">Error connecting GitHub.</p>
            {error && <p className="text-sm text-gray-400 mt-2">{error}</p>}
            <p className="text-sm text-gray-500 mt-2">Redirecting back to onboarding...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GitHubCallback() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <GitHubCallbackContent />
    </Suspense>
  );
}
