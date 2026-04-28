import type { Metadata } from "next";
import type { JSX } from "react";
import { Suspense } from "react";
import PageLayout from "@/components/page-layout";
import { ApiKeysListContainer } from "./api-keys-list.container.server";
import { ApiKeysListSkeleton } from "./api-keys-list.skeleton.client";
import {
  GenerateApiKeyResult,
  GenerateApiKeyTrigger,
} from "./generate-api-key.presenter.client";

export const metadata: Metadata = {
  title: "API キー",
};

export default function ApiKeysPage(): JSX.Element {
  return (
    <PageLayout title="API キー" operations={<GenerateApiKeyTrigger />}>
      <div className="flex flex-col gap-6">
        <GenerateApiKeyResult />
        <Suspense fallback={<ApiKeysListSkeleton />}>
          <ApiKeysListContainer />
        </Suspense>
      </div>
    </PageLayout>
  );
}
