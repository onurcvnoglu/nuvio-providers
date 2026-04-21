var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var TMDB_API_KEY = "4ef0d7355d9ffb5151e987764708ce96";
var BASE_URL = "https://dizilla.to";
var PROVIDER_ID = "dizilla";
var PROVIDER_NAME = "Dizilla";
var AES_KEY = "9bYMCNQiWsXIYFWYAu7EkdsSbmGBTyUI";
var cryptoJsCache = null;
var HEADERS = {
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json,text/plain,*/*;q=0.8",
  "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
};
function fetchText(url, options) {
  return __async(this, null, function* () {
    var response = yield fetch(url, withHeaders(options));
    return yield response.text();
  });
}
function fetchJson(url, options) {
  return __async(this, null, function* () {
    var text = yield fetchText(url, options);
    return JSON.parse(text);
  });
}
function withHeaders(options) {
  var merged = {};
  var key;
  options = options || {};
  for (key in HEADERS)
    merged[key] = HEADERS[key];
  for (key in options.headers || {})
    merged[key] = options.headers[key];
  options.headers = merged;
  return options;
}
function getCryptoJS() {
  if (cryptoJsCache !== null)
    return cryptoJsCache;
  try {
    cryptoJsCache = require("crypto-js");
  } catch (_error) {
    cryptoJsCache = typeof CryptoJS !== "undefined" ? CryptoJS : false;
  }
  return cryptoJsCache;
}
function decryptAesBase64(payload) {
  var CryptoJS2 = getCryptoJS();
  var encrypted;
  var decrypted;
  if (!CryptoJS2)
    throw new Error("crypto-js unavailable");
  encrypted = CryptoJS2.enc.Base64.parse(String(payload || "").replace(/\s+/g, ""));
  decrypted = CryptoJS2.AES.decrypt(
    { ciphertext: encrypted },
    CryptoJS2.enc.Utf8.parse(AES_KEY),
    { iv: CryptoJS2.lib.WordArray.create([0, 0, 0, 0], 16), mode: CryptoJS2.mode.CBC, padding: CryptoJS2.pad.Pkcs7 }
  );
  return decrypted.toString(CryptoJS2.enc.Utf8);
}
function absoluteUrl(value, baseUrl) {
  var input = String(value || "").trim();
  var origin = originOf(baseUrl);
  var cleanBase;
  if (!input)
    return "";
  if (/^https?:\/\//i.test(input))
    return input;
  if (input.indexOf("//") === 0)
    return "https:" + input;
  if (input.charAt(0) === "/")
    return origin + input;
  cleanBase = String(baseUrl || "").split("#")[0].split("?")[0];
  cleanBase = cleanBase.charAt(cleanBase.length - 1) === "/" ? cleanBase : cleanBase.slice(0, cleanBase.lastIndexOf("/") + 1);
  return cleanBase + input;
}
function originOf(url) {
  var match = String(url || "").match(/^(https?:\/\/[^/]+)/i);
  return match ? match[1] : "";
}
function hostOf(url) {
  var match = String(url || "").match(/^https?:\/\/([^/:?#]+)/i);
  return match ? match[1].replace(/^www\./, "") : "External";
}
function extractFirst(text, regex, groupIndex) {
  var match = regex.exec(String(text || ""));
  return match ? match[groupIndex || 1] : "";
}
function extractAll(text, regex, mapper) {
  var input = String(text || "");
  var result = [];
  var match;
  regex.lastIndex = 0;
  while (match = regex.exec(input))
    result.push(mapper ? mapper(match) : match[1]);
  return result;
}
function stripTags(value) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
}
function normalize(value) {
  return String(value || "").replace(/İ/g, "I").replace(/ı/g, "i").replace(/Ş/g, "S").replace(/ş/g, "s").replace(/Ğ/g, "G").replace(/ğ/g, "g").replace(/Ü/g, "U").replace(/ü/g, "u").replace(/Ö/g, "O").replace(/ö/g, "o").replace(/Ç/g, "C").replace(/ç/g, "c").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
function unique(values) {
  var seen = {};
  var result = [];
  var index;
  var value;
  for (index = 0; index < (values || []).length; index += 1) {
    value = String(values[index] || "").trim();
    if (value && !seen[value]) {
      seen[value] = true;
      result.push(value);
    }
  }
  return result;
}
function buildQueries(metadata) {
  var output = [];
  (metadata.titles || []).forEach(function(title) {
    var clean = String(title || "").replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
    output.push(clean);
    clean.split(/\s+-\s+|\s*:\s*/g).forEach(function(part) {
      output.push(part);
    });
  });
  return unique(output).filter(function(value) {
    return value.length > 1;
  }).slice(0, 6);
}
function getMetadata(tmdbId, mediaType) {
  return __async(this, null, function* () {
    var type = mediaType === "movie" ? "movie" : "tv";
    var languages = ["tr-TR", "en-US"];
    var titles = [];
    var year = null;
    var index;
    var url;
    var data;
    for (index = 0; index < languages.length; index += 1) {
      try {
        url = "https://api.themoviedb.org/3/" + type + "/" + encodeURIComponent(String(tmdbId)) + "?language=" + languages[index] + "&api_key=" + TMDB_API_KEY;
        data = yield fetchJson(url);
        if (data.title || data.name)
          titles.push(data.title || data.name);
        if (data.original_title || data.original_name)
          titles.push(data.original_title || data.original_name);
        if (!year)
          year = Number(String(data.release_date || data.first_air_date || "").slice(0, 4)) || null;
      } catch (_error) {
      }
    }
    titles = unique(titles);
    if (!titles.length)
      throw new Error("TMDB metadata not found");
    return { titles, displayTitle: titles[0], year, mediaType };
  });
}
function searchSite(query) {
  return __async(this, null, function* () {
    var payload = yield fetchJson(BASE_URL + "/api/bg/searchcontent?searchterm=" + encodeURIComponent(query), {
      method: "POST",
      headers: {
        Referer: BASE_URL + "/",
        Accept: "application/json,text/plain,*/*"
      }
    });
    var data = JSON.parse(decryptAesBase64(payload.response || ""));
    return (data.result || []).map(function(entry) {
      return {
        title: entry.object_name || "",
        url: absoluteUrl(entry.used_slug || "", BASE_URL + "/"),
        type: "tv",
        year: entry.object_release_year || null
      };
    }).filter(function(entry) {
      return entry.title && entry.url && entry.url.indexOf("/dizi/") >= 0;
    });
  });
}
function parseSeriesUrl(html, pageUrl) {
  var direct = extractFirst(html, /href="([^"]*\/dizi\/[^"]+)"/i);
  var canonical = extractFirst(html, /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i);
  return absoluteUrl(direct || canonical || pageUrl, BASE_URL + "/");
}
function parseSeasonUrls(html) {
  return unique(extractAll(html, /href="([^"]*?-sezon[^"]*)"/gi, function(match) {
    return absoluteUrl(match[1], BASE_URL + "/");
  })).filter(function(url) {
    return url.indexOf("-bolum") < 0;
  });
}
function parseEpisodes(html) {
  return unique(extractAll(html, /href="([^"]*?-bolum[^"]*)"/gi, function(match) {
    return absoluteUrl(match[1], BASE_URL + "/");
  })).map(function(url) {
    var seasonMatch = url.match(/-(\d+)-sezon/i);
    var episodeMatch = url.match(/-(\d+)-bolum/i);
    return {
      season: seasonMatch ? Number(seasonMatch[1]) : null,
      episode: episodeMatch ? Number(episodeMatch[1]) : null,
      url
    };
  }).filter(function(entry) {
    return entry.season != null && entry.episode != null;
  });
}
function loadItem(url) {
  return __async(this, null, function* () {
    var initialHtml = yield fetchText(url, { headers: { Referer: BASE_URL + "/" } });
    var seriesUrl = parseSeriesUrl(initialHtml, url);
    var seriesHtml = seriesUrl !== url ? yield fetchText(seriesUrl, { headers: { Referer: url } }) : initialHtml;
    var title = stripTags(extractFirst(seriesHtml, /<h2[^>]*>([\s\S]*?)<\/h2>/i));
    var seasonUrls = parseSeasonUrls(seriesHtml);
    var episodes = [];
    var index;
    for (index = 0; index < seasonUrls.length; index += 1) {
      try {
        episodes = episodes.concat(parseEpisodes(yield fetchText(seasonUrls[index], { headers: { Referer: seriesUrl } })));
      } catch (_error) {
      }
    }
    return { title, url: seriesUrl, episodes };
  });
}
function parseNextSecureData(html) {
  var script = extractFirst(html, /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  var nextData = script ? JSON.parse(script) : null;
  var secureData = nextData && nextData.props && nextData.props.pageProps ? nextData.props.pageProps.secureData : "";
  return secureData ? JSON.parse(decryptAesBase64(secureData)) : null;
}
function extractLinks(targetUrl, metadata, season, episode) {
  return __async(this, null, function* () {
    var html = yield fetchText(targetUrl, { headers: { Referer: BASE_URL + "/" } });
    var details = parseNextSecureData(html);
    var sources = details && details.RelatedResults && details.RelatedResults.getEpisodeSources ? details.RelatedResults.getEpisodeSources.result || [] : [];
    var streams = [];
    sources.forEach(function(source) {
      var iframeUrl = extractFirst(source.source_content || "", /src="([^"]+)"/i);
      if (!iframeUrl)
        return;
      if (iframeUrl.indexOf("sn.dplayer74.site") >= 0)
        iframeUrl = iframeUrl.replace("sn.dplayer74.site", "sn.hotlinger.com");
      iframeUrl = absoluteUrl(iframeUrl, BASE_URL + "/");
      streams.push({
        name: PROVIDER_NAME + " - " + hostOf(iframeUrl),
        title: metadata.displayTitle + " - S" + String(season).padStart(2, "0") + "E" + String(episode).padStart(2, "0") + " - " + (source.quality_name || "Auto"),
        url: iframeUrl,
        quality: source.quality_name || "Auto",
        headers: { Referer: BASE_URL + "/" },
        provider: PROVIDER_ID
      });
    });
    return streams;
  });
}
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      var metadata;
      var queries;
      var candidates = [];
      var queryIndex;
      var results;
      var candidateIndex;
      var item;
      var ep;
      var links;
      if (mediaType !== "tv")
        return [];
      metadata = yield getMetadata(tmdbId, mediaType);
      queries = buildQueries(metadata);
      for (queryIndex = 0; queryIndex < queries.length && candidates.length < 12; queryIndex += 1) {
        try {
          results = yield searchSite(queries[queryIndex]);
          candidates = candidates.concat(results);
        } catch (_error) {
        }
      }
      candidates = unique(candidates.map(function(item2) {
        return item2.url;
      })).map(function(url) {
        return candidates.filter(function(candidate) {
          return candidate.url === url;
        })[0];
      });
      for (candidateIndex = 0; candidateIndex < candidates.length && candidateIndex < 6; candidateIndex += 1) {
        item = yield loadItem(candidates[candidateIndex].url);
        ep = item.episodes.filter(function(entry) {
          return Number(entry.season) === Number(season) && Number(entry.episode) === Number(episode);
        })[0];
        if (!ep)
          continue;
        links = yield extractLinks(ep.url, metadata, season, episode);
        if (links.length)
          return links;
      }
      return [];
    } catch (error) {
      console.error("[" + PROVIDER_NAME + "] " + error.message);
      return [];
    }
  });
}
if (typeof globalThis !== "undefined")
  globalThis.getStreams = getStreams;
else if (typeof global !== "undefined")
  global.getStreams = getStreams;
if (typeof module !== "undefined")
  module.exports = { getStreams };
