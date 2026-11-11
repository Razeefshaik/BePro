// Picks the right renderer for a validated visual. Unknown kinds render nothing (never crash).
import FlowVisual from "./FlowVisual.jsx";
import ChartVisual from "./ChartVisual.jsx";
import DiagramVisual from "./DiagramVisual.jsx";
import AnimationVisual from "./AnimationVisual.jsx";
import ImageVisual from "./ImageVisual.jsx";

const RENDERERS = {
  flow: FlowVisual,
  chart: ChartVisual,
  diagram: DiagramVisual,
  animation: AnimationVisual,
  image: ImageVisual,
};

export default function Visual({ visual, compact = false }) {
  if (!visual) return null;
  const Renderer = RENDERERS[visual.kind];
  if (!Renderer) return null;
  return (
    <figure className={`visual visual-${visual.kind} ${compact ? "visual-compact" : ""}`}>
      <Renderer visual={visual} />
    </figure>
  );
}
