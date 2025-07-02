// Database types for the modified github_tokens table
export interface GitHubTokenRecord {
  id: string;
  user_id: string | null;
  access_token: string | null;
  email: string | null;
  team_size: string | null;
  designer_type: string | null;
  team_location: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

// Onboarding data interface
export interface OnboardingData {
  email: string;
  teamSize: string;
  designerType: string;
  teamLocation: string;
  githubAccess: boolean;
}

// API response types
export interface OnboardingResponse {
  success: boolean;
  message: string;
  data?: GitHubTokenRecord;
  error?: string;
} 