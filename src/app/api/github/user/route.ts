import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 400 });
  }

  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch GitHub user' }, { status: response.status });
    }

    const userData = await response.json();
    return NextResponse.json(userData);
  } catch (error) {
    console.error('GitHub User API - Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 