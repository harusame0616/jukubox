const mockLog = [
  {
    date: "2025-04-03",
    topic: "React Server Components",
    correct: 8,
    total: 10,
    duration: "42 min",
  },
  {
    date: "2025-04-02",
    topic: "TypeScript Generics",
    correct: 6,
    total: 9,
    duration: "35 min",
  },
  {
    date: "2025-04-01",
    topic: "SQL Window Functions",
    correct: 10,
    total: 10,
    duration: "58 min",
  },
  {
    date: "2025-03-31",
    topic: "Docker Compose",
    correct: 5,
    total: 8,
    duration: "29 min",
  },
];

const mockWeak = ["Closure", "Currying", "Middleware"];
const mockStrong = ["REST API", "Git Flow", "CSS Grid"];

export function LearningRecords() {
  return (
    <section
      id="学習記録"
      className="relative py-28 px-8"
      style={{ background: "var(--juku-bg)" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="flex flex-col items-center gap-4 mb-20 text-center">
          <span
            className="font-space-mono text-xs uppercase tracking-[0.3em]"
            style={{ color: "var(--juku-neon-gold)" }}
          >
            ✦ Learning Records
          </span>
          <h2
            className="font-orbitron font-black text-4xl lg:text-5xl"
            style={{ color: "oklch(0.92 0 0)" }}
          >
            記録が、成長をつくる。
          </h2>
          <p
            className="text-base max-w-lg leading-relaxed"
            style={{ color: "oklch(0.55 0 0)" }}
          >
            学習の全履歴が自動で残る。
            いつ・何を・どれだけ正解したか。弱点も強みも、データが教えてくれる。
          </p>
          <div
            className="w-24 h-px mt-2"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--juku-neon-gold), transparent)",
            }}
          />
        </div>

        {/* モックUI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 学習ログ（ターミナル風） */}
          <div
            className="juku-glass lg:col-span-2 rounded-none overflow-hidden"
            style={{ border: "1px solid oklch(0.85 0.18 195 / 0.15)" }}
          >
            {/* ターミナルヘッダー */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{
                background: "oklch(0.1 0.02 260)",
                borderBottom: "1px solid oklch(0.85 0.18 195 / 0.1)",
              }}
            >
              <div className="flex gap-1.5">
                {["oklch(0.65 0.28 330)", "oklch(0.82 0.15 85)", "oklch(0.82 0.2 145)"].map(
                  (c, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full"
                      style={{ background: c }}
                    />
                  )
                )}
              </div>
              <span
                className="flex-1 text-center font-space-mono text-xs"
                style={{ color: "oklch(0.45 0 0)" }}
              >
                jukubox — learning_log
              </span>
            </div>

            {/* ログ一覧 */}
            <div className="p-6 flex flex-col gap-4 font-space-mono">
              <div
                className="text-xs mb-2"
                style={{ color: "var(--juku-neon-green)" }}
              >
                $ jukubox log --recent 4
              </div>
              {mockLog.map((entry) => (
                <div
                  key={entry.date}
                  className="flex items-center gap-4 group"
                  style={{ borderBottom: "1px solid oklch(1 0 0 / 0.04)" }}
                >
                  {/* 日付 */}
                  <span
                    className="text-xs shrink-0 w-24"
                    style={{ color: "oklch(0.45 0 0)" }}
                  >
                    {entry.date}
                  </span>

                  {/* トピック */}
                  <span
                    className="text-sm flex-1 truncate"
                    style={{ color: "oklch(0.85 0 0)" }}
                  >
                    {entry.topic}
                  </span>

                  {/* 正答率 */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className="w-24 h-1.5 rounded-full overflow-hidden"
                      style={{ background: "oklch(0.2 0 0)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(entry.correct / entry.total) * 100}%`,
                          background:
                            entry.correct / entry.total >= 0.9
                              ? "var(--juku-neon-green)"
                              : entry.correct / entry.total >= 0.7
                              ? "var(--juku-neon-gold)"
                              : "var(--juku-neon-magenta)",
                        }}
                      />
                    </div>
                    <span
                      className="text-xs w-12 text-right"
                      style={{
                        color:
                          entry.correct / entry.total >= 0.9
                            ? "var(--juku-neon-green)"
                            : entry.correct / entry.total >= 0.7
                            ? "var(--juku-neon-gold)"
                            : "var(--juku-neon-magenta)",
                      }}
                    >
                      {entry.correct}/{entry.total}
                    </span>
                  </div>

                  {/* 時間 */}
                  <span
                    className="text-xs shrink-0 w-16 text-right"
                    style={{ color: "oklch(0.4 0 0)" }}
                  >
                    {entry.duration}
                  </span>
                </div>
              ))}
              <div
                className="text-xs mt-2 juku-neon-pulse"
                style={{ color: "var(--juku-neon-cyan)" }}
              >
                █ <span style={{ color: "oklch(0.45 0 0)" }}>waiting for input...</span>
              </div>
            </div>
          </div>

          {/* 弱点・得意タグ */}
          <div className="flex flex-col gap-6">
            {/* 弱点 */}
            <div
              className="juku-glass p-6 flex flex-col gap-4"
              style={{ border: "1px solid oklch(0.65 0.28 330 / 0.2)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-orbitron font-bold"
                  style={{ color: "var(--juku-neon-magenta)" }}
                >
                  ▲ 要強化エリア
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {mockWeak.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-xs font-space-mono uppercase tracking-wider"
                    style={{
                      border: "1px solid var(--juku-neon-magenta)",
                      color: "var(--juku-neon-magenta)",
                      background: "oklch(0.65 0.28 330 / 0.08)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 強み */}
            <div
              className="juku-glass p-6 flex flex-col gap-4"
              style={{ border: "1px solid oklch(0.82 0.2 145 / 0.2)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-orbitron font-bold"
                  style={{ color: "var(--juku-neon-green)" }}
                >
                  ◆ 習得済みスキル
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {mockStrong.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-xs font-space-mono uppercase tracking-wider"
                    style={{
                      border: "1px solid var(--juku-neon-green)",
                      color: "var(--juku-neon-green)",
                      background: "oklch(0.82 0.2 145 / 0.08)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 学習統計 */}
            <div
              className="juku-glass p-6 flex flex-col gap-4"
              style={{ border: "1px solid oklch(0.82 0.15 85 / 0.2)" }}
            >
              <span
                className="text-sm font-orbitron font-bold"
                style={{ color: "var(--juku-neon-gold)" }}
              >
                ◈ 今月の統計
              </span>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "学習日数", value: "18日" },
                  { label: "総時間", value: "24h" },
                  { label: "解いた問題", value: "312問" },
                  { label: "正答率", value: "78%" },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col gap-1">
                    <span
                      className="text-xs font-space-mono"
                      style={{ color: "oklch(0.45 0 0)" }}
                    >
                      {stat.label}
                    </span>
                    <span
                      className="text-xl font-orbitron font-bold juku-neon-text-gold"
                      style={{ color: "var(--juku-neon-gold)" }}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
