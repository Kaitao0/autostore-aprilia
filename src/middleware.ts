import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Protects /admin/*: valid session + staff role required.
 * /admin/login stays reachable; already-authenticated staff is
 * bounced back to the dashboard. All admin responses are noindex.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/admin/login";

  const noindex = (res: NextResponse) => {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  };

  if (!isSupabaseConfigured()) {
    // Explicit "not configured" state on the login page; never a fake session.
    if (isLoginPage) return noindex(NextResponse.next({ request }));
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("reason", "not_configured");
    return noindex(NextResponse.redirect(url));
  }

  const { response, user, supabase } = await updateSession(request);

  const redirectToLogin = (reason: string) => {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    url.searchParams.set("reason", reason);
    if (!isLoginPage && reason !== "unauthorized") {
      url.searchParams.set("next", pathname);
    }
    return noindex(NextResponse.redirect(url));
  };

  if (!user) {
    if (isLoginPage) return noindex(response);
    const hadSession = request.cookies
      .getAll()
      .some((c) => c.name.startsWith("sb-"));
    return redirectToLogin(hadSession ? "session_expired" : "unauthenticated");
  }

  const { data: isStaff } = await supabase.rpc("is_staff", {
    _user_id: user.id,
  });

  if (!isStaff) {
    if (isLoginPage) return noindex(response);
    return redirectToLogin("unauthorized");
  }

  if (isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return noindex(NextResponse.redirect(url));
  }

  return noindex(response);
}

export const config = {
  matcher: ["/admin/:path*"],
};
