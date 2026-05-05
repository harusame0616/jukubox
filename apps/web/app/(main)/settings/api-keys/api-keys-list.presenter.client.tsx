"use client";

import { type JSX, useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type DeleteApiKeyErrorCode,
  deleteApiKey,
} from "./delete-api-key.action";
import type { ApiKey } from "./api-keys.data";

const API_KEY_MASK = "jukubox_••••";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "medium",
});

const deleteErrorMessages: Record<DeleteApiKeyErrorCode, string> = {
  UNAUTHORIZED: "認証が切れています。再度ログインしてください。",
  APIKEY_NOT_FOUND:
    "対象の API キーが見つかりませんでした。一覧を更新してください。",
  INTERNAL_ERROR:
    "予期しないエラーが発生しました。時間をおいて再度お試しください。",
};

function formatDate(value: string): string {
  if (value === "") return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return dateFormatter.format(parsed);
}

function formatExpiredAt(value: string | null): string {
  if (value === null) return "無期限";
  return formatDate(value);
}

function formatApiKey(suffix: string): string {
  return `${API_KEY_MASK}${suffix}`;
}

interface Props {
  apiKeys?: ApiKey[];
  disabled?: boolean;
}

const SKELETON_ROWS: ApiKey[] = Array.from({ length: 3 }, (_, index) => ({
  apiKeyId: `skeleton-${index}`,
  suffix: "",
  createdAt: "",
  expiredAt: null,
}));

export function ApiKeysListPresenter({
  apiKeys = [],
  disabled = false,
}: Props): JSX.Element {
  const rows = disabled ? SKELETON_ROWS : apiKeys;

  if (!disabled && rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        API キーがまだ登録されていません。
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>API キー</TableHead>
          <TableHead>作成日</TableHead>
          <TableHead>有効期限</TableHead>
          <TableHead className="w-0">
            <span className="sr-only">操作</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((apiKey) => (
          <TableRow key={apiKey.apiKeyId}>
            <TableCell className="font-mono">
              {disabled ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                formatApiKey(apiKey.suffix)
              )}
            </TableCell>
            <TableCell>
              {disabled ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                formatDate(apiKey.createdAt)
              )}
            </TableCell>
            <TableCell>
              {disabled ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                formatExpiredAt(apiKey.expiredAt)
              )}
            </TableCell>
            <TableCell className="text-right">
              {disabled ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <DeleteApiKeyButton apiKey={apiKey} />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

interface DeleteApiKeyButtonProps {
  apiKey: ApiKey;
}

function DeleteApiKeyButton({
  apiKey,
}: DeleteApiKeyButtonProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [errorCode, setErrorCode] = useState<DeleteApiKeyErrorCode | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const handleConfirm = (): void => {
    setErrorCode(null);
    startTransition(async () => {
      const result = await deleteApiKey(apiKey.apiKeyId);
      if (result.success) {
        setOpen(false);
        return;
      }
      setErrorCode(result.code);
    });
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setErrorCode(null);
      }}
    >
      <AlertDialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            削除
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>API キーを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            {formatApiKey(apiKey.suffix)} を削除すると、このキーを使用している
            連携はすべて無効になります。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        {errorCode !== null && (
          <p
            role="alert"
            className="border-destructive bg-destructive/10 text-destructive border px-3 py-2 text-sm"
          >
            {deleteErrorMessages[errorCode]}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "削除中..." : "削除する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
