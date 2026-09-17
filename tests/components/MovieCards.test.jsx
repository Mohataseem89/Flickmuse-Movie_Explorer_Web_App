import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import MovieCards from "../../src/components/MovieCards";

const tvShow = {
  id: 123,
  media_type: "tv",
  name: "The Example Show",
  first_air_date: "2026-01-01",
  vote_average: 8.2,
  poster_path: "/poster.jpg",
};

describe("MovieCards", () => {
  it("links TV shows to their TV route and adds the selected title to the watchlist", () => {
    const handleAddToWatchlist = vi.fn();

    render(
      <MemoryRouter>
        <MovieCards
          movie={tvShow}
          watchlist={[]}
          handleAddToWatchlist={handleAddToWatchlist}
          handleRemoveFromWatchlist={vi.fn()}
        />
      </MemoryRouter>
    );
    expect(
      screen.getByRole("link", {
        name: /view details for the example show/i,
      })
    ).toHaveAttribute("href", "/tv/the-example-show/123");
    expect(screen.getByAltText("The Example Show poster")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /add the example show to watchlist/i }));
    expect(handleAddToWatchlist).toHaveBeenCalledWith(tvShow);
  });
});
