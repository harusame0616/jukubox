import { CancelIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { JSX } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";

interface Props {
  tags: string[];
  onRemove?: (index: number) => void;
  disabled?: boolean;
}

export function CourseTagList({
  tags,
  onRemove,
  disabled,
}: Props): JSX.Element | null {
  if (tags.length === 0) {
    return null;
  }
  return (
    <ul className="flex flex-wrap gap-1">
      {tags.map((tag, index) => (
        <li key={`${tag}-${index}`}>
          <Badge variant="outline">
            {tag}
            {onRemove ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => onRemove(index)}
                disabled={disabled}
                className="text-muted-foreground hover:text-foreground"
                data-icon="inline-end"
              >
                <HugeiconsIcon icon={CancelIcon} />
                <span className="sr-only">{tag} を削除</span>
              </Button>
            ) : null}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
