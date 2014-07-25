goog.provide('ck.utility.PageVisibility');

goog.require('goog.dom');
goog.require('goog.userAgent.product');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventHandler');
goog.require('goog.events.FocusHandler');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 * @param {Document=} opt_document
 */
ck.utility.PageVisibility = function (opt_document) {
  goog.base(this);

  this.document_ = opt_document || goog.dom.getDocument();
  this.handler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.handler_);

  this.determinePageVisibilitySupport_();

  if (this.supportsPageVisibility_()) {
    this.listenForPageVisibility_();
  } else {
    this.listenForDocumentFocus_();
  }
};
goog.inherits(ck.utility.PageVisibility, goog.events.EventTarget);

/**
 * @return {boolean}
 */
ck.utility.PageVisibility.prototype.supportsPageVisibility_ = function () {
  return this.hiddenProperty_ !== null;
};

/**
 *
 * Firefox: https://developer.mozilla.org/en/DOM/Using_the_Page_Visibility_API
 * Chrome: https://developers.google.com/chrome/whitepapers/pagevisibility
 * IE: http://ie.microsoft.com/testdrive/Performance/PageVisibility/Default.html
 *
 * @private
 */
ck.utility.PageVisibility.prototype.determinePageVisibilitySupport_ = function () {
  var propertyToEventMap, hidden;

  propertyToEventMap = {
    'hidden': 'visibilitychange',
    'mozHidden': 'mozvisibilitychange',
    'msHidden': 'msvisibilitychange',
    'webkitHidden': 'webkitvisibilitychange'
  };

  hidden = goog.object.findKey(propertyToEventMap, function (event, hidden) {
    return (typeof goog.object.get(this.document_, hidden) !== 'undefined');
  }, this);

  if (hidden) {
    this.hiddenProperty_ = hidden;
    this.visibilityEvent_ = /** @type {string} */ (
      goog.object.get(propertyToEventMap, hidden)
    );
  }
};

/**
 * @private
 */
ck.utility.PageVisibility.prototype.listenForPageVisibility_ = function () {
  this.handler_.listen(
    this.document_,
    this.visibilityEvent_,
    function () {
      if (this.isVisible()) {
        this.dispatchEvent(ck.utility.PageVisibility.EventType.VISIBLE);
      }
    }
  );
};

/**
 * Used to support some notion of page visibility for browsers that do not support the
 * page visibility API.
 *
 * With this method if you have two windows open and "visible" to the user, only the
 * browser that has active focus will update.
 * @private
 */
ck.utility.PageVisibility.prototype.listenForDocumentFocus_ = function () {
  this.focusHandler_ = new goog.events.FocusHandler(this.document_);
  this.registerDisposable(this.focusHandler_);

  // Assume yes (?)
  this.isInFocus_ = true;

  this.handler_.listen(
    this.focusHandler_,
    goog.events.FocusHandler.EventType.FOCUSIN,
    function (e) {
      this.isInFocus_ = true;
      this.dispatchEvent(ck.utility.PageVisibility.EventType.VISIBLE);
    }
  );
  this.handler_.listen(
    this.focusHandler_,
    goog.events.FocusHandler.EventType.FOCUSOUT,
    function (e) {
      this.isInFocus_ = false;
    }
  );
};

/**
 * @private
 * @type {Document}
 */
ck.utility.PageVisibility.prototype.document_ = null;

/**
 * @private
 * @type {boolean}
 */
ck.utility.PageVisibility.prototype.isInFocus_ = true;

/**
 * @private
 * @type {?string}
 */
ck.utility.PageVisibility.prototype.hiddenProperty_ = null;

/**
 * @private
 * @type {?string}
 */
ck.utility.PageVisibility.prototype.visibilityEvent_ = null;

/**
 * @return {boolean}
 */
ck.utility.PageVisibility.prototype.isVisible = function () {
  if (this.hiddenProperty_) {
    return !this.document_[this.hiddenProperty_];
  } else if(goog.userAgent.product.SAFARI) {
    /**
     * Safari doesn't fire focus event on window focus,
     * unless any element on the windows is focused
     */
    return true;
  } else {
    return this.isInFocus_;
  }
};

/**
 */
ck.utility.PageVisibility.prototype.getFocusHandler = function () {
  return this.focusHandler_;
};

ck.utility.PageVisibility.EventType = {
  VISIBLE: goog.events.getUniqueId('VISIBLE')
};
