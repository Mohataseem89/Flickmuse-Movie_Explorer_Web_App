export const fightClub = { id: 550, title: "Fight Club", overview: "An insomniac office worker crosses paths with a soap maker.", release_date: "1999-10-15", poster_path: "/fight.jpg", backdrop_path: "/fight-bg.jpg", vote_average: 8.4, vote_count: 29000, runtime: 139, genres: [{ id: 18, name: "Drama" }], media_type: "movie" };
export const matrix = { id: 603, title: "The Matrix", overview: "A hacker discovers the truth about his reality.", release_date: "1999-03-30", poster_path: "/matrix.jpg", backdrop_path: "/matrix-bg.jpg", vote_average: 8.2, vote_count: 26000, runtime: 136, genres: [{ id: 878, name: "Science Fiction" }], media_type: "movie" };

export async function mockTmdb(page) {
  await page.route("**/api/tmdb?**", async (route) => {
    const url = new URL(route.request().url()); const path = url.searchParams.get("path") || ""; const query = (url.searchParams.get("query") || "").toLowerCase();
    let body = { page: 1, results: [fightClub, matrix], total_pages: 1, total_results: 2 };
    if (path === "/search/multi" || path === "/search/movie") body = { ...body, results: query.includes("matrix") ? [matrix] : [fightClub] };
    else if (path === "/movie/550") body = { ...fightClub, credits: { cast: [], crew: [] }, videos: { results: [] }, recommendations: { results: [] }, similar: { results: [] }, "watch/providers": { results: {} }, release_dates: { results: [] } };
    else if (path === "/movie/603") body = { ...matrix, credits: { cast: [], crew: [] }, videos: { results: [] }, recommendations: { results: [] }, similar: { results: [] }, "watch/providers": { results: {} }, release_dates: { results: [] } };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.route("https://image.tmdb.org/**", route => route.fulfill({ status: 204, body: "" }));
}
