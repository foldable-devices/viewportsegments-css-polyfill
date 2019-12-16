/**
 * Returns a promise, once resolved it contains an array
 * of CSS text retrieved from <link> URLs and <style> DOM elements
 *
 * @param {array} elements JavaScript array (not NodeList)
 *
 * @return {Promise<string[]>}
 */
export function fetchCSSText(elements) {
  return Promise.all(
    elements.map(element => {
      let href = element.href;
      if (href) {
        return fetch(href).then(r => r.text());
      }
      return element.textContent;
    })
  );
}

/**
 * Returns a function that won't call `fn` if it was invoked at a faster interval than `wait`
 *
 * @param {Function} fn
 * @param {Number} wait - milliseconds
 */
export function debounnce(fn, wait) {
  let timeout;
  return function() {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, arguments), wait);
  };
}

/**
 * 
 * @param {String} name 
 * @param {Object} attributes 
 * @param {String} content 
 * 
 * @return {DOM Node}
 */
export function createElement(name, attributes, content) {
  let el = document.createElement(name);
  Object.keys(attributes).forEach(k => {
    el.setAttribute( k, attributes[k] )
  })
  if( typeof content !== 'undefined') {
    el.textContent = content
  }
  return el;
}