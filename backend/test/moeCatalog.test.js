const test = require("node:test");
const assert = require("node:assert/strict");
const {
  assertMoeUrl,
  decodeHtml,
  languageFromFilename,
  mapCircular,
} = require("../src/services/moeCatalog");

test("decodeHtml unescapes official WordPress titles", () => {
  assert.equal(
    decodeHtml("&#8220;Clean Sri Lanka&#8221; &amp; schools"),
    "“Clean Sri Lanka” & schools",
  );
});

test("assertMoeUrl allows only moe.gov.lk", () => {
  assert.equal(assertMoeUrl("https://moe.gov.lk/wp-content/uploads/2026/07/32-2025i-En.pdf").hostname, "moe.gov.lk");
  assert.throws(() => assertMoeUrl("https://evil.example/file.pdf"), /moe.gov.lk/);
  assert.throws(() => assertMoeUrl("javascript:alert(1)"), /Invalid|moe.gov.lk/);
});

test("languageFromFilename reads En/Si/Ta suffixes", () => {
  assert.equal(languageFromFilename("32-2025i-En.pdf"), "en");
  assert.equal(languageFromFilename("32-2025i-Si.pdf"), "si");
  assert.equal(languageFromFilename("32-2025i-Ta.pdf"), "ta");
});

test("mapCircular uses rendered title and official link", () => {
  const mapped = mapCircular({
    id: 26270,
    date: "2026-07-20T14:24:31",
    link: "https://moe.gov.lk/en/circulars/example/",
    slug: "example",
    title: { rendered: "Regarding the First Efficiency Bar" },
  });
  assert.equal(mapped.id, 26270);
  assert.equal(mapped.title, "Regarding the First Efficiency Bar");
  assert.match(mapped.link, /moe.gov.lk/);
});
