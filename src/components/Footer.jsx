import { Film, Github } from "lucide-react";

const REPOSITORY_URL = "https://github.com/Mohataseem89/FilmWick-Movie_Explorer_Web_App";

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

        <div className="max-w-xl leading-6 lg:text-right">
          <a
            href={REPOSITORY_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 font-bold text-gray-200 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
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
