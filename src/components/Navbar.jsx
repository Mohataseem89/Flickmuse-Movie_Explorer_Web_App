import { Bookmark, Clapperboard, Compass, Home, Menu, Tv, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import SearchBar from "./SearchBar";

const Navbar = ({ watchlistCount }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

  const navLinks = [
    { name: "Home", path: "/", icon: Home },
    { name: "Discover", path: "/discover", icon: Compass },
    { name: "TV shows", path: "/tv", icon: Tv },
    { name: "Watchlist", path: "/watchlist", icon: Bookmark },
  ];

  const isLinkActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080a0f]/90 text-white backdrop-blur-xl">
      <nav className="mx-auto max-w-[1600px] px-5 sm:px-8" aria-label="Primary navigation">
        <div className="flex h-[72px] items-center gap-5">
          <Link
            to="/"
            className="group flex shrink-0 items-center gap-3 rounded-xl"
            aria-label="FlickMuse home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 shadow-lg shadow-red-950/40 transition-transform duration-200 group-hover:scale-105">
              <Clapperboard className="h-5 w-5" aria-hidden="true" />
            </span>

            <span className="hidden text-xl font-black tracking-[-0.03em] sm:inline xl:text-2xl">
              Flick<span className="text-red-500">Muse</span>
            </span>
          </Link>

          <div className="mx-auto hidden min-w-0 flex-1 justify-center lg:flex">
            <SearchBar />
          </div>

          <div className="ml-auto hidden shrink-0 items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = isLinkActive(link.path);

              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={
                    "relative flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors xl:px-4 " +
                    (isActive
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:bg-white/5 hover:text-white")
                  }
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  <span className="hidden xl:inline">{link.name}</span>
                  {link.name === "Watchlist" && watchlistCount > 0 && (
                    <span className="flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                      {watchlistCount > 99 ? "99+" : watchlistCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-gray-200 transition-colors hover:bg-white/10 hover:text-white md:hidden"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>

        <div
          id="mobile-navigation"
          aria-hidden={!menuOpen}
          inert={!menuOpen}
          className={
            "grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 md:hidden " +
            (menuOpen
              ? "grid-rows-[1fr] pb-4 opacity-100"
              : "pointer-events-none grid-rows-[0fr] opacity-0")
          }
        >
          <div className="min-h-0">
            <div className="rounded-2xl border border-white/10 bg-[#11151c] p-2">
              <div className="p-2">
                <SearchBar compact onNavigate={() => setMenuOpen(false)} />
              </div>
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = isLinkActive(link.path);

                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={
                      "flex min-h-12 items-center gap-3 rounded-xl px-4 font-semibold transition-colors " +
                      (isActive
                        ? "bg-red-600 text-white"
                        : "text-gray-300 hover:bg-white/10 hover:text-white")
                    }
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span className="flex-1">{link.name}</span>
                    {link.name === "Watchlist" && watchlistCount > 0 && (
                      <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">
                        {watchlistCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
