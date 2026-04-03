function VinylRecord() {
  const grooves = Array.from({ length: 28 }, (_, i) => i);
  return (
    <svg
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* ベース（レコード本体） */}
      <circle cx="200" cy="200" r="195" fill="oklch(0.1 0.02 260)" />
      {/* レコードのリフレクション（外縁ハイライト） */}
      <circle cx="200" cy="200" r="194" fill="none" stroke="oklch(0.85 0.18 195 / 0.2)" strokeWidth="1" />
      {/* 溝（concentric rings） */}
      {grooves.map((i) => (
        <circle
          key={i}
          cx="200"
          cy="200"
          r={180 - i * 4.5}
          fill="none"
          stroke={i % 5 === 0
            ? "oklch(0.85 0.18 195 / 0.12)"
            : "oklch(0.85 0.18 195 / 0.04)"}
          strokeWidth={i % 5 === 0 ? "0.8" : "0.4"}
        />
      ))}
      {/* センターラベルエリア */}
      <circle cx="200" cy="200" r="58" fill="oklch(0.14 0.04 280)" />
      <circle cx="200" cy="200" r="55" fill="oklch(0.12 0.05 270)" />
      {/* センターラベル装飾 */}
      <circle cx="200" cy="200" r="52" fill="none" stroke="oklch(0.82 0.15 85 / 0.5)" strokeWidth="0.8" />
      <circle cx="200" cy="200" r="48" fill="none" stroke="oklch(0.82 0.15 85 / 0.2)" strokeWidth="0.4" />
      {/* ラベルテキスト（JukuBox） */}
      <text
        x="200"
        y="196"
        textAnchor="middle"
        fontSize="11"
        fontFamily="Orbitron, sans-serif"
        fontWeight="700"
        fill="oklch(0.82 0.15 85)"
        letterSpacing="2"
      >
        JUKUBOX
      </text>
      <text
        x="200"
        y="212"
        textAnchor="middle"
        fontSize="7"
        fontFamily="Space Mono, monospace"
        fill="oklch(0.65 0.28 330)"
        letterSpacing="1"
      >
        .AI
      </text>
      {/* センターホール */}
      <circle cx="200" cy="200" r="7" fill="oklch(0.06 0.02 260)" />
      {/* ハイライトアーク */}
      <path
        d="M 80 130 A 135 135 0 0 1 230 65"
        fill="none"
        stroke="oklch(0.85 0.18 195 / 0.25)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FloatingBadge({
  children,
  style,
  color = "cyan",
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  color?: "cyan" | "magenta" | "gold" | "green";
}) {
  const colorMap = {
    cyan: "var(--juku-neon-cyan)",
    magenta: "var(--juku-neon-magenta)",
    gold: "var(--juku-neon-gold)",
    green: "var(--juku-neon-green)",
  };
  const c = colorMap[color];
  return (
    <div
      className="absolute juku-float juku-glass px-3 py-1.5 text-xs font-space-mono font-bold uppercase tracking-widest whitespace-nowrap"
      style={{
        border: `1px solid ${c}`,
        color: c,
        boxShadow: `0 0 8px ${c}40`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden juku-scanline juku-grid-bg"
      style={{ background: "var(--juku-bg)" }}
    >
      {/* 背景グロウ */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 70% 50%, oklch(0.85 0.18 195 / 0.04) 0%, transparent 70%)," +
            "radial-gradient(ellipse 40% 40% at 20% 80%, oklch(0.65 0.28 330 / 0.03) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-8 pt-24 pb-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-0">
        {/* 左: テキストコンテンツ */}
        <div className="flex-1 flex flex-col gap-6 lg:pr-12">
          {/* バッジ */}
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full juku-neon-pulse"
              style={{
                background: "var(--juku-neon-green)",
                boxShadow: "0 0 8px var(--juku-neon-green)",
              }}
            />
            <span
              className="font-space-mono text-xs uppercase tracking-widest"
              style={{ color: "var(--juku-neon-green)" }}
            >
              AI-Powered Learning Platform
            </span>
          </div>

          {/* ロゴ見出し */}
          <h1 className="flex flex-col gap-1">
            <span
              className="font-orbitron font-black leading-none text-7xl lg:text-8xl juku-neon-text-cyan"
              style={{ color: "var(--juku-neon-cyan)" }}
            >
              JukuBox
            </span>
            <span
              className="font-orbitron font-black leading-none text-5xl lg:text-6xl juku-neon-text-magenta"
              style={{ color: "var(--juku-neon-magenta)" }}
            >
              .ai
            </span>
          </h1>

          {/* キャッチコピー */}
          <p
            className="text-2xl lg:text-3xl font-bold leading-relaxed"
            style={{ color: "oklch(0.92 0 0)" }}
          >
            AI エージェントと
            <br />
            <span
              className="juku-neon-text-gold"
              style={{ color: "var(--juku-neon-gold)" }}
            >
              好きなことを
            </span>
            好きなだけ学ぶ
          </p>

          {/* 説明文 */}
          <p
            className="text-base leading-relaxed max-w-lg"
            style={{ color: "oklch(0.65 0 0)" }}
          >
            自分が契約している AI エージェントをそのまま活用。
            コースを選んで、記録して、着実に成長していく——
            あなたのペースで、あなたの学びを。
          </p>

          {/* CTA ボタン */}
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <button className="juku-cta-btn-primary px-8 py-3.5 font-orbitron font-bold text-sm uppercase tracking-widest">
              <span>無料で始める →</span>
            </button>
            <button className="juku-cta-btn-secondary px-8 py-3.5 font-orbitron font-bold text-sm uppercase tracking-widest">
              デモを見る
            </button>
          </div>

          {/* 信頼バッジ */}
          <div className="flex items-center gap-6 mt-4">
            {["Claude", "GPT-4o", "Gemini", "Llama"].map((model) => (
              <span
                key={model}
                className="text-xs font-space-mono uppercase tracking-wider"
                style={{ color: "oklch(0.45 0 0)" }}
              >
                {model}
              </span>
            ))}
          </div>
        </div>

        {/* 右: ビジュアル */}
        <div className="flex-shrink-0 w-full lg:w-[420px] relative flex items-center justify-center">
          {/* レコード本体（回転） */}
          <div className="relative w-80 h-80 lg:w-96 lg:h-96">
            <div className="juku-record-spin w-full h-full">
              <VinylRecord />
            </div>
            {/* レコードのグロウ */}
            <div
              className="absolute inset-4 rounded-full pointer-events-none juku-neon-pulse"
              style={{
                boxShadow:
                  "0 0 40px oklch(0.85 0.18 195 / 0.15), 0 0 80px oklch(0.85 0.18 195 / 0.05)",
              }}
            />
          </div>

          {/* フローティングバッジ */}
          <FloatingBadge style={{ top: "0%", right: "0%" }} color="green">
            ✓ 正誤記録
          </FloatingBadge>
          <FloatingBadge
            style={{ bottom: "8%", left: "0%", animationDelay: "1.2s" }}
            color="magenta"
          >
            ♪ コース共有
          </FloatingBadge>
          <FloatingBadge
            style={{ top: "30%", right: "-8%", animationDelay: "0.6s" }}
            color="gold"
          >
            📊 学習分析
          </FloatingBadge>
        </div>
      </div>

      {/* スクロールヒント */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 juku-neon-pulse"
        style={{ color: "oklch(0.45 0 0)" }}
      >
        <span className="text-xs font-space-mono uppercase tracking-widest">
          Scroll
        </span>
        <div
          className="w-px h-8"
          style={{
            background:
              "linear-gradient(to bottom, oklch(0.85 0.18 195 / 0.5), transparent)",
          }}
        />
      </div>
    </section>
  );
}
