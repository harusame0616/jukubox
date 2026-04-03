export function CtaSection() {
  return (
    <section
      className="relative py-32 px-8 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.1 0.025 260) 0%, var(--juku-bg) 100%)",
      }}
    >
      {/* 背景の円形グロウ */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, oklch(0.85 0.18 195 / 0.06) 0%, transparent 70%)",
        }}
      />

      {/* デコレーティブグリッド */}
      <div
        className="absolute inset-0 juku-grid-bg opacity-50 pointer-events-none"
      />

      {/* コンテンツ */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-10 text-center">
        {/* ラベル */}
        <span
          className="font-space-mono text-xs uppercase tracking-[0.3em]"
          style={{ color: "var(--juku-neon-cyan)" }}
        >
          ✦ Get Started
        </span>

        {/* メインコピー */}
        <h2
          className="font-orbitron font-black text-4xl lg:text-6xl leading-tight juku-neon-text-cyan"
          style={{ color: "var(--juku-neon-cyan)" }}
        >
          さあ、
          <br />
          <span style={{ color: "oklch(0.92 0 0)" }}>
            学びを始めよう。
          </span>
        </h2>

        <p
          className="text-lg leading-relaxed max-w-xl"
          style={{ color: "oklch(0.6 0 0)" }}
        >
          今すぐ無料でアカウントを作成。
          自分だけの学習スタジオを立ち上げよう。
        </p>

        {/* CTA ボタン群 */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            className="juku-cta-btn-primary juku-glow-border px-10 py-4 font-orbitron font-black text-base uppercase tracking-widest"
          >
            <span>無料で始める —</span>
          </button>
          <button
            className="juku-cta-btn-secondary px-10 py-4 font-orbitron font-bold text-base uppercase tracking-widest"
          >
            デモを見る
          </button>
        </div>

        {/* 補足テキスト */}
        <p
          className="font-space-mono text-xs"
          style={{ color: "oklch(0.4 0 0)" }}
        >
          クレジットカード不要 · いつでもキャンセル可 · 商用利用可
        </p>

        {/* 装飾ライン */}
        <div className="flex items-center gap-4 w-full max-w-xs">
          <div
            className="flex-1 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, oklch(0.85 0.18 195 / 0.3))",
            }}
          />
          <span
            className="font-space-mono text-xs"
            style={{ color: "oklch(0.3 0 0)" }}
          >
            ◈
          </span>
          <div
            className="flex-1 h-px"
            style={{
              background:
                "linear-gradient(90deg, oklch(0.85 0.18 195 / 0.3), transparent)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
