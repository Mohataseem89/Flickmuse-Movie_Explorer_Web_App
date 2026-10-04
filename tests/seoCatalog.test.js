import test from "node:test";
import assert from "node:assert/strict";
import { MOVIE_GENRES, getGenreBySlug, genrePathFromId } from "../src/seo/catalog.js";
test("genre SEO slugs are unique and human readable",()=>{assert.equal(new Set(MOVIE_GENRES.map(g=>g.slug)).size,MOVIE_GENRES.length);assert.equal(getGenreBySlug("science-fiction")?.id,878);assert.equal(genrePathFromId(27),"/genre/horror")});
test("unknown genre slugs and ids fail safely",()=>{assert.equal(getGenreBySlug("not-a-genre"),null);assert.equal(genrePathFromId(999999),"/discover")});
