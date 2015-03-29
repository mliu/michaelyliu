goog.provide('ck.widgets.UnderlineTooltip');

goog.require('ck.widgets.Tooltip');

/**
 * @constructor
 * @param {string} popupContent
 * @extends {ck.widgets.Tooltip}
 */
ck.widgets.UnderlineTooltip = function (popupContent) {
  goog.base(this);

  this.setHtml(popupContent);
};
goog.inherits(ck.widgets.UnderlineTooltip, ck.widgets.Tooltip);

/**
 * @inheritDoc
 */
ck.widgets.UnderlineTooltip.prototype.attach = function (element) {
  goog.base(this, 'attach', element);
  goog.dom.classes.add(/** @type {Node} */ (element), 'underline-tooltip-toggle');
};

/** @inheritDoc */
ck.widgets.UnderlineTooltip.prototype.detach = function (opt_element) {
  if (opt_element) {
    goog.dom.classes.remove(opt_element, 'underline-tooltip-toggle');
  } else {
    goog.array.forEach(this.getElements().getValues(), function (element) {
      goog.dom.classes.remove(element, 'underline-tooltip-toggle');
    });
  }
  goog.base(this, 'detach', opt_element);
};
