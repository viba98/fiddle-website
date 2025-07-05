import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { OnboardingData } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    if (!supabase || !supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    const body: OnboardingData = await request.json();
    const { email, teamSize, designerType, teamLocation } = body;

    console.log('API: Saving onboarding data', { email, step: 'onboarding' });

    // Only validate email as required (minimum for saving)
    if (!email) {
      console.log('API: Missing email');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get current user if authenticated
    let { data: { user } } = await supabase.auth.getUser();
    
    console.log('API: User auth', { userId: user?.id || 'none' });
    
    const currentTime = new Date().toISOString();

    // For unauthenticated users, handle user creation/getting
    if (!user) {
      // First try to get existing user by email
      const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (getUserError) {
        console.error('Error listing users:', getUserError);
        return NextResponse.json(
          { error: 'Failed to check user account' },
          { status: 500 }
        );
      }

      // Find user by email
      const foundUser = existingUser.users.find(u => u.email === email);
      
      if (foundUser) {
        // User exists, use their ID
        console.log('Found existing user:', foundUser.id);
        user = foundUser;
      } else {
        // Create new user
        const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          email_confirm: true, // Skip email verification
          user_metadata: { source: 'onboarding' }
        });

        if (createUserError) {
          console.error('Error creating user:', createUserError);
          return NextResponse.json(
            { error: 'Failed to create user account' },
            { status: 500 }
          );
        }

        console.log('Created user for onboarding:', newUser.user?.id);
        user = newUser.user; // Use the newly created user
      }
    }

    // Save onboarding data to github_tokens table
    const { error: upsertError } = await supabase
      .from('github_tokens')
      .upsert([
        {
          user_id: user!.id,
          email,
          team_size: teamSize || '',
          designer_type: designerType || '',
          team_location: teamLocation || '',
          onboarding_completed: true,
          created_at: currentTime,
          updated_at: currentTime,
          access_token: null,
        }
      ], {
        onConflict: 'user_id',
      });

    if (upsertError) {
      console.error('Database error:', upsertError);
      return NextResponse.json(
        { error: 'Database error: ' + upsertError.message },
        { status: 500 }
      );
    }


    return NextResponse.json({
      success: true,
      message: 'Onboarding data saved successfully'
    });

  } catch (error) {
    console.error('Onboarding API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 