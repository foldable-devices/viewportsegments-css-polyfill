
/**
 * This is the documentation for the CSS spanning polyfill. There are only
 * few methods available.
 *
 * @projectname Spanning CSS Polyfill
 * @version 1.0
 * @author Zouhir Chahoud
 * @author Kenneth Christiansen
 * @author Alexis Menard
 * @copyright 2020
 *
 */
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

let browser_supports_spanning_mq = false;

browser_supports_spanning_mq = window.matchMedia('(spanning: single-fold-horizontal)').matches ||
          window.matchMedia('(spanning: single-fold-vertical)').matches ||
          window.matchMedia('(spanning: none)').matches;
console.log("Spanning Media Queries are supported ? " + browser_supports_spanning_mq);

if (!browser_supports_spanning_mq) {
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

  fetchCSSText(cssElements).then(sheetsTextContentArray => {
    if (browser_supports_spanning_mq)
      return;
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

    cssElements.forEach(el => el.parentElement != null && el.parentElement.removeChild(el));

    document.head.appendChild(styleFragment);

    // insert spanning media query stylesheet
    insertSpanningStyles();

    window.addEventListener("resize", () => debounce(insertSpanningStyles, 150));
  });
}
/*
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

/** Replace the spanning media queries according to their configuration.
 * This will pre-process the sheet and make it valid.
 * @param {HTMLElement} element - The element.
 * @param {CSSStyleSheet} sheet - The stylesheet to update.
*/
export function adjustCSS(sheet, elementName) {
  if (browser_supports_spanning_mq)
    return sheet;
  const noSpanningCSS = replaceSpanningMediaBlocks(sheet, "");
  const spanningCSS = getSpanningCSSText(sheet);

  if (elementName) {
    spanning[elementName] = {
      [SPANNING_MF_VAL_HOR]: "",
      [SPANNING_MF_VAL_VER]: "",
      [SPANNING_MF_VAL_NONE]: ""
    };
  }

  const _spanning = elementName ? spanning[elementName] : spanning;

  Object.keys(spanningCSS).forEach(k => {
    if (typeof _spanning[k] !== typeof(undefined)) {
      _spanning[k] += `
        /* origin: ${elementName ? elementName : "inline"} */
        ${spanningCSS[k]}`;
    }
  });

  _spanning["non-spanning"] = noSpanningCSS;
  return noSpanningCSS;
}

/** Register the element to make sure it gets updated whenever the
 * configuration changes.
 * @param {HTMLElement} element - The element.
*/
export function observe(element) {
  if (browser_supports_spanning_mq)
    return;
  insertSpanningStyles(element);
  window.addEventListener("resize", () => debounce(insertSpanningStyles(element), 150));
  window[POLYFILL_NAMESPACE].onupdate.push(() => insertSpanningStyles(element));
}

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

/**
 *
 * @typedef Configuration
 * @type {object}
 * @property {number} foldSize - The size in CSS pixels of the fold.
 * @property {number} browserShellSize - The size in CSS pixels of the browser shell.
 * @property {string} spanning - The current spanning mode : single-fold-horizontal, single-fold-vertical or none.
 */
const VALID_CONFIG_PROPS = new Set([
  "foldSize",
  "browserShellSize",
  "spanning"
]);

/** Update the current configuration with the provided configuration.
 * @param {Configuration} configuration - The new configuration.
*/
export function update(newConfings) {
  if (browser_supports_spanning_mq)
    return;
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
