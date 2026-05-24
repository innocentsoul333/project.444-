import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/feed(.*)",
  "/heatmap(.*)",
  "/community(.*)",
  "/placement-hub(.*)",
  "/stories(.*)",
  "/chat(.*)",
  "/notifications(.*)",
  "/profile(.*)",
  "/anonymous(.*)",
  "/emergency(.*)",
  "/settings(.*)",
  "/admin(.*)",
  "/api/(.*)"
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)"
  ]
};
