const { getStreams } = require("./providers/dizimom.js");

const tmdbId = process.argv[2] || "245914";
const mediaType = process.argv[3] || "tv";
const season = Number(process.argv[4] || 1);
const episode = Number(process.argv[5] || 1);

function printStreams(streams) {
  console.log("Streams found:", streams.length);
  console.log(JSON.stringify(streams, null, 2));
}

function run() {
  if (typeof getStreams !== "function") {
    throw new Error("DiziMom getStreams export is not a function");
  }

  console.log("Testing DiziMom getStreams");
  console.log({ tmdbId, mediaType, season, episode });

  return getStreams(tmdbId, mediaType, season, episode).then(printStreams);
}

run().catch(function(error) {
  console.error("Test failed:", error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
