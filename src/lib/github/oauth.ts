export function initiateGitHubAuth() {
  const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  
  if (!GITHUB_CLIENT_ID) {
    console.error('GitHub Client ID not configured');
    return;
  }

  const redirectUri = `${window.location.origin}/auth/github/callback`;
  const scope = 'repo user';
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
  
  window.location.href = githubAuthUrl;
} 