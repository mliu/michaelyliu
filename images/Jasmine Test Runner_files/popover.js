goog.provide('ck.widgets.Popover');

goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.style');
goog.require('goog.ui.Popup');
goog.require('goog.positioning.Corner');
goog.require('ck.templates.Popover');
goog.require('ck.AnchoredPositionCenter');
goog.require('goog.async.Delay');

/**
 * The standard Popover widget.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
ck.widgets.Popover = function () {
  goog.base(this);
  this.handler_ = new goog.events.EventHandler(this);
  this.popup_ = new goog.ui.Popup();
  this.popup_.setAutoHide(false);
  this.layout_ = ck.widgets.Popover.Layout.LEFT;
  this.setupDom_();
  this.registerDisposable(this.handler_);
  this.registerDisposable(this.popup_);
};
goog.inherits(ck.widgets.Popover, goog.events.EventTarget);

/**
 * Timeout for popover in modal state in milliseconds
 * @type {number}
 * @private
 */
ck.widgets.Popover.prototype.modalTimeout_ = 10000;

/**
 * @type {goog.async.Delay}
 * @private
 */
ck.widgets.Popover.prototype.modalTimeoutDelay_ = null;

/**
 * @type {goog.events.EventHandler}
 * @private
 */
ck.widgets.Popover.prototype.handler_ = null;

/**
 * Internal popup that is used for showing the popup.
 * @type {goog.ui.Popup}
 * @private
 */
ck.widgets.Popover.prototype.popup_ = null;

/**
 * Keeps track of the layout of the popover.
 * @type {ck.widgets.Popover.Layout|null}
 * @private
 */
ck.widgets.Popover.prototype.layout_ = null;

/**
 * The managed DOM element.
 * @type {Element}
 * @private
 */
ck.widgets.Popover.prototype.element_ = null;

/**
 * The content DOM element that contains all user defined content.
 * @type {Element}
 * @private
 */
ck.widgets.Popover.prototype.contentElement_ = null;

/**
 * All the user defined content.
 * @type {Element}
 * @private
 */
ck.widgets.Popover.prototype.innerContent_ = null;

/**
 * The DOM element that shows the loading indicator.
 * @type {Element}
 * @private
 */
ck.widgets.Popover.prototype.loadingElement_ = null;

/**
 * @type {boolean}
 * @private
 */
ck.widgets.Popover.prototype.autoHide_ = true;

/**
 * Available layouts.
 * @enum {string}
 */
ck.widgets.Popover.Layout = {
  LEFT: 'left',
  RIGHT: 'right',
  BOTTOM_LEFT: 'bottom-left',
  TOP_RIGHT: 'top-right',
  BOTTOM_RIGHT: 'bottom-right'
};

/**
 * @type {number}
 * @const
 */
ck.widgets.Popover.XOFFSET = 47;

/**
 * @type {number}
 * @const
 */
ck.widgets.Popover.YOFFSET = 47;

/**
 * Dictionary that Maps the relation of the Popover.Layout type to appropriate
 * positions for the internal popup.
 * @private
 */
ck.widgets.Popover.layoutMap_ = {};
ck.widgets.Popover.layoutMap_[ck.widgets.Popover.Layout.BOTTOM_RIGHT] = {
  targetOrientation: ck.AnchoredPositionCenter.Orientation.BOTTOM,
  popupCorner: goog.positioning.Corner.TOP_RIGHT
};
ck.widgets.Popover.layoutMap_[ck.widgets.Popover.Layout.TOP_RIGHT] = {
  targetOrientation: ck.AnchoredPositionCenter.Orientation.TOP,
  popupCorner: goog.positioning.Corner.BOTTOM_RIGHT
};
ck.widgets.Popover.layoutMap_[ck.widgets.Popover.Layout.BOTTOM_LEFT] = {
  targetOrientation: ck.AnchoredPositionCenter.Orientation.BOTTOM,
  popupCorner: goog.positioning.Corner.TOP_LEFT
};
ck.widgets.Popover.layoutMap_[ck.widgets.Popover.Layout.RIGHT] = {
  targetOrientation: ck.AnchoredPositionCenter.Orientation.RIGHT,
  popupCorner: goog.positioning.Corner.TOP_LEFT
};
ck.widgets.Popover.layoutMap_[ck.widgets.Popover.Layout.LEFT] = {
  targetOrientation: ck.AnchoredPositionCenter.Orientation.LEFT,
  popupCorner: goog.positioning.Corner.TOP_RIGHT
};

/**
 * CSS class names used by this class.
 * @enum {string}
 */
ck.widgets.Popover.ClassNames = {
  BASE: 'ck-widgets-popover',
  FRAME: 'ck-widgets-popover-frame',
  OUTER: 'ck-widgets-popover-outer',
  POINTER: 'ck-widgets-popover-pointer',
  LOADING: 'ck-widgets-popover-loading',
  LOADING_VISIBLE: 'visible',
  CONTENT: 'ck-widgets-popover-content',
  BACKGROUND: 'ck-widgets-popover-background'
};

/**
 * CSS class names that specified for layout styling.
 * @enum {string}
 * @private
 */
ck.widgets.Popover.LayoutClassNames_ = {
  LEFT: 'ck-widgets-popover-left',
  RIGHT: 'ck-widgets-popover-right',
  BOTTOM_LEFT: 'ck-widgets-popover-bottom-left',
  TOP_RIGHT: 'ck-widgets-popover-top-right',
  BOTTOM_RIGHT: 'ck-widgets-popover-bottom-right'
};

/**
 * Events dispatched by this class.
 * @enum {string}
 */
ck.widgets.Popover.EventType = {
  HIDE: goog.events.getUniqueId('hide'),
  SHOW: goog.events.getUniqueId('show'),
  SHOW_LOADING: goog.events.getUniqueId('show_loading'),
  HIDE_LOADING: goog.events.getUniqueId('hide_loading'),
  SCROLL: goog.events.getUniqueId('scroll'),
  MODAL_TIMEOUT: goog.events.getUniqueId('modal_timeout')
};

/**
 * Sets the target element to which the popover points.
 * @param {!Element} target
 */
ck.widgets.Popover.prototype.setTarget = function (target) {
  this.target_ = target;
};

/**
 * Gets the target element to which the popover points.
 * @return {!Element}
 */
ck.widgets.Popover.prototype.getTarget = function () {
  return this.target_;
};

/**
 * Gets the inernal customizable content of the popover.
 * @return {Element}
 */
ck.widgets.Popover.prototype.getContent = function () {
  return this.innerContent_;
};

/**
 * Sets the internal customizable content of the popover.
 * @param {!Element|string} content A string of HTML or a detached DOM Element.
 */
ck.widgets.Popover.prototype.setContent = function (content) {
  goog.dom.removeChildren(this.contentElement_);
  if (goog.dom.isElement(content)) {
    this.innerContent_ = /** @type {!Element}*/ (content);
  } else if (goog.isString(content)) {
    this.innerContent_ = /** @type {!Element}*/ (goog.dom.htmlToDocumentFragment(content));
  }
  goog.dom.append(
    /** @type {!Node}*/ (this.contentElement_),
    this.innerContent_
  );
};

/**
 * Sets the layout position of the popover.
 * @param {ck.widgets.Popover.Layout} layout
 */
ck.widgets.Popover.prototype.setLayout = function (layout) {
  var layoutMapping;
  if (!goog.isDefAndNotNull(this.target_)) {
    throw 'Popover target must be set before setting layout.';
  }
  this.layout_ = layout;
  layoutMapping = ck.widgets.Popover.layoutMap_[this.layout_];
  this.popup_.setPosition(
    new ck.AnchoredPositionCenter(this.target_,
      layoutMapping.targetOrientation, ck.widgets.Popover.XOFFSET,
      ck.widgets.Popover.YOFFSET));
  this.popup_.setPinnedCorner(layoutMapping.popupCorner);
  goog.dom.classes.addRemove(this.element_,
    goog.object.getValues(ck.widgets.Popover.LayoutClassNames_),
    goog.string.buildString(ck.widgets.Popover.ClassNames.BASE, '-',
      this.layout_));
};

/**
 * Repositions the popover
 */
ck.widgets.Popover.prototype.reposition = function () {
  this.popup_.reposition();
};

/**
 * Shows the popover with the current configuration.
 * @param {boolean} visible
 */
ck.widgets.Popover.prototype.setVisible = function (visible) {
  if (visible) {
    if (!goog.isDefAndNotNull(this.target_)) {
      throw 'Popover target must be set before showing.';
    }
    this.showPopup_();
    this.scrollIntoView();
    this.dispatchEvent(ck.widgets.Popover.EventType.SHOW);
  } else {
    this.setLoadingVisible(false);
    this.hidePopup_();
    delete this.autoHide_;
    this.dispatchEvent(ck.widgets.Popover.EventType.HIDE);
  }
};

/**
 * Shows the loading indicator which obscures all inner content.
 * @param {boolean} visible
 */
ck.widgets.Popover.prototype.setLoadingVisible = function (visible) {
  if (visible) {
    goog.dom.classes.add(this.loadingElement_,
      ck.widgets.Popover.ClassNames.LOADING_VISIBLE);
    this.dispatchEvent(ck.widgets.Popover.EventType.SHOW_LOADING);
  } else {
    goog.dom.classes.remove(this.loadingElement_,
      ck.widgets.Popover.ClassNames.LOADING_VISIBLE);
    this.dispatchEvent(ck.widgets.Popover.EventType.HIDE_LOADING);
  }
};

/**
 * Returns boolean indicating visibility.
 * @return {boolean} visible
 */
ck.widgets.Popover.prototype.isVisible = function() {
  return this.popup_.isVisible();
};

/**
 * Sets whether the Popover dismisses itself when the user clicks outside of it.
 * @param {boolean} autoHide
 * @param {number=} opt_timeout timeout for popover modal state
 */
ck.widgets.Popover.prototype.setAutoHide = function(autoHide, opt_timeout) {
  this.autoHide_ = autoHide;
  if (goog.isDef(opt_timeout)) {
    this.modalTimeout_ = opt_timeout;
  }
  this.updateModalTimeout_();
};

/**
 * Scrolls the popover into view if it's outside of the viewport.
 */
ck.widgets.Popover.prototype.scrollIntoView = function () {
  var rect, win;
  win = goog.dom.getWindow();
  rect = goog.style.getBounds(this.element_);
  if (win.innerHeight + win.pageYOffset < rect.top + rect.height) {
    this.element_.scrollIntoView(false);
    this.dispatchEvent(ck.widgets.Popover.EventType.SCROLL);
  }
};

/**
 * Gets the underlying base element.
 * @return {Element}
 */
ck.widgets.Popover.prototype.getElement = function () {
  return this.element_;
};

/**
 * Adds necessary element(s) to the DOM, sets internal references to elements,
 * attaches handlers.
 * @private
 */
ck.widgets.Popover.prototype.setupDom_ = function () {
  this.element_ = this.generateElement_();
  this.contentElement_ = goog.dom.getElementByClass(
    ck.widgets.Popover.ClassNames.CONTENT,
    this.element_);
  this.loadingElement_ = goog.dom.getElementByClass(
    ck.widgets.Popover.ClassNames.LOADING, this.element_);
  this.backgroundElement_ = goog.dom.getElementByClass(
    ck.widgets.Popover.ClassNames.BACKGROUND,
    this.element_);
  this.handler_.listen(
    this.backgroundElement_,
    goog.events.EventType.CLICK,
    this.handleBackgroundClick_,
    false
  );
  this.handler_.listen(
    goog.dom.getWindow(goog.dom.getDocument()),
    goog.events.EventType.KEYDOWN,
    function(e) {
      if (e.keyCode === goog.events.KeyCodes.ESC) {
        this.onEscPress_();
      }
    },
    false);
  // IE Hack to prevent scrollable elements from resetting when page scrolls.
  if (goog.userAgent.IE) {
    this.handler_.listen(
      this.popup_,
      goog.ui.PopupBase.EventType.BEFORE_SHOW,
      goog.bind(this.setBodyOverflow_, this, 'hidden'),
      false
    );
    this.handler_.listen(
      this.popup_,
      goog.ui.PopupBase.EventType.HIDE,
      goog.bind(this.setBodyOverflow_, this, 'auto'),
      false
    );
  }
  //
  goog.dom.append(/** @type {!Node} */(goog.dom.getDocument().body),
    this.element_);
  goog.style.setElementShown(this.element_, false);
  this.popup_.setElement(this.element_);
};

/** @inheritDoc */
ck.widgets.Popover.prototype.disposeInternal = function () {
  goog.base(this, 'disposeInternal');
  goog.events.removeAll(this.backgroundElement_);
  goog.dom.removeNode(/** @type {Node} */ (this.element_));
  delete this.backgroundElement_;
  delete this.handler_;
  delete this.popup_;
  delete this.layout_;
  delete this.element_;
  delete this.contentElement_;
  delete this.loadingElement_;
};

/**
 * Sets the body overflow value to 'hidden' or 'auto' to accomodate IE
 * scrolling issues.
 * @param {string} overflowValue
 * @private
 */
ck.widgets.Popover.prototype.setBodyOverflow_ = function (overflowValue) {
  if (overflowValue !== 'hidden' && overflowValue !== 'auto') {
    return;
  }
  goog.style.setStyle(goog.dom.getDocument().body, 'overflow', overflowValue);
};

/**
 * Generates a new detached popover DOM Element sans the inner content.
 * @private
 */
ck.widgets.Popover.prototype.generateElement_ = function () {
  return goog.dom.htmlToDocumentFragment(
    ck.templates.Popover.wrapper({
      classes: {
        base: ck.widgets.Popover.ClassNames.BASE,
        frame: ck.widgets.Popover.ClassNames.FRAME,
        outer: ck.widgets.Popover.ClassNames.OUTER,
        loading: ck.widgets.Popover.ClassNames.LOADING,
        pointer: ck.widgets.Popover.ClassNames.POINTER,
        content: ck.widgets.Popover.ClassNames.CONTENT,
        background: ck.widgets.Popover.ClassNames.BACKGROUND
      }
    })
  );
};

/**
 * @private
 */
ck.widgets.Popover.prototype.onEscPress_ = function() {
  if (this.autoHide_ && this.isInForeground_()) {
    this.setVisible(false);
  }
};

/**
 * @param {goog.events.Event} e
 * @private
 */
ck.widgets.Popover.prototype.handleBackgroundClick_ = function (e) {
  if (this.autoHide_) {
    this.setVisible(false);
  }
};

/**
 * @return {boolean}
 */
ck.widgets.Popover.prototype.isModal = function () {
  return !this.autoHide_;
};

/**
 * @param {boolean} isModal
 */
ck.widgets.Popover.prototype.setModal = function (isModal) {
  this.autoHide_ = !isModal;
};

/**
 * Sets modal timeout
 * @private
 */
ck.widgets.Popover.prototype.updateModalTimeout_ = function () {
  if (!goog.isNull(this.modalTimeoutDelay_) &&
      !this.modalTimeoutDelay_.isDisposed()) {
    this.modalTimeoutDelay_.dispose();
  }
  if (this.isVisible() && this.isModal()) {
    this.modalTimeoutDelay_ = new goog.async.Delay(
      function () {
        this.setAutoHide(true);
        this.dispatchEvent(ck.widgets.Popover.EventType.MODAL_TIMEOUT);
      }, this.modalTimeout_, this);
    this.modalTimeoutDelay_.start();
    this.registerDisposable(this.modalTimeoutDelay_);
  }
};

/**
 * Shows the internally managed goog.ui.Popup.
 * @private
 */
ck.widgets.Popover.prototype.showPopup_ = function () {
  this.popup_.setVisible(true);
  if (!this.isModal()) {
    this.updateModalTimeout_();
  }
  this.repositionOnDelay_();
};

/**
 * Repositions popover on a delay
 * @private
 */
 ck.widgets.Popover.prototype.repositionOnDelay_ = function () {
  var repositionDelay = new goog.async.Delay(function () {
    if(this.isVisible()) {
      this.reposition();
    }
  }, 0, this);

  this.registerDisposable(repositionDelay);
  repositionDelay.start();
 };

/**
 * Hides the internally managed goog.ui.Popup.
 * @private
 */
ck.widgets.Popover.prototype.hidePopup_ = function () {
  this.popup_.setVisible(false);
  this.updateModalTimeout_();
};

/**
 * @private
 * @return {boolean}
 */
ck.widgets.Popover.prototype.isInForeground_ = function () {
  var popovers;

  popovers = goog.dom.getElementsByClass(ck.widgets.Popover.ClassNames.BASE);
  popovers = goog.array.filter(popovers, function (e) {
    return goog.style.isElementShown(e);
  });
  return goog.array.peek(popovers) === this.getElement();
};
