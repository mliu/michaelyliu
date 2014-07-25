goog.provide('servo.Model');

goog.require('goog.array');
goog.require('goog.events.Event');
goog.require('goog.events.EventHandler');
goog.require('goog.object');
goog.require('goog.string');
goog.require('servo.Base');
goog.require('servo.Store');
goog.require('servo.events.EventType');
goog.require('servo.events.ModelUpdateEvent');
goog.require('servo.property');

/**
 * @fileoverview The model is a single unit of data.
 */

/**
 * Create a model class that you can use to make instances of.
 * @param {!Object.<string, servo.Property|servo.Collection>} properties
 * @param {!function (new:servo.Store): undefined} store
 * @return {!Function}
 */
servo.createModel = function (properties, store) {
  /**
   * @constructor
   * @extends {servo.Model}
   */
  var ModelClass = function () {
    servo.Model.apply(this, arguments);
    this.initializeModel();
  };
  goog.inherits(ModelClass, servo.Model);
  /**
   * @type {!Object}
   * @protected
   */
  ModelClass.prototype.properties_ = goog.object.clone(properties);

  /**
   * @type {!Object}
   * @private
   */
  ModelClass.prototype.storeClass_ = (/** @type {!Object} */ (store));

  return ModelClass;
};

/**
 * The class that represents a model that must be extended.
 * @constructor
 * @param {Object=} opt_values
 * @param {servo.Store=} opt_store
 * @extends {servo.Base}
 */
servo.Model = function (opt_values, opt_store) {
  if (opt_store) {
    this.storeClass_ = opt_store;
  }
  goog.base(this);
  if (goog.isDefAndNotNull(opt_values)) {
    /**
     * @type {!Object}
     * @protected
     */
    (opt_values = goog.object.clone(opt_values));
  }
  this.handler_ = new goog.events.EventHandler(this);
  this.handler_.listen(
    this,
    [servo.events.EventType.SYNC,
     servo.events.EventType.ERROR,
     servo.events.EventType.TIMEOUT],
    this.updateLoadedStatus
  );

  this.setStore(this.storeClass_);
  if (opt_values && goog.isDefAndNotNull(opt_values.id)) {
    this.setId_(opt_values.id);
    delete opt_values.id;
  }

  this.createRoot_();

  /**
   * @private
   * @type {!Array.<string>}
   */
  this.changedProperties_ = [];
  if (opt_values) {
    this.set(opt_values, true);
  }
};
goog.inherits(servo.Model, servo.Base);

servo.Model.prototype.initializeModel = goog.nullFunction;

/**
 * @private
 */
servo.Model.prototype.createRoot_ = function () {
  this.root_ = {};

  goog.object.forEach(this.properties_, function (type, key) {
    var type_;

    if (type.create) {
      this.root_[key] = type.create();
      this.root_[key]['subscribe'](goog.bind(this.handlePropUpdate_, this, key));
    } else {
      type_ = new type();
      this.root_[key] = type_;
      this.handler_.listen(/** @type {servo.Property} */ (type_),
        [
          servo.events.EventType.PROPERTY_UPDATE,
          servo.events.EventType.COLLECTION_UPDATE,
          servo.events.EventType.ADD,
          servo.events.EventType.REMOVE
        ],
        goog.bind(this.handlePropUpdate_, this, key)
      );
    }
  }, this);
};

/**
 * @type {string|number?}
 * @private
 */
servo.Model.prototype.id_ = null;

/**
 * @type {goog.events.EventHandler}
 * @private
 */
servo.Model.prototype.handler_ = null;

/**
 * @type {Object}
 * @protected
 */
servo.Model.prototype.properties_ = null;

/**
 * @type {Object}
 * @protected
 */
servo.Model.prototype.root_ = null;

/**
 * Get the store used by the model.
 * @return {!servo.Store}
 */
servo.Model.prototype.getStore = function () {
  return this.store_;
};

/**
 * Get the event handler used by the model for subclasses that need to define
 * their own event behavior.
 * @return {goog.events.EventHandler}
 */
servo.Model.prototype.getHandler = function () {
  return this.handler_;
};

/**
 * Get the model's id or null if it doesn't have one yet.
 * @return {string|number?}
 */
servo.Model.prototype.id = function () {
  return this.id_;
};

/**
 * Save changes to the storage engine.
 * @param {Object=} opt_data
 */
servo.Model.prototype.save = function (opt_data) {
  var updatingModelWithTempData;
  if (this.isDisposed()) {
    throw new Error('Model is disposed.');
  }
  updatingModelWithTempData = this.id() && opt_data;
  if (updatingModelWithTempData) {
    opt_data['id'] = this.id();
  }
  this.store_.save(opt_data || this.get());
};

/**
 * Fetch updates for model.
 * @param {*=} opt_args
 */
servo.Model.prototype.fetch = function (opt_args) {
  var args;
  if (this.isDisposed()) {
    throw new Error('Model is disposed.');
  }
  args = goog.array.toArray(arguments);
  if (!opt_args) {
    opt_args = {};
    args.push(opt_args);
  }
  if (opt_args.id === undefined) {
    opt_args.id = this.id();
  }
  if (!this.hasSynced()) {
    this.isLoading_ = true;
  }
  this.store_.fetch.apply(this.store_, args);
};

/**
 * @param {!servo.events.StoreSyncedEvent} event
 * @protected
 */
servo.Model.prototype.handleSync_ = function (event) {
  var oldId;
  oldId = this.id() || undefined;
  this.setId_(/** @type {number|string} */(event.id) ||
    /** @type {number|string} */ (oldId));
  this.update(/** @type {!Object} */ (event.parsedData));
  this.updateLoadedStatus(event);
  this.isLoading_ = false;
  this.initializeModel();
  this.dispatchEvent(new servo.events.StoreSyncedEvent(
      this, event.parsedData, event.id, oldId));
};

/**
 * Manually set the model to sync.
 */
servo.Model.prototype.setSynced = function () {
  var syncEvent;

  syncEvent = new goog.events.Event(servo.events.EventType.SYNC, this);
  this.updateLoadedStatus(syncEvent);
  this.dispatchEvent(syncEvent);
};

/**
 * @param {!goog.events.Event} event
 * @private
 */
servo.Model.prototype.handleDelete_ = function (event) {
  this.dispatchEvent(new goog.events.Event(servo.events.EventType.DELETE, this));
};

/**
 * @param {!goog.events.Event} event
 * @private
 */
servo.Model.prototype.handlePropUpdate_ = function (propName, event) {
  this.changedProperties_.push(propName);
  if (event && !event.parentSet && this.hasChangedProperties_()) {
    this.dispatchEvent(new servo.events.ModelUpdateEvent(
      this,
      this.clearChangedProperties_(),
      /** @type {!Object} */(this.get()),
      false
    ));
  }
};

/**
 * @private
 * @return {!Array.<string>}
 */
servo.Model.prototype.clearChangedProperties_ = function () {
  var tmp;
  tmp = this.changedProperties_;
  this.changedProperties_ = [];
  goog.array.removeDuplicates(tmp);
  return tmp;
};

/** @inheritDoc */
servo.Model.prototype.disposeInternal = function () {
  this.dispatchEvent(new goog.events.Event(
        servo.events.EventType.REMOVE, this));
  goog.base(this, 'disposeInternal');
  goog.object.forEach(this.root_, function (prop) {
    if (ko.isObservable(prop)) {
      prop['dispose']();
    } else {
      prop.dispose();
    }
  });
  this.root_ = null;
  this.handler_.dispose();
};

/**
 * Update all of the model's properties.
 *
 * This function has two forms:
 *
 * 1: model.set({
 *   key1: value1,
 *   key2: value2
 * }, opt_silent);
 *
 * If opt_silent is the boolean value true, the model does not trigger
 * a parent update event.
 *
 * 2: model.set(key1, value1);
 *
 * In the second form you cannot pass opt_silent in.
 *
 * @param {Object|string} values
 * @param {*=} opt_silent If true, does not trigger a parent update event.
 * @return {boolean} If the submitted values were different.
 */
servo.Model.prototype.set = function (values, opt_silent) {
  var changedProperties;
  if (this.isDisposed()) {
    throw new Error('Model is disposed.');
  }

  if (goog.isString(arguments[0])) {
    this.setEntryByKey(arguments[0], arguments[1]);
    return true;
  }

  values = /** @type {Object} */ (values);
  this.checkInputs_(values, true);
  this.applyChange_(values, true);
  if (this.hasChangedProperties_()) {
    this.dispatchEvent(new servo.events.ModelUpdateEvent(
      this,
      this.clearChangedProperties_(),
      /** @type {!Object} */(this.get()),
      /** @type {boolean} */(opt_silent)
    ));
    return true;
  }
  return false;
};

/**
 * @param  {Object} values
 * @param {boolean=} opt_default Fall back on default values.
 * @private
 */
servo.Model.prototype.applyChange_ = function (values, opt_default) {
  goog.array.extend(this.changedProperties_, goog.array.filter(
    goog.object.getKeys(this.root_),
    function (key) {

      var prop, value;

      if (!opt_default && !values.hasOwnProperty(key)) {
        // Return if we should not be attempting a change.
        return false;
      }
      prop = this.root_[key];
      value = values[key];
      if (prop instanceof servo.Property) {
        // If a property...
        return prop.set(
          goog.isDefAndNotNull(value)?value:prop.getDefault(), true);
      } else if (prop instanceof servo.Model) {
          // If a model...
        if (value) {
            prop.update(value, true);
          } else {
            prop.set({}, true);
          }
        return true;
      } else if (ko.isObservable(prop)) {
        if (goog.isDef(value)) {
          prop(value);
          return true;
        } else {
          return false;
        }
      } else {
        // If a collection...
        if (value) {
          if (opt_default) {
            prop.set(value, true);
          } else {
            prop.update(value, true);
          }
        } else {
          prop.clear();
        }
        return true;
      }
    },
    this
  ));
};

/**
 * @private
 * @return {boolean}
 */
servo.Model.prototype.hasChangedProperties_ = function () {
  return !goog.array.isEmpty(this.changedProperties_);
};

/**
 * Update a single property, providing a key.
 * @protected
 * @param {Object|Array|string|boolean|number} value
 * @param {string} key
 */
servo.Model.prototype.setEntryByKey = function (key, value) {
  var prop;
  if (this.isDisposed()) {
    throw new Error('Model is disposed.');
  }
  this.checkInput_(key, value);
  prop = this.root_[key];
  prop.set(value);
};

/**
 * Describes what the model expects in terms of properties.
 * @return {!string}
 */
servo.Model.prototype.describe = function () {
  var description;
  description = [];
  goog.object.forEach(this.root_, function (value, key) {
    description.push(key + ': ' + value.describe());
  });
  return description.join(', ');
};

/**
 * Get the value representing the model.
 *
 * This function has two forms:
 *
 * model.get() -> returns all the keys and values associated with a model
 *
 * model.get(key) -> return the value associated with a given key
 *
 * @param {string=} opt_key
 * @return {Object|Array|number|string|boolean}
 */
servo.Model.prototype.get = function (opt_key) {
  var returnObj;

  if (arguments.length === 1) {
    if (arguments[0] === 'id') {
      return this.id();
    } else {
      return this.getEntryByKey(arguments[0]);
    }
  }

  returnObj = goog.object.map(
    this.root_,
    function (value) {
      return value.get();
    }
  );
  if (this.id()) {
    returnObj.id = this.id();
  }
  return returnObj;
};

/**
 * Get the value of one property.
 * @protected
 * @param {string=} key
 * @return {Object|Array|number|string|boolean}
 */
servo.Model.prototype.getEntryByKey = function (key) {
  if (!this.root_[key]) {
    throw new Error('Model has no property named "' + key + '"');
  }
  return this.root_[key].get();
};

/**
 * Delete the model.
 * @param {(string|number)=} opt_id
 */
servo.Model.prototype.destroy = function (opt_id) {
  if (this.isDisposed()) {
    throw new Error('Model is disposed.');
  }
  this.store_.destroy(opt_id || this.id());
};

/**
 * Update the model with new values, does not reset existing values
 * not provided in argument.
 * @param {!Object} values
 * @param {boolean=} opt_silent If true, does not trigger a parent update event.
 */
servo.Model.prototype.update = function (values, opt_silent) {
  if (this.isDisposed()) {
    throw 'Model is disposed.';
  }
  this.checkInputs_(values, true);
  this.applyChange_(values);
  if (this.hasChangedProperties_()) {
    this.dispatchEvent(new servo.events.ModelUpdateEvent(
      this,
      this.clearChangedProperties_(),
      /** @type {!Object} */(this.get()),
      opt_silent
    ));
  }
};

/**
 * Get the servo.Property object for a property instead of the value.
 * @param {string} propertyName
 * @return {servo.Property|servo.Collection|servo.Model}
 */
servo.Model.prototype.getPropertyByKey = function (propertyName) {
  this.checkInput_(propertyName);
  return this.root_[propertyName];
};

/**
 * Gets a list of property names available for model.
 * It does not return a list of property objects.
 * @return {!Array.<string>}
 */
servo.Model.prototype.getKeys = function () {
  return goog.object.getKeys(this.root_);
};

/**
 * Set the Model to use a different store.
 * @param {!function (new:servo.Store): undefined} store
 */
servo.Model.prototype.setStore = function (store) {
  if (this.store_ && !this.store_.isDisposed()) {
    this.store_.dispose();
  }
  this.storeClass_ = store;
  this.store_ = new this.storeClass_();
  this.listenToStoreEvents_();
};

/**
 * Fire events from the store on the Model.
 * @protected
 */
servo.Model.prototype.listenToStoreEvents_ = function () {
  this.handler_.listen(
    this.store_,
    servo.events.EventType.SYNC,
    this.handleSync_
  );
  this.handler_.listen(
    this.store_,
    servo.events.EventType.DELETE,
    this.handleDelete_
  );
  this.handler_.listen(
    this,
    [servo.events.EventType.SYNC,
     servo.events.EventType.ERROR,
     servo.events.EventType.TIMEOUT],
    this.updateLoadedStatus
  );
  this.handler_.listen(
    this.store_,
    [servo.events.EventType.ERROR,
     servo.events.EventType.SUCCESS,
     servo.events.EventType.TIMEOUT],
    this.forwardEvent_
  );
};

/**
 * Set the model's id.
 * @param {number|string} id
 * @protected
 */
servo.Model.prototype.setId_ = function (id) {
  this.id_ = id;
};

/**
 * @private
 * @param {string} key
 * @param {*=} opt_value
 * @param {boolean=} opt_permissive If true, ignores extra attributes.
 */
servo.Model.prototype.checkInput_ = function (key, opt_value, opt_permissive) {

  var prop, failed;

  failed = false;
  prop = this.root_[key];
  if (!prop) {
    failed = !opt_permissive;
  } else {
    if (prop instanceof servo.Property) {
      if (opt_value !== undefined && !prop.checkType(opt_value)) {
        throw new Error(goog.getMsg(
          'Type error: Attempted to set property "{$key}" to value "{$value}" ({$type}, expected {$expectedType})',
          {
            'key': key,
            'value': opt_value,
            'type': typeof(opt_value),
            'expectedType': prop.describe()
          }
        ));
      }
    } else if (prop instanceof servo.Collection) {
      if (opt_value !== undefined && !goog.isArray(opt_value)) {
        throw new Error(goog.getMsg(
          'Value error: Attempted to set property "{$key}" to value "{$value}" (expected array)',
          {
            'key': key,
            'value': opt_value
          }
        ));
      }
    } else if (prop instanceof servo.Model) {
      if (opt_value !== undefined && !this.checkType_(opt_value)) {
        throw new Error(goog.getMsg(
          'Type error: Attempted to set property "{$key}" to value "{$value}" ({$type}, expected {$expectedType})',
          {
            'key': key,
            'value': opt_value,
            'type': typeof(opt_value),
            'expectedType': prop.describe()
          }
        ));
      }
    } else if (ko.isObservable(prop)) {
      // No-op
    } else {
      failed = true;
    }
  }
  if (failed) {
    throw new Error(goog.string.buildString(
      key,
      ' is an invalid property name, should be one of: ',
      this.describe()
    ));
  }
};

/**
 * @private
 * @param {*=} val
 * @return {boolean}
 */
servo.Model.prototype.checkType_ = function (val) {
  if (this.nullable_ && goog.isNull(val)) {
    return true;
  }
  return !goog.isArrayLike(val) && goog.isObject(val);
};

/**
 * @private
 * @param {Object} obj
 * @param {boolean=} opt_permissive If true, ignores extra attributes.
 */
servo.Model.prototype.checkInputs_ = function (obj, opt_permissive) {
  goog.object.forEach(
    obj,
    function (value, key) {
      this.checkInput_(key, value, opt_permissive);
    },
    this
  );
};
