goog.provide('ck.widgets.popovers.Displayer');

goog.require('ck.View');
goog.require('ck.widgets.Popover');
goog.require('ck.widgets.popovers.PopoverCloseTracker');

/**
 * @constructor
 * @extends {ck.View}
 * @param {ck.widgets.Popover=} opt_popoverWidget
 * @param {ck.widgets.popovers.PopoverCloseTracker=} opt_popoverCloseTracker
 */
ck.widgets.popovers.Displayer = function (opt_popoverWidget, opt_popoverCloseTracker) {
  goog.base(this);

  this.popoverWidget_ = opt_popoverWidget || new ck.widgets.Popover();
  if (!opt_popoverWidget) {
    this.registerDisposable(this.popoverWidget_);
  }

  this.popoverCloseTracker_ = opt_popoverCloseTracker || ck.widgets.popovers.PopoverCloseTracker.getInstance();
};
goog.inherits(ck.widgets.popovers.Displayer, ck.View);

/**
 * @return {ck.widgets.popovers.Content}
 */
ck.widgets.popovers.Displayer.prototype.getContent = function () {
  return this.content_;
};

/**
 * @private
 * @type {ck.widgets.Popover}
 */
ck.widgets.popovers.Displayer.prototype.popoverWidget_ = null;

/**
 * @return {ck.widgets.Popover}
 */
ck.widgets.popovers.Displayer.prototype.getPopover = function () {
  return this.popoverWidget_;
};

/**
 * @param {ck.widgets.Popover.Layout} layout
 */
ck.widgets.popovers.Displayer.prototype.setLayout = function (layout) {
  this.layout_ = layout;
};

/**
 * @param {Element} target
 */
ck.widgets.popovers.Displayer.prototype.setTarget = function (target) {
  this.target_ = target;
};

/**
 * @param {ck.widgets.popovers.Content} content
 */
ck.widgets.popovers.Displayer.prototype.setContent = function (content) {
  this.content_ = content;
  this.registerDisposable(this.content_);
};

/**
 */
ck.widgets.popovers.Displayer.prototype.show = function () {
  var element, form;

  element = goog.dom.createDom(goog.dom.TagName.DIV);

  this.configurePopover(element);
  if (!this.content_.getElement()) {
    this.content_.createDom();
  }

  element.insertBefore(this.content_.getElement(), null);
  this.popoverWidget_.setVisible(true);
  this.content_.setPopover(this.popoverWidget_);

  this.content_.enterDocument();

  if (this.content_.isReady()) {
    this.configureContent();
  } else {
    this.popoverWidget_.setLoadingVisible(true);
    goog.dom.classes.add(this.content_.getElement(), 'loading-popover');

    this.getEventHandler().listen(
      this.content_,
      ck.widgets.popovers.Content.EventType.READY,
      function () {
        goog.dom.classes.remove(this.content_.getElement(), 'loading-popover');
        this.popoverWidget_.setLoadingVisible(false);
        this.configureContent();
        this.popoverWidget_.reposition();
      }
    );
  }

  this.popoverWidget_.scrollIntoView();

  this.getEventHandler().listenOnce(
    this.popoverWidget_,
    ck.widgets.Popover.EventType.HIDE,
    function () {
      this.popoverCloseTracker_.close(this.content_.getConversionEventId());
      this.hide();
    }
  );

  this.popoverCloseTracker_.open(this.content_.getConversionEventId());
};

/**
 * @protected
 * @param {!Element} element
 */
ck.widgets.popovers.Displayer.prototype.configurePopover = function (element) {
  this.popoverWidget_.setTarget(/** @type {!Element} */ (this.target_));
  this.popoverWidget_.setLayout(
    /** @type {!ck.widgets.Popover.Layout.<string>} */ (this.layout_));
  this.popoverWidget_.setContent(element);
};

/**
 * @protected
 */
ck.widgets.popovers.Displayer.prototype.configureContent = function () {
  var form, element;

  element = this.content_.getElement();
  form = this.content_.getBoundForm();

  // Certain popovers (Add Record, Create Check) override the default
  // bound form decoration.

  if (goog.isDefAndNotNull(form) && form.canDecorate(element) && !form.isInDocument()) {
    form.decorate(element);
  }
};

ck.widgets.popovers.Displayer.prototype.hide = function () {
  this.getEventHandler().removeAll();
  this.popoverWidget_.setVisible(false);
  this.dispose();
};

/**
 * @private
 * @type {Element}
 */
ck.widgets.popovers.Displayer.prototype.target_ = null;

/**
 * @private
 * @type {ck.widgets.popovers.Content}
 */
ck.widgets.popovers.Displayer.prototype.content_ = null;

/**
 * @private
 * @type {ck.widgets.popovers.PopoverCloseTracker}
 */
ck.widgets.popovers.Displayer.prototype.popoverCloseTracker_ = null;

/**
 * @protected
 * @type {?ck.widgets.Popover.Layout}
 */
ck.widgets.popovers.Displayer.prototype.layout_ = null;
