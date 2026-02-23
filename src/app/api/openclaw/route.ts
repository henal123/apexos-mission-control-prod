/**
 * API ROUTES DISABLED FOR STATIC EXPORT
 * 
 * This application uses client-side OpenClaw integration
 * via the openclaw-client.ts library.
 * 
 * For static exports, API routes are not available.
 * All OpenClaw calls are made directly from the browser.
 */

export const dynamic = 'error';

export async function POST() {
  return Response.json(
    { 
      error: 'API routes not available in static export mode. Use client-side library.',
      hint: 'Use /lib/openclaw-client.ts for OpenClaw integration'
    },
    { status: 503 }
  );
}
