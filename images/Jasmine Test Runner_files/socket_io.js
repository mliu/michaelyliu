goog.provide('ck.urls.socket_io');

goog.require('ck.urls.base');
goog.require('goog.string');

ck.urls.Socket_IO = {};

ck.urls.Socket_IO.overview_bind = goog.string.buildString(
    ck.urls.Base,
    'overview/bind'
  );

ck.urls.Socket_IO.ready = goog.string.buildString(
    ck.urls.Base,
    'ready/'
  );