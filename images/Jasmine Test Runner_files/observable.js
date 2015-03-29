goog.provide('servo.observable');

servo.observable = function (isValidType, options) {
  var observable, computed;

  function checkType(value) {
    if (!options['nullable'] && value === null) {
      throw new Error('Typed observable does not accept null.');
    } else if (value !== null && !isValidType(value)) {
      throw new Error('Typed observable does not accept type "' + typeof value + '".');
    }
  }

  function read() {
    return observable();
  }

  function write(value) {
    checkType(value);
    observable(value);
  }

  options = options || {};
  observable = ko.observable();
  computed = ko.computed({ 'read': read, 'write': write });

  if (options['default'] !== undefined) {
    computed(options['default']);
  }

  ko.utils.extend(computed, servo.observable['fn']);

  return computed;
};

/**
 * These methods exist so that observable properties implement a subset of the
 * property interface that is used by models and collections. These should be
 * DELETED once they are no longer used on the model.
 */
servo.observable['fn'] = {
  describe: function () {
    return 'observable';
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
