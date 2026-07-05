import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in · kliqboost",
};

// Reads the session cookie to redirect signed-in users; must run per request.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Already signed in? Skip the form.
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/brand-profile");
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <LoginForm />
    </main>
  );
}
