goog.provide('ck.widgets.forms.filters.Filter');

goog.require('goog.object');
goog.require('goog.array');

/**
 * @constructor
 * @param {Array.<function (*)>=} opt_customFilters
 */
ck.widgets.forms.filters.Filter = function (opt_customFilters) {
  this.filters_ = opt_customFilters || [];
};

/**
 * @private
 * @type {Array.<function (*)>}
 */
ck.widgets.forms.filters.Filter.prototype.filters_ = [];

/**
 * @param {Object.<string,*>} unfilteredData
 * @return {Object}
 */
ck.widgets.forms.filters.Filter.prototype.filter = function (unfilteredData) {
  var data;

  data = goog.object.clone(unfilteredData);

  goog.array.forEach(this.filters_, function (filter) { filter(data); });

  return data;
};
