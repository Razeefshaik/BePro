// The model only gives a search term. Our code looks it up on Wikimedia Commons.
// No result (or a failed lookup) means no image, not an error.
import { useEffect, useState } from "react";
import { Skeleton } from "../common.jsx";

const cache = new Map(); // searchTerm -> { url, page } or null

async function findImage(term, signal) {
  if (cache.has(term)) return cache.get(term);
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrnamespace: "6",
    gsrlimit: "5",
    gsrsearch: `${term} filetype:bitmap`,
    prop: "imageinfo",
    iiprop: "url|mime",
    iiurlwidth: "640",
  });
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { signal });
  const json = await response.json();
  const pages = Object.values(json?.query?.pages ?? {}).sort((a, b) => a.index - b.index);
  const hit = pages.find((p) => p.imageinfo?.[0]?.thumburl && /^image\/(jpeg|png|webp)/.test(p.imageinfo[0].mime));
  const result = hit ? { url: hit.imageinfo[0].thumburl, page: hit.imageinfo[0].descriptionurl, title: hit.title.replace(/^File:/, "") } : null;
  cache.set(term, result);
  return result;
}

export default function ImageVisual({ visual }) {
  const [state, setState] = useState(() => (cache.has(visual.searchTerm) ? { status: "done", image: cache.get(visual.searchTerm) } : { status: "loading" }));

  useEffect(() => {
    if (cache.has(visual.searchTerm)) {
      setState({ status: "done", image: cache.get(visual.searchTerm) });
      return undefined;
    }
    const controller = new AbortController();
    findImage(visual.searchTerm, controller.signal)
      .then((image) => setState({ status: "done", image }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "done", image: null });
      });
    return () => controller.abort();
  }, [visual.searchTerm]);

  if (state.status === "loading") return <Skeleton height={180} radius={16} />;
  if (!state.image) return null;
  return (
    <>
      <img className="visual-image" src={state.image.url} alt={visual.searchTerm} loading="lazy" onError={(e) => (e.currentTarget.style.display = "none")} />
      <figcaption className="visual-caption">
        <a href={state.image.page} target="_blank" rel="noreferrer">
          {state.image.title}
        </a>{" "}
        · Wikimedia Commons
      </figcaption>
    </>
  );
}
