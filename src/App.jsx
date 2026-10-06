import { lazy, Suspense, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import PageLoader from "./components/PageLoader";
import ScrollToTop from "./components/ScrollToTop";
import Toast from "./components/Toast";
import RouteTransition from "./components/RouteTransition";
import InstallAppPrompt from "./components/InstallAppPrompt";
import { useWatchlist } from "./hooks/useWatchlist";
import { usePwaInstall } from "./hooks/usePwaInstall";

const HomePage = lazy(() => import("./pages/HomePage"));
const DiscoverPage = lazy(() => import("./pages/DiscoverPage"));
const TVShowsPage = lazy(() => import("./pages/TVShowsPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const PersonDetails = lazy(() => import("./pages/PersonDetails"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const MovieDetails = lazy(() => import("./components/MovieDetails"));
const WatchList = lazy(() => import("./components/WatchList"));
const TonightPage = lazy(() => import("./pages/TonightPage"));
const SharedListPage = lazy(() => import("./pages/SharedListPage"));
const GenrePage = lazy(() => import("./pages/GenrePage"));
const TopRatedPage = lazy(() => import("./pages/TopRatedPage"));
const ComparePage = lazy(() => import("./pages/ComparePage"));
const CollectionPage = lazy(() => import("./pages/CollectionPage"));

function App() {
  const { watchlist, addToWatchlist, removeFromWatchlist, changeViewingState } = useWatchlist();
  const [toast, setToast] = useState(null);
  const pwaInstall = usePwaInstall();

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
    changeViewingState,
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

      <Navbar watchlistCount={watchlist.length} installAvailable={pwaInstall.installAvailable} onInstallApp={pwaInstall.install} />

      <main id="main-content" tabIndex="-1" className="min-h-[calc(100svh-5rem)] outline-none">
        <Suspense fallback={<PageLoader />}>
          <RouteTransition>
            <Routes>
              <Route path="/" element={<HomePage {...discoveryProps} />} />
              <Route path="/discover" element={<DiscoverPage {...discoveryProps} />} />
              <Route path="/discover/tonight" element={<TonightPage />} />
              <Route path="/list" element={<SharedListPage {...discoveryProps} />} />
              <Route path="/genre/:slug" element={<GenrePage {...discoveryProps} />} />
              <Route path="/top-rated" element={<TopRatedPage {...discoveryProps} />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/tv" element={<TVShowsPage {...discoveryProps} />} />
              <Route path="/search" element={<SearchPage {...discoveryProps} />} />
              <Route
                path="/watchlist"
                element={
                  <WatchList watchlist={watchlist} handleRemoveFromWatchlist={handleRemoveFromWatchlist} changeViewingState={changeViewingState} />
                }
              />
              <Route path="/movie/:slug/:id" element={<MovieDetails {...discoveryProps} />} />
              <Route path="/movie/:id" element={<MovieDetails {...discoveryProps} />} />
              <Route path="/tv/:slug/:id" element={<MovieDetails {...discoveryProps} mediaType="tv" />} />
              <Route path="/tv/:id" element={<MovieDetails {...discoveryProps} mediaType="tv" />} />
              <Route path="/person/:slug/:id" element={<PersonDetails {...discoveryProps} />} />
              <Route path="/person/:id" element={<PersonDetails {...discoveryProps} />} />
              <Route path="/collection/:slug/:id" element={<CollectionPage {...discoveryProps} />} />
              <Route path="/collection/:id" element={<CollectionPage {...discoveryProps} />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </RouteTransition>
        </Suspense>
      </main>

      <Footer />
      <Toast key={toast?.id} toast={toast} onClose={() => setToast(null)} />
      <InstallAppPrompt
        showBanner={pwaInstall.showBanner}
        iosInstructionsOpen={pwaInstall.iosInstructionsOpen}
        onInstall={pwaInstall.install}
        onDismiss={pwaInstall.dismissBanner}
        onCloseInstructions={pwaInstall.closeIosInstructions}
      />

    </BrowserRouter>
  );
}

export default App;
