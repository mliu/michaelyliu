goog.provide('ck.View');

goog.require('goog.net.XhrManager');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('ck.IView');

/**
 * Deprecated -- do not use for new code.  Use ck.views.View instead.
 * @constructor
 * @implements {ck.IView}
 * @extends {goog.events.EventTarget}
 */
ck.View = function() {
  goog.base(this);
};
goog.inherits(ck.View, goog.events.EventTarget);

/**
 * @enum {string}
 */
ck.View.ClassName = {
  FLUID: 'fluidView',
  SIDEBAR_RIGHT: 'sidebar_right',
  STICKY: 'sticky'
};

/**
 * @private
 * @type {goog.events.EventHandler}
 */
ck.View.prototype.eventHandler_ = null;

/**
 * @private
 * @type {goog.net.XhrManager}
 */
ck.View.prototype.xhrManager_ = null;

/** inheritDoc */
ck.View.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
  goog.dispose(this.eventHandler_);
  goog.dispose(this.xhrManager_);
  delete this.eventHandler_;
  delete this.xhrManager_;
};

/**
 * @return {goog.events.EventHandler}
 */
ck.View.prototype.getEventHandler = function() {
  if (!goog.isDefAndNotNull(this.eventHandler_)) {
    this.eventHandler_ = new goog.events.EventHandler(this);
  }

  return this.eventHandler_;
};

/**
 * @return {goog.net.XhrManager}
 */
ck.View.prototype.getXhrManager = function() {

  if (!goog.isDefAndNotNull(this.xhrManager_)) {
    this.xhrManager_ = new goog.net.XhrManager();
  }

  return this.xhrManager_;
};

/** inheritDoc */
ck.View.prototype.show = goog.abstractMethod;

/** inheritDoc */
ck.View.prototype.hide = goog.abstractMethod;
