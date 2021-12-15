export const VIEWPORT_SEG_KEY = "-viewport-segments";


const VIEWPORT_SEGMENT_MEDIA_BLOCK_REGEXP_STR = `(\\s*)(@media.*?\\b${VIEWPORT_SEG_KEY}\\b[^{]+)\\{([\\s\\S]+?\\})(\\s*)\\}`;

const MEDIA_FEATURES_REGEXP = /\((.*?)\)/gi;
const MEDIA_TYPES_REGEXP = /@media[^\(]+/gi;
const VIEWPORT_SEGMENT_HOR_REGEXP = /(horizontal-viewport-segments:)\s?(\d)/gi;
const VIEWPORT_SEGMENT_VER_REGEXP = /(vertical-viewport-segments:)\s?(\d)/gi;

const cssEnvVariableRegExpMaker = variable => {
  return new RegExp(`env\\(\\s*${variable}\\s*\\)`, "gi");
};

/**
 * Finds and returns an array of `@media` blocks with containing viewport segments media feature
 *
 * @param {string} cssText
 *
 * @returns {string[]}
 */
export function _processViewportSegmentsMediaBlock(cssText) {
  const regex = new RegExp(VIEWPORT_SEGMENT_MEDIA_BLOCK_REGEXP_STR, "gi");

  let viewportSegmentMediaBlocks;
  if (typeof cssText.matchAll === "function") {
    viewportSegmentMediaBlocks = Array.from(cssText.matchAll(regex));
  } else {
    viewportSegmentMediaBlocks = [];

    while (viewportSegmentMediaBlocks[viewportSegmentMediaBlocks.length] = regex.exec(cssText));
    viewportSegmentMediaBlocks.length--;
  }
  return viewportSegmentMediaBlocks;
}

export function hasViewportSegmentsMediaBlocks(originalSheetStr) {
    const regEx = new RegExp(VIEWPORT_SEGMENT_MEDIA_BLOCK_REGEXP_STR, "gi");
    return regEx.test(originalSheetStr)
}

/**
 * Replaces *-viewport-segments `@media` blocks containing `*-viewport-segments` feature
 * and returns a new stylesheet string
 *
 * @param {String} originalSheetStr
 * @param {String} replaceWith
 *
 * @returns {String}
 */
export function replaceViewportSegmentsMediaBlocks(originalSheetStr, replaceWith) {
  return originalSheetStr.replace(
    new RegExp(VIEWPORT_SEGMENT_MEDIA_BLOCK_REGEXP_STR, "gi"),
    replaceWith
  );
}

/**
 * Replaces a word in a string and returns a new string
 *
 * @param {String} originalSheetStr
 * @param {String} cssEnvVariable
 * @param {String} replaceWith
 *
 * @returns {String}
 */
export function replaceCSSEnvVariables(
  originalSheetStr,
  cssEnvVariable,
  replaceWith
) {
  return originalSheetStr.replace(
    cssEnvVariableRegExpMaker(cssEnvVariable),
    replaceWith
  );
}

/**
 * Returns an array of media features found a string sucb as
 * `(min-width: ..)`, `(orientation:..)` etc.
 *
 * @param {String[]} mediaQueryStr
 *
 * @returns {String[]}
 */
export function _getMediaFeatures(mediaQueryStr) {
  return mediaQueryStr.match(MEDIA_FEATURES_REGEXP) || [];
}

/**
 * Returns an array of media features found a string sucb as
 * `(min-width: ..)`, `(orientation:..)` etc.
 *
 * @param {String[]} mediaQueryStr
 *
 * @returns {String[]}
 */
 export function _getViewportSegments(mediaQueryStr , type) {
  const matches = mediaQueryStr.matchAll(type);
  if (matches === null) {
    return [];
  }
  return Array.from(matches, m => m[2])[0];
}

/**
 * Returns an array containing `@media` and following media types such
 * as screen, all, print, etc. up until the first media feature parenthesis
 *
 * @param {*} mediaQueryStr
 *
 * @returns {String[]}
 */
export function _getMediaTypes(mediaQueryStr) {
  return mediaQueryStr.match(MEDIA_TYPES_REGEXP) || [];
}

/**
 * Finds all *-viewport-segments media queries in CSS text and returns an object of all media
 * queries, grouped by type
 *
 * @param {*} cssText
 */
export function getViewportSegmentCSSText(cssText) {
  const viewportSegmentMediaBlocks = _processViewportSegmentsMediaBlock(cssText);
  let result = [[]];

  viewportSegmentMediaBlocks.forEach(block => {
    const indentStart = block[1];
    const definition = block[2];
    const content = block[3];
    const indentEnd = block[4];

    const mediaTypes = _getMediaTypes(definition);
    let mediaFeatures = _getMediaFeatures(definition);
    let verticalSegments = _getViewportSegments(definition, VIEWPORT_SEGMENT_VER_REGEXP);
    if (verticalSegments === undefined)
      verticalSegments = 1;

    let horizontalSegments = _getViewportSegments(definition, VIEWPORT_SEGMENT_HOR_REGEXP);
    if (horizontalSegments === undefined) {
      horizontalSegments = 1;
    }

    mediaFeatures = mediaFeatures
      .filter(f => !f.includes(VIEWPORT_SEG_KEY))
      .join(" and ");

    if (result[verticalSegments] === undefined) {
      result[verticalSegments] = new Array();
    }
    result[verticalSegments][horizontalSegments] = `${indentStart}${mediaTypes}${mediaFeatures}{${content}${indentEnd}}`;
  });

  return result;
}
