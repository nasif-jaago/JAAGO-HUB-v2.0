import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://rdmyghbciiepqmlwekjd.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkbXlnaGJjaWllcHFtbHdla2pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MTQ4ODQsImV4cCI6MjEwMjM5MDg4NH0.iZaS0700NUP3bwNJIiMeY-_B3X4BV6SQnFLGMUx23fA";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
