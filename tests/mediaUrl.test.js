import test from "node:test";
import assert from "node:assert/strict";
import {
  getMediaPath,
  getMediaPathFromParts,
  slugifyTitle,
} from "../src/utils/mediaUrl.js";

test("slugifyTitle creates clean URL-safe slugs", () => {
  assert.equal(slugifyTitle("The Odyssey"), "the-odyssey");
  assert.equal(slugifyTitle("Spider-Man: No Way Home"), "spider-man-no-way-home");
  assert.equal(slugifyTitle("Ocean's Eleven"), "oceans-eleven");
  assert.equal(slugifyTitle("Amélie"), "amelie");
  assert.equal(slugifyTitle("Dungeons & Dragons: Honor Among Thieves"), "dungeons-and-dragons-honor-among-thieves");
});

test("movie and TV paths keep the numeric TMDb id as the unique key", () => {
  assert.equal(
    getMediaPath({ id: 1368337, title: "The Odyssey", media_type: "movie" }),
    "/movie/the-odyssey/1368337"
  );
  assert.equal(
    getMediaPath({ id: 66732, name: "Stranger Things", media_type: "tv" }),
    "/tv/stranger-things/66732"
  );
});

test("duplicate titles cannot conflict because ids remain part of the route", () => {
  const first = getMediaPathFromParts("movie", "The Thing", 1091);
  const second = getMediaPathFromParts("movie", "The Thing", 60935);
  assert.notEqual(first, second);
  assert.equal(first, "/movie/the-thing/1091");
  assert.equal(second, "/movie/the-thing/60935");
});
