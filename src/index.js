import {
  SPANNING_MF_VAL_NONE,
  POLYFILL_NAMESPACE,
  SPANNING_MF_VAL_VER,
  SPANNING_MF_VAL_HOR
} from "./constants.js";

import {
  getSpanningCSSText,
  replaceSpanningMediaBlocks,
  replaceCSSEnvVariables
} from "./utils/css-text-processors.js";

import { getDeviceFoldRects } from "./utils/device-gemoetry.js";

import { fetchCSSText, debounnce, createElement } from "./utils/misc.js";

if (typeof window[POLYFILL_NAMESPACE] === "undefined") {
  // polyfill configuration related variables
  let spanning =
    sessionStorage.getItem(`${POLYFILL_NAMESPACE}-spanning`) ||
    SPANNING_MF_VAL_NONE;
  let foldSize = sessionStorage.getItem(`${POLYFILL_NAMESPACE}-foldSize`) || 0;
  let browserShellSize =
    sessionStorage.getItem(`${POLYFILL_NAMESPACE}-browserShellSize`) || 0;
  // global configs, accessible via the window object
  Object.defineProperty(window, POLYFILL_NAMESPACE, {
    value: {
      spanning,
      foldSize,
      browserShellSize,
      update: update,
      onupdate: [insertSpanningStyles]
    }
  });

  // web-based emulator runs this polyfill in an iframe, we need to communicate
  // emulator state changes to the site
  // should only be registered once (in CSS or JS polyfill not both)
  window.addEventListener("message", evt => {
    let action = evt.data.action || "";
    let value = evt.data.value || {};
    if (action === "update") {
      window[POLYFILL_NAMESPACE].update(value);
    }
  });
}

let cssElements = Array.from(
  document.querySelectorAll('link[rel="stylesheet"], style')
);

// original page CSS
//let cssText = "";

/**
 * modified page CSS text: env(fold-*) variables replaced, (spanning: *) media query replaced
 * grouped in this object as:
 *
 * -- single-fold-vertical: CSS found in the media feature (spanning: single-fold-vertical)
 * -- single-fold-horizontal: CSS found in the media feature (spanning: single-fold-horizontal)
 * -- none: CSS found in the media feature (spanning: none)
 */
let spanning = {
  [SPANNING_MF_VAL_HOR]: "",
  [SPANNING_MF_VAL_VER]: "",
  [SPANNING_MF_VAL_NONE]: ""
};

fetchCSSText(cssElements).then(sheetsTextContentArray => {
  let styleFragment = new DocumentFragment();
  sheetsTextContentArray.forEach((sheet, i) => {

    // all other css excluding spanning media blocks
    let noSpanningCSS = replaceSpanningMediaBlocks(sheet, "");
    let spanningCSS = getSpanningCSSText(sheet);

    let sheetOrigin = cssElements[i].href || "inline";

    Object.keys(spanningCSS).forEach(k => {
      if (typeof spanning[k] !== "undefined") {
        spanning[k] += `
          /* origin:  ${sheetOrigin} */
          ${spanningCSS[k]}`;
      }
    });

    styleFragment.appendChild(
      createElement("style", { "data-css-origin": sheetOrigin }, noSpanningCSS)
    );
  });

  // spanning media blocks grouped by spanning type (single-fold-horizontal, vertical or none)
  // let spanningCSSText = getSpanningCSSText(cssText);
  // editedCSSText = Object.assign(editedCSSText, spanningCSSText);

  cssElements.forEach(el => el.parentElement.removeChild(el));

  document.head.appendChild(styleFragment);

  // insert spanning media query styelsheet
  insertSpanningStyles();

  window.addEventListener("resize", debounnce(insertSpanningStyles, 150));
});

// looks at configs and appends the correct `spanning` styles
function insertSpanningStyles() {
  Array.from(document.querySelectorAll(`.${POLYFILL_NAMESPACE}`)).forEach(el =>
    el.parentElement.removeChild(el)
  );
  let configs = window[POLYFILL_NAMESPACE];

  if (configs.spanning === SPANNING_MF_VAL_NONE) return;

  let spanningCSSText = spanning[configs.spanning];
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
      window[POLYFILL_NAMESPACE][k] = newConfings[k];
      sessionStorage.setItem(
        `${POLYFILL_NAMESPACE}-${k}`,
        window[POLYFILL_NAMESPACE][k]
      );
    }
  });

  window[POLYFILL_NAMESPACE].onupdate.forEach(fn => fn());
}
