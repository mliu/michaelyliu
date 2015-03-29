goog.provide('ck.utility.PageUnloading');

goog.require('goog.events.EventType');
goog.require('goog.dom');

/**
 * @constructor
 */
ck.utility.PageUnloading = function (opt_window) {
  var window;

  window = opt_window || goog.dom.getWindow();
  window['onbeforeunload'] = goog.bind(function () {
    this.isUnloading_ = true;
  }, this);
};
goog.addSingletonGetter(ck.utility.PageUnloading);

/**
 * @return {boolean}
 */
ck.utility.PageUnloading.prototype.isUnloading = function () {
  return this.isUnloading_;
};

/**
 * @private
 * @type {boolean}
 */
ck.utility.PageUnloading.prototype.isUnloading_ = false;
