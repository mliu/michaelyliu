goog.provide('ck.urls.providers');

goog.require('goog.string');
goog.require('ck.urls.base');

ck.urls.Providers = {};

/**
 * @type {string}
 */
ck.urls.Providers.Base = 'overview/providers/';

/**
 * Url for getting all the providers.
 */
ck.urls.Providers.get_all = goog.string.buildString(
    ck.urls.Base,
    ck.urls.Providers.Base
  );

/**
 * Url for a specific provider.
 * @param {number} id
 * @return {string}
 */
ck.urls.Providers.get = function (id) {
  return goog.string.buildString(
    ck.urls.Base,
    ck.urls.Providers.Base,
    id
  );
};

/**
 * Url for adding a new provider.
 */
ck.urls.Providers.add_provider = goog.string.buildString(
  ck.urls.Base,
  'overview/add_provider'
);
