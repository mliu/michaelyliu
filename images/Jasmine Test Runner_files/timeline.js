goog.provide('ck.timeline');

/**
 * Record of events during app initialization.
 * @type {Array.<Object>}
 * @private
 */
ck.timeline.record_ = [];

/**
 * Record a timeline message.
 * @param {string} msg
 */
ck.timeline.recordMessage = function (msg) {
  ck.timeline.record_.push({
    date: goog.now(),
    message: msg
  });
};

/**
 * @return {string}
 */
ck.timeline.getString = function () {
  var totalRecord;

  totalRecord = goog.array.clone(ck.timeline.record_);
  totalRecord.unshift({
    date: goog.global['APP_INITIALIZATION_START'],
    message: 'started initialization timer'
  });
  return goog.array.map(totalRecord, function (recordData) {
    var dateString;

    dateString = new Date(recordData.date).toLocaleTimeString();
    return goog.string.subs('[%s] %s', dateString, recordData.message);
  }).join(',');
};

/**
 * @return {number}
 */
ck.timeline.getDuration = function () {
  var last, start;

  start = goog.global['APP_INITIALIZATION_START'];
  last = ck.timeline.record_[ck.timeline.record_.length - 1];

  return new Date(last.date - start).getSeconds();
};

/**
 * Used to reset timeline to testing purposes.
 */
ck.timeline.clear = function () {
  ck.timeline.record_ = [];
};

goog.exportSymbol('ck.timeline.getString', ck.timeline.getString);
