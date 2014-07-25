goog.provide('ck.servers.Roles');

/**
 * @enum {string}
 */
ck.servers.Roles.NextGen = {
  ADMIN: 'nova:admin',
  CREATOR: 'nova:creator',
  OBSERVER: 'nova:observer'
};

/**
 * @enum {string}
 */
ck.servers.Roles.FirstGen = {
  ADMIN: 'legacyCompute:admin',
  OBSERVER: 'legacyCompute:observer'
};
