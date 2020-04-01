import {
  POLYFILL_NAMESPACE,
  SPANNING_MF_VAL_NONE,
  SPANNING_MF_VAL_VER,
  SPANNING_MF_VAL_HOR
} from "./constants.js";

import {
  getSpanningCSSText,
  replaceSpanningMediaBlocks,
  replaceCSSEnvVariables
} from "./utils/css-text-processors.js";

import { getDeviceFoldRects } from "./utils/device-geometry.js";

import { fetchCSSText, debounce, createElement } from "./utils/misc.js";

if (typeof window[POLYFILL_NAMESPACE] === typeof(undefined)) {
  // polyfill configuration related variables
  const spanning =
    sessionStorage.getItem(`${POLYFILL_NAMESPACE}-spanning`) ||
    SPANNING_MF_VAL_NONE;
  const foldSize =
    +sessionStorage.getItem(`${POLYFILL_NAMESPACE}-foldSize`) || 0;
  const browserShellSize =
    +sessionStorage.getItem(`${POLYFILL_NAMESPACE}-browserShellSize`) || 0;
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

  // Web-based emulator runs this polyfill in an iframe, we need to
  // communicate emulator state changes to the site.
  // Should only be registered once (in CSS or JS polyfill not both)
  window.addEventListener("message", evt => {
    const action = evt.data.action || "";
    const value = evt.data.value || {};
    if (action === "update") {
      window[POLYFILL_NAMESPACE].update(value);
    }
  });
} else {
  window[POLYFILL_NAMESPACE].onupdate.push(insertSpanningStyles);
}

const cssElements = Array.from(
  document.querySelectorAll('link[rel="stylesheet"], style')
);

/**
 * modified page CSS text: env(fold-*) variables replaced (spanning: *) media query replaced
 * grouped in this object as:
 *
 * -- single-fold-vertical: CSS found in the media feature (spanning: single-fold-vertical)
 * -- single-fold-horizontal: CSS found in the media feature (spanning: single-fold-horizontal)
 * -- none: CSS found in the media feature (spanning: none)
 */
const spanning = {
  [SPANNING_MF_VAL_HOR]: "",
  [SPANNING_MF_VAL_VER]: "",
  [SPANNING_MF_VAL_NONE]: ""
};

export function adjustCSS(elementName, sheet) {
  const noSpanningCSS = replaceSpanningMediaBlocks(sheet, "");
  const spanningCSS = getSpanningCSSText(sheet);

  spanning[elementName] = {
    [SPANNING_MF_VAL_HOR]: "",
    [SPANNING_MF_VAL_VER]: "",
    [SPANNING_MF_VAL_NONE]: ""
  };

  Object.keys(spanningCSS).forEach(k => {
    if (typeof spanning[elementName][k] !== typeof(undefined)) {
      spanning[elementName][k] += `
        /* origin: ${elementName} */
        ${spanningCSS[k]}`;
    }
  });

  spanning[elementName]["non-spanning"] = noSpanningCSS;
  return noSpanningCSS;
}

export function observe(element) {
  insertSpanningStyles(element);
  window.addEventListener("resize", key => debounce(element => insertSpanningStyles(element), 150));
  window[POLYFILL_NAMESPACE].onupdate.push(() => insertSpanningStyles(element));
}

fetchCSSText(cssElements).then(sheetsTextContentArray => {
  const styleFragment = new DocumentFragment();
  sheetsTextContentArray.forEach((sheet, i) => {
    // all other css excluding spanning media blocks
    const noSpanningCSS = replaceSpanningMediaBlocks(sheet, "");
    const spanningCSS = getSpanningCSSText(sheet);

    const sheetOrigin = cssElements[i].href || "inline";

    Object.keys(spanningCSS).forEach(k => {
      if (typeof spanning[k] !== typeof(undefined)) {
        spanning[k] += `
          /* origin:  ${sheetOrigin} */
          ${spanningCSS[k]}`;
      }
    });

    styleFragment.appendChild(
      createElement("style", { "data-css-origin": sheetOrigin }, noSpanningCSS)
    );
  });

  // Spanning media blocks grouped by spanning type (single-fold-horizontal, vertical or none)
  // let spanningCSSText = getSpanningCSSText(cssText);
  // editedCSSText = Object.assign(editedCSSText, spanningCSSText);

  cssElements.forEach(el => el.parentElement.removeChild(el));

  document.head.appendChild(styleFragment);

  // insert spanning media query stylesheet
  insertSpanningStyles();

  window.addEventListener("resize", () => debounce(insertSpanningStyles, 150));
});

// looks at configs and appends the correct `spanning` styles
function insertSpanningStyles(element) {
  if (element) {
    Array.from(element.shadowRoot.querySelectorAll(`.${POLYFILL_NAMESPACE}`)).forEach(el =>
      el.parentNode.removeChild(el)
    );
  } else {
    Array.from(document.querySelectorAll(`.${POLYFILL_NAMESPACE}`)).forEach(el =>
      el.parentElement.removeChild(el)
    );
  }
  let configs = window[POLYFILL_NAMESPACE];

  let spanningCSSText = element ?
    spanning[element.nodeName.toLowerCase()][configs.spanning] :
    spanning[configs.spanning];

  let noSpanningCSSText = element ?
    spanning[element.nodeName.toLowerCase()]["non-spanning"] : null;

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
  if (element) {
    const shadowRoot = element.shadowRoot;
    if ("adoptedStyleSheets" in shadowRoot && shadowRoot.adoptedStyleSheets.length > 0) {
      shadowRoot.adoptedStyleSheets[0].replace(noSpanningCSSText + spanningCSSText);
    } else {
      shadowRoot.appendChild(polyfilledStyles);
    }
  } else {
    document.head.appendChild(polyfilledStyles);
  }
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
