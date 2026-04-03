export function Nav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
      style={{
        background: "oklch(0.08 0.02 260 / 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid oklch(0.85 0.18 195 / 0.12)",
      }}
    >
      {/* ロゴ */}
      <a href="#" className="flex items-baseline gap-0.5 no-underline">
        <span
          className="font-orbitron font-black text-2xl tracking-wider juku-neon-text-cyan"
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
      </a>

      {/* ナビリンク */}
      <div className="hidden md:flex items-center gap-8">
        {["機能", "使い方", "学習記録"].map((label) => (
          <a
            key={label}
            href={`#${label}`}
            className="text-sm font-medium tracking-wide transition-all duration-200"
            style={{ color: "oklch(0.7 0 0)" }}
            onMouseEnter={undefined}
          >
            {label}
          </a>
        ))}
      </div>

      {/* CTA */}
      <button
        className="juku-cta-btn-primary px-6 py-2 text-sm font-bold font-orbitron uppercase tracking-widest"
      >
        <span>無料で始める</span>
      </button>
    </nav>
  );
}
