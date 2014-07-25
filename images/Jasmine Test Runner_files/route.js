goog.provide('ck.routing.Route');

goog.require('goog.string');
goog.require('goog.Uri.QueryData');
goog.require('ck.routing');

/**
 * @constructor
 * @param {string} fragment
 * @param {string|Array.<string>=} opt_capability
 */
ck.routing.Route = function (fragment, opt_capability) {
  this.fragment_ = fragment;
  this.requiredCapability_ = opt_capability || '';
  this.query_string_regex_ = new RegExp(ck.routing.QUERY_STRING_REGEX);
};

/**
 * @private
 * @type {?string}
 */
ck.routing.Route.prototype.fragment_ = null;

/**
 * @private
 * @type {string|Array.<string>}
 */
ck.routing.Route.prototype.requiredCapability_ = '';

/**
 * @private
 * @type {function(...[(string|Object)])}
 */
ck.routing.Route.prototype.action_ = goog.nullFunction;

/**
 * @private
 * @type {RegExp}
 */
ck.routing.Route.prototype.query_string_regex_ = null;

/**
 * @return {?string}
 */
ck.routing.Route.prototype.getFragment = function() {
  return this.fragment_;
};

/**
 * @return {function(...[(string|Object)])}
 */
ck.routing.Route.prototype.getAction = function() {
  return this.action_;
};

/**
 * @param {string} fragment
 * @return {boolean}
 */
ck.routing.Route.prototype.matches_fragment = function(fragment) {
  var parameter_matcher;

  parameter_matcher = this.fuzz_fragment_();
  return parameter_matcher.test(fragment);
};

/**
 * Takes routes (segment/:id/:name) and converts it to a regular
 * expression that can be used to compare against the current URI.
 * @private
 * @return {RegExp}
 */
ck.routing.Route.prototype.fuzz_fragment_ = function() {
  var fuzzy_fragment, parameter_matcher;

  fuzzy_fragment = this.fragment_.replace(ck.routing.PARAMETER_REGEX,
    '([^/\\?]*)');
  parameter_matcher = goog.string.buildString('^', fuzzy_fragment, '/?(',
    ck.routing.QUERY_STRING_REGEX, ')?$');
  return new RegExp(parameter_matcher);
};

/**
 * @param {string} fragment
 * @return {Array}
 */
ck.routing.Route.prototype.extract_parameters = function(fragment) {
  var parameter_matcher, parameters;

  parameter_matcher = this.fuzz_fragment_();
  parameters = parameter_matcher.exec(fragment).slice(1);
  parameters.pop();
  return parameters;
};

/**
 * @param {string} fragment
 * @return {goog.Uri.QueryData}
 */
ck.routing.Route.prototype.extract_query_data = function(fragment) {
  var query_string;

  query_string = this.query_string_regex_.exec(fragment) || [];
  query_string = query_string.pop() || '';
  return new goog.Uri.QueryData(query_string.slice(1));
};

/**
 * @return {boolean}
 */
ck.routing.Route.prototype.isAllowed = function () {
  return ck.UserAccount.hasCapability(this.requiredCapability_);
};

/**
 * @param {function()} action
 */
ck.routing.Route.prototype.setAction = function (action) {
  this.action_ = action;
};
