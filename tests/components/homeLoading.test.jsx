import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/api/tmdb", () => {
  class TmdbError extends Error {
    constructor(message, { kind = "api", status = 0, retryAfter = null } = {}) {
      super(message);
      this.kind = kind; this.status = status; this.retryAfter = retryAfter;
    }
  }
  return {
    TmdbError,
    getTmdbCooldownSeconds: () => 0,
    getImageUrl: () => null,
    getNowPlayingMovies: vi.fn(),
    getUpcomingMovies: vi.fn(),
    getTopRatedMovies: vi.fn(),
    getPopularMovies: vi.fn(),
  };
});

import * as api from "../../src/api/tmdb";
import DiscoveryRows from "../../src/components/DiscoveryRows";
import Movies from "../../src/components/Movies";

const movie = (id, title) => ({ id, title, poster_path: null, vote_average: 7, release_date: "2025-01-01", genre_ids: [] });
const props = { watchlist: [], handleAddToWatchlist: vi.fn(), handleRemoveFromWatchlist: vi.fn() };
const rateLimit = () => new api.TmdbError("TMDb is receiving too many requests right now.", { kind: "rate_limit", status: 429, retryAfter: 5 });

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("homepage loading resilience", () => {
  it("one rate-limited collection does not blank the other collections", async () => {
    api.getNowPlayingMovies.mockResolvedValue({ results: [movie(1, "Now Playing Hit")] });
    api.getUpcomingMovies.mockRejectedValue(rateLimit());
    api.getTopRatedMovies.mockResolvedValue({ results: [movie(3, "Top Rated Gem")] });

    render(<MemoryRouter><DiscoveryRows {...props} /></MemoryRouter>);

    expect(await screen.findByText("Now Playing Hit")).toBeTruthy();
    expect(await screen.findByText("Top Rated Gem")).toBeTruthy();
    expect(await screen.findByText("Coming soon could not be loaded")).toBeTruthy();
  });

  it("'Try again' is locked during the cooldown so clicking cannot create a request storm", async () => {
    api.getPopularMovies.mockRejectedValue(rateLimit());

    render(<MemoryRouter><Movies {...props} /></MemoryRouter>);

    const button = await screen.findByRole("button", { name: /Try again in \d+s/ });
    expect(button.disabled).toBe(true);
    const callsBefore = api.getPopularMovies.mock.calls.length;

    for (let i = 0; i < 10; i++) fireEvent.click(button);

    expect(api.getPopularMovies.mock.calls.length).toBe(callsBefore);
  });

  it("'Try again' re-enables after the cooldown and then makes exactly one new request", async () => {
    api.getPopularMovies
      .mockRejectedValueOnce(rateLimit())
      .mockResolvedValue({ results: [movie(9, "Recovered Movie")] });
    render(<MemoryRouter><Movies {...props} /></MemoryRouter>);
    await screen.findByRole("button", { name: /Try again in/ });

    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
    await act(async () => { vi.advanceTimersByTime(6000); });

    const button = await screen.findByRole("button", { name: "Try again" });
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => expect(screen.getByText("Recovered Movie")).toBeTruthy());
    expect(api.getPopularMovies).toHaveBeenCalledTimes(2);
  });

  it("shows the meaningful error message, not a fake movie list", async () => {
    api.getPopularMovies.mockRejectedValue(rateLimit());
    render(<MemoryRouter><Movies {...props} /></MemoryRouter>);
    expect(await screen.findByText(/too many requests/i)).toBeTruthy();
    expect(screen.queryByText("Recovered Movie")).toBeNull();
  });
});
