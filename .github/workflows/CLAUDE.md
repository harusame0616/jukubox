# GitHub Action 実装ガイドライン

GitHub Actions ワークフローは以下のルールに従うこと。

## 必須設定

### ステップ名の日本語化

各ステップに日本語でわかりやすい name をつける

### pnpm バージョン

`pnpm/action-setup` で version を省略する

### actions/setup-node

node-version-file で .node-version を指定する

### concurrency 設定

原則的に concurrency を設定し、重複実行を防ぐ
設定しない場合はその理由をコメントで残す

```yaml
concurrency:
  group: <workflow-name>-${{ github.ref }}
  cancel-in-progress: true
```

### タイムアウト設定

各ジョブには最低 10 分のタイムアウトを設定する

### Permission 設定

ワークフローレベルで permission ブロックを設定し、最小限の権限を付与する

### 不要なワークフローのスキップ

ワークフローと関連ない変更の場合は必ずワークフローの実行をスキップする
スキップが不要な場合はスキップが不要な理由を冒頭にコメントで記載すること
新たに作成する際に「Require status checks to pass」に登録するかどうかユーザーから明示されない場合は登録する前提で作成すること
フィルター条件を書く際は以下を調査し、ワークフローの処理内容に無関係なファイル・フォルダは除外すること

#### 「Require status checks to pass」に設定するジョブの場合

dorny/paths-filter を使用する
変更のチェックとワークフローの処理は同じジョブ内に記載し、 if で制御する
デフォルトでフィルター条件は or 条件のため、フィルターの条件を AND 条件にしたい場合は predicate-quantifier に every を指定する

#### 「Require status checks to pass」に設定しないジョブの場合

Github Actions 標準の paths, paths-ignore を設定する
