/**
 * This is the documentation for the CSS Viewport Segments polyfill.
 *
 * The polyfill processes global stylesheets (link or inline)
 * automatically, but provides a few methods that allows for
 * the polyfill to work with shadow root or when CSS is
 * constructed programmatically.
 *
 * @projectname Viewport Segments CSS Polyfill
 * @version 1.0.0
 * @author Zouhir Chahoud
 * @author Kenneth Christiansen
 * @author Alexis Menard
 * @copyright 2021
 *
 */

import { FoldablesFeature } from "../node_modules/viewportsegments-polyfill/build/viewportsegments-polyfill.js";
export { FoldablesFeature };

import {
  getViewportSegmentCSSText,
  replaceViewportSegmentsMediaBlocks,
  replaceCSSEnvVariables
} from "./utils/css-text-processors.js";

const hasBrowserSupport =
  window.matchMedia('(vertical-viewport-segments)').matches ||
  window.matchMedia('(horizontal-viewport-segments)').matches || false;

console.info(`CSS Viewport Segments are supported? ${hasBrowserSupport}`);

let feature = new FoldablesFeature();

if (!hasBrowserSupport) {
  const cssElements = Array.from(
    document.querySelectorAll('link[rel="stylesheet"], style')
  );

  const fetchCSSText = elements => Promise.all(
    elements.map(element => element.href ? fetch(element.href).then(r => r.text()) : element.textContent)
  );

  fetchCSSText(cssElements).then(sheetsTextContentArray => {
    const styleFragment = new DocumentFragment();
    sheetsTextContentArray.forEach((sheet, i) => {
      const noViewportSegments = replaceViewportSegmentsMediaBlocks(sheet, "");
      const viewportSegmentCSS = getViewportSegmentCSSText(sheet);

      const sheetOrigin = cssElements[i].href || "inline";
      for (let [key, value] of Object.entries(viewportSegmentCSS)) {
        if (viewportSegments[key] == undefined)
          viewportSegments[key]= [];
        for (let [key2, value2] of Object.entries(value)) {
          viewportSegments[key][key2] = `/* origin: ${sheetOrigin} */${value2}`;
        };
      };

      const element = document.createElement("style");
      element.setAttribute("data-css-origin", sheetOrigin);
      element.textContent = noViewportSegments;
      styleFragment.appendChild(element);
    });

    cssElements.forEach(el => el.parentElement != null && el.parentElement.removeChild(el));

    document.head.appendChild(styleFragment);

    observe();
  });
}

/*
 * Modified page CSS text: env(viewport-segment-*) variables replaced (*-viewport-segments: *) media query features replaced
 * grouped in this object as: [vertical-viewport-segments-#][horizontal-viewport-segments-#]
 * In other words, accessing the CSS text for directives like @media (horizontal-viewport-segments: 1) and (vertical-viewport-segments: 1)
 * is viewportSegments[1][1] or @media (horizontal-viewport-segments: 3) would be viewportSegments[1][3].
 */
const viewportSegments = [[]];

/** Pre-processes the make the stylesheet valid.
 *
 * Strips out the CSS '*-viewport-segments' media query features and environment variables,
 * if not supported by the user agent, and internally stores rewritten CSS rules,
 * which will be applied according to the polyfill options.
 *
 * Call observe() to respond to changes affecting the polyfilled features.
 *
 * @param {CSSStyleSheet} sheet - The stylesheet to pre-process.
 * @param {string} [elementName] - The element name, if the stylesheet is associated
 * the shadow root of an element.
 */
export function adjustCSS(sheet, elementName) {
  if (hasBrowserSupport) {
    return sheet;
  }
  const noViewportSegments = replaceViewportSegmentsMediaBlocks(sheet, "");
  const viewportSegmentCSS = getViewportSegmentCSSText(sheet);

  if (elementName) {
    viewportSegments[elementName] = [[]];
  }

  const actualViewportSegments = elementName ? viewportSegments[elementName] : viewportSegments;
  const sheetOrigin = elementName ? '' : "/* origin: inline */";
  for (let [verticalSegmentId, verticalSegmentsArray] of Object.entries(viewportSegmentCSS)) {
    if (actualViewportSegments[verticalSegmentId] == undefined) {
      actualViewportSegments[verticalSegmentId]= [];
    }
    for (let [horizontalSegmentId, horizontalSegmentsArray] of Object.entries(verticalSegmentsArray)) {
      actualViewportSegments[verticalSegmentId][horizontalSegmentId] = `${sheetOrigin}${horizontalSegmentsArray}`;
    };
  };

  actualViewportSegments[0][0] = noViewportSegments;
  return noViewportSegments;
}

/** Observe and respond to changes affecting the polyfilled features.
 *
 * When called without arguments, it will apply rewritten style rules globally,
 * which will not affect elements with associated shadow root.
 *
 * When called with [element] it will apply the correct rewritten style rules
 * to the element with associated shadow root.
 *
 * @param {HTMLElement} [element] - An element with associated shadow root.
 */
export function observe(element) {
  if (hasBrowserSupport) {
    return;
  }
  insertViewportSegmentsStyles(element);
  feature.addEventListener("change", () => insertViewportSegmentsStyles(element));
}

function insertViewportSegmentsStyles(element) {
  let options = feature;
  let viewportSegmentsDefinitions;
  if (element) {
    viewportSegmentsDefinitions = viewportSegments[element.nodeName.toLowerCase()];
  } else {
    viewportSegmentsDefinitions = viewportSegments;
  }

  let viewportSegmentCSSText = null;
  if(viewportSegmentsDefinitions[options.verticalViewportSegments]) {
    viewportSegmentCSSText = viewportSegmentsDefinitions[options.verticalViewportSegments][options.horizontalViewportSegments];
  }

  let noViewportSegmentsText = viewportSegmentsDefinitions[0][0] ? viewportSegmentsDefinitions[0][0] : null;

  if (!viewportSegmentCSSText) {
    return;
  }

  const segments = window.visualViewport.segments;
  let areViewportSegmentsVertical = false;
  if (segments.length > 1)
    areViewportSegmentsVertical = !(segments[0].height < window.innerHeight);
  for (let [segmentId, segment] of Object.entries(segments)) {
    for (let [edge, edgeValue] of Object.entries(segment)) {
      if (areViewportSegmentsVertical) {
        viewportSegmentCSSText = replaceCSSEnvVariables(viewportSegmentCSSText, `viewport-segment-${edge} ${segmentId} 0`, `${edgeValue}px`);
      } else {
        viewportSegmentCSSText = replaceCSSEnvVariables(viewportSegmentCSSText, `viewport-segment-${edge} 0 ${segmentId}`, `${edgeValue}px`);
      }
    };
  }

  const ns = "__foldables_sheet__";
  const replace = (target, sheet) => {
    for (let el of target.querySelectorAll(`.${ns}`)) {
      el.remove();
    }
    const el = document.createElement("style");
    el.className = ns;
    el.textContent = sheet;
    target === document ? document.head.appendChild(el) : target.appendChild(el);
  }

  if (element) {
    const shadowRoot = element.shadowRoot;
    if ("adoptedStyleSheets" in shadowRoot && shadowRoot.adoptedStyleSheets.length > 0) {
      shadowRoot.adoptedStyleSheets[0].replace(noViewportSegmentsText + viewportSegmentCSSText);
    } else {
      replace(shadowRoot, viewportSegmentCSSText);
    }
  } else {
    replace(document, viewportSegmentCSSText)
  }
}