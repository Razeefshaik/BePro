// Nodes and edges in a simple layered layout: a node sits one column right of its parents.
// Edges are lines in an SVG behind the nodes; nodes are normal HTML so their text wraps.

function layout(nodes, edges) {
  const layer = {};
  nodes.forEach((n) => (layer[n.id] = 0));
  // Push each edge's target right of its source. nodes.length passes are enough without cycles,
  // and the cap keeps a cyclic diagram from looping forever.
  for (let pass = 0; pass < nodes.length; pass++) {
    let changed = false;
    for (const e of edges) {
      if (e.from !== e.to && layer[e.to] <= layer[e.from] && layer[e.from] + 1 < nodes.length) {
        layer[e.to] = layer[e.from] + 1;
        changed = true;
      }
    }
    if (!changed) break;
  }

  const columns = [];
  nodes.forEach((n) => {
    (columns[layer[n.id]] ||= []).push(n);
  });
  const filled = columns.filter(Boolean);
  const position = {};
  filled.forEach((col, x) => {
    col.forEach((n, y) => {
      position[n.id] = { x: ((x + 0.5) / filled.length) * 100, y: ((y + 0.5) / col.length) * 100 };
    });
  });
  const tallest = Math.max(...filled.map((c) => c.length));
  return { position, columns: filled.length, tallest };
}

export default function DiagramVisual({ visual }) {
  const { nodes, edges } = visual;
  const { position, columns, tallest } = layout(nodes, edges);
  const description = edges.map((e) => `${label(nodes, e.from)} to ${label(nodes, e.to)}${e.label ? ` (${e.label})` : ""}`).join("; ");

  return (
    <div className="diagram" style={{ height: `${Math.max(150, tallest * 74)}px`, "--cols": columns }} role="img" aria-label={`Diagram: ${description || nodes.map((n) => n.label).join(", ")}`}>
      <svg className="diagram-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {edges.map((e, i) => {
          const a = position[e.from];
          const b = position[e.to];
          if (!a || !b) return null;
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} vectorEffect="non-scaling-stroke" />;
        })}
      </svg>
      {edges.map((e, i) => {
        const a = position[e.from];
        const b = position[e.to];
        if (!a || !b || !e.label) return null;
        return (
          <span key={`l${i}`} className="diagram-edge-label" style={{ left: `${(a.x + b.x) / 2}%`, top: `${(a.y + b.y) / 2}%` }} aria-hidden="true">
            {e.label}
          </span>
        );
      })}
      {nodes.map((n) => (
        <span key={n.id} className="diagram-node" style={{ left: `${position[n.id].x}%`, top: `${position[n.id].y}%` }} aria-hidden="true">
          {n.label}
        </span>
      ))}
    </div>
  );
}

function label(nodes, id) {
  return nodes.find((n) => n.id === id)?.label ?? id;
}
