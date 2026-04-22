var TMDB_API_KEY = "4ef0d7355d9ffb5151e987764708ce96";
var API_BASE = "https://stream." + "watch" + "buddy.tv/api/v1";
var PLUGIN = "XPrime";
var PROVIDER_ID = "xprime";
var PROVIDER_NAME = "XPrime";
var SUPPORTED_TYPES = ["movie","tv"];

function fetchJson(url) {
  return fetch(url, {
    headers: {
      Accept: "application/json,text/plain,*/*",
      "User-Agent": "Mozilla/5.0"
    }
  }).then(function(response) {
    return response.text().then(function(text) {
      return JSON.parse(text);
    });
  });
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

function normalize(value) {
  return String(value || "")
    .replace(/İ/g, "I").replace(/ı/g, "i").replace(/Ş/g, "S").replace(/ş/g, "s")
    .replace(/Ğ/g, "G").replace(/ğ/g, "g").replace(/Ü/g, "U").replace(/ü/g, "u")
    .replace(/Ö/g, "O").replace(/ö/g, "o").replace(/Ç/g, "C").replace(/ç/g, "c")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function buildQueries(metadata) {
  var queries = [];
  (metadata.titles || []).forEach(function(title) {
    var clean = String(title || "").replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
    queries.push(clean);
    clean.split(/\s+-\s+|\s*:\s*/g).forEach(function(part) {
      queries.push(part);
    });
  });
  return unique(queries).filter(function(value) {
    return value.length > 1;
  }).slice(0, 8);
}

function hasSupportedType(mediaType) {
  return SUPPORTED_TYPES.indexOf(mediaType) >= 0;
}

function hostOf(url) {
  var match = String(url || "").match(/^https?:\/\/([^/:?#]+)/i);
  return match ? match[1].replace(/^www\./, "") : "External";
}

function qualityOf(value) {
  var match = String(value || "").match(/(2160p|1080p|720p|480p|360p|4k)/i);
  if (!match) return "Auto";
  return match[1].toLowerCase() === "4k" ? "4K" : match[1].toUpperCase();
}

function two(value) {
  value = String(value || 0);
  return value.length < 2 ? "0" + value : value;
}

function getMetadata(tmdbId, mediaType) {
  var type = mediaType === "movie" ? "movie" : "tv";
  var languages = ["tr-TR", "en-US", "ja-JP", "ko-KR", "zh-CN"];
  var titles = [];
  var year = null;
  var chain = Promise.resolve();

  languages.forEach(function(language) {
    chain = chain.then(function() {
      var url = "https://api.themoviedb.org/3/" + type + "/" + encodeURIComponent(String(tmdbId)) +
        "?language=" + language + "&api_key=" + TMDB_API_KEY;
      return fetchJson(url).then(function(data) {
        if (data.title || data.name) titles.push(data.title || data.name);
        if (data.original_title || data.original_name) titles.push(data.original_title || data.original_name);
        if (!year) year = Number(String(data.release_date || data.first_air_date || "").slice(0, 4)) || null;
      }).catch(function() {});
    });
  });

  return chain.then(function() {
    titles = unique(titles);
    if (!titles.length) throw new Error("TMDB metadata not found");
    return {
      titles: titles,
      displayTitle: titles[0],
      year: year,
      mediaType: mediaType
    };
  });
}

function apiSearch(query) {
  var url = API_BASE + "/search?plugin=" + encodeURIComponent(PLUGIN) + "&query=" + encodeURIComponent(query);
  return fetchJson(url).then(function(payload) {
    return payload && Array.isArray(payload.result) ? payload.result : [];
  });
}

function apiLoadItem(encodedUrl) {
  var url = API_BASE + "/load_item?plugin=" + encodeURIComponent(PLUGIN) + "&encoded_url=" + asEncodedUrl(encodedUrl);
  return fetchJson(url).then(function(payload) {
    return payload ? payload.result : null;
  });
}

function apiLoadLinks(encodedUrl) {
  var url = API_BASE + "/load_links?plugin=" + encodeURIComponent(PLUGIN) + "&encoded_url=" + asEncodedUrl(encodedUrl);
  return fetchJson(url).then(function(payload) {
    return payload && Array.isArray(payload.result) ? payload.result : [];
  });
}

function asEncodedUrl(value) {
  var text = String(value || "");
  return /^https?:\/\//i.test(text) ? encodeURIComponent(text) : text;
}

function decodeMaybe(value) {
  try {
    return decodeURIComponent(String(value || ""));
  } catch (_error) {
    return String(value || "");
  }
}

function resultType(result) {
  var decoded = decodeMaybe(result && result.url);
  if (decoded.indexOf("/film/") >= 0 || decoded.indexOf("/filmler/") >= 0 || decoded.indexOf("/movie/") >= 0) return "movie";
  if (decoded.indexOf("/dizi/") >= 0 || decoded.indexOf("/diziler/") >= 0 || decoded.indexOf("/series/") >= 0 || decoded.indexOf("-sezon-") >= 0 || decoded.indexOf("/sezon-") >= 0) return "tv";
  return "unknown";
}

function scoreResult(result, metadata) {
  var resultTitle = normalize(result.title || "");
  var best = 0;
  (metadata.titles || []).forEach(function(title) {
    var normalizedTitle = normalize(title);
    if (!normalizedTitle || !resultTitle) return;
    if (resultTitle === normalizedTitle) best = Math.max(best, 100);
    else if (resultTitle.indexOf(normalizedTitle) >= 0 || normalizedTitle.indexOf(resultTitle) >= 0) best = Math.max(best, 85);
    else if (resultTitle.split(" ")[0] === normalizedTitle.split(" ")[0]) best = Math.max(best, 55);
  });
  return best;
}

function findCandidates(metadata) {
  var queries = buildQueries(metadata);
  var candidates = [];
  var chain = Promise.resolve();

  queries.forEach(function(query) {
    chain = chain.then(function() {
      if (candidates.length >= 12) return null;
      return apiSearch(query).then(function(results) {
        results.forEach(function(result) {
          var type = resultType(result);
          if (result && result.url && (type === metadata.mediaType || type === "unknown")) {
            result.searchScore = scoreResult(result, metadata);
            candidates.push(result);
          }
        });
      }).catch(function() {});
    });
  });

  return chain.then(function() {
    var byUrl = {};
    candidates.forEach(function(candidate) {
      if (!byUrl[candidate.url] || byUrl[candidate.url].searchScore < candidate.searchScore) {
        byUrl[candidate.url] = candidate;
      }
    });
    return Object.keys(byUrl).map(function(key) {
      return byUrl[key];
    }).sort(function(left, right) {
      return right.searchScore - left.searchScore;
    });
  });
}

function resolveTarget(candidate, mediaType, season, episode) {
  return apiLoadItem(candidate.url).then(function(item) {
    var episodes;
    var index;
    if (!item) return null;
    if (mediaType !== "tv") return item.url || candidate.url;
    episodes = Array.isArray(item.episodes) ? item.episodes : [];
    for (index = 0; index < episodes.length; index += 1) {
      if (Number(episodes[index].season) === Number(season) && Number(episodes[index].episode) === Number(episode)) {
        return episodes[index].url;
      }
    }
    return null;
  });
}

function proxiedUrl(link) {
  var url = String(link && link.url || "");
  var userAgent = String(link && link.user_agent || "");
  var referer = String(link && link.referer || "");
  var proxy = "https://goproxy." + "watch" + "buddy.tv/proxy/video?url=" + encodeURIComponent(url);
  if (userAgent) proxy += "&user_agent=" + encodeURIComponent(userAgent);
  if (referer) proxy += "&referer=" + encodeURIComponent(referer);
  return proxy;
}

function buildStreams(links, metadata, season, episode) {
  var episodeTag = season ? " - S" + two(season) + "E" + two(episode) : "";
  return (links || []).filter(function(link) {
    return link && link.url;
  }).map(function(link) {
    var headers = {};
    if (link.referer) headers.Referer = link.referer;
    if (link.user_agent) headers["User-Agent"] = link.user_agent;
    return {
      name: PROVIDER_NAME + " - " + (link.name || hostOf(link.url)),
      title: metadata.displayTitle + episodeTag + " - " + (link.name || "Auto"),
      url: proxiedUrl(link),
      quality: qualityOf(link.name || link.url),
      headers: headers,
      subtitles: link.subtitles || [],
      provider: PROVIDER_ID
    };
  });
}

function getStreams(tmdbId, mediaType, season, episode) {
  if (!hasSupportedType(mediaType)) return Promise.resolve([]);
  return getMetadata(tmdbId, mediaType).then(function(metadata) {
    return findCandidates(metadata).then(function(candidates) {
      var index = 0;

      function tryNext() {
        var candidate = candidates[index++];
        if (!candidate) return [];
        return resolveTarget(candidate, mediaType, season, episode).then(function(targetUrl) {
          if (!targetUrl) return tryNext();
          return apiLoadLinks(targetUrl).then(function(links) {
            var streams = buildStreams(links, metadata, season, episode);
            return streams.length ? streams : tryNext();
          });
        }).catch(function() {
          return tryNext();
        });
      }

      return tryNext();
    });
  }).catch(function(error) {
    console.error("[" + PROVIDER_NAME + "] " + error.message);
    return [];
  });
}

if (typeof globalThis !== "undefined") globalThis.getStreams = getStreams;
else if (typeof global !== "undefined") global.getStreams = getStreams;
if (typeof module !== "undefined") module.exports = { getStreams: getStreams };
