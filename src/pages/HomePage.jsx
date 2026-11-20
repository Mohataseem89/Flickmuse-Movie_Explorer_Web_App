import Banner from "../components/Banner";
import DiscoveryRows from "../components/DiscoveryRows";
import Movies from "../components/Movies";
import DeferredSection from "../components/DeferredSection";
import { usePageMetadata } from "../hooks/usePageMetadata";
import { SITE_NAME, SITE_URL } from "../seo/site";
import { Link } from "react-router-dom";
import { ArrowUpRight, Instagram } from "lucide-react";

const moodLinks = [
  { label: "Feel-good comedy", genre: 35, rating: 6 },
  { label: "Edge-of-your-seat thrillers", genre: 53, rating: 7 },
  { label: "Mind-bending sci-fi", genre: 878, rating: 7 },
  { label: "Romantic nights", genre: 10749, rating: 6 },
  { label: "Family movie night", genre: 10751, rating: 6 },
];

export default function HomePage(props) {
  usePageMetadata({
    title: "FlickMuse — Movie Discovery, Trailers & Cast",
    description:
      "Explore trending, popular, upcoming, and top-rated movies on FlickMuse. Watch trailers, browse cast, view movie details, and save a personal watchlist.",
    canonicalPath: "/",
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          name: SITE_NAME,
          url: SITE_URL + "/",
          description: "A movie discovery website for browsing films, trailers, cast, and movie details.",
          potentialAction: {
            "@type": "SearchAction",
            target: SITE_URL + "/search?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        },
        {
          "@type": "WebApplication",
          name: SITE_NAME,
          applicationCategory: "EntertainmentApplication",
          operatingSystem: "Web",
          url: SITE_URL + "/",
          description: "Discover movies, trailers, cast profiles, and movie details, then save titles to a personal watchlist.",
        },
      ],
    },
  });

  return (
    <>
      <Banner />
      <DeferredSection fallback={<div className="min-h-[320px] bg-[#0b0e14]" aria-hidden="true" />}><DiscoveryRows {...props} /></DeferredSection>
      <section className="border-b border-white/[0.07] bg-[#0b0e14] py-12 text-white sm:py-16" aria-labelledby="mood-title"><div className="mx-auto max-w-[1600px] px-5 sm:px-8"><p className="text-xs font-bold uppercase tracking-[0.22em] text-red-400">Choose a feeling</p><h2 id="mood-title" className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">What are you in the mood for?</h2><div className="mt-7 flex flex-wrap gap-3">{moodLinks.map((mood) => <Link key={mood.label} to={'/discover?genre=' + mood.genre + '&rating=' + mood.rating} className="min-h-11 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-gray-200 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-white">{mood.label}</Link>)}</div><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold"><Link to="/genre/science-fiction" className="text-red-400 hover:text-red-300">Science-fiction movies →</Link><Link to="/genre/horror" className="text-red-400 hover:text-red-300">Horror movies →</Link><Link to="/top-rated" className="text-red-400 hover:text-red-300">Top-rated movies →</Link><Link to="/compare" className="text-red-400 hover:text-red-300">Compare two movies →</Link></div></div></section>
      <section className="border-y border-pink-400/10 bg-[radial-gradient(ellipse_at_top_left,_rgba(190,24,93,0.13),_transparent_55%),#080a0f] py-10 text-white sm:py-12" aria-labelledby="smozaic-instagram-title">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-5 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-orange-400/20 text-pink-300 ring-1 ring-pink-300/20">
              <Instagram className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-pink-300">Stay in the loop</p>
              <h2 id="smozaic-instagram-title" className="mt-2 text-2xl font-black tracking-[-0.035em] sm:text-3xl">Your next scroll-worthy find is on Instagram</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300 sm:text-base">Join Smozaic on Instagram and keep the movie inspiration going beyond FlickMuse.</p>
            </div>
          </div>
          <a
            href="https://www.instagram.com/smozaic/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-pink-950/25 transition duration-200 hover:-translate-y-0.5 hover:from-pink-500 hover:to-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-300 md:self-center"
            aria-label="Visit Smozaic on Instagram (opens in a new tab)"
          >
            <Instagram className="h-4 w-4" aria-hidden="true" />
            Follow @smozaic
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>
      <DeferredSection fallback={<div className="min-h-[420px] bg-[#080a0f]" aria-hidden="true" />}><Movies {...props} /></DeferredSection>
      <section className="border-t border-white/[0.07] bg-[#0b0e14] py-16 text-white sm:py-20" aria-labelledby="about-flickmuse-title">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-400">About FlickMuse</p>
          <h2 id="about-flickmuse-title" className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            A simple way to find your next movie
          </h2>
          <p className="mt-4 max-w-3xl leading-7 text-gray-300">
            FlickMuse helps movie lovers explore popular, trending, upcoming, and top-rated films. Search by title, use genre and rating filters, open trailers and cast profiles, and keep a personal watchlist for later.
          </p>
        </div>
      </section>
    </>
  );
}
