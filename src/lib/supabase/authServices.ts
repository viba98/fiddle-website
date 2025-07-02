import { supabase } from './client'

export interface AuthResult {
  success: boolean;
  message?: string;
}

export async function addGitHubToken(accessToken: string): Promise<AuthResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentTime = new Date().toISOString();

  // First, get existing record to preserve onboarding data
  const { data: existingRecord } = await supabase
    .from('github_tokens')
    .select('*')
    .eq('user_id', user?.id)
    .single();

  const { error } = await supabase.from('github_tokens').upsert(
    [
      {
        user_id: user?.id,
        access_token: accessToken,
        // Preserve existing onboarding data if it exists
        email: existingRecord?.email || null,
        team_size: existingRecord?.team_size || null,
        designer_type: existingRecord?.designer_type || null,
        team_location: existingRecord?.team_location || null,
        onboarding_completed: existingRecord?.onboarding_completed || false,
        created_at: existingRecord?.created_at || currentTime,
        updated_at: currentTime,
      },
    ],
    { onConflict: 'user_id' },
  );

  if (error) {
    console.error('Error inserting GitHub token:', error.message);
    return { success: false, message: error.message };
  }

  return { success: true, message: 'Token saved successfully' };
} 