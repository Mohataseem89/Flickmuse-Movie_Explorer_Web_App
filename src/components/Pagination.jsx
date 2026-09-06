import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({
  currentPage,
  loading,
  handlePreviousPage,
  handleNextPage,
  pageNo,
  hasNextPage = true,
}) => {
  return (
    <nav
      className="mt-14 flex items-center justify-center gap-3 sm:mt-16"
      aria-label="Movie results pagination"
    >
      <button
        type="button"
        onClick={handlePreviousPage}
        disabled={currentPage === 1 || loading}
        className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm font-bold text-gray-200 transition-colors hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35 sm:gap-2 sm:px-5"
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <span
        className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-red-600 px-3 text-sm font-black text-white shadow-lg shadow-red-950/25"
        aria-current="page"
        aria-label={"Current page " + pageNo}
      >
        {pageNo}
      </span>

      <button
        type="button"
        onClick={handleNextPage}
        disabled={loading || !hasNextPage}
        className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm font-bold text-gray-200 transition-colors hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35 sm:gap-2 sm:px-5"
        aria-label="Go to next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
};

export default Pagination;
