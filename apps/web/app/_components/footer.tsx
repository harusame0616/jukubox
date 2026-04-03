const links = [
  { label: "機能", href: "#機能" },
  { label: "使い方", href: "#使い方" },
  { label: "学習記録", href: "#学習記録" },
  { label: "ドキュメント", href: "#" },
  { label: "プライバシー", href: "#" },
  { label: "利用規約", href: "#" },
];

export function Footer() {
  return (
    <footer
      className="relative py-16 px-8"
      style={{
        background: "var(--juku-bg)",
        borderTop: "1px solid oklch(0.85 0.18 195 / 0.08)",
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-10">
        {/* ロゴ */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-baseline gap-0.5">
            <span
              className="font-orbitron font-black text-2xl juku-neon-text-cyan"
              style={{ color: "var(--juku-neon-cyan)" }}
            >
              JukuBox
            </span>
            <span
              className="font-orbitron font-black text-sm juku-neon-text-magenta"
              style={{ color: "var(--juku-neon-magenta)" }}
            >
              .ai
            </span>
          </div>
          <p
            className="text-xs font-space-mono text-center"
            style={{ color: "oklch(0.45 0 0)" }}
          >
            AI エージェントと好きなことを好きなだけ学ぶ
          </p>
        </div>

        {/* リンク */}
        <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs font-space-mono uppercase tracking-widest transition-colors duration-200"
              style={{ color: "oklch(0.4 0 0)" }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* セパレーター */}
        <div
          className="w-full h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.85 0.18 195 / 0.15) 30%, oklch(0.65 0.28 330 / 0.15) 70%, transparent)",
          }}
        />

        {/* コピーライト */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center">
          <p
            className="text-xs font-space-mono"
            style={{ color: "oklch(0.35 0 0)" }}
          >
            © 2025 JukuBox.ai — All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {["Claude", "GPT-4o", "Gemini"].map((model) => (
              <span
                key={model}
                className="text-[10px] font-space-mono px-2 py-0.5"
                style={{
                  border: "1px solid oklch(0.85 0.18 195 / 0.15)",
                  color: "oklch(0.35 0 0)",
                }}
              >
                {model}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
