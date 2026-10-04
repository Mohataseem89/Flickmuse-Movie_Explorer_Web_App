export const MOVIE_GENRES = [
  [28,"Action","action"],[12,"Adventure","adventure"],[16,"Animation","animation"],[35,"Comedy","comedy"],[80,"Crime","crime"],[99,"Documentary","documentary"],[18,"Drama","drama"],[10751,"Family","family"],[14,"Fantasy","fantasy"],[36,"History","history"],[27,"Horror","horror"],[10402,"Music","music"],[9648,"Mystery","mystery"],[10749,"Romance","romance"],[878,"Science Fiction","science-fiction"],[10770,"TV Movie","tv-movie"],[53,"Thriller","thriller"],[10752,"War","war"],[37,"Western","western"],
].map(([id,name,slug])=>({id,name,slug, path:`/genre/${slug}`, description:`Explore popular ${name.toLowerCase()} movies on FlickMuse, with ratings, release years, and direct links to full movie details.`}));

export const CATEGORY_PAGES = {
  "top-rated": { slug:"top-rated", path:"/top-rated", title:"Top-Rated Movies", eyebrow:"Critically loved", description:"Explore highly rated movies on FlickMuse, ranked using TMDB audience ratings and vote activity." },
};

export function getGenreBySlug(slug) { return MOVIE_GENRES.find((genre)=>genre.slug===slug) || null; }
export function genrePathFromId(id) { return MOVIE_GENRES.find((genre)=>genre.id===Number(id))?.path || "/discover"; }
