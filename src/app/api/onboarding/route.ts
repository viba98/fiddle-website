import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { OnboardingData } from '@/types/database';

// Helper function to update Loops contact
async function updateLoopsContact(email: string, onboardingData: OnboardingData) {
  try {
    const loopsPayload = {
      email: email,
      firstName: onboardingData.name || '', // Use the name from onboarding
      lastName: '',  // We don't collect last name in onboarding
      source: 'onboarding',
      hasAccess: false,
      // Add custom properties for onboarding data
      teamSize: onboardingData.teamSize || '',
      designerType: onboardingData.designerType || '',
      teamLocation: onboardingData.teamLocation || '',
      techStack: onboardingData.techStack || '',
      githubAccess: onboardingData.githubAccess || false
    };

    // First try to create the contact
    const createResponse = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.VITE_LOOPS_API_AUTH_TOKEN}`
      },
      body: JSON.stringify(loopsPayload),
    });

    if (createResponse.ok) {
      return true;
    }

    // If contact already exists (409 Conflict), try to update it
    if (createResponse.status === 409) {
      // Use the update endpoint for existing contacts
      const updateResponse = await fetch('https://app.loops.so/api/v1/contacts/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.VITE_LOOPS_API_AUTH_TOKEN}`
        },
        body: JSON.stringify(loopsPayload),
      });

      if (updateResponse.ok) {
        return true;
      } else {
        console.error('Loops update API error:', updateResponse.status, updateResponse.statusText);
        return false;
      }
    }

    // Handle other errors
    console.error('Loops API error:', createResponse.status, createResponse.statusText);
    return false;
  } catch (error) {
    console.error('Error updating Loops contact:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase || !supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    const body: OnboardingData = await request.json();
    const { name, email, teamSize, designerType, teamLocation, techStack } = body;

    // Only validate email as required (minimum for saving)
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get current user if authenticated
    let { data: { user } } = await supabase.auth.getUser();
    
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

        user = newUser.user;
      }
    }

    // Save onboarding data to github_tokens table
    const { error: upsertError } = await supabase
      .from('github_tokens')
      .upsert([
        {
          user_id: user!.id,
          name: name || '',
          email,
          team_size: teamSize || '',
          designer_type: designerType || '',
          team_location: teamLocation || '',
          tech_stack: techStack || '',
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

    // Update Loops contact with onboarding data
    try {
      await updateLoopsContact(email, body);
    } catch (loopsError) {
      console.error('Error updating Loops:', loopsError);
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