goog.provide('servo.file');

goog.require('servo.observable');

servo.file = function (options) {
  return servo.observable(function (value) {
    return (value instanceof File) || (value instanceof Object);
  }, options);
};
