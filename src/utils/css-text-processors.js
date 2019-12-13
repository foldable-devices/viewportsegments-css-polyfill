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
  let regex = new RegExp(SPANNING_MEDIA_BLOCK_REGEXP_STR, "gi");

  // mathAll is not yet supported in Safari but shipped in Edge, Chrome and FF
  // Accoding to Babel docs: https://babeljs.io/docs/en/babel-preset-env#shippedproposals
  // setting {useBuiltIns: "usage"} will use the browser shipped version than the transpiled
  let spanningMediaBlocks = Array.from(cssText.matchAll(regex));

  return spanningMediaBlocks;
}

/**
 * Replaces spanning `@media` blocks containning `spanning` feature and returns a new string
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
 * Returns an array of media features found a string sucb as `(min-width: ..)`, `(orientation:..)` etc..
 *
 * @param {String[]} mediaQueryStr
 *
 * @returns {String[]}
 */
export function _getMediaFeatures(mediaQueryStr) {
  return mediaQueryStr.match(MEDIA_FEATURES_REGEXP) || [];
}

/**
 * Returns an array containing `@media` and following media types such as screen, all, print, etc.
 * up until the first media feature parentheses
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
 * queries grouped by type
 *
 * @param {*} cssText
 */
export function getSpanningCSSText(cssText) {
  let spanningMediaBlocks = _processSpanningMediaBlock(cssText);

  let result = {
    [SPANNING_MF_VAL_HOR]: "",
    [SPANNING_MF_VAL_VER]: "",
    [SPANNING_MF_VAL_NONE]: ""
  };

  spanningMediaBlocks.forEach(block => {
    let defintion = block[1];
    let content = block[2];

    //TODO: this is bad.
    let spanningValue = SPANNING_MF_VAL_NONE;
    if (defintion.indexOf(SPANNING_MF_VAL_HOR) > -1) {
      spanningValue = SPANNING_MF_VAL_HOR;
    }
    if (defintion.indexOf(SPANNING_MF_VAL_VER) > -1) {
      spanningValue = SPANNING_MF_VAL_VER;
    }

    let mediaTypes = _getMediaTypes(defintion);
    let mediaFeatures = _getMediaFeatures(defintion);

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
