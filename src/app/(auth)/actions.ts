"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

const signupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(100, "Your name is too long."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Your password must contain at least 8 characters."),
});

function getString(formData: FormData, field: string): string {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

function getSafeNextPath(value: FormDataEntryValue | null) {
  if (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
  ) {
    return value;
  }

  return "/overview";
}

function redirectWithParams(
  pathname: string,
  params: Record<string, string>,
): never {
  const searchParams = new URLSearchParams(params);

  redirect(`${pathname}?${searchParams.toString()}`);
}

export async function login(formData: FormData) {
  const nextPath = getSafeNextPath(formData.get("next"));

  const parsed = loginSchema.safeParse({
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  });

  if (!parsed.success) {
    redirectWithParams("/login", {
      error: parsed.error.issues[0]?.message ?? "Check your login details.",
      next: nextPath,
    });
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    redirectWithParams("/login", {
      error: error.message,
      next: nextPath,
    });
  }

  redirect(nextPath);
}

export async function signup(formData: FormData) {
  const parsed = signupSchema.safeParse({
    fullName: getString(formData, "fullName"),
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  });

  if (!parsed.success) {
    redirectWithParams("/signup", {
      error: parsed.error.issues[0]?.message ?? "Check your account details.",
    });
  }

  const requestHeaders = await headers();

  const origin =
    requestHeaders.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
      emailRedirectTo: `${origin}/auth/callback?next=/overview`,
    },
  });

  if (error) {
    redirectWithParams("/signup", {
      error: error.message,
    });
  }

  // If email confirmation is disabled, Supabase may immediately return an authenticated session.

  if (data.session) {
    redirect("/overview");
  }

  redirectWithParams("/signup", {
    message: "Account created. Check your email to confirm your address.",
  });
}
