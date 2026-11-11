// A 270 degree gauge for the overall score.
export default function ScoreGauge({ percent, label }) {
  const radius = 118;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * 0.75; // 270 of 360 degrees
  const filled = (arc * Math.max(0, Math.min(100, percent))) / 100;

  return (
    <div className="gauge">
      <svg viewBox="0 0 300 300" role="img" aria-label={`Score ${percent} percent`}>
        <defs>
          <linearGradient id="gauge-fill" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="var(--good-fill)" />
            <stop offset="1" stopColor="var(--focus)" />
          </linearGradient>
        </defs>
        <circle cx="150" cy="150" r={radius} className="gauge-track" strokeDasharray={`${arc} ${circumference}`} transform="rotate(135 150 150)" />
        <circle cx="150" cy="150" r={radius} className="gauge-value" stroke="url(#gauge-fill)" strokeDasharray={`${filled} ${circumference}`} transform="rotate(135 150 150)" />
        <circle cx="150" cy="150" r="94" className="gauge-ticks" />
      </svg>
      <div className="gauge-center">
        <span className="gauge-number">
          {percent}
          <small>%</small>
        </span>
        <span className="muted">{label}</span>
      </div>
    </div>
  );
}
