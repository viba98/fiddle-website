import { NextRequest, NextResponse } from 'next/server';

const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
    }

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      return NextResponse.json({ error: 'GitHub OAuth not configured' }, { status: 500 });
    }

    // Exchange code for access token
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error_description || data.error }, { status: 400 });
    }

    return NextResponse.json({ access_token: data.access_token });
  } catch (error) {
    console.error('GitHub Token API - Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
