// api/github/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// Define interfaces for GitHub API responses
interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  [key: string]: unknown;
}

interface GitHubRepo {
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  language: string | null;
  size: number;
  owner: {
    login: string;
  };
  default_branch: string;
  [key: string]: unknown;
}

interface GitHubOrg {
  login: string;
  id: number;
  [key: string]: unknown;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  [key: string]: unknown;
}

interface GitHubRateLimit {
  resources: {
    core: {
      limit: number;
      remaining: number;
      reset: number;
    };
  };
  [key: string]: unknown;
}

interface GitHubFileItem {
  name: string;
  type: 'file' | 'dir';
  path: string;
  size: number;
  [key: string]: unknown;
}

interface TestResults {
  user?: GitHubUser | { error: string };
  repositories?: Partial<GitHubRepo>[] | { error: string };
  first_repo_details?: Partial<GitHubRepo>;
  first_repo_file_tree?: GitHubFileItem[] | { error: string } | { type: string };
  organizations?: GitHubOrg[] | { error: string };
  first_org_repos?: {
    org_name: string;
    repos: Partial<GitHubRepo>[];
  } | { error: string } | { message: string };
  emails?: GitHubEmail[] | { error: string };
  rate_limit?: GitHubRateLimit | { error: string };
}

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Extract the token from the header
    const token = authHeader.replace('Bearer ', '');
    
    // Get user from the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token or user not found' }, { status: 401 });
    }

    // Get their GitHub token
    const { data: tokenData, error: tokenError } = await supabase
      .from('github_tokens')
      .select('access_token')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'No GitHub token found' }, { status: 404 });
    }

    const githubToken = tokenData.access_token;
    const results: TestResults = {};

    // Test 1: Basic user info
    try {
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (userResponse.ok) {
        results.user = await userResponse.json() as GitHubUser;
      } else {
        results.user = { error: userResponse.statusText };
      }
    } catch (error) {
      results.user = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Test 2: List all repositories
    try {
      const reposResponse = await fetch('https://api.github.com/user/repos?per_page=5', {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (reposResponse.ok) {
        const repos = await reposResponse.json() as GitHubRepo[];
        results.repositories = repos.map((repo: GitHubRepo) => ({
          name: repo.name,
          full_name: repo.full_name,
          private: repo.private,
          description: repo.description,
          language: repo.language,
          size: repo.size
        }));

        // Test 3: Get file tree of first repo (1 level deep)
        if (repos.length > 0) {
          const firstRepo = repos[0];
          results.first_repo_details = {
            name: firstRepo.name,
            full_name: firstRepo.full_name,
            private: firstRepo.private,
            description: firstRepo.description,
            language: firstRepo.language,
            size: firstRepo.size,
            default_branch: firstRepo.default_branch
          };

          // Get contents of first repo (1 level deep)
          const fileTree = await getFileTree(firstRepo.owner.login, firstRepo.name, githubToken, '', 1);
          results.first_repo_file_tree = fileTree;
        }
      } else {
        results.repositories = { error: reposResponse.statusText };
      }
    } catch (error) {
      results.repositories = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Test 4: Get user's organizations
    try {
      const orgsResponse = await fetch('https://api.github.com/user/orgs', {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (orgsResponse.ok) {
        const orgs = await orgsResponse.json() as GitHubOrg[];
        results.organizations = orgs;

        // Test 5: Get repos from first organization (if any)
        if (orgs.length > 0) {
          const firstOrg = orgs[0];
          const orgReposResponse = await fetch(
            `https://api.github.com/orgs/${firstOrg.login}/repos?per_page=5`,
            {
              headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            }
          );

          if (orgReposResponse.ok) {
            const orgRepos = await orgReposResponse.json() as GitHubRepo[];
            results.first_org_repos = {
              org_name: firstOrg.login,
              repos: orgRepos.map((repo: GitHubRepo) => ({
                name: repo.name,
                full_name: repo.full_name,
                private: repo.private,
                description: repo.description,
                language: repo.language,
                size: repo.size
              }))
            };
          } else {
            results.first_org_repos = { error: orgReposResponse.statusText };
          }
        } else {
          results.first_org_repos = { message: 'No organizations found' };
        }
      } else {
        results.organizations = { error: orgsResponse.statusText };
      }
    } catch (error) {
      results.organizations = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Test 6: Get user's email addresses
    try {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (emailsResponse.ok) {
        results.emails = await emailsResponse.json() as GitHubEmail[];
      } else {
        results.emails = { error: emailsResponse.statusText };
      }
    } catch (error) {
      results.emails = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Test 7: Check rate limits
    try {
      const rateLimitResponse = await fetch('https://api.github.com/rate_limit', {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (rateLimitResponse.ok) {
        results.rate_limit = await rateLimitResponse.json() as GitHubRateLimit;
      } else {
        results.rate_limit = { error: rateLimitResponse.statusText };
      }
    } catch (error) {
      results.rate_limit = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    return NextResponse.json({
      success: true,
      user_id: user.id,
      tests: results
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// Helper function to get file tree (1 level deep)
async function getFileTree(owner: string, repo: string, token: string, path: string = '', maxDepth: number = 1): Promise<GitHubFileItem[] | { error: string } | { type: string }> {
  if (maxDepth <= 0) return { type: 'max_depth_reached' };

  try {
    const url = path 
      ? `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
      : `https://api.github.com/repos/${owner}/${repo}/contents`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      return { error: response.statusText };
    }

    const contents = await response.json() as GitHubFileItem[];
    
    if (Array.isArray(contents)) {
      const tree: GitHubFileItem[] = [];
      
      for (const item of contents.slice(0, 10)) { // Limit to first 10 items
        const treeItem: GitHubFileItem = {
          name: item.name,
          type: item.type,
          path: item.path,
          size: item.size
        };

        if (item.type === 'dir' && maxDepth > 1) {
          const children = await getFileTree(owner, repo, token, item.path, maxDepth - 1);
          if (Array.isArray(children)) {
            (treeItem as GitHubFileItem & { children: GitHubFileItem[] }).children = children;
          }
        }

        tree.push(treeItem);
      }

      return tree;
    } else {
      return { error: 'Unexpected response format' };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}