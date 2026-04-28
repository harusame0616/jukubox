import type { JSX, PropsWithChildren, ReactNode } from "react";

interface Props {
  title: string;
  operations?: ReactNode;
}
export default function PageLayout({
  title,
  operations,
  children,
}: PropsWithChildren<Props>): JSX.Element {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {operations}
      </div>
      {children}
    </div>
  );
}
