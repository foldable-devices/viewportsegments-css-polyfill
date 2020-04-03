CSS Foldable Display polyfill
===

This is a polyfill for the [proposed](https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/master/Foldables/explainer.md) CSS Foldable Display extensions.

Web developers targeting foldable devices want to be able to effectively lay out the content in a window that spans multiple displays. CSS Foldable Display
extensions provides a mean to do that using stylesheets.

### The 'spanning' CSS media feature

The `spanning` CSS media feature can be used to test whether the browser window is spanning across multiple diplays.

![Figure showing 2 foldable devices with different hinge postures](https://raw.githubusercontent.com/foldable-devices/spanning-css-polyfill/master/images/spanning-media-query.svg?sanitize=true)

#### Syntax

The `spanning` media feature value can be one of the following keywords:

- **single-fold-vertical**

This value matches when the layout viewport is spanning a single fold (two screens) and the fold posture is vertical.

- **single-fold-horizontal**

This value matches when the layout viewport is spanning a single fold (two screens) and the fold posture is horizontal.

- **none**

This value describes the state of when the browser window is not in spanning mode.

#### Example

A map application that presents a map on one window segment and search results on another

![Foldable with the left segment of the window containing a map and the right segment containing list of search results](https://raw.githubusercontent.com/foldable-devices/spanning-css-polyfill/master/images/map-app.svg?sanitize=true)

```css
@media (spanning: single-fold-vertical) {
  body {
    flex-direction: row;
  }

  .map {
    flex: 1 1 env(fold-left)
  }

  .locations-list {
    flex: 1;
  }
}
```

### Device fold CSS environment variables

There are 4 pre-defined CSS environment variables, which can be used to calculate each screen segment size at both landscape and portrait orientations.

- **fold-top**
- **fold-left**
- **fold-width**
- **fold-height**

![predefined environment variables](https://raw.githubusercontent.com/foldable-devices/spanning-css-polyfill/master/images/css-env-variables.svg?sanitize=true)

While the spanning media query guarantees there is only a single hinge and two screen segments, developers must not take a dependency that each screen segment is 50% of the viewport height or width, as that may not always be the case.

The values of these variables are CSS pixels, and are relative to the layout viewport (i.e. are in the [client coordinates, as defined by CSSOM Views](https://drafts.csswg.org/cssom-view/#dom-mouseevent-clientx)).

When evaluated while not in one of the spanning states, these values will be treated as if they don't exist, and use the fallback value as passed to the `env()` function.


How to use the polyfill
===

This polyfill is packaged as a JavaScript module. It is available on NPM over [here](https://www.npmjs.com/package/spanning-css-polyfill). 

To install the polyfill just run:

```bash
npm install --save spanning-css-polyfill
```

Then you can include it in your project:

```html
<script type="module" src="/path/to/modules/spanning-css-polyfill.js"></script>
```

or in your JavaScript source file

```js
import "/path/to/modules/spanning-css-polyfill/spanning-css-polyfill.js";
```

and start using the new CSS features.

- That's it. See the `demo/` directory for examples.

In order to change the display configuration, you can use the polyfill together with an emulator or you can change the settings manually. The settings are stored across sessions.

#### Manually changing the display configuration

You can update values such as `spanning`, `foldSize` and `browserShellSize` by importing the `FoldablesFeature` object. You can also subscribe to the 'change' event
to be notified whenever the `'spanning'` media query feature or the environment variables change. That can happen due to window resizes or because the configuration values were changed programmatically.

```js
  import { FoldablesFeature } from '/path/to/modules/spanning-css-polyfill/spanning-css-polyfill.js';

  const foldablesFeat = new FoldablesFeature;

  // Add an event listener.
  foldablesFeat.onchange = () => console.log("change");

    // Add as many event listeners as you want.
  foldablesFeat.addEventListener('change', () => console.log("change"));

  // Change a single value; results in one update (one 'change' event firing).
  foldablesFeat.foldSize = 20;

  // Change multiple values by assignment; results in one update.
  Object.assign(foldablesFeat, { foldSize: 50, spanning: "none"});

  // Change multiple values in one scope; results in one update
  (function() { foldablesFeat.foldSize = 100; foldablesFeat = "single-fold-horizontal" })();
```

#### Special note on web components and [lit-element](https://lit-element.polymer-project.org/)
In order for the polyfill to work with web components and [lit-element](https://lit-element.polymer-project.org/), a bit of extra work is needed. There are a couple of examples in the `demo/` directory.

The polyfill provides two methods, one to register and one to observe and adjust to updates.

```js
import { adjustCSS, observe } from "spanning-css-polyfill/spanning-css-polyfill.js";
```

In the constructor of your web component make sure to pre-process and make the CSS browser valid by calling the `adjustCSS` method:

```js
let sheet = shadowRoot.querySelector("style");
sheet.innerText = adjustCSS(sheet.innerText, "test-element");
```

Now to make sure the style is updated whenever the configuration changes you need to add in your component class:
```js
  connectedCallback() {
    observe(this);
  }
```
Please note that if connectedCallback() exists on the parent, don't forget to call `super.connectedCallback()`.

For lit-element, a bit of extra work is needed if you're styling your element with the `css` template literal (which is the recommended way).

```js
import { html, css as litCSS, LitElement } from 'https://cdn.pika.dev/lit-element@^2.2.1';
import { adjustCSS, observe } from "spanning-css-polyfill/spanning-css-polyfill.js";

const css = (strings, ...values) => {
  const string = adjustCSS(strings[0], "test-element");
  return litCSS([string], ...values);
};
```

The `observe` method is also needed (see above).

#### Special note for handling of stylesheets manually constructed from CSS rules
If you build your CSS style sheets in JavaScript, the polyfill can't automatically convert your style sheets. However you can do something like this:


```js
import { adjustCSS, observe } from "spanning-css-polyfill/spanning-css-polyfill.js";

const css = sheets => {
  const rule = adjustCSS(sheets[0]);
  return rule ? rule : "* {}"; // Avoid empty rules.
}

sheet.insertRule(css`@media (spanning: single-fold-vertical) {
  .div {
    flex: 0 0 env(fold-left);
    margin-right: env(fold-width);
    background-color: steelblue;
  }
}`, sheet.cssRules.length);
```

Documentation
===
Located [here](https://foldable-devices.github.io/spanning-css-polyfill/global.html).

Demos
===
Head over [here](https://github.com/foldable-devices/demos).

Test suite
===

There are unfortunately no [web-platform-tests](https://github.com/w3c/web-platform-tests/) available yet.

Known issues
===

Check GitHub [here](https://github.com/foldable-devices/spanning-css-polyfill/issues).

Learn more
===

- [Explainer](https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/master/Foldables/explainer.md) - a document explaining how this feature was designed and how it fits together with other APIs.