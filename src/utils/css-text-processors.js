import {
  SPANNING_MF_KEY,
  SPANNING_MF_VAL_HOR,
  SPANNING_MF_VAL_VER,
  SPANNING_MF_VAL_NONE
} from "../constants.js";

const SPANNING_MEDIA_BLOCK_REGEXP_STR = `(@media.*?\\b${SPANNING_MF_KEY}\\b[^{]+)\\{([\\s\\S]+?\\})\\s*\\}`;

const MEDIA_FEATURES_REGEXP = /\((.*?)\)/gi;

const MEDIA_TYPES_REGEXP = /@media[^\(]+/gi;

const cssEnvVariableRegExpMaker = variable => {
  return new RegExp(`env\\(\\s*${variable}\\s*\\)`, "gi");
};

/**
 * Finds and returns an array of `@media` blocks with containing spanning media feature
 *
 * @param {string} cssText
 *
 * @returns {string[]}
 */
export function _processSpanningMediaBlock(cssText) {
  const regex = new RegExp(SPANNING_MEDIA_BLOCK_REGEXP_STR, "gi");

  // matchAll is not yet supported in Safari, but shipped in Edge, Chrome and FF
  // Accoding to Babel docs: https://babeljs.io/docs/en/babel-preset-env#shippedproposals
  // setting {useBuiltIns: "usage"} will use the browser shipped version rather than
  // the transpiled version.
  const spanningMediaBlocks = Array.from(cssText.matchAll(regex));

  return spanningMediaBlocks;
}

/**
 * Replaces spanning `@media` blocks containing `spanning` feature
 * and returns a new stylesheet string
 *
 * @param {String} originalSheetStr
 * @param {String} replaceWith
 *
 * @returns {String}
 */
export function replaceSpanningMediaBlocks(originalSheetStr, replaceWith) {
  return originalSheetStr.replace(
    new RegExp(SPANNING_MEDIA_BLOCK_REGEXP_STR, "gi"),
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
 * Finds all spanning media queries in CSS text and returns an object of all media
 * queries, grouped by type
 *
 * @param {*} cssText
 */
export function getSpanningCSSText(cssText) {
  const spanningMediaBlocks = _processSpanningMediaBlock(cssText);

  const result = {
    [SPANNING_MF_VAL_HOR]: "",
    [SPANNING_MF_VAL_VER]: "",
    [SPANNING_MF_VAL_NONE]: ""
  };

  spanningMediaBlocks.forEach(block => {
    const definition = block[1];
    const content = block[2];

    //TODO: this is bad.
    let spanningValue = SPANNING_MF_VAL_NONE;
    if (definition.indexOf(SPANNING_MF_VAL_HOR) > -1) {
      spanningValue = SPANNING_MF_VAL_HOR;
    }
    if (definition.indexOf(SPANNING_MF_VAL_VER) > -1) {
      spanningValue = SPANNING_MF_VAL_VER;
    }

    const mediaTypes = _getMediaTypes(definition);
    let mediaFeatures = _getMediaFeatures(definition);

    mediaFeatures = mediaFeatures
      .filter(f => !f.includes(SPANNING_MF_KEY))
      .join(" and ");

    result[spanningValue] += `
      ${mediaTypes} ${mediaFeatures} {
        ${content}
      }`;
  });

  return result;
}
