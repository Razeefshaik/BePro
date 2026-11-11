// Boxes and arrows in a row (they wrap on narrow screens).
export default function FlowVisual({ visual }) {
  return (
    <>
      <ol className="flow" aria-label="Steps">
        {visual.steps.map((step, i) => (
          <li key={i} className="flow-step">
            <span className="flow-num" aria-hidden="true">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <figcaption className="sr-only">A flow of {visual.steps.length} steps.</figcaption>
    </>
  );
}
