goog.provide('ck.query');
goog.provide('ck.queryAll');

goog.require('goog.dom');

/**
 * @param {string} selector
 * @param {Node=} opt_context
 * returns {Node}
 */
ck.query = function (selector, opt_context) {
  opt_context = opt_context || goog.dom.getDocument();
  return opt_context.querySelector(selector);
};

/**
 * @param {string} selector
 * @param {Node=} opt_context
 * returns {Array<Node>}
 */
ck.queryAll = function (selector, opt_context) {
  opt_context = opt_context || goog.dom.getDocument();
  return opt_context.querySelectorAll(selector);
};
