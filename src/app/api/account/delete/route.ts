import { createClient as createStandaloneClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { deleteAccountSchema } from "@/features/settings/settings-validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  try {
    return await handleDelete(request);
  } catch (error) {
    console.error("[account-delete]", error);

    return NextResponse.json(
      {
        success: false,

        error: "FinSight could not delete the account.",
      },
      {
        status: 500,
      },
    );
  }
}

async function handleDelete(request: Request) {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();

  const user = userData.user;

  if (userError || !user) {
    return NextResponse.json(
      {
        success: false,
        error: "You must be signed in.",
      },
      {
        status: 401,
      },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "The account-deletion request is invalid.",
      },
      {
        status: 400,
      },
    );
  }

  const parsed = deleteAccountSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,

        error:
          parsed.error.issues[0]?.message ??
          "The account-deletion request is invalid.",
      },
      {
        status: 400,
      },
    );
  }

  const providers = getProviders(user);

  if (providers.includes("email")) {
    const password = parsed.data.currentPassword?.trim();

    if (!password) {
      return NextResponse.json(
        {
          success: false,

          error: "Enter your current password to delete this account.",
        },
        {
          status: 400,
        },
      );
    }

    if (!user.email) {
      return NextResponse.json(
        {
          success: false,

          error: "The account email is unavailable.",
        },
        {
          status: 400,
        },
      );
    }

    const passwordValid = await verifyPassword({
      email: user.email,
      password,
    });

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,

          error: "The current password is incorrect.",
        },
        {
          status: 403,
        },
      );
    }
  }

  const admin = createAdminClient();

  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json(
      {
        success: false,

        error: `Supabase could not delete the account: ${error.message}`,
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json({
    success: true,
  });
}

async function verifyPassword({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error("Supabase public configuration is missing.");
  }

  const verificationClient = createStandaloneClient(
    supabaseUrl,
    publishableKey,
    {
      auth: {
        persistSession: false,

        autoRefreshToken: false,

        detectSessionInUrl: false,
      },
    },
  );

  const { error } = await verificationClient.auth.signInWithPassword({
    email,
    password,
  });

  return !error;
}

function getProviders(user: {
  app_metadata?: {
    provider?: unknown;
    providers?: unknown;
  };

  identities?: Array<{
    provider?: string;
  }> | null;
}): string[] {
  const providers = new Set<string>();

  const metadataProviders = user.app_metadata?.providers;

  if (Array.isArray(metadataProviders)) {
    for (const provider of metadataProviders) {
      if (typeof provider === "string") {
        providers.add(provider);
      }
    }
  }

  if (typeof user.app_metadata?.provider === "string") {
    providers.add(user.app_metadata.provider);
  }

  for (const identity of user.identities ?? []) {
    if (identity.provider) {
      providers.add(identity.provider);
    }
  }

  return [...providers];
}
