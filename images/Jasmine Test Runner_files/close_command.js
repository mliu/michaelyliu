goog.provide('ck.widgets.popovers.CloseCommand');

goog.require('ck.widgets.popovers.Command');

/**
 * This class should be used in conjunction with ck.templates.controls.closePanel,
 * when there is only one close button in the controls.
 *
 * @constructor
 * @param {Object=} opt_model
 * @extends {ck.widgets.popovers.Command}
 */
ck.widgets.popovers.CloseCommand = function (opt_model) {
  goog.base(this, opt_model);
};
goog.inherits(ck.widgets.popovers.CloseCommand, ck.widgets.popovers.Command);
