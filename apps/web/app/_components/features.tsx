const features = [
  {
    icon: "◈",
    title: "自分のAIで学ぶ",
    description:
      "Claude、GPT-4o、Gemini など、すでに契約しているAIエージェントをそのまま活用。追加コスト不要で最先端AIによる個別指導を実現。",
    accent: "var(--juku-neon-cyan)",
    tag: "BRING YOUR OWN AI",
  },
  {
    icon: "◉",
    title: "コースを作る・使う",
    description:
      "自分でカリキュラムを組んでコースを作成し公開。あるいはコミュニティが用意した豊富なコースをすぐに使って学習開始。",
    accent: "var(--juku-neon-magenta)",
    tag: "COURSE LIBRARY",
  },
  {
    icon: "◎",
    title: "学習を記録する",
    description:
      "いつ・何を・どれだけ学んだかを自動記録。タイムライン形式で学習の軌跡を可視化し、モチベーションを維持。",
    accent: "var(--juku-neon-gold)",
    tag: "PROGRESS TRACKING",
  },
  {
    icon: "◐",
    title: "正解・不正解を分析",
    description:
      "何を理解し、何を間違えたのかを詳細に記録。弱点を把握してAIに重点的に質問できる、データドリブンな学習サイクル。",
    accent: "var(--juku-neon-green)",
    tag: "MISTAKE ANALYSIS",
  },
];

export function Features() {
  return (
    <section
      id="機能"
      className="relative py-28 px-8"
      style={{ background: "var(--juku-bg)" }}
    >
      {/* セクションヘッダー */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center gap-4 mb-20 text-center">
          <span
            className="font-space-mono text-xs uppercase tracking-[0.3em]"
            style={{ color: "var(--juku-neon-cyan)" }}
          >
            ✦ Features
          </span>
          <h2
            className="font-orbitron font-black text-4xl lg:text-5xl leading-tight"
            style={{ color: "oklch(0.92 0 0)" }}
          >
            学びを、自由に。
          </h2>
          <p
            className="text-base max-w-lg leading-relaxed"
            style={{ color: "oklch(0.55 0 0)" }}
          >
            塾の構造化された学習と、Jukebox のように「好きな曲を選んで流す」自由さを融合させた、
            まったく新しい学習体験。
          </p>
          {/* デコレーションライン */}
          <div
            className="w-24 h-px mt-2"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--juku-neon-cyan), transparent)",
            }}
          />
        </div>

        {/* カードグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="juku-glass juku-feature-card p-8 flex flex-col gap-5"
              style={
                { "--juku-card-accent": feature.accent } as React.CSSProperties
              }
            >
              {/* タグ */}
              <span
                className="font-space-mono text-[10px] uppercase tracking-[0.2em]"
                style={{ color: feature.accent }}
              >
                {feature.tag}
              </span>

              {/* アイコン */}
              <div
                className="text-5xl leading-none juku-neon-pulse"
                style={{
                  color: feature.accent,
                  textShadow: `0 0 20px ${feature.accent}`,
                }}
              >
                {feature.icon}
              </div>

              {/* タイトル */}
              <h3
                className="font-orbitron font-bold text-lg leading-snug"
                style={{ color: "oklch(0.9 0 0)" }}
              >
                {feature.title}
              </h3>

              {/* 説明 */}
              <p
                className="text-sm leading-relaxed flex-1"
                style={{ color: "oklch(0.6 0 0)" }}
              >
                {feature.description}
              </p>

              {/* アクセントライン（ホバーで伸びる） */}
              <div
                className="h-px w-0 group-hover:w-full transition-all duration-500"
                style={{ background: feature.accent }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
