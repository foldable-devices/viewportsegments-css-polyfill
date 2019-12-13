import {
  SPANNING_MF_VAL_NONE,
  POLYFILL_NAMESPACE
} from "./constants.js";

import {
  getSpanningCSSText,
  replaceSpanningMediaBlocks,
  replaceCSSEnvVariables
} from "./utils/css-text-processors.js";

import { getDeviceFoldRects } from "./utils/device-gemoetry.js";

import { fetchCSSText, debounnce } from "./utils/misc.js";

let spanning =
  sessionStorage.getItem(`${POLYFILL_NAMESPACE}-spanning`) ||
  SPANNING_MF_VAL_NONE;
let foldSize = sessionStorage.getItem(`${POLYFILL_NAMESPACE}-foldSize`) || 0;
let browserShellSize =
  sessionStorage.getItem(`${POLYFILL_NAMESPACE}-browserShellSize`) || 0;
let configs = {
  spanning,
  foldSize,
  browserShellSize,
  update
};

let cssElements = Array.from(
  document.querySelectorAll('link[rel="stylesheet"], style')
);

let cssText = "";

let editedCSSText = {
  all: ""
};

fetchCSSText(cssElements).then(sheetsTextContentArray => {
  cssText = sheetsTextContentArray.join("\n");

  editedCSSText.all = replaceSpanningMediaBlocks(cssText, "");

  let spanningCSSText = getSpanningCSSText(cssText);
  editedCSSText = Object.assign(editedCSSText, spanningCSSText);

  cssElements.forEach(el => el.parentElement.removeChild(el));

  let polyfilledStyles = document.createElement("style");
  polyfilledStyles.textContent = editedCSSText.all;
  document.head.appendChild(polyfilledStyles);

  Object.defineProperty(window, POLYFILL_NAMESPACE, {
    value: configs
  });

  window.addEventListener("resize", debounnce(insertSpanningStyles, 150));

  window.addEventListener("message", evt => {
    let action = evt.data.action || "";
    let value = evt.data.value || {};
    if (action === "update") {
      update(value);
    }
  });

  insertSpanningStyles();
});

function insertSpanningStyles() {
  Array.from(document.querySelectorAll(`.${POLYFILL_NAMESPACE}`)).forEach(el =>
    el.parentElement.removeChild(el)
  );

  if (configs.spanning === SPANNING_MF_VAL_NONE) return;

  let spanningCSSText = editedCSSText[configs.spanning];
  let rects = getDeviceFoldRects(configs);
  Object.keys(rects).forEach(r => {
    spanningCSSText = replaceCSSEnvVariables(
      spanningCSSText,
      r,
      `${rects[r]}px`
    );
  });

  let polyfilledStyles = document.createElement("style");
  polyfilledStyles.className = POLYFILL_NAMESPACE;
  polyfilledStyles.textContent = spanningCSSText;
  document.head.appendChild(polyfilledStyles);
}

const VALID_CONFIG_PROPS = new Set([
  "foldSize",
  "browserShellSize",
  "spanning"
]);

function update(newConfings) {
  Object.keys(newConfings).forEach(k => {
    if (VALID_CONFIG_PROPS.has(k)) {
      configs[k] = newConfings[k];
      sessionStorage.setItem(`${POLYFILL_NAMESPACE}-${k}`, configs[k]);
    }
    insertSpanningStyles();
  });
}
