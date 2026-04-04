export function CtaSection() {
  return (
    <section className="relative py-32 px-8 overflow-hidden juku-grid-bg bg-background">
      {/* ラジアルグロウ（控えめ） */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_55%_at_50%_50%,oklch(0.75_0.12_77/0.04)_0%,transparent_65%)]" />

      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-10 text-center">
        {/* ラベル */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-px bg-gold-dim" />
          <span className="font-space-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Get Started
          </span>
          <div className="w-8 h-px bg-gold-dim" />
        </div>

        {/* 見出し */}
        <h2 className="font-noto-serif-jp font-black text-4xl lg:text-6xl leading-snug text-foreground">
          さあ、
          <br />
          <span className="text-gold juku-glow-gold-text">
            学びを始めよう。
          </span>
        </h2>

        <p className="text-base leading-relaxed max-w-lg text-muted-foreground">
          今すぐ無料でアカウントを作成。 自分だけの学習スタジオを立ち上げよう。
        </p>

        {/* ボタン群 */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="juku-cta-btn-primary juku-glow-border px-10 py-4 font-orbitron font-black text-sm uppercase tracking-widest"
          >
            <span>無料で始める —</span>
          </button>
          <button
            className="juku-cta-btn-secondary px-10 py-4 font-orbitron font-bold text-sm uppercase tracking-widest"
            type="button"
          >
            デモを見る
          </button>
        </div>

        {/* 補足 */}
        <p className="font-space-mono text-xs text-[oklch(0.35_0.02_55)]">
          クレジットカード不要 · いつでもキャンセル可 · 商用利用可
        </p>

        {/* セパレーター */}
        <div className="juku-divider w-full max-w-sm mt-2" />
      </div>
    </section>
  );
}
