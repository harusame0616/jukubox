const steps = [
  {
    number: "01",
    title: "AIエージェントを接続",
    description:
      "Claude、GPT-4o など、自分が使っているAIをそのまま接続。MCP や Skill 経由で簡単に連携できます。",
    accent: "var(--juku-neon-cyan)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "コースを選ぶ or 作る",
    description:
      "ライブラリから既存コースを選ぶか、独自のカリキュラムを作成。社内研修にも個人学習にも対応。",
    accent: "var(--juku-neon-magenta)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "AIと学習スタート",
    description:
      "AIエージェントがコースに沿って出題・解説・フィードバック。まるで専属の家庭教師がいるような感覚。",
    accent: "var(--juku-neon-gold)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "記録を確認・振り返る",
    description:
      "学習ログ・正誤記録・進捗グラフで成長を可視化。何が得意で何が苦手かが一目でわかります。",
    accent: "var(--juku-neon-green)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section
      id="使い方"
      className="relative py-28 px-8"
      style={{
        background:
          "linear-gradient(180deg, var(--juku-bg) 0%, oklch(0.1 0.025 260) 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="flex flex-col items-center gap-4 mb-20 text-center">
          <span
            className="font-space-mono text-xs uppercase tracking-[0.3em]"
            style={{ color: "var(--juku-neon-magenta)" }}
          >
            ✦ How It Works
          </span>
          <h2
            className="font-orbitron font-black text-4xl lg:text-5xl"
            style={{ color: "oklch(0.92 0 0)" }}
          >
            使い方は、シンプル。
          </h2>
          <div
            className="w-24 h-px mt-2"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--juku-neon-magenta), transparent)",
            }}
          />
        </div>

        {/* ステップ */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 relative">
          {/* コネクターライン（デスクトップ） */}
          <div
            className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, oklch(0.85 0.18 195 / 0.2) 20%, oklch(0.85 0.18 195 / 0.2) 80%, transparent)",
            }}
          />

          {steps.map((step, idx) => (
            <div
              key={step.number}
              className="relative flex flex-col items-center text-center px-6 py-8 gap-5"
            >
              {/* ステップ番号サークル */}
              <div
                className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: "oklch(0.1 0.03 260)",
                  border: `1px solid ${step.accent}`,
                  boxShadow: `0 0 20px ${step.accent}30`,
                }}
              >
                <span
                  className="font-orbitron font-black text-2xl"
                  style={{
                    color: step.accent,
                    textShadow: `0 0 12px ${step.accent}`,
                  }}
                >
                  {step.number}
                </span>
              </div>

              {/* アイコン */}
              <div style={{ color: step.accent }}>{step.icon}</div>

              {/* タイトル */}
              <h3
                className="font-orbitron font-bold text-base leading-snug"
                style={{ color: "oklch(0.88 0 0)" }}
              >
                {step.title}
              </h3>

              {/* 説明 */}
              <p
                className="text-sm leading-relaxed"
                style={{ color: "oklch(0.55 0 0)" }}
              >
                {step.description}
              </p>

              {/* ステップ間の矢印（モバイル） */}
              {idx < steps.length - 1 && (
                <div
                  className="lg:hidden text-2xl mt-2"
                  style={{ color: "oklch(0.3 0 0)" }}
                >
                  ↓
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
