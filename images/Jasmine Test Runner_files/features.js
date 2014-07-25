goog.provide('ck.Features');

/**
 * @param {string} feature
 * @return {boolean}
 */
ck.Features.has = function (feature) {
  if (goog.isDefAndNotNull(goog.global['FEATURES']) &&
      goog.isDefAndNotNull(goog.global['FEATURES'][feature])) {
    return goog.global['FEATURES'][feature];
  }

  return true;
};

/**
 * @return {boolean}
 */
ck.Features.hasNewServiceLevels = function () {
  return ck.Features.has('new_service_levels');
};

/**
 * @return {boolean}
 */
ck.Features.hasTeeth = function () {
  return ck.Features.has('teeth');
};

/**
 * @return {boolean}
 */
ck.Features.hasRackConnect3 = function () {
  return ck.Features.has('rackconnect3');
};

/**
 * @return {boolean}
 */
ck.Features.hasWhatsNewCassandra = function () {
  return ck.Features.has('whats_new_cassandra');
};

/**
 * @return {boolean}
 */
ck.Features.hasResourceLimitsSection = function () {
  return ck.Features.has('resource_limits_section');
};

/**
 * @return {boolean}
 */
ck.Features.hasImprovedUnverifiedExperience = function () {
  return ck.Features.has('improved_unverified_experience');
};

/**
 * @return {boolean}
 */
ck.Features.hasFauxFolders = function () {
  return ck.Features.has('files_faux_folders');
};

/**
 * @return {boolean}
 */
ck.Features.hasFreeMonitoring = function () {
  return ck.Features.has('free_monitoring');
};

/**
 * @return {boolean}
 */
ck.Features.hasOrchestration = function () {
  return ck.Features.has('orchestration');
};

/**
 * @return {boolean}
 */
ck.Features.hasDatabaseTypes = function () {
  return ck.Features.has('database_types');
};

/**
 * @return {boolean}
 */
ck.Features.hasDatabaseFacets = function () {
  return ck.Features.has('database_facets');
};

/**
 * @return {boolean}
 */
ck.Features.hasNewFirstTimeExperience = function () {
  return ck.Features.has('new_first_time_experience_modal');
};

/**
 * @return {boolean}
 */
ck.Features.isPilotEnabled = function () {
  return goog.global['IS_PILOT_ENABLED'];
};
