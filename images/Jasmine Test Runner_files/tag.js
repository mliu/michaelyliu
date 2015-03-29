goog.provide('ck.data.EntityTags');
goog.provide('ck.data.Tag');

goog.require('servo.Collection');
goog.require('servo.Model');
goog.require('servo.String');
goog.require('servo.Property');
goog.require('ck.data.RackspaceStore');
goog.require('goog.json');
goog.require('goog.structs.Set');

/**
 * @constructor
 * @extends {ck.data.RackspaceStore}
 */
ck.data.TagStore = function () {
  goog.base(this);
};
goog.inherits(ck.data.TagStore, ck.data.RackspaceStore);

/** @inheritDoc */
ck.data.TagStore.prototype.getUrl = function () {
  return '/ck/tag';
};

/** @inheritDoc */
ck.data.TagStore.prototype.verifyProvider_ = goog.nullFunction;

/** @inheritDoc */
ck.data.TagStore.prototype.parseInternal = function (opt_rawData) {
  var opt_withRemoval;

  opt_withRemoval = true;
  this.setParsedData(opt_rawData, undefined, opt_withRemoval);
};

/**
 * @param {Object} data
 */
ck.data.TagStore.prototype.createTag = function (data) {
  this.sendRequest(
    goog.string.subs('/ck/tag/', ck.urls.Base),
    this.handleSendResponse_,
    ck.data.ProxyStore.HttpMethods.POST,
    goog.json.serialize(data),
    {'X-CSRFToken': goog.global['_csrf_token']}
  );
};

/**
 * @constructor
 * @extends {servo.Model}
 * @param {Object=} opt_values
 */
ck.data.Tag = servo.createModel({
  'name': servo.createProperty(servo.String),
  'provider_id': servo.createProperty(servo.String),
  'entity_id': servo.createProperty(servo.String)
}, ck.data.TagStore);

ck.data.Tag.prototype.createTag = function () {
  this.getStore().createTag({'tag': this.get()});
};

/**
 * @param {servo.Model} model
 * @return {boolean}
 */
ck.data.Tag.prototype.matches = function (model) {
  return (model.id() === this.get('entity_id'));
};

/**
 * @param {string} tagName
 * @param {string} serverId
 * @return {string}
 */
ck.data.Tag.getUniqueId = function (tagName, serverId) {
  return goog.string.buildString(tagName, '|', serverId);
};

/**
 * @constructor
 * @extends {ck.data.RackspaceStore}
 */
ck.data.EntityTagsStore = function () {
  goog.base(this);
};
goog.inherits(ck.data.EntityTagsStore, ck.data.RackspaceStore);

/** @inheritDoc */
ck.data.EntityTagsStore.prototype.getUrl = function () {
  return goog.string.subs('%stag/', ck.urls.Base);
};

/** @inheritDoc */
ck.data.EntityTagsStore.prototype.verifyProvider_ = goog.nullFunction;

/** @inheritDoc */
ck.data.EntityTagsStore.prototype.parseInternal = function (opt_rawData) {
  var opt_withRemoval, tags;

  opt_withRemoval = true;
  tags = [];

  goog.object.forEach(opt_rawData['tags'], function(tagList, entityId) {
    goog.array.forEach(tagList, function (tag) {
      tags.push(
        {
          'provider_id': "CassandraMigration",
          'entity_id': entityId,
          'name': tag,
          'id': ck.data.Tag.getUniqueId(
            /** @type {string} */ (tag),
            /** @type {string} */ (entityId)
          )
        }
      );
    });
  });

  this.setParsedData(tags, undefined, opt_withRemoval);
};

/**
 * @param {string} data
 */
ck.data.EntityTagsStore.prototype.updateTags = function (data) {
  //This function can be deleted after the migration to cassandra is finished.
  this.sendRequest(
    goog.string.subs('/ck/tag/', ck.urls.Base),
    this.handleSendResponse_,
    ck.data.ProxyStore.HttpMethods.POST,
    goog.json.serialize(data),
    {'X-CSRFToken': goog.global['_csrf_token']}
  );
};

/**
 * @constructor
 * @extends {servo.Collection}
 */
ck.data.EntityTags = servo.createCollection(ck.data.Tag, ck.data.EntityTagsStore);

/**
 * @param {Array.<ck.data.Tag|Object>} tags
 */
ck.data.EntityTags.getNames = function (tags) {
  return goog.array.map(
    tags,
    function (tag) {
      if (tag instanceof ck.data.Tag) {
        return tag.get('name');
      }
      return tag['name'];
    }
  );
};

/**
 * @param {Array.<Object>} tags
 */
ck.data.EntityTags.getUniqueNames = function (tags) {
  var uniqueTags;

  uniqueTags = new goog.structs.Set();
  goog.array.forEach(
    tags,
    function (tag) {
      if (tag instanceof ck.data.Tag) {
        uniqueTags.add(tag.get('name'));
        return;
      }
      uniqueTags.add(tag['name']);
    }
  );

  return uniqueTags.getValues();
};

/**
 * Filters the tags based on entityId
 *
 * @param {string} entityId
 * @return {Array.<ck.data.Tag>}
 */
ck.data.EntityTags.prototype.getForModel = function (entityId) {
  return this.filter(function (tag) {
    return tag.get('entity_id') === entityId;
  });
};

/**
 * Filters the tags based on a tag name.
 *
 * @param {string} tagName
 * @return {Array.<ck.data.Tag>}
 */
ck.data.EntityTags.prototype.getForName = function (tagName) {
  return this.filter(function (tag) {
    return tag.get('name') === tagName;
  });
};

/**
 * Find the tag object from the tag's data.
 *
 * @param {string} entityId
 * @param {string} name
 * @return {ck.data.Tag}
 */
ck.data.EntityTags.prototype.findTag = function (entityId, name) {
  return /** @type {ck.data.Tag} */ (goog.array.find(
    this.getForModel(entityId),
    function (tag) {
      return tag.get('name') === name;
    }
  ));
};

/**
 * @param {string} serverId
*/
ck.data.EntityTags.prototype.updateTags = function (serverId) {
  var tags, tagData;

  tagData = {};
  tags = [];

  this.forEach(function(tag) {
    goog.array.insert(tags, tag.get('name'));
  });

  tagData[serverId] = tags;

  this.getStore().updateTags({'tags': tagData});
};
