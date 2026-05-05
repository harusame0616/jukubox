"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DeleteApiKeyErrorCode =
  | "UNAUTHORIZED"
  | "APIKEY_NOT_FOUND"
  | "INTERNAL_ERROR";

export type DeleteApiKeyResult =
  | { success: true }
  | { success: false; code: DeleteApiKeyErrorCode };

export async function deleteApiKey(
  apiKeyId: string,
): Promise<DeleteApiKeyResult> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { success: false, code: "UNAUTHORIZED" };
  }

  const response = await fetch(
    `${process.env.API_URL}/v1/me/apikeys/${encodeURIComponent(apiKeyId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  );

  if (response.status === 401) {
    return { success: false, code: "UNAUTHORIZED" };
  }

  if (response.status === 404) {
    return { success: false, code: "APIKEY_NOT_FOUND" };
  }

  if (!response.ok) {
    return { success: false, code: "INTERNAL_ERROR" };
  }

  revalidatePath("/settings/api-keys");

  return { success: true };
}
