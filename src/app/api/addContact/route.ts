export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Make request to Loops API
    const response = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.VITE_LOOPS_API_AUTH_TOKEN}`
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    // Return the response
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in addContact API route:', error);
    return new Response(JSON.stringify({ error: 'Failed to add contact' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
