import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

const ALLOWED_DOMAINS = ["jaago.com.bd", "emkcenter.org"];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rdmyghbciiepqmlwekjd.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkbXlnaGJjaWllcHFtbHdla2pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MTQ4ODQsImV4cCI6MjEwMjM5MDg4NH0.iZaS0700NUP3bwNJIiMeY-_B3X4BV6SQnFLGMUx23fA",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: CookieToSet[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      const email = data.user.email?.toLowerCase() || "";
      const isAllowed = ALLOWED_DOMAINS.some((domain) => email.endsWith(`@${domain}`));

      if (!isAllowed) {
        // Enforce strict security: sign out and block outsider email domains
        await supabase.auth.signOut();
        return NextResponse.redirect(
          `${origin}/login?error=domain_restricted&msg=Access%20restricted.%20Only%20@jaago.com.bd%20and%20@emkcenter.org%20accounts%20are%20permitted.`
        );
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to login with error details if failed
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
