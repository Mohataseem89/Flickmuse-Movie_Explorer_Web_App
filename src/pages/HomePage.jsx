import Banner from "../components/Banner";
import DiscoveryRows from "../components/DiscoveryRows";
import Movies from "../components/Movies";
import { usePageMetadata } from "../hooks/usePageMetadata";
import { SITE_NAME, SITE_URL } from "../seo/site";
import { Link } from "react-router-dom";

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
      <DiscoveryRows {...props} />
      <section className="border-b border-white/[0.07] bg-[#0b0e14] py-12 text-white sm:py-16" aria-labelledby="mood-title"><div className="mx-auto max-w-[1600px] px-5 sm:px-8"><p className="text-xs font-bold uppercase tracking-[0.22em] text-red-400">Choose a feeling</p><h2 id="mood-title" className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">What are you in the mood for?</h2><div className="mt-7 flex flex-wrap gap-3">{moodLinks.map((mood) => <Link key={mood.label} to={'/discover?genre=' + mood.genre + '&rating=' + mood.rating} className="min-h-11 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-gray-200 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-white">{mood.label}</Link>)}</div></div></section>
      <Movies {...props} />
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
