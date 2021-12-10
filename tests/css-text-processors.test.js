import test from "tape";

import { replaceCSSEnvVariables, _processViewportSegmentsMediaBlock, _getMediaFeatures, _getMediaTypes } from "../src/utils/css-text-processors.js";

test(`_processViewportSegmentsMediaBlock should find media query blocks starting with @media and containing horizontal-viewport-segments `, function(t) {
  let viewportSegmentsMediaQuery = `@media type (horizontal-viewport-segments: 1) and (min-width: 900px){body { color: green; }}`;
  let otherCSSText = `body{ background: blue' }`;
  t.equal(
    viewportSegmentsMediaQuery,
    _processViewportSegmentsMediaBlock(viewportSegmentsMediaQuery + otherCSSText)[0][0]
  );
  t.end();
});

test(`_processViewportSegmentsMediaBlock should find media query blocks starting with @media and containing vertical-viewport-segments `, function(t) {
  let viewportSegmentsMediaQuery = `@media type (vertical-viewport-segments: 1) and (min-width: 900px){body { color: green; }}`;
  let otherCSSText = `body{ background: blue' }`;
  t.equal(
    viewportSegmentsMediaQuery,
    _processViewportSegmentsMediaBlock(viewportSegmentsMediaQuery + otherCSSText)[0][0]
  );
  t.end();
});

test(`_processViewportSegmentsMediaBlock should find media query blocks starting with @media and containing vertical-viewport-segments but no space after :`, function(t) {
  let viewportSegmentsMediaQuery = `@media type (vertical-viewport-segments:1) and (min-width: 900px){body { color: green; }}`;
  let otherCSSText = `body{ background: blue' }`;
  t.equal(
    viewportSegmentsMediaQuery,
    _processViewportSegmentsMediaBlock(viewportSegmentsMediaQuery + otherCSSText)[0][0]
  );
  t.end();
});

test(`_processViewportSegmentsMediaBlock should find media query blocks starting with @media and containing vertical-viewport-segments and horizontal-viewport-segments :`, function(t) {
  let viewportSegmentsMediaQuery = `@media type (vertical-viewport-segments:1) and (horizontal-viewport-segments:1) and (min-width: 900px){body { color: green; }}`;
  let otherCSSText = `body{ background: blue' }`;
  t.equal(
    viewportSegmentsMediaQuery,
    _processViewportSegmentsMediaBlock(viewportSegmentsMediaQuery + otherCSSText)[0][0]
  );
  t.end();
});

test("_processViewportSegmentsMediaBlock should find ALL viewport segments media blocks", function(t) {
  let viewportSegmentsMediaQuery = `@media type (vertical-viewport-segments: 1) and (min-width: 900px){body { color: green; }}`;
  let viewportSegmentsMediaQuery2 = `@media type (horizontal-viewport-segments: 2) and (min-width: 900px){body { color: green; }}`;
  let otherCSSText = `body{ background: blue' }`;
  t.equal(
    viewportSegmentsMediaQuery2,
    _processViewportSegmentsMediaBlock(
      viewportSegmentsMediaQuery + viewportSegmentsMediaQuery2 + otherCSSText
    )[1][0]
  );
  t.end();
});

test("_processViewportSegmentsMediaBlock should capture the media query definition", function(t) {
  let viewportSegmentsMediaQuery = `@media type (vertical-viewport-segments: 1) and (min-width: 900px){body { color: green; }}`;
  let otherCSSText = `body{ background: blue' }`;
  t.equal(
    `@media type (vertical-viewport-segments: 1) and (min-width: 900px)`,
    _processViewportSegmentsMediaBlock(viewportSegmentsMediaQuery + otherCSSText)[0][2]
  );
  t.end();
});

test("_processViewportSegmentsMediaBlock should capture the media query CSS content", function(t) {
  let viewportSegmentsMediaQuery = `@media type (horizontal-viewport-segments: 1) and (min-width: 900px){body { color: green; }}`;
  let otherCSSText = `body{ background: blue' }`;
  t.equal(
    "body { color: green; }",
    _processViewportSegmentsMediaBlock(viewportSegmentsMediaQuery + otherCSSText)[0][3]
  );
  t.end();
});

test("_getMediaFeatures should return an array with features inside parentheses that comes after @media", function(t) {
  let mfStr = `@media type (horizontal-viewport-segments: 1) and (min-width: 900px)`;
  t.equal(2, _getMediaFeatures(mfStr).length);
  t.end();
});

test("_getMediaFeatures should still return an array even tho there was no matches", function(t) {
  let mfStr = `@media type `;
  t.equal(0, _getMediaFeatures(mfStr).length);
  t.end();
});

test("_getMediaFeatures matches correctly and captures the features including the ( parentheses )", function(t) {
  let mfStr = `@media type (horizontal-viewport-segments: 1) and (min-width: 900px)`;
  t.equal(`(horizontal-viewport-segments: 1)`, _getMediaFeatures(mfStr)[0]);
  t.equal(`(min-width: 900px)`, _getMediaFeatures(mfStr)[1]);
  t.end();
});

test("_getMediaTypes should return array of and capture `@media` and following media-types up until first feature parentheses", function(t) {
  let mfStr = `@media type1 type2 (horizontal-viewport-segments: 1) and (min-width: 900px)`;
  t.equal(1, _getMediaTypes(mfStr).length);
  t.end();
});

test("_getMediaTypes should return an array of length 0 if there was no matches", function(t) {
  let mfStr = `hello media type1 type2 (horizontal-viewport-segments: 1) and (min-width: 900px)`;
  t.equal(0, _getMediaTypes(mfStr).length);
  t.end();
});

test("_getMediaTypes should return capture `@madia` and the following words until the first parentheses", function(t) {
  let mfStr = `@media type1 type2 (horizontal-viewport-segments: 1) and (min-width: 900px)`;
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
