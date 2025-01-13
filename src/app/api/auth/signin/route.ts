import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // For now, we'll just log the email and return success
    // Later you can add actual email storage (database, Airtable, etc.)
    console.log('New signup:', email);

    // Simulate waitlist behavior (you can modify this logic later)
    const isWaitlisted = true;

    if (isWaitlisted) {
      return NextResponse.json(
        { message: 'Added to waitlist', waitlisted: true },
        { status: 202 }
      );
    }

    return NextResponse.json(
      { message: 'Login link sent' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to process signup' },
      { status: 500 }
    );
  }
} 