// Bar or line chart from labels and values, drawn with plain elements (no chart library).

function format(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export default function ChartVisual({ visual }) {
  const { chartType, labels, values, caption } = visual;
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const share = (v) => ((v - min) / range) * 100; // 0 to 100, height above the lowest value

  return (
    <>
      {chartType === "bar" ? (
        <div className="chart-bars" role="img" aria-label={`Bar chart. ${labels.map((l, i) => `${l}: ${format(values[i])}`).join(", ")}`}>
          {values.map((v, i) => (
            <div key={i} className="chart-col">
              <span className="chart-value">{format(v)}</span>
              <span className="chart-bar" style={{ height: `${Math.max(3, share(v))}%` }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="chart-line" role="img" aria-label={`Line chart. ${labels.map((l, i) => `${l}: ${format(values[i])}`).join(", ")}`}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline
              points={values.map((v, i) => `${(i / (values.length - 1)) * 100},${100 - share(v)}`).join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
            />
          </svg>
          {values.map((v, i) => (
            <span key={i} className="chart-point" style={{ left: `${(i / (values.length - 1)) * 100}%`, bottom: `${share(v)}%` }}>
              <span className="chart-point-value">{format(v)}</span>
            </span>
          ))}
        </div>
      )}
      <div className="chart-labels" aria-hidden="true">
        {labels.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
      {caption && <figcaption className="visual-caption">{caption}</figcaption>}
    </>
  );
}
