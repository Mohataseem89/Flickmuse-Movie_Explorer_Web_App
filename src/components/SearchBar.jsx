import { Clock3, Film, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getImageUrl, searchTitles } from "../api/tmdb";
import {
  clearRecentSearches,
  getRecentSearches,
  saveRecentSearch,
} from "../utils/searchHistory";
import { getMediaPath } from "../utils/mediaUrl";

const SearchBar = ({ compact = false, onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);
  const resultsId = useId();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState(getRecentSearches);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (location.pathname === "/search") {
      setQuery(new URLSearchParams(location.search).get("q") || "");
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setLoading(true);
        const data = await searchTitles(normalizedQuery, 1, controller.signal);
        setSuggestions((data.results || []).filter((result) => result.media_type === "movie" || result.media_type === "tv").slice(0, 6));
      } catch (error) {
        if (error.name !== "AbortError") setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const runSearch = (searchQuery) => {
    const normalizedQuery = searchQuery.trim();
    if (!normalizedQuery) return;

    setRecentSearches(saveRecentSearch(normalizedQuery));
    setSuggestions([]);
    setActiveIndex(-1);
    setFocused(false);
    navigate("/search?q=" + encodeURIComponent(normalizedQuery));
    onNavigate?.();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    runSearch(query);
  };

  const handleSuggestion = (movie) => {
    const title = movie.title || movie.name || query;
    setRecentSearches(saveRecentSearch(title));
    setSuggestions([]);
    setActiveIndex(-1);
    setFocused(false);
    navigate(getMediaPath(movie));
    onNavigate?.();
  };

  const handleInputKeyDown = (event) => {
    if (event.key === "Escape") {
      setFocused(false);
      setActiveIndex(-1);
      event.currentTarget.blur();
      return;
    }

    if (suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        index <= 0 ? suggestions.length - 1 : index - 1
      );
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      handleSuggestion(suggestions[activeIndex]);
    }
  };

  const showDropdown =
    focused &&
    (suggestions.length > 0 ||
      loading ||
      query.trim().length >= 2 ||
      (query.trim().length === 0 && recentSearches.length > 0));

  return (
    <div
      ref={containerRef}
      className={"relative " + (compact ? "w-full" : "w-full max-w-xl")}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget)) {
          setFocused(false);
        }
      }}
    >
      <form onSubmit={handleSubmit} role="search">
        <label className="relative block">
          <span className="sr-only">Search movies and TV shows</span>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={handleInputKeyDown}
            type="search"
            placeholder={compact ? "Search movies and TV" : "Search movies, TV shows and more"}
            autoComplete="off"
            className={
              "w-full rounded-xl border border-white/10 bg-white/[0.055] py-2.5 pl-11 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-red-500/70 focus:bg-[#11151c] " +
              (query ? "pr-11" : "pr-4")
            }
            aria-expanded={showDropdown}
            aria-controls={resultsId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0
                ? resultsId + "-option-" + activeIndex
                : undefined
            }
            role="combobox"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setActiveIndex(-1);
              }}
              className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Clear movie search"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </label>
      </form>

      {showDropdown && (
        <div
          id={resultsId}
          className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-[70] overflow-hidden rounded-2xl border border-white/10 bg-[#11151c]/98 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          {loading && (
            <div
              className="flex items-center gap-3 px-3 py-4 text-sm text-gray-400"
              role="status"
              aria-live="polite"
            >
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-red-500" />
              Searching titles…
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <ul aria-label="Movie and TV show suggestions" role="listbox">
              {suggestions.map((movie, index) => {
                const title = movie.title || movie.name || "Untitled movie";
                const poster = getImageUrl(movie.poster_path, "w92");

                return (
                  <li key={movie.id}>
                    <button
                      id={resultsId + "-option-" + index}
                      type="button"
                      onClick={() => handleSuggestion(movie)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={
                        "flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors " +
                        (activeIndex === index
                          ? "bg-white/[0.1]"
                          : "hover:bg-white/[0.07]")
                      }
                      role="option"
                      aria-selected={activeIndex === index}
                      tabIndex={-1}
                    >
                      <span className="h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-900">
                        {poster ? (
                          <img
                            src={poster}
                            alt=""
                            width="92"
                            height="138"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-gray-400">
                            <Film className="h-4 w-4" aria-hidden="true" />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-1 block text-sm font-bold text-gray-100">
                          {title}
                        </span>
                        <span className="mt-1 block text-xs text-gray-400">
                          {movie.media_type === "tv" ? "TV show · " : "Movie · "}{(movie.release_date || movie.first_air_date)?.slice(0, 4) || "Release TBA"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
              <li className="mt-1 border-t border-white/[0.07] pt-1">
                <button
                  type="button"
                  onClick={() => runSearch(query)}
                  className="flex min-h-11 w-full items-center justify-center rounded-xl text-sm font-bold text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                >
                  View all results for “{query.trim()}”
                </button>
              </li>
            </ul>
          )}

          {!loading &&
            query.trim().length >= 2 &&
            suggestions.length === 0 && (
              <p className="px-3 py-4 text-sm text-gray-400" role="status">
                No movie or TV show suggestions found.
              </p>
            )}

          {!loading &&
            query.trim().length === 0 &&
            recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Recent searches
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      clearRecentSearches();
                      setRecentSearches([]);
                    }}
                    className="text-xs font-semibold text-gray-400 hover:text-white"
                  >
                    Clear
                  </button>
                </div>
                <ul>
                  {recentSearches.map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery(item);
                          runSearch(item);
                        }}
                        className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-gray-300 transition-colors hover:bg-white/[0.07] hover:text-white"
                      >
                        <Clock3 className="h-4 w-4 text-gray-600" aria-hidden="true" />
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
