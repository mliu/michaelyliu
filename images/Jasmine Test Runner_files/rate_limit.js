goog.provide('ck.data.RateLimit');

goog.require('servo.Collection');
goog.require('servo.Model');
goog.require('servo.Number');
goog.require('servo.Property');
goog.require('servo.String');

ck.data.RateLimit = servo.createModel({
  'uri': servo.createProperty(servo.String),
  'verb': servo.createProperty(servo.String),
  'remaining': servo.createProperty(servo.Number)
}, servo.Store);
