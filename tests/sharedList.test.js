import assert from "node:assert/strict";
import test from "node:test";
import { encodeSharedList, MAX_SHARED_ITEMS, parseSharedList } from "../src/utils/sharedList.js";

test("shared lists preserve media type and reject malformed entries", () => {
  assert.deepEqual(parseSharedList("movie:603,tv:1396,nope:1,movie:x,movie:603"), [
    { mediaType: "movie", id: 603 }, { mediaType: "tv", id: 1396 },
  ]);
});

test("shared lists have a bounded URL payload", () => {
  const items = Array.from({ length: MAX_SHARED_ITEMS + 5 }, (_, index) => ({ id: index + 1, media_type: index % 2 ? "tv" : "movie" }));
  assert.equal(encodeSharedList(items).split(",").length, MAX_SHARED_ITEMS);
});
