import { RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { discoverTonight, getImageUrl, getMovieDetails } from "../api/tmdb";
import { usePageMetadata } from "../hooks/usePageMetadata";
import { getMediaPath } from "../utils/mediaUrl";
import { DEFAULT_REGION, getInitialRegion, WATCH_REGIONS } from "../utils/region";

const MOODS = {
  "feel-good": { label: "Feel-good", genres: "35,10751" }, exciting: { label: "Exciting", genres: "28,12" },
  funny: { label: "Funny", genres: "35" }, dark: { label: "Dark", genres: "80,53" }, romantic: { label: "Romantic", genres: "10749" },
  thoughtful: { label: "Thought-provoking", genres: "18,878" }, scary: { label: "Scary", genres: "27,53" },
};
const RUNTIMES = { short: [0, 89, "Under 90 min"], medium: [90, 120, "90–120 min"], long: [121, 400, "2+ hours"] };

export default function TonightPage() {
  const [params, setParams] = useSearchParams();
  const mood = MOODS[params.get("mood")] ? params.get("mood") : "feel-good";
  const runtime = RUNTIMES[params.get("runtime")] ? params.get("runtime") : "medium";
  const region = WATCH_REGIONS.some(([code]) => code === params.get("region")) ? params.get("region") : getInitialRegion() || DEFAULT_REGION;
  const [result, setResult] = useState(null); const [pool, setPool] = useState([]); const [index, setIndex] = useState(0); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  usePageMetadata({ title: "What Should I Watch Tonight?", description: "Pick a mood, runtime and region to get a quality-controlled movie recommendation from FlickMuse.", canonicalPath: "/discover/tonight" });
  const filters = useMemo(() => ({ mood, runtime, region }), [mood, runtime, region]);

  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(""); setResult(null);
    const [minRuntime, maxRuntime] = RUNTIMES[runtime];
    discoverTonight({ genres: MOODS[mood].genres, minRuntime, maxRuntime, region }, controller.signal)
      .then((data) => { const candidates = (data.results || []).filter((item) => item.poster_path && item.overview && item.vote_count >= 150).slice(0, 20); setPool(candidates); setIndex(0); if (!candidates.length) throw new Error("No strong matches found. Try another combination."); return getMovieDetails(candidates[0].id, controller.signal); })
      .then(setResult).catch((err) => { if (err.name !== "AbortError") setError(err.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filters, mood, runtime, region]);

  const update = (key, value) => { const next = new URLSearchParams(params); next.set(key, value); setParams(next); };
  const reroll = async () => { if (pool.length < 2) return; const next = (index + 1) % pool.length; setIndex(next); setLoading(true); try { setResult(await getMovieDetails(pool[next].id)); } catch (err) { setError(err.message); } finally { setLoading(false); } };

  return <section className="min-h-screen bg-flick-bg px-5 py-16 text-flick-text sm:px-8 sm:py-20"><div className="mx-auto max-w-6xl">
    <p className="text-xs font-bold uppercase tracking-[0.22em] text-flick-accent">Guided discovery</p><h1 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">What should I watch tonight?</h1><p className="mt-4 max-w-2xl leading-7 text-flick-muted">Choose a mood, runtime and region. FlickMuse filters for established, well-rated movies rather than picking randomly from the whole catalogue.</p>
    <div className="mt-8 grid gap-4 rounded-3xl border border-flick-border bg-flick-surface p-5 md:grid-cols-3 md:p-6">
      <label className="text-sm font-bold">Mood<select value={mood} onChange={(e)=>update("mood",e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-flick-border bg-flick-elevated px-3 text-white">{Object.entries(MOODS).map(([v,x])=><option key={v} value={v}>{x.label}</option>)}</select></label>
      <label className="text-sm font-bold">Runtime<select value={runtime} onChange={(e)=>update("runtime",e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-flick-border bg-flick-elevated px-3 text-white">{Object.entries(RUNTIMES).map(([v,x])=><option key={v} value={v}>{x[2]}</option>)}</select></label>
      <label className="text-sm font-bold">Region<select value={region} onChange={(e)=>update("region",e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-flick-border bg-flick-elevated px-3 text-white">{WATCH_REGIONS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
    </div>
    {error && <p role="alert" className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">{error}</p>}
    {loading && !result ? <div className="mt-8 aspect-[16/7] animate-pulse rounded-3xl bg-white/[0.07]"/> : result && <article className="mt-8 overflow-hidden rounded-3xl border border-flick-border bg-flick-surface shadow-flick-card"><div className="grid md:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
      <div className="min-h-[280px] bg-cover bg-center md:min-h-[460px]" style={{backgroundImage:`linear-gradient(90deg,rgba(8,10,15,.05),rgba(8,10,15,.75)),url(${getImageUrl(result.backdrop_path,"w1280")})`}} />
      <div className="p-6 sm:p-8"><Sparkles className="h-7 w-7 text-flick-accent" aria-hidden="true"/><h2 className="mt-4 text-3xl font-black">{result.title}</h2><p className="mt-2 text-sm text-flick-muted">{result.release_date?.slice(0,4)} · {result.runtime ? `${result.runtime} min` : "Runtime unavailable"} · ★ {result.vote_average?.toFixed(1)}</p><p className="mt-5 line-clamp-6 leading-7 text-gray-300">{result.overview}</p><div className="mt-5 flex flex-wrap gap-2">{result.genres?.slice(0,4).map(g=><span key={g.id} className="rounded-full border border-flick-border px-3 py-1 text-xs text-gray-300">{g.name}</span>)}</div><div className="mt-7 flex flex-wrap gap-3"><Link to={getMediaPath(result)} className="inline-flex min-h-12 items-center rounded-xl bg-flick-accent px-5 font-bold text-white hover:bg-red-500">Open details</Link><button type="button" onClick={reroll} disabled={loading || pool.length < 2} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-flick-border px-5 font-bold hover:bg-white/[0.06] disabled:opacity-50"><RefreshCw className="h-4 w-4"/>Reroll</button></div></div>
    </div></article>}
  </div></section>;
}
