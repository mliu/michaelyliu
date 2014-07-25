goog.provide('ck.views.View');

goog.require('ck.analytics.Tracker');
goog.require('ck.views.ViewComponent');

/**
 * @constructor
 * @param {string=} opt_bodyClass
 * @extends {ck.views.ViewComponent}
 */
ck.views.View = function (opt_bodyClass) {
  goog.base(this);

  if (opt_bodyClass) {
    this.bodyClass_ = opt_bodyClass;
  }
};
goog.inherits(ck.views.View, ck.views.ViewComponent);

/**
 * Used for compatibility with old ck.View class.
 */
ck.views.View.prototype.show = function () {
  this.render(this.getMainElement());
};

/** @inheritDoc */
ck.views.View.prototype.enterDocument = function () {
  goog.base(this, 'enterDocument');

  if (this.bodyClass_) {
    goog.dom.classes.add(goog.dom.getDocument().body, this.bodyClass_);
  }
  this.track_();
};

/**
 * @private
 */
ck.views.View.prototype.track_ = function () {
  if (this.canBeTracked()) {
    ck.analytics.Tracker.getInstance().trackPageView(
      this.analyticsPage_,
      this.analyticsCategory_
    );
  }
};

/**
 * @protected
 * @return {boolean}
 */
ck.views.View.prototype.canBeTracked = function () {
  return (!goog.string.isEmptySafe(this.analyticsCategory_) && !goog.string.isEmptySafe(this.analyticsPage_));
};

/** @inheritDoc */
ck.views.View.prototype.exitDocument = function () {
  goog.base(this, 'exitDocument');

  if (this.bodyClass_) {
    goog.dom.classes.remove(goog.dom.getDocument().body, this.bodyClass_);
  }
  ko.cleanNode(this.getElement());
};

/**
 * 'Parent views', e.g. create view, details view, list view, all modify
 * the 'main' element in the page.
 * @protected
 */
ck.views.View.prototype.getMainElement = function () {
  return goog.dom.getElement('main');
};

/**
 * Used for compatibility with old ck.View class.
 */
ck.views.View.prototype.hide = function () {
  goog.dom.removeChildren(this.getMainElement());

  this.dispose();
};

/**
 * @param {string} analyticsPage
 */
ck.views.View.prototype.setAnalyticsPage = function (analyticsPage) {
  this.analyticsPage_ = analyticsPage;
};

/**
 * @param {string} analyticsCategory
 */
ck.views.View.prototype.setAnalyticsCategory = function (analyticsCategory) {
  this.analyticsCategory_ = analyticsCategory;
};

/**
 * @return {?string}
 */
ck.views.View.prototype.getAnalyticsPage = function () {
  return this.analyticsPage_;
};

/**
 * @return {string}
 */
ck.views.View.prototype.getAnalyticsCategory = function () {
  return this.analyticsCategory_;
};

/**
 * @private
 * @type {?string}
 */
ck.views.View.prototype.bodyClass_ = null;

/**
 * @private
 * @type {?string}
 */
ck.views.View.prototype.analyticsPage_ = null;

/**
 * @private
 * @type {string}
 */
ck.views.View.prototype.analyticsCategory_ = '';
