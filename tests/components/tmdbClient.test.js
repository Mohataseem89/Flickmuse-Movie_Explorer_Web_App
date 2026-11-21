import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The client keeps module-level state (cache, queue, cooldown), so each test
// gets a fresh copy of the module.
async function freshClient() {
  vi.resetModules();
  return import("../../src/api/tmdb.js");
}

const ok = (body) => new Response(JSON.stringify(body), { status: 200 });

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("TMDb client request management", () => {
  it("shares one network request between identical simultaneous callers", async () => {
    const client = await freshClient();
    const fetchMock = vi.fn(async () => ok({ results: [{ id: 1 }] }));
    vi.stubGlobal("fetch", fetchMock);

    const results = await Promise.all(Array.from({ length: 6 }, () => client.getTrendingMovies()));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results.every((data) => data.results[0].id === 1)).toBe(true);
    await client.getTrendingMovies(); // served from memory afterwards
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("never runs more than 3 requests at once and runs interactive requests first", async () => {
    const client = await freshClient();
    let active = 0;
    let peak = 0;
    const order = [];
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      active++; peak = Math.max(peak, active);
      order.push(new URL(url).searchParams.get("path"));
      await new Promise((resolve) => setTimeout(resolve, 15));
      active--;
      return ok({ results: [] });
    }));

    const pending = [
      client.getPopularMovies(1), client.getPopularMovies(2), client.getPopularMovies(3),
      client.getPopularMovies(4), client.getPopularMovies(5),
      client.searchMovies("heat"), // interactive: should jump the queue
    ];
    await Promise.all(pending);

    expect(peak).toBeLessThanOrEqual(3);
    expect(order.indexOf("/search/movie")).toBeLessThan(order.length - 1);
  });

  it("surfaces a long Retry-After as a rate-limit error without retrying", async () => {
    const client = await freshClient();
    const fetchMock = vi.fn(async () => new Response("{}", { status: 429, headers: { "Retry-After": "30" } }));
    vi.stubGlobal("fetch", fetchMock);

    const error = await client.getPopularMovies(1).catch((e) => e);

    expect(error).toBeInstanceOf(client.TmdbError);
    expect(error.kind).toBe("rate_limit");
    expect(error.retryAfter).toBe(30);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(client.getTmdbCooldownSeconds()).toBeGreaterThan(0);
  });

  it("retries once after a short Retry-After and then succeeds", async () => {
    const client = await freshClient();
    let calls = 0;
    vi.stubGlobal("fetch", vi.fn(async () => {
      calls++;
      return calls === 1 ? new Response("{}", { status: 429, headers: { "Retry-After": "1" } }) : ok({ results: ["fine"] });
    }));

    const data = await client.getNowPlayingMovies();

    expect(data.results).toEqual(["fine"]);
    expect(calls).toBe(2);
  });

  it("stops after a bounded number of attempts on server errors", async () => {
    const client = await freshClient();
    const fetchMock = vi.fn(async () => new Response("{}", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    const error = await client.getTopRatedMovies(1).catch((e) => e);

    expect(error.kind).toBe("api");
    expect(error.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  }, 15000);

  it("does not retry client errors such as 404", async () => {
    const client = await freshClient();
    const fetchMock = vi.fn(async () => new Response("{}", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(client.getMovieDetails(1)).rejects.toMatchObject({ kind: "api", status: 404 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("classifies network failures separately from API and rate-limit errors", async () => {
    const client = await freshClient();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));

    const error = await client.getPopularTV(1).catch((e) => e);

    expect(error.kind).toBe("network");
  }, 15000);

  it("shows older real data instead of an error when TMDb is unavailable", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const client = await freshClient();
    vi.stubGlobal("fetch", vi.fn(async () => ok({ results: [{ id: 7 }] })));
    await client.getTrendingMovies();

    vi.setSystemTime(Date.now() + 30 * 60 * 1000); // past the 10 minute fresh window
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 429, headers: { "Retry-After": "30" } })));

    const data = await client.getTrendingMovies();

    expect(data.results[0].id).toBe(7);
  });

  it("restores stale list data from a previous visit when the network fails", async () => {
    const first = await freshClient();
    vi.stubGlobal("fetch", vi.fn(async () => ok({ results: [{ id: 9 }] })));
    await first.getTopRatedMovies(1);

    const second = await freshClient(); // simulates a new page load
    const fetchMock = vi.fn(async () => new Response("{}", { status: 429, headers: { "Retry-After": "30" } }));
    vi.stubGlobal("fetch", fetchMock);

    const data = await second.getTopRatedMovies(1);

    expect(data.results[0].id).toBe(9);
  });

  it("does not leak the API key and only calls the same-origin proxy", async () => {
    const client = await freshClient();
    const fetchMock = vi.fn(async () => ok({}));
    vi.stubGlobal("fetch", fetchMock);
    await client.getPopularMovies(1);
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("/api/tmdb?");
    expect(url).not.toMatch(/api_key/i);
  });
});
