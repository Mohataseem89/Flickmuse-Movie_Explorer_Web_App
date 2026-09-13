import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import DiscoverPage from "../../src/pages/DiscoverPage";
import { discoverTitles } from "../../src/api/tmdb";

vi.mock("../../src/api/tmdb", () => ({
  discoverTitles: vi.fn().mockResolvedValue({ results: [], total_results: 0, total_pages: 1 }),
}));

vi.mock("../../src/hooks/useGenres", () => ({
  useGenres: () => ({ genres: [] }),
}));

vi.mock("../../src/hooks/usePageMetadata", () => ({
  usePageMetadata: () => {},
}));

const CurrentLocation = () => <output>{useLocation().search}</output>;

describe("DiscoverPage", () => {
  it("switches to TV discovery and preserves the selection in the URL", async () => {
    render(
      <MemoryRouter initialEntries={["/discover"]}>
        <Routes>
          <Route path="/discover" element={<><DiscoverPage watchlist={[]} handleAddToWatchlist={vi.fn()} handleRemoveFromWatchlist={vi.fn()} /><CurrentLocation /></>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(discoverTitles).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "TV shows" }));

    await waitFor(() => expect(discoverTitles).toHaveBeenLastCalledWith(expect.objectContaining({ mediaType: "tv" }), expect.any(AbortSignal)));
    expect(screen.getByText("?type=tv")).toBeInTheDocument();
  });
});
