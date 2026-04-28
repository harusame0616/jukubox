"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type GenerateApiKeyErrorCode =
  | "UNAUTHORIZED"
  | "APIKEY_QUOTA_EXCEEDS_LIMIT"
  | "APIKEY_LOCK_TIMEOUT"
  | "INTERNAL_ERROR";

export type GenerateApiKeyResult =
  | { success: true; apiKey: string }
  | { success: false; code: GenerateApiKeyErrorCode };

export async function generateApiKey(): Promise<GenerateApiKeyResult> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { success: false, code: "UNAUTHORIZED" };
  }

  const response = await fetch(
    `${process.env.API_URL}/v1/users/${session.user.id}/apikeys`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    },
  );

  if (response.status === 401) {
    return { success: false, code: "UNAUTHORIZED" };
  }

  if (response.status === 409) {
    return { success: false, code: "APIKEY_QUOTA_EXCEEDS_LIMIT" };
  }

  if (response.status === 503) {
    return { success: false, code: "APIKEY_LOCK_TIMEOUT" };
  }

  if (!response.ok) {
    return { success: false, code: "INTERNAL_ERROR" };
  }

  const body = (await response.json()) as { apikey: string };

  revalidatePath("/settings/api-keys");

  return { success: true, apiKey: body.apikey };
}
