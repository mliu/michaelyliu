goog.provide('ck.routing');

goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.History');
goog.require('goog.string');
goog.require('goog.Uri.QueryData');

/**
 * @const
 * @type {RegExp}
 */
ck.routing.PARAMETER_REGEX = /:[\w]+/ig;

/**
 * @const
 * @type {string|RegExp}
 */
ck.routing.QUERY_STRING_REGEX = '\\?.+';

/**
 * @enum {string}
 */
ck.routing.AppPaths = {
  SERVERS: '/servers',
  LOADBALANCERS: '/load_balancers',
  TICKETS: '/tickets',
  ACCOUNT: '/account',
  SSO: '/ck/sso',
  DATABASES: '/database',
  DNS: '/dns'
};

/**
 * @param {ck.routing.Route} route
 * @param {Array.<string|Object>} parameters
 * @param {goog.Uri.QueryData=} opt_queryData
 * @return {string}
 */
ck.routing.url_for = function(route, parameters, opt_queryData) {

  var parameter_keys, queryData, fragment;

  fragment = route.getFragment();

  parameter_keys = fragment.match(ck.routing.PARAMETER_REGEX) || [];
  queryData = opt_queryData || new goog.Uri.QueryData();
  goog.array.forEach(parameter_keys, function(key, i) {
    //Pass the parameters into replace() as a function, which prevents replace()
    //from treating '$' as an escape char.
    //See:  https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_function_as_a_parameter
    var param_func;

    param_func = function () {
       return encodeURIComponent(/** @type {string} */ (parameters[i]) || '');
    };
    fragment = fragment.replace(key, /** @type {function(): string} */ (param_func));
  });

  return queryData.isEmpty() ?
    fragment :
    goog.string.buildString(fragment, '?', queryData.toString());
};

/**
 * @param {string} app
 * @param {ck.routing.Route} route
 * @param {Array.<string|Object>=} opt_parameters
 * @param {goog.Uri.QueryData=} opt_queryData
 * @return {string}
 */
ck.routing.urlForApp = function(app, route, opt_parameters, opt_queryData) {
  return goog.string.subs(
    '%s%s#%s',
    ck.UserAccount.getBasePath(),
    app,
    ck.routing.url_for(route, opt_parameters || [], opt_queryData)
  );
};

/**
 * @param {string} route
 * @return {string}
 */
ck.routing.urlForSso = function(route) {
  return goog.string.subs(
    '%s/%s',
    ck.routing.AppPaths.SSO,
    route
  );
};

/**
 * The history manager must be instantiated immediately to prevent WebKit bugs.
 * @type {goog.History}
 */
ck.routing.history_manager = new goog.History();
