goog.provide('servo.observableArray');

servo.observableArray = function (isValidType, options) {
  var observableArray, computed;

  function checkType(value) {
    if (!options['nullable'] && value === null) {
      throw new Error('Typed observable array does not accept null.');
    } else if (value !== null && !isValidType(value)) {
      throw new Error('Typed observable array does not accept type "' + typeof value + '".');
    }
  }

  function read() {
    return observableArray();
  }

  function write(value) {
    checkType(value);
    observableArray(value);
  }

  options = options || {};
  observableArray = ko.observableArray();
  computed = ko.computed({ 'read': read, 'write': write });

  if (options['default'] !== undefined) {
    computed(options['default']);
  }

  ko.utils.extend(computed, servo.observableArray['fn']);

  return computed;
};

/**
 * These methods exist so that observable properties implement a subset of the
 * property interface that is used by models and collections. These should be
 * DELETED once they are no longer used on the model.
 */
servo.observableArray['fn'] = {
  describe: function () {
    return 'observableArray';
  },
  set: function (value) {
    this(value);
  },
  get: function () {
    return this();
  },
  getSortValue: function () {
    return this();
  }
};
