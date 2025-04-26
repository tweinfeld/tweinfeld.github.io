const kefir = require("kefir");
const path = require("path");
const fs = require("node:fs");

const readFileSteam = (filename) =>
  kefir
    .fromNodeCallback((cb) => fs.readFile(filename, "utf8", cb))
    .map(JSON.parse);

module.exports = function (baseDataPath) {
  return kefir
    .combine(
      ["profile", "company", "tag"].map((filename) =>
        readFileSteam(path.join(baseDataPath, [filename, "json"].join("."))),
      ),
      (profile, company, tag) => ({ profile, company, tag }),
    )
    .toPromise();
};
