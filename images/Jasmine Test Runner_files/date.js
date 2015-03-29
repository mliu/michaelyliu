goog.provide('servo.date');

goog.require('servo.observable');

servo.date = function (options) {
  return servo.observable(function (value) {
    return value instanceof Date;
  }, options);
};
