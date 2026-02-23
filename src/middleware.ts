import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// NO AUTH REQUIRED - Public Access
// This middleware is disabled to allow static export with no authentication
export function middleware(request: NextRequest) {
  // Allow all access - no authentication required
  return NextResponse.next();
}

// Keep matcher minimal for static export
export const config = {
  matcher: [],
};
