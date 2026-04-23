---
paths:
  - *.tsx
---

# コンポーネントアーキテクチャ

- Container / Presentational パターンを基本とする
- データフェッチ・ロジックは Container コンポーネントで行う
- Container コンポーネント内に直接データフェッチ・ロジックを書くのではなく、別ファイルに関数を切り出して Container コンポーネントから呼び出す形にする
- Container コンポーネントは Suspense でラップし、ローディング状態の UI を表示する
- shadcn/ui のコンポーネントを優先して使用する

# Form

- スタック
  - Shadcn/UI の Field
  - TANSTACK Form
  - valibot
- placeholder は使用せず、常にテキストで説明を表示する
- ラベルに必ず必須、任意を表示する(RequiredOptionalBadge コンポーネント)
