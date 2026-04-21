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
var BASE_URL = "https://webdramaturkey2.com";
var PROVIDER_ID = "webdramaturkey";
var PROVIDER_NAME = "WebDramaTurkey";
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
function extractAll(text, regex, mapper) {
  var input = String(text || "");
  var result = [];
  var match;
  regex.lastIndex = 0;
  while (match = regex.exec(input))
    result.push(mapper ? mapper(match) : match[1]);
  return result;
}
function htmlDecode(value) {
  return String(value || "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}
function stripTags(value) {
  return htmlDecode(String(value || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
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
  }).slice(0, 8);
}
function getMetadata(tmdbId, mediaType) {
  return __async(this, null, function* () {
    var type = mediaType === "movie" ? "movie" : "tv";
    var languages = ["tr-TR", "en-US", "ja-JP", "ko-KR", "zh-CN"];
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
function parseSearchResults(html) {
  return extractAll(html, /<a href="([^"]+)" class="list-title">\s*([\s\S]*?)\s*<\/a>/gi, function(match) {
    var url = absoluteUrl(match[1], BASE_URL + "/");
    var type = url.indexOf("/film/") >= 0 ? "movie" : url.indexOf("/dizi/") >= 0 || url.indexOf("/anime/") >= 0 ? "tv" : "";
    return { title: stripTags(match[2]), url, type };
  }).filter(function(entry) {
    return entry.title && entry.url && entry.type;
  });
}
function searchSite(query) {
  return __async(this, null, function* () {
    var html = yield fetchText(BASE_URL + "/arama/" + encodeURIComponent(query), { headers: { Referer: BASE_URL + "/" } });
    return parseSearchResults(html);
  });
}
function parseEpisodes(html) {
  return unique(extractAll(html, /href="([^"]*\/\d+-sezon\/\d+-bolum[^"]*)"/gi, function(match) {
    return absoluteUrl(match[1], BASE_URL + "/");
  })).map(function(url) {
    var seasonMatch = url.match(/\/(\d+)-sezon\//i);
    var episodeMatch = url.match(/\/(\d+)-bolum/i);
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
    var html = yield fetchText(url, { headers: { Referer: BASE_URL + "/" } });
    return {
      title: stripTags(extractFirst(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)),
      url,
      episodes: parseEpisodes(html)
    };
  });
}
function parseDirectMedia(text) {
  var urls = [];
  [
    /sources\s*:\s*\[\s*\{\s*file\s*:\s*['"]([^'"]+\.(?:m3u8|mp4)[^'"]*)/ig,
    /file\s*:\s*['"]([^'"]+\.(?:m3u8|mp4)[^'"]*)/ig,
    /"file"\s*:\s*"([^"]+\.(?:m3u8|mp4)[^"]*)/ig,
    /(https?:\/\/[^"'\\\s<>]+\.(?:m3u8|mp4)[^"'\\\s<>]*)/ig
  ].forEach(function(pattern) {
    urls = urls.concat(extractAll(text, pattern));
  });
  return unique(urls.map(function(url) {
    return String(url || "").replace(/\\u0026/g, "&").replace(/\\\//g, "/").replace(/^"+|"+$/g, "");
  }));
}
function resolveMedia(url, referer) {
  return __async(this, null, function* () {
    var fullUrl = absoluteUrl(url, referer || BASE_URL + "/");
    var html;
    var media;
    if (/\.(m3u8|mp4)(\?|$)/i.test(fullUrl))
      return [fullUrl];
    try {
      html = yield fetchText(fullUrl, { headers: { Referer: referer || BASE_URL + "/" } });
      media = parseDirectMedia(html);
      if (media.length)
        return media;
    } catch (_error) {
    }
    return [fullUrl];
  });
}
function extractLinks(targetUrl, metadata, season, episode) {
  return __async(this, null, function* () {
    var html = yield fetchText(targetUrl, { headers: { Referer: BASE_URL + "/" } });
    var embedIds = unique(extractAll(html, /data-embed="([^"]+)"/gi));
    var streams = [];
    var index;
    var embedHtml;
    var iframeUrl;
    var mediaUrls;
    var mediaIndex;
    for (index = 0; index < embedIds.length; index += 1) {
      try {
        embedHtml = yield fetchText(BASE_URL + "/ajax/embed", {
          method: "POST",
          headers: {
            Referer: targetUrl,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest"
          },
          body: "id=" + encodeURIComponent(embedIds[index])
        });
        iframeUrl = extractFirst(embedHtml, /<iframe[^>]+src="([^"]+)"/i);
        if (!iframeUrl)
          continue;
        iframeUrl = absoluteUrl(iframeUrl, targetUrl);
        mediaUrls = yield resolveMedia(iframeUrl, targetUrl);
        for (mediaIndex = 0; mediaIndex < mediaUrls.length; mediaIndex += 1) {
          streams.push({
            name: PROVIDER_NAME + " - " + hostOf(mediaUrls[mediaIndex]),
            title: metadata.displayTitle + (season ? " - S" + String(season).padStart(2, "0") + "E" + String(episode).padStart(2, "0") : "") + " - Auto",
            url: mediaUrls[mediaIndex],
            quality: "Auto",
            headers: { Referer: iframeUrl },
            provider: PROVIDER_ID
          });
        }
      } catch (_error) {
      }
    }
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
