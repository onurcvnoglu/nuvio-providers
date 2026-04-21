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
var BASE_URL = "https://selcukflix.net";
var PROVIDER_ID = "selcukflix";
var PROVIDER_NAME = "SelcukFlix";
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
function base64Decode(value) {
  var input = String(value || "").replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/g, "");
  var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var output = "";
  var buffer = 0;
  var bits = 0;
  var index;
  var current;
  if (typeof atob === "function")
    return atob(input);
  for (index = 0; index < input.length; index += 1) {
    current = alphabet.indexOf(input.charAt(index));
    if (current < 0)
      continue;
    buffer = buffer << 6 | current;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode(buffer >> bits & 255);
    }
  }
  return output;
}
function utf8Decode(binary) {
  var bytes = [];
  var index;
  for (index = 0; index < binary.length; index += 1)
    bytes.push(binary.charCodeAt(index));
  return utf8BytesToString(bytes);
}
function utf8BytesToString(bytes) {
  var output = "";
  var index = 0;
  var b1;
  var b2;
  var b3;
  var b4;
  var code;
  while (index < bytes.length) {
    b1 = bytes[index++];
    if (b1 < 128)
      output += String.fromCharCode(b1);
    else if (b1 < 224) {
      b2 = bytes[index++];
      output += String.fromCharCode((b1 & 31) << 6 | b2 & 63);
    } else if (b1 < 240) {
      b2 = bytes[index++];
      b3 = bytes[index++];
      output += String.fromCharCode((b1 & 15) << 12 | (b2 & 63) << 6 | b3 & 63);
    } else {
      b2 = bytes[index++];
      b3 = bytes[index++];
      b4 = bytes[index++];
      code = (b1 & 7) << 18 | (b2 & 63) << 12 | (b3 & 63) << 6 | b4 & 63;
      code -= 65536;
      output += String.fromCharCode(55296 + (code >> 10), 56320 + (code & 1023));
    }
  }
  return output;
}
function decodeBase64Json(payload) {
  try {
    return JSON.parse(utf8Decode(base64Decode(payload)));
  } catch (_error) {
    return null;
  }
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
    var data = decodeBase64Json(payload.response || "");
    return (data && data.result || []).map(function(entry) {
      return {
        title: entry.object_name || entry.title || "",
        url: absoluteUrl(entry.used_slug || "", BASE_URL + "/"),
        type: String(entry.used_type || "").toLowerCase().indexOf("movie") >= 0 ? "movie" : "tv",
        year: entry.object_release_year || null
      };
    }).filter(function(entry) {
      return entry.title && entry.url && entry.url.indexOf("/seri-filmler/") < 0;
    });
  });
}
function parseSecureData(html) {
  var script = extractFirst(html, /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  var nextData = script ? JSON.parse(script) : null;
  var secureData = nextData && nextData.props && nextData.props.pageProps ? nextData.props.pageProps.secureData : "";
  return secureData ? decodeBase64Json(secureData) : null;
}
function pickMovieSources(details) {
  var related = details && details.RelatedResults ? details.RelatedResults : {};
  var parts = related.getMoviePartsById && related.getMoviePartsById.result ? related.getMoviePartsById.result : [];
  var sources = [];
  parts.forEach(function(part) {
    var key = "getMoviePartSourcesById_" + part.id;
    if (related[key] && Array.isArray(related[key].result))
      sources = sources.concat(related[key].result);
  });
  return sources;
}
function loadItem(url) {
  return __async(this, null, function* () {
    var html = yield fetchText(url, { headers: { Referer: BASE_URL + "/" } });
    var details = parseSecureData(html);
    var item = details ? details.contentItem || {} : {};
    var related = details ? details.RelatedResults || {} : {};
    var series = related.getSerieSeasonAndEpisodes && related.getSerieSeasonAndEpisodes.result ? related.getSerieSeasonAndEpisodes.result : [];
    var episodes = [];
    series.forEach(function(seasonBlock) {
      (seasonBlock.episodes || []).forEach(function(episode) {
        episodes.push({
          season: Number(seasonBlock.season_no),
          episode: Number(episode.episode_no),
          url: absoluteUrl(episode.used_slug || "", BASE_URL + "/")
        });
      });
    });
    return {
      title: item.original_title || item.title || "",
      url,
      year: item.release_year || null,
      episodes
    };
  });
}
function extractLinks(targetUrl, metadata, season, episode) {
  return __async(this, null, function* () {
    var html = yield fetchText(targetUrl, { headers: { Referer: BASE_URL + "/" } });
    var details = parseSecureData(html);
    var related = details ? details.RelatedResults || {} : {};
    var rawSources = [];
    var streams = [];
    if (targetUrl.indexOf("/dizi/") >= 0 && related.getEpisodeSources && Array.isArray(related.getEpisodeSources.result)) {
      rawSources = related.getEpisodeSources.result;
    } else {
      rawSources = pickMovieSources(details);
    }
    rawSources.forEach(function(source) {
      var iframeUrl = extractFirst(source.source_content || "", /src="([^"]+)"/i);
      if (!iframeUrl)
        return;
      if (iframeUrl.indexOf("sn.dplayer74.site") >= 0)
        iframeUrl = iframeUrl.replace("sn.dplayer74.site", "sn.hotlinger.com");
      iframeUrl = absoluteUrl(iframeUrl, BASE_URL + "/");
      streams.push({
        name: PROVIDER_NAME + " - " + hostOf(iframeUrl),
        title: metadata.displayTitle + (season ? " - S" + String(season).padStart(2, "0") + "E" + String(episode).padStart(2, "0") : "") + " - " + (source.quality_name || "Auto"),
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
      var metadata = yield getMetadata(tmdbId, mediaType);
      var queries = buildQueries(metadata);
      var candidates = [];
      var queryIndex;
      var results;
      var candidateIndex;
      var item;
      var targetUrl;
      var ep;
      var links;
      for (queryIndex = 0; queryIndex < queries.length && candidates.length < 12; queryIndex += 1) {
        try {
          results = yield searchSite(queries[queryIndex]);
          candidates = candidates.concat(results.filter(function(result) {
            return result.type === mediaType;
          }));
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
        targetUrl = item.url;
        if (mediaType === "tv") {
          ep = item.episodes.filter(function(entry) {
            return Number(entry.season) === Number(season) && Number(entry.episode) === Number(episode);
          })[0];
          if (!ep)
            continue;
          targetUrl = ep.url;
        }
        links = yield extractLinks(targetUrl, metadata, season, episode);
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
