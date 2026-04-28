"use client";

import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { type JSX, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useIsHydrated } from "@/hooks/use-is-hydrated";
import {
  type GenerateApiKeyErrorCode,
  generateApiKey,
} from "./generate-api-key.action";

const errorMessages: Record<GenerateApiKeyErrorCode, string> = {
  UNAUTHORIZED: "認証が切れています。再度ログインしてください。",
  APIKEY_QUOTA_EXCEEDS_LIMIT:
    "API キーの登録上限に達しています。不要なキーを削除してから再度生成してください。",
  APIKEY_LOCK_TIMEOUT:
    "API キーを生成できませんでした。時間をおいて再度お試しください。",
  INTERNAL_ERROR:
    "予期しないエラーが発生しました。時間をおいて再度お試しください。",
};

type CopyState = "idle" | "copied" | "failed";

const generatedAtom = atom<string | null>(null);
const errorCodeAtom = atom<GenerateApiKeyErrorCode | null>(null);

export function GenerateApiKeyTrigger(): JSX.Element {
  const isHydrated = useIsHydrated();
  const [isPending, startTransition] = useTransition();
  const setGenerated = useSetAtom(generatedAtom);
  const setErrorCode = useSetAtom(errorCodeAtom);

  const handleGenerate = (): void => {
    setErrorCode(null);
    startTransition(async () => {
      const result = await generateApiKey();
      if (result.success) {
        setGenerated(result.apiKey);
      } else {
        setGenerated(null);
        setErrorCode(result.code);
      }
    });
  };

  return (
    <Button
      type="button"
      onClick={handleGenerate}
      size="sm"
      disabled={!isHydrated || isPending}
    >
      {isPending ? "生成中..." : "API キー生成"}
    </Button>
  );
}

export function GenerateApiKeyResult(): JSX.Element | null {
  const [generated, setGenerated] = useAtom(generatedAtom);
  const errorCode = useAtomValue(errorCodeAtom);

  if (generated === null && errorCode === null) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {errorCode !== null && (
        <p
          role="alert"
          className="border-destructive bg-destructive/10 text-destructive border px-4 py-3 text-sm"
        >
          {errorMessages[errorCode]}
        </p>
      )}

      {generated !== null && (
        <GeneratedApiKeyCard
          key={generated}
          apiKey={generated}
          onClose={() => setGenerated(null)}
        />
      )}
    </div>
  );
}

interface GeneratedApiKeyCardProps {
  apiKey: string;
  onClose: () => void;
}

function GeneratedApiKeyCard({
  apiKey,
  onClose,
}: GeneratedApiKeyCardProps): JSX.Element {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <div className="border-primary bg-card flex flex-col gap-3 border px-4 py-4">
      <p className="text-sm">
        API
        キーを生成しました。この画面を閉じると再表示できないため、必ずコピーして安全な場所に保管してください。
      </p>
      <code className="bg-muted block px-3 py-2 font-mono text-sm break-all">
        {apiKey}
      </code>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={handleCopy}
          size="sm"
        >
          コピー
        </Button>
        <Button type="button" variant="outline" onClick={onClose} size="sm">
          閉じる
        </Button>
        {copyState === "copied" && (
          <span aria-live="polite" className="text-muted-foreground text-sm">
            コピーしました
          </span>
        )}
        {copyState === "failed" && (
          <span aria-live="polite" className="text-destructive text-sm">
            コピーに失敗しました
          </span>
        )}
      </div>
    </div>
  );
}
