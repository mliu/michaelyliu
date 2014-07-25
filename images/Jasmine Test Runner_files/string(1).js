goog.provide('servo.string');

goog.require('servo.observable');

servo.string = function (options) {
  return servo.observable(function (value) {
    return typeof value === 'string';
  }, options);
};
