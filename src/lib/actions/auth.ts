"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string | null };

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) return { error: "Authentication is not configured yet." };

  const { email, password } = readCredentials(formData);
  if (!email || !password) return { error: "Email and password are required." };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect("/brand-profile");
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) return { error: "Authentication is not configured yet." };

  const { email, password } = readCredentials(formData);
  if (!email || !password) return { error: "Email and password are required." };
  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    // Don't leak whether an email is already registered — a verbatim
    // "User already registered" lets an attacker enumerate accounts. Collapse
    // duplicate-registration errors into a generic message; keep specific text
    // for validation-style failures (weak password, invalid email, etc.).
    if (/already\s*registered|already\s*exists|already\s*in\s*use/i.test(error.message)) {
      return {
        error: "Check your inbox to confirm your email, then sign in to continue.",
      };
    }
    return { error: error.message };
  }

  // When email confirmation is enabled, no session is returned until the user
  // confirms. Surface that instead of redirecting into a protected route.
  if (!data.session) {
    return {
      error:
        "Check your inbox to confirm your email, then sign in to continue.",
    };
  }

  redirect("/brand-profile");
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore sign-out failures (e.g. transient network error) — still send
      // the user to /login rather than leaving them on an error page.
    }
  }
  redirect("/login");
}
