/**
 * API ROUTES DISABLED FOR STATIC EXPORT
 * Authentication removed - Public access only
 */

export const dynamic = 'error';

export async function POST() {
  return Response.json(
    { 
      success: true, 
      message: 'Static export - No authentication required',
      public: true
    },
    { status: 200 }
  );
}
