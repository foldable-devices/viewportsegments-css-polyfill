import {
  SPANNING_MF_VAL_VER,
  SPANNING_MF_VAL_HOR,
  CSS_ENV_FOLD_TOP,
  CSS_ENV_FOLD_LEFT,
  CSS_ENV_FOLD_HEIGHT,
  CSS_ENV_FOLD_WIDTH
} from "../constants.js";

/**
 * Returns the device fold (hinge) geometry
 *
 * @param {Object} configs
 * @returns {Object}
 */
export function getDeviceFoldRects(configs) {
  let left = 0,
    top = 0,
    width = 0,
    height = 0;
  if (configs.spanning === SPANNING_MF_VAL_VER) {
    width = configs.foldSize;
    height = window.innerHeight;
    left = window.innerWidth / 2 - configs.foldSize / 2;
  }
  if (configs.spanning === SPANNING_MF_VAL_HOR) {
    width = window.innerWidth;
    height = configs.foldSize;
    top =
      window.innerHeight / 2 - configs.foldSize / 2 - configs.browserShellSize;
  }
  return {
    [CSS_ENV_FOLD_TOP]: top,
    [CSS_ENV_FOLD_LEFT]: left,
    [CSS_ENV_FOLD_HEIGHT]: height,
    [CSS_ENV_FOLD_WIDTH]: width
  };
}
