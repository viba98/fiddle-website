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

  const { error } = await supabase.from('github_tokens').upsert(
    [
      {
        user_id: user?.id,
        access_token: accessToken,
        created_at: currentTime,
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