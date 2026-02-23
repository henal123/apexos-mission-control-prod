/**
 * API ROUTES DISABLED FOR STATIC EXPORT
 */

export const dynamic = 'error';

export async function GET() {
  return Response.json(
    { error: 'API routes not available in static export mode' },
    { status: 503 }
  );
}

export async function POST() {
  return Response.json(
    { error: 'API routes not available in static export mode' },
    { status: 503 }
  );
}
