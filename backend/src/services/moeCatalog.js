const axios = require("axios");

const DEFAULT_WP_BASE = "https://moe.gov.lk/en/wp-json/wp/v2";
const USER_AGENT = "EasyCircular/0.2 (educational workspace; +https://moe.gov.lk/en/circulars/)";
const ALLOWED_HOSTS = new Set(["moe.gov.lk", "www.moe.gov.lk"]);

function wpBase() {
  return (process.env.MOE_WP_BASE || DEFAULT_WP_BASE).replace(/\/$/, "");
}

function officialListingUrl() {
  return process.env.MOE_CIRCULARS_URL || "https://moe.gov.lk/en/circulars/";
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&quot;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&apos;|&lsquo;|&rsquo;/gi, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function assertMoeUrl(raw) {
  let parsed;
  try {
    parsed = new URL(String(raw || ""));
  } catch {
    const error = new Error("Invalid official circular URL");
    error.status = 400;
    error.expose = true;
    throw error;
  }

  const host = parsed.hostname.toLowerCase();
  if (!["http:", "https:"].includes(parsed.protocol) || !ALLOWED_HOSTS.has(host)) {
    const error = new Error("Only official moe.gov.lk circulars can be imported");
    error.status = 400;
    error.expose = true;
    throw error;
  }

  return parsed;
}

function languageFromFilename(filename) {
  const name = String(filename || "");
  if (/\b(si|sin|sinhala)\b/i.test(name) || /[\u0D80-\u0DFF]/.test(name)) return "si";
  if (/\b(ta|tam|tamil)\b/i.test(name) || /[\u0B80-\u0BFF]/.test(name)) return "ta";
  if (/\b(en|eng|english)\b/i.test(name)) return "en";
  return "unknown";
}

function mapCircular(item) {
  return {
    id: Number(item.id),
    title: decodeHtml((item.title && item.title.rendered) || item.slug || `Circular ${item.id}`),
    date: item.date || null,
    link: item.link || null,
    slug: item.slug || null,
  };
}

function mapPdf(media) {
  const filename = media.filename || decodeHtml((media.title && media.title.rendered) || "") || `circular-${media.id}.pdf`;
  return {
    id: Number(media.id),
    filename,
    title: decodeHtml((media.title && media.title.rendered) || filename),
    sourceUrl: media.source_url,
    filesize: media.filesize || media.media_details?.filesize || null,
    language: languageFromFilename(filename),
  };
}

function moeClient() {
  return axios.create({
    timeout: 20_000,
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    maxRedirects: 3,
    beforeRedirect: (options) => {
      const host = String(options?.hostname || "").toLowerCase();
      if (host && !ALLOWED_HOSTS.has(host)) {
        throw new Error("Redirect left moe.gov.lk");
      }
    },
  });
}

async function listOfficialCirculars({ page = 1, perPage = 10, search = "" } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safePerPage = Math.min(20, Math.max(1, Number(perPage) || 10));
  const params = {
    page: safePage,
    per_page: safePerPage,
    _fields: "id,date,link,slug,title",
    orderby: "date",
    order: "desc",
  };
  if (search && String(search).trim()) {
    params.search = String(search).trim();
  }

  try {
    const response = await moeClient().get(`${wpBase()}/circulars`, { params });
    const items = Array.isArray(response.data) ? response.data.map(mapCircular) : [];
    return {
      items,
      page: safePage,
      perPage: safePerPage,
      total: Number(response.headers["x-wp-total"] || items.length),
      totalPages: Number(response.headers["x-wp-totalpages"] || 1),
      officialUrl: officialListingUrl(),
    };
  } catch (error) {
    const wrapped = new Error(
      error.response?.status
        ? `Official MOE catalog returned HTTP ${error.response.status}`
        : "Could not reach the official MOE circulars catalog",
    );
    wrapped.status = 502;
    wrapped.expose = true;
    throw wrapped;
  }
}

async function getOfficialCircular(moeId) {
  const id = Number(moeId);
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error("Invalid official circular id");
    error.status = 400;
    error.expose = true;
    throw error;
  }

  try {
    const [post, media] = await Promise.all([
      moeClient().get(`${wpBase()}/circulars/${id}`, {
        params: { _fields: "id,date,link,slug,title" },
      }),
      moeClient().get(`${wpBase()}/media`, {
        params: { parent: id, per_page: 20 },
      }),
    ]);

    const pdfs = (Array.isArray(media.data) ? media.data : [])
      .filter((item) => item.mime_type === "application/pdf" && item.source_url)
      .map(mapPdf)
      .filter((item) => {
        try {
          assertMoeUrl(item.sourceUrl);
          return true;
        } catch {
          return false;
        }
      });

    return {
      circular: mapCircular(post.data),
      pdfs,
      officialUrl: officialListingUrl(),
    };
  } catch (error) {
    if (error.response?.status === 404) {
      const missing = new Error("Official circular not found");
      missing.status = 404;
      missing.expose = true;
      throw missing;
    }
    if (error.status) throw error;
    const wrapped = new Error("Could not load official circular PDFs");
    wrapped.status = 502;
    wrapped.expose = true;
    throw wrapped;
  }
}

async function downloadOfficialPdf(sourceUrl, { maxBytes } = {}) {
  const parsed = assertMoeUrl(sourceUrl);
  const limit = maxBytes || 50 * 1024 * 1024;

  const response = await axios.get(parsed.toString(), {
    responseType: "arraybuffer",
    timeout: 60_000,
    maxContentLength: limit,
    maxBodyLength: limit,
    maxRedirects: 3,
    headers: { "User-Agent": USER_AGENT, Accept: "application/pdf" },
    beforeRedirect: (options) => {
      const host = String(options?.hostname || "").toLowerCase();
      if (host && !ALLOWED_HOSTS.has(host)) {
        throw new Error("Redirect left moe.gov.lk");
      }
    },
  });

  const buffer = Buffer.from(response.data);
  if (!buffer.length) {
    const error = new Error("Official PDF is empty");
    error.status = 422;
    error.expose = true;
    throw error;
  }

  return { buffer, finalUrl: parsed.toString() };
}

module.exports = {
  ALLOWED_HOSTS,
  USER_AGENT,
  assertMoeUrl,
  decodeHtml,
  downloadOfficialPdf,
  getOfficialCircular,
  languageFromFilename,
  listOfficialCirculars,
  mapCircular,
  mapPdf,
  officialListingUrl,
};
