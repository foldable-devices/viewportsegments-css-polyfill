const test = require("tape");

const { SPANNING_MF_KEY } = require("../src/constants");

const {
  _processSpanningMediaBlock,
  _getMediaFeatures,
  replaceCSSEnvVariables,
  _getMediaTypes
} = require("../src/utils/css-text-processors.js");

test(`_processSpanningMediaBlock should find media query blocks starting with @media and containing ${SPANNING_MF_KEY} `, function(t) {
  let spanningmediaQuery = `@media type (${SPANNING_MF_KEY}: single-fold-vertical) and (min-width: 900px){body { color: green; }}`;
  let otherCSSText = `body{ background: blue' }`;
  t.equal(
    spanningmediaQuery,
    _processSpanningMediaBlock(spanningmediaQuery + otherCSSText)[0][0]
  );
  t.end();
});

test("_processSpanningMediaBlock should find ALL spanning media blocks", function(t) {
  let spanningmediaQuery = `@media type (${SPANNING_MF_KEY}: single-fold-vertical) and (min-width: 900px){body { color: green; }}`;
  let spanningmediaQuery2 = `@media type (${SPANNING_MF_KEY}: single-fold-vertical) and (min-width: 900px){body { color: green; }}`;
  let otherCSSText = `body{ background: blue' }`;
  t.equal(
    spanningmediaQuery2,
    _processSpanningMediaBlock(
      spanningmediaQuery + spanningmediaQuery2 + otherCSSText
    )[1][0]
  );
  t.end();
});

test("_processSpanningMediaBlock should capture the media query defintion", function(t) {
  let spanningmediaQuery = `@media type (${SPANNING_MF_KEY}: single-fold-vertical) and (min-width: 900px){body { color: green; }}`;
  let otherCSSText = `body{ background: blue' }`;
  t.equal(
    "@media type (spanning: single-fold-vertical) and (min-width: 900px)",
    _processSpanningMediaBlock(spanningmediaQuery + otherCSSText)[0][1]
  );
  t.end();
});

test("_processSpanningMediaBlock should capture the media query CSS content", function(t) {
  let spanningmediaQuery = `@media type (spanning: single-fold-vertical) and (min-width: 900px){body { color: green; }}`;
  let otherCSSText = `body{ background: blue' }`;
  t.equal(
    "body { color: green; }",
    _processSpanningMediaBlock(spanningmediaQuery + otherCSSText)[0][2]
  );
  t.end();
});

test("_getMediaFeatures should return an array with features inside parentheses that comes after @media", function(t) {
  let mfStr = `@media type (spanning: single-fold-vertical) and (min-width: 900px)`;
  t.equal(2, _getMediaFeatures(mfStr).length);
  t.end();
});

test("_getMediaFeatures should still return an array even tho there was no matches", function(t) {
  let mfStr = `@media type `;
  t.equal(0, _getMediaFeatures(mfStr).length);
  t.end();
});

test("_getMediaFeatures matches correctly and captures the features including the ( parentheses )", function(t) {
  let mfStr = `@media type (spanning: single-fold-vertical) and (min-width: 900px)`;
  t.equal("(spanning: single-fold-vertical)", _getMediaFeatures(mfStr)[0]);
  t.equal("(min-width: 900px)", _getMediaFeatures(mfStr)[1]);
  t.end();
});

test("_getMediaTypes should return array of and capture `@media` and following media-types up until first feature parentheses", function(t) {
  let mfStr = `@media type1 type2 (spanning: single-fold-vertical) and (min-width: 900px)`;
  t.equal(1, _getMediaTypes(mfStr).length);
  t.end();
});

test("_getMediaTypes should return an array of length 0 if there was no matches", function(t) {
  let mfStr = `hello media type1 type2 (spanning: single-fold-vertical) and (min-width: 900px)`;
  t.equal(0, _getMediaTypes(mfStr).length);
  t.end();
});

test("_getMediaTypes should return capture `@madia` and the following words until the first parentheses", function(t) {
  let mfStr = `@media type1 type2 (spanning: single-fold-vertical) and (min-width: 900px)`;
  t.equal(`@media type1 type2 `, _getMediaTypes(mfStr)[0]);
  t.end();
});

test("replaceCSSEnvVariables should find and replace  all istances of an CSS env(variable)", function(t) {
  let sheetStr = `
    body {
      width: env(pre-defined-variable);
      height: env(pre-defined-variable);
    }
  `;

  let expectedOutput = `
    body {
      width: 99px;
      height: 99px;
    }
  `;
  t.equal(
    expectedOutput,
    replaceCSSEnvVariables(sheetStr, "pre-defined-variable", "99px")
  );
  t.end();
});

test("replaceCSSEnvVariables should ignore white spaces inside the parentheses of env(variable) ", function(t) {
  let sheetStr = `env(        pre-defined-variable  ) env( pre-defined-variable )`;
  let expectedOutput = `99px 99px`;
  t.equal(
    expectedOutput,
    replaceCSSEnvVariables(sheetStr, "pre-defined-variable", "99px")
  );
  t.end();
});
