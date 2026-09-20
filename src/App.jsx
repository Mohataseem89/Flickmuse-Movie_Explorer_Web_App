import { lazy, Suspense, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import PageLoader from "./components/PageLoader";
import ScrollToTop from "./components/ScrollToTop";
import Toast from "./components/Toast";
import RouteTransition from "./components/RouteTransition";
import { useWatchlist } from "./hooks/useWatchlist";
import { Analytics } from '@vercel/analytics/next';

const HomePage = lazy(() => import("./pages/HomePage"));
const DiscoverPage = lazy(() => import("./pages/DiscoverPage"));
const TVShowsPage = lazy(() => import("./pages/TVShowsPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const PersonDetails = lazy(() => import("./pages/PersonDetails"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const MovieDetails = lazy(() => import("./components/MovieDetails"));
const WatchList = lazy(() => import("./components/WatchList"));

function App() {
  const { watchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const [toast, setToast] = useState(null);

  const showToast = (message, tone = "success") => {
    setToast({ id: Date.now(), message, tone });
  };

  const handleAddToWatchlist = (movie) => {
    if (!addToWatchlist(movie)) {
      showToast("This movie is already in your watchlist.", "info");
      return;
    }

    showToast((movie.title || movie.name) + " added to your watchlist.");
  };

  const handleRemoveFromWatchlist = (movie) => {
    removeFromWatchlist(movie);
    showToast((movie.title || movie.name) + " removed from your watchlist.", "info");
  };

  const discoveryProps = {
    watchlist,
    handleAddToWatchlist,
    handleRemoveFromWatchlist,
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-24 rounded-lg bg-white px-4 py-2 font-semibold text-black transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>

      <Navbar watchlistCount={watchlist.length} />

      <main id="main-content" tabIndex="-1" className="outline-none">
        <Suspense fallback={<PageLoader />}>
          <RouteTransition>
            <Routes>
              <Route path="/" element={<HomePage {...discoveryProps} />} />
              <Route path="/discover" element={<DiscoverPage {...discoveryProps} />} />
              <Route path="/tv" element={<TVShowsPage {...discoveryProps} />} />
              <Route path="/search" element={<SearchPage {...discoveryProps} />} />
              <Route
                path="/watchlist"
                element={
                  <WatchList
                    watchlist={watchlist}
                    handleRemoveFromWatchlist={handleRemoveFromWatchlist}
                  />
                }
              />
              <Route path="/movie/:slug/:id" element={<MovieDetails {...discoveryProps} />} />
              <Route path="/movie/:id" element={<MovieDetails {...discoveryProps} />} />
              <Route path="/tv/:slug/:id" element={<MovieDetails {...discoveryProps} mediaType="tv" />} />
              <Route path="/tv/:id" element={<MovieDetails {...discoveryProps} mediaType="tv" />} />
              <Route path="/person/:id" element={<PersonDetails {...discoveryProps} />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </RouteTransition>
        </Suspense>
      </main>

      <Footer />
      <Toast key={toast?.id} toast={toast} onClose={() => setToast(null)} />
      <Analytics />

    </BrowserRouter>
  );
}

export default App;
