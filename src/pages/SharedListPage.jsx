import { Film } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getMovieDetails, getTVBundle } from "../api/tmdb";
import MovieCards from "../components/MovieCards";
import { usePageMetadata } from "../hooks/usePageMetadata";
import { parseSharedList } from "../utils/sharedList";

export default function SharedListPage({ watchlist, handleAddToWatchlist, handleRemoveFromWatchlist }) {
  const [params] = useSearchParams(); const entries = parseSharedList(params.get("items")); const [items,setItems]=useState([]); const [loading,setLoading]=useState(true);
  usePageMetadata({ title:"Shared Watchlist", description:"A read-only FlickMuse watchlist shared by another viewer.", canonicalPath:"/list", robots:"noindex,follow" });
  useEffect(()=>{ const controller=new AbortController(); setLoading(true); Promise.allSettled(entries.map(e=>(e.mediaType==="tv"?getTVBundle(e.id,controller.signal):getMovieDetails(e.id,controller.signal)).then(x=>({...x,media_type:e.mediaType})))).then(results=>setItems(results.filter(x=>x.status==="fulfilled").map(x=>x.value))).finally(()=>{if(!controller.signal.aborted)setLoading(false)}); return()=>controller.abort(); },[params.toString()]);
  return <section className="min-h-[70vh] bg-flick-bg px-5 py-16 text-flick-text sm:px-8"><div className="mx-auto max-w-[1600px]"><p className="text-xs font-bold uppercase tracking-[.22em] text-flick-accent">Shared collection</p><h1 className="mt-3 text-4xl font-black">FlickMuse watchlist</h1><p className="mt-3 text-flick-muted">This is a read-only shared list. Your personal watchlist is not changed unless you use a card’s save button.</p>{!entries.length&&!loading?<div className="mt-10 rounded-3xl border border-flick-border bg-flick-surface p-8 text-center"><Film className="mx-auto h-10 w-10 text-flick-muted"/><p className="mt-4 font-bold">This shared-list link is empty or invalid.</p><Link to="/" className="mt-5 inline-block text-flick-accent">Explore FlickMuse</Link></div>:<div className="mt-9 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">{loading?Array.from({length:6},(_,i)=><div key={i} className="aspect-[2/3] animate-pulse rounded-2xl bg-white/[.07]"/>):items.map(item=><MovieCards key={`${item.media_type}:${item.id}`} movie={item} watchlist={watchlist} handleAddToWatchlist={handleAddToWatchlist} handleRemoveFromWatchlist={handleRemoveFromWatchlist}/>)}</div>}</div></section>;
}
