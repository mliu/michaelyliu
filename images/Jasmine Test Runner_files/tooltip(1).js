goog.provide('ck.widgets.Tooltip');

goog.require('goog.ui.Tooltip');
goog.require('goog.positioning');
goog.require('goog.fx.dom');

/**
 * @param {Element|string=} opt_el Element to display tooltip for, either
 *     element reference or string id.
 * @param {?string=} opt_str Text message to display in tooltip.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @param {ck.StatsClient=} opt_statsClient
 * @constructor
 * @extends {goog.ui.Tooltip}
 */
ck.widgets.Tooltip = function (opt_el, opt_str, opt_domHelper, opt_statsClient) {
  goog.base(this, opt_el, opt_str, opt_domHelper);
  this.statsClient_ = opt_statsClient || new ck.StatsClient();

  this.setPinnedCorner(goog.positioning.Corner.TOP_END);
  this.setHideDelayMs(ck.widgets.Tooltip.TOOLTIP_DELAY);

  this.setTransition(
    new goog.fx.dom.FadeIn(this.getElement(), 200),
    new goog.fx.dom.FadeOut(this.getElement(), 100)
  );
};
goog.inherits(ck.widgets.Tooltip, goog.ui.Tooltip);

/** @inheritDoc */
ck.widgets.Tooltip.prototype.setVisible = function (visible) {
  goog.base(this, 'setVisible', visible);

  if (visible) {
    goog.array.forEach(this.getElements().getValues(), function (el) {
      ck.Logger.getInstance().info('tooltip', 'displayed tooltip', el);
    });
    this.getStatsClient().increment(
      goog.string.buildString(
        'tooltip.displayed.',
        this.getTooltipType()
      )
    );
  }
};

/**
 * Determines the type of the tooltip for use in stat instrumentation.
 *
 * Tooltips will increment the stat 'tooltip.displayed.<TYPE>'.  General
 * tooltips (used for clarifying information) will show up as
 * 'tooltip.displayed.base'.
 *
 * @protected
 * @return {string}
 */
ck.widgets.Tooltip.prototype.getTooltipType = function () {
  return 'base';
};

/**
 * @protected
 * @return {ck.StatsClient}
 */
ck.widgets.Tooltip.prototype.getStatsClient = function () {
  return this.statsClient_;
};

/**
 * @protected
 * @type {string}
 */
ck.widgets.Tooltip.prototype.className = 'ckTooltip rs-tooltip-inner';

/**
 * @private
 * @type {ck.StatsClient}
 */
ck.widgets.Tooltip.prototype.statsClient_ = null;

/**
 * @param {string=} opt_elementId
 * @return {Element}
 */
ck.widgets.Tooltip.prototype.createInfoToggle = function (opt_elementId) {
  var toggle = goog.dom.createDom('span', 'tooltip_toggle');
  if (opt_elementId) {
    toggle.setAttribute('id', opt_elementId);
  }
  return toggle;
};

/**
 * @const
 * @type {number}
 */
ck.widgets.Tooltip.TOOLTIP_DELAY = 200;
