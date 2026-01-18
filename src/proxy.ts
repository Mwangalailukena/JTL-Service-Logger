import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Mock function to decode token - in production use firebase-admin or edge-compatible JWT parser
// Since we can't easily use firebase-admin in Edge Middleware, we rely on checking cookies or 
// client-side redirection for now.
// For a robust middleware, we would use `next-firebase-auth-edge`.
// Here we implement a simplified logic based on path matching to reserve the namespace.

export default function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Reserve /portal for clients
  // If a user hits /portal, we assume they should be there (auth check happens in page layout)
  if (path.startsWith('/portal')) {
    return NextResponse.next();
  }

  // 2. Protect Internal Routes
  // /logs, /reports, /kb, /settings are for Technicians/Admins
  // Ideally, we check the user's role here.
  // Without edge-compatible auth library ready in this prototype, we rely on the client-side AuthProvider
  // to redirect unauthorized users. 
  // However, we can enforce that `/portal` is the ONLY place clients should be.
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (auth page)
     * - manifest.json, etc.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|manifest.json|icons).*)',
  ],
};
