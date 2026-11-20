import { ArrowUpRight, Film, Github, Instagram } from "lucide-react";

const REPOSITORY_URL = "https://github.com/Mohataseem89/Flickmuse-Movie_Explorer_Web_App";

const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-[#080a0f]">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-5 py-10 text-sm text-gray-400 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600">
              <Film className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-black tracking-tight">FlickMuse</span>
          </div>
          <p>Find a great movie. Save it for later.</p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:ml-auto">
          <a
            href="https://www.instagram.com/smozaic/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex min-h-14 items-center gap-3 rounded-2xl border border-pink-400/20 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-orange-400/10 px-4 py-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-pink-400/40 hover:bg-pink-500/15"
            aria-label="Follow Smozaic on Instagram (opens in a new tab)"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/20 to-orange-400/20 text-pink-300">
              <Instagram className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block font-bold text-white">Find Smozaic on Instagram</span>
              <span className="block text-xs text-gray-400">Follow along for more</span>
            </span>
            <ArrowUpRight className="ml-2 h-4 w-4 shrink-0 text-pink-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </a>
        </div>

        <div className="max-w-xl leading-6 lg:text-right">
          <a
            href={REPOSITORY_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 min-w-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 font-bold text-gray-200 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
            aria-label="View FlickMuse source code on GitHub"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
            View source on GitHub
          </a>
          <p className="mt-4">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
          <p className="mt-1">
            Movie information and images are provided by{" "}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-gray-200 underline-offset-4 hover:text-white hover:underline"
            >
              The Movie Database
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
