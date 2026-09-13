import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const luminance = (hex) => {
  const channels = hex.match(/[a-f\d]{2}/gi).map((channel) => Number.parseInt(channel, 16) / 255);
  const linear = channels.map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};

const contrastRatio = (foreground, background) => {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
};

const sourceFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : [join(directory, entry.name)]))).flat();
};

test("gray-400 passes WCAG AA against FlickMuse's darkest background", () => {
  assert.ok(contrastRatio("#9ca3af", "#080a0f") >= 4.5);
});

test("rendered source no longer uses low-contrast gray-500 text", async () => {
  const files = (await sourceFiles(join(process.cwd(), "src"))).filter((file) => /\.(js|jsx)$/.test(file));
  const contents = await Promise.all(files.map((file) => readFile(file, "utf8")));
  assert.equal(contents.some((content) => content.includes("text-gray-500")), false);
});
