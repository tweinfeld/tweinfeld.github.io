const { readFileSync, writeFileSync, mkdirSync } = require("node:fs");
const { resolve, join } = require("node:path");
const identity = require("lodash/fp/identity.js");
const pipe = require("lodash/fp/pipe.js");
const get = require("lodash/fp/get.js");
const less = require("less");
const svgo = require("svgo");
const prettier = require("prettier");
const configuration = require("./src/configuration");
const kefir = require("kefir");
const fs = require("node:fs");
const path = require("path");

const DIR_PUBLISH_PATH = "./publish";
const DIR_DATA_PATH = "./data";
const DIR_SRC_PATH = "./src";

const readFileSteam = (filename) =>
  kefir
    .fromNodeCallback((cb) => fs.readFile(filename, "utf8", cb))
    .map(JSON.parse);

const pipeAsync = function (...funcs) {
  return (initialValue) =>
    funcs.reduce(
      (promise, func) => promise.then(func),
      Promise.resolve(initialValue),
    );
};

const readAs =
  (encType = "utf8") =>
  (source) =>
    readFileSync(source, encType);
const toBuffer =
  (encType = "utf8") =>
  (data) =>
    Buffer.from(data, encType);
const writeTo = (destination) => (data) => writeFileSync(destination, data);

const basePublishDir = resolve(__dirname, DIR_PUBLISH_PATH);
const baseSrcDir = resolve(__dirname, DIR_SRC_PATH);
const baseDataDir = resolve(__dirname, DIR_DATA_PATH);

mkdirSync(basePublishDir, { recursive: true });

[
  {
    filename: "index.html",
    transform: pipeAsync(
      readAs("utf8"),
      (html) =>
        prettier.format(html, {
          parser: "html",
          singleQuote: false,
          semi: true,
        }),
      toBuffer(),
      writeTo(resolve(basePublishDir, "./index.html")),
    ),
  },
  {
    filename: "print.less",
    transform: pipeAsync(
      readAs("utf8"),
      (stylesheet) => less.render(stylesheet, { compress: true }),
      get("css"),
      toBuffer(),
      writeTo(resolve(basePublishDir, "print.css")),
    ),
  },
  {
    filename: "screen.less",
    transform: pipeAsync(
      readAs("utf8"),
      (stylesheet) => less.render(stylesheet, { compress: true }),
      get("css"),
      toBuffer(),
      writeTo(resolve(basePublishDir, "screen.css")),
    ),
  },
  {
    filename: "logos.svg",
    transform: pipeAsync(
      readAs("utf8"),
      (svgContent) => svgo.optimize(svgContent, {}).data,
      toBuffer(),
      writeTo(resolve(basePublishDir, "./logos.svg")),
    ),
  },
  {
    filename: "robots.txt",
    transform: pipeAsync(
      readAs("utf8"),
      toBuffer(),
      writeTo(resolve(basePublishDir, "./robots.txt")),
    ),
  },
  {
    transform: pipeAsync(
      function () {
        return kefir
          .combine(
            ["profile", "company", "tag"].map((filename) =>
              readFileSteam(
                path.join(baseDataDir, [filename, "json"].join(".")),
              ),
            ),
            (profile, company, tag) => ({ profile, company, tag }),
          )
          .toPromise();
      },
      JSON.stringify,
      toBuffer(),
      writeTo(resolve(basePublishDir, "./data.json")),
    ),
  },
].forEach(async function ({ filename = "", transform }) {
  transform(resolve(baseSrcDir, filename));
});
