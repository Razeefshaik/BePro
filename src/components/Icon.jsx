// Small inline stroke icons, so we need no icon library.
const PATHS = {
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  arrowLeft: "M19 12H5M11 6l-6 6 6 6",
  arrowUpRight: "M7 17L17 7M8 7h9v9",
  chevronLeft: "M15 6l-6 6 6 6",
  chevronRight: "M9 6l6 6-6 6",
  chevronDown: "M6 9l6 6 6-6",
  chevronUp: "M6 15l6-6 6 6",
  plus: "M12 5v14M5 12h14",
  close: "M6 6l12 12M18 6L6 18",
  check: "M5 12l5 5 9-10",
  redo: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5",
  refresh: "M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5",
  flip: "M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5",
  book: "M4 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4zM20 5h-5a3 3 0 0 0-3 3",
  list: "M4 19h16M4 5h16M4 12h10",
  menu: "M4 7h16M4 12h16M4 17h10",
  road: "M3 18c4 0 4-12 9-12s5 12 9 12",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  chat: "M4 5h16v11H9l-5 4z",
  send: "M4 12l16-8-6 16-2-7z",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  flag: "M5 21V4h11l-2 4 2 4H5",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  pencil: "M4 20h4L19 9l-4-4L4 16z",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8v.5M12 11v5",
  alert: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v6M12 16.5v.5",
  warn: "M12 3l10 18H2L12 3zM12 10v4M12 17v.5",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  pin: "M9 4h6l-1 6 3 3H7l3-3zM12 13v8",
  play: "M7 5l12 7-12 7z",
  pause: "M8 5v14M16 5v14",
  save: "M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6",
  home: "M4 11l8-7 8 7v9H4zM10 20v-5h4v5",
  external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9h.01",
  layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
  star: "M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z",
  bars: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  stairs1: "M8 20v-4M12 20v-8M16 20V8",
  stairs2: "M8 20v-8M12 20V8M16 20v-4",
  stairs3: "M8 20v-4M12 20V8M16 20V4",
  cap: "M12 3l9 5-9 5-9-5 9-5zM7 11v5c3 2 7 2 10 0v-5",
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z",
  fire: "M12 21c-4 0-7-3-7-7 0-4 3-6 4-10 2 2 3 4 3 6 1-1 2-2 2-4 3 3 5 5 5 8 0 4-3 7-7 7z",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
};

export default function Icon({ name, size = 18, stroke = 2, className, title }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : "true"}
      role={title ? "img" : undefined}
      aria-label={title}
    >
      <path d={d} />
    </svg>
  );
}
