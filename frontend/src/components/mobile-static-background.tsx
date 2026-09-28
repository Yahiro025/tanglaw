/**
 * Static, pure-CSS/SVG mobile background. Server-renderable, no JS animation.
 * Visible below the `md` breakpoint only (see .mobile-static-bg in globals.css).
 */
export default function MobileStaticBackground() {
  return (
    <div className="mobile-static-bg" aria-hidden="true">
      <div className="msb-glow" />
      <svg
        className="msb-svg"
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMin slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="msb-arc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--msb-arc-a)" stopOpacity="0.15" />
            <stop offset="0.55" stopColor="var(--msb-arc-b)" stopOpacity="0.55" />
            <stop offset="1" stopColor="var(--msb-arc-a)" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <circle cx="120" cy="560" r="420" fill="none" stroke="url(#msb-arc)" strokeWidth="1.2" />
        <circle cx="120" cy="560" r="416" fill="none" stroke="var(--msb-arc-b)" strokeOpacity="0.07" strokeWidth="6" />
        <g className="msb-stars" fill="var(--msb-star)">
          <circle cx="22" cy="140" r="1.2" opacity="0.7" />
          <circle cx="368" cy="160" r="1" opacity="0.5" />
          <circle cx="58" cy="228" r="1.4" opacity="0.6" />
          <circle cx="345" cy="300" r="1.1" opacity="0.5" />
          <circle cx="120" cy="80" r="0.9" opacity="0.4" />
          <circle cx="290" cy="90" r="1.2" opacity="0.5" />
          <circle cx="30" cy="420" r="1" opacity="0.35" />
          <circle cx="360" cy="520" r="1.2" opacity="0.4" />
          <circle cx="80" cy="640" r="0.9" opacity="0.3" />
          <circle cx="310" cy="720" r="1" opacity="0.3" />
        </g>
      </svg>
    </div>
  );
}
