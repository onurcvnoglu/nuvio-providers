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
var TMDB_API_KEY = "500330721680edb6d5f7f12ba7cd9023";
var VERSION = "8.0.0-UNIFIED-VERIFIED";
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      var typePath = mediaType === "movie" ? "movie" : "tv";
      var tmdbUrl = "https://api.themoviedb.org/3/" + typePath + "/" + tmdbId + "?api_key=" + TMDB_API_KEY + "&language=tr-TR&append_to_response=external_ids";
      var tmdbRes = yield fetch(tmdbUrl);
      var d = yield tmdbRes.json();
      var imdbId = d.external_ids ? d.external_ids.imdb_id : null;
      var title = d.title || d.name || "Icerik";
      var targetUrl = "";
      var displayTitle = title;
      var releaseYear;
      var sStr;
      var eStr;
      var checkRes;
      if (!imdbId || !imdbId.startsWith("tt")) {
        return [];
      }
      if (mediaType === "movie") {
        targetUrl = "https://vidmody.com/vs/" + imdbId;
        releaseYear = (d.release_date || "").slice(0, 4);
        displayTitle += releaseYear ? " (" + releaseYear + ")" : "";
      } else {
        sStr = "s" + season;
        eStr = "e" + (episode < 10 ? "0" + episode : episode);
        targetUrl = "https://vidmody.com/vs/" + imdbId + "/" + sStr + "/" + eStr;
        displayTitle += " - " + sStr.toUpperCase() + eStr.toUpperCase();
      }
      try {
        checkRes = yield fetch(targetUrl, { method: "HEAD" });
        if (checkRes.status === 200) {
          return [{
            url: targetUrl,
            name: "Vidmody",
            title: displayTitle,
            quality: "Auto",
            headers: {
              "Referer": "https://vidmody.com/",
              "User-Agent": "Mozilla/5.0"
            }
          }];
        }
      } catch (_linkErr) {
        return [];
      }
      return [];
    } catch (error) {
      console.error("[V" + VERSION + "] HATA: " + error.message);
      return [];
    }
  });
}
if (typeof globalThis !== "undefined") {
  globalThis.getStreams = getStreams;
} else if (typeof global !== "undefined") {
  global.getStreams = getStreams;
}
if (typeof module !== "undefined") {
  module.exports = { getStreams };
}
