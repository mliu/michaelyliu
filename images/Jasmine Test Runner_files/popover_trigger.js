goog.provide('ck.widgets.popovers.PopoverTrigger');

goog.require('goog.events.EventHandler');
goog.require('goog.Disposable');

/**
 * @constructor
 * @param {ck.widgets.popovers.PopoverController} popoverController
 * @extends {goog.Disposable}
 */
ck.widgets.popovers.PopoverTrigger = function (popoverController) {
  this.popoverController_ = popoverController;
  this.handler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.handler_);
};
goog.inherits(ck.widgets.popovers.PopoverTrigger, goog.Disposable);


/**
 * Configure a popover trigger.
 *
 * @param {{events, type, target, layout, model, data}} triggerInfo
 */
ck.widgets.popovers.PopoverTrigger.prototype.triggerOn = function (triggerInfo) {
  var showPopover;

  showPopover = goog.bind(function (e) {
    var data, args;

    e.preventDefault();

    if (typeof triggerInfo.data === 'function') {
      data = triggerInfo.data(e);
    } else {
      data = triggerInfo.data;
    }

    args = [
      triggerInfo.type,
      this.getElementOrObject_(triggerInfo.target),
      triggerInfo.layout,
      triggerInfo.model
    ];

    if (goog.isDef(data)) {
      args.push(data);
    }

    this.popoverController_.show.apply(this.popoverController_, args);
  }, this);

  if (goog.isArray(triggerInfo.events)) {
    goog.array.forEach(triggerInfo.events, function (eventInfo) {
      this.listenForEvent_(eventInfo, showPopover);
    }, this);
  } else {
    this.listenForEvent_(triggerInfo.events, showPopover);
  }
};

/**
 * @private
 * @param {Object} eventInfo
 * @param {Function} showPopover
 */
ck.widgets.popovers.PopoverTrigger.prototype.listenForEvent_ = function (eventInfo, showPopover) {
  this.handler_.listen(
    this.getElementOrObject_(eventInfo.source),
    eventInfo.event,
    showPopover
  );
};

ck.widgets.popovers.PopoverTrigger.prototype.removeAll = function () {
  this.handler_.removeAll();
};

/**
 * @private
 * @param {Object|string|Element} arg
 * @return {EventTarget|goog.events.EventTarget}
 */
ck.widgets.popovers.PopoverTrigger.prototype.getElementOrObject_ = function (arg) {
  if (goog.isString(arg)) {
    return /** @type {EventTarget} */(goog.dom.getElement(arg));
  }
  return /** @type {goog.events.EventTarget} */(arg);
};

/**
 * @return {ck.widgets.popovers.PopoverController}
 */
ck.widgets.popovers.PopoverTrigger.prototype.getPopoverController = function () {
  return this.popoverController_;
};

/**
 * @private
 * @type {goog.events.EventHandler}
 */
ck.widgets.popovers.PopoverTrigger.prototype.handler_ = null;

/**
 * @return {goog.events.EventHandler}
 */
ck.widgets.popovers.PopoverTrigger.prototype.getHandler = function () {
  return this.handler_;
};

/**
 * @private
 * @type {ck.widgets.popovers.PopoverController}
 */
ck.widgets.popovers.PopoverTrigger.prototype.popoverController_ = null;
