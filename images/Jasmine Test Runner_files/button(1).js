goog.provide('ck.buttons.Button');

goog.require('goog.ui.Button');

/**
 * @constructor
 * @extends {goog.ui.Button}
 * @param {goog.ui.ControlContent=} opt_content
 */
ck.buttons.Button = function (opt_content) {
  goog.base(this, opt_content || null);
};
goog.inherits(ck.buttons.Button, goog.ui.Button);

ck.buttons.Button.prototype.hide = function () {
  this.setVisible(false);
};

ck.buttons.Button.prototype.show = function () {
  this.setVisible(true);
};

/** @inheritDoc */
ck.buttons.Button.prototype.createDom = function () {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.getElement(), 'rs-btn');
};

/** @inheritDoc */
ck.buttons.Button.prototype.canDecorate = function () {
  return true;
};

/**
 * @protected
 * @return {boolean}
 */
ck.buttons.Button.prototype.isEnabled_ = function () {
  return !goog.dom.classes.has(this.getElement(), 'disabled');
};

ck.buttons.Button.prototype.disable = function () {
  goog.dom.classes.add(this.getElement(), 'disabled');
};

ck.buttons.Button.prototype.enable = function () {
  goog.dom.classes.remove(this.getElement(), 'disabled');
};
