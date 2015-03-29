goog.provide('ck.events.EventListenerMixin');

goog.require('goog.Disposable');
goog.require('goog.events.EventTarget');

ck.events.EventListenerMixin = function (){};

/**
 * @param {goog.events.ListenableType} src
 * @param {string|Array.<string>} type
 * @param {Function|Object=} fn
 * @this {goog.Disposable} instance
 */
ck.events.EventListenerMixin.prototype.listenFirst = function(src, type, fn) {
  var handler;
  handler = new goog.events.EventHandler(this);
  this.registerDisposable(handler);

  handler.listenOnce(
    src,
    type,
    function () {
      handler.dispose();
      fn.apply(this, Array.prototype.slice.call(arguments));
    }
  );
};
