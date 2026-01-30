import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Pages that require authentication (will redirect to sign-in)
const isProtectedPage = createRouteMatcher([
  '/dashboard(.*)',
  '/settings(.*)',
]);

// API routes handle their own auth and return JSON 401
// Don't use auth.protect() for these - it redirects to sign-in instead of returning JSON
const isApiRoute = createRouteMatcher([
  '/api/(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Only use auth.protect() for pages, not API routes
  // API routes check auth manually and return proper JSON responses
  if (isProtectedPage(req) && !isApiRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
