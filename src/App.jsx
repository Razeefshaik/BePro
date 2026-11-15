import { useEffect, useState } from "react";
import { useApp } from "./state/useApp.js";
import { loadPref, savePref } from "./state/persistence.js";
import { loadServerConfig } from "./api/client.js";
import { ErrorBoundary } from "./components/common.jsx";
import StartScreen from "./screens/StartScreen.jsx";
import RoadmapScreen from "./screens/RoadmapScreen.jsx";
import LearnScreen from "./screens/LearnScreen.jsx";
import ResultsScreen from "./screens/ResultsScreen.jsx";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/start.css";
import "./styles/roadmap.css";
import "./styles/learn-layout.css";
import "./styles/flashcard.css";
import "./styles/visuals.css";
import "./styles/quiz.css";
import "./styles/doubt.css";
import "./styles/liveboard.css";
import "./styles/learn-responsive.css";
import "./styles/results.css";

export default function App() {
  const { state, activeSession, actions } = useApp();
  const [theme, setTheme] = useState(() => (loadPref("theme", "meadow") === "night" ? "night" : "meadow"));

  useEffect(() => {
    document.documentElement.className = `t-${theme}`;
    savePref("theme", theme);
  }, [theme]);

  // Ask the server once how long a request may take (it depends on the model provider),
  // and whether it runs on demo content (no real model set up).
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    loadServerConfig().then((config) => setDemo(config?.provider === "mock"));
  }, []);

  const toggleTheme = () => setTheme((t) => (t === "meadow" ? "night" : "meadow"));

  // Without an open session, only the start screen makes sense.
  const screen = activeSession ? state.screen : "start";
  const props = { state, session: activeSession, actions, theme, toggleTheme, demo };

  return (
    <ErrorBoundary key={`${screen}:${state.activeId}`}>
      {screen === "start" && <StartScreen {...props} />}
      {screen === "roadmap" && <RoadmapScreen {...props} />}
      {screen === "learn" && <LearnScreen {...props} />}
      {screen === "results" && <ResultsScreen {...props} />}
    </ErrorBoundary>
  );
}
