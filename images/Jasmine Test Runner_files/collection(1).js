goog.provide('servo.Collection');

goog.require('servo.Base');
goog.require('servo.Model');
goog.require('servo.events.EventType');
goog.require('servo.events.RelatedEvent');
goog.require('servo.events.ParentSetEvent');
goog.require('goog.array');
goog.require('goog.object');

/**
 * @fileoverview A collection is a list of models.
 */

/**
 * Create a collection class that you can use to store a list of models.
 * @param {!Object} model
 * @param {!function (new:servo.Store): undefined} store
 * @return {!Function}
 */
servo.createCollection = function (model, store) {
  /**
   * @constructor
   * @extends {servo.Collection}
   */
  var CollectionClass = function () {
    servo.Collection.apply(this, goog.array.toArray(arguments));
  };
  goog.inherits(CollectionClass, servo.Collection);
  /**
   * @type {function(new:servo.Model):undefined}
   * @private
   */
  CollectionClass.prototype.modelClass_ = (
    /** @type {function(new:servo.Model):undefined} */ (model)
  );
  /**
   * @type {function(new:servo.Collection):undefined}
   * @private
   */
  CollectionClass.prototype.collectionClass_ = CollectionClass;
  /**
   * @type {!function (new:servo.Store): undefined}
   * @private
   */
  CollectionClass.prototype.storeClass_ = store;

  return CollectionClass;
};

/**
 * The class that represents a collection.
 * @constructor
 * @param {Array.<servo.Model|Object>} opt_values
 * @extends {servo.Base}
 */
servo.Collection = function (opt_values) {
  if (!this.storeClass_) {
    throw 'No store given.';
  }
  goog.base(this);
  this.handler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.handler_);
  this.handler_.listen(
    this,
    [servo.events.EventType.SYNC,
     servo.events.EventType.ERROR,
     servo.events.EventType.TIMEOUT],
    this.updateLoadedStatus
  );

  this.setStore(this.storeClass_);
  this.root_ = [];
  this.idMap_ =  {};
  if (opt_values) {
    this.set(opt_values);
  }
};
goog.inherits(servo.Collection, servo.Base);

/**
 * Returns a Model function (that can be newed to create a class.)
 */
servo.Collection.prototype.getModelClass = function () {
  return this.modelClass_;
};

/**
 * Returns a Collection function (that can be newed to create a class.)
 */
servo.Collection.prototype.getCollectionClass = function () {
  return this.collectionClass_;
};

/**
 * Returns the number of models in the collection.
 * @return {number}
 */
servo.Collection.prototype.length = function () {
  return this.root_.length;
};

/**
 * @param {(function(?servo.Model, ?servo.Model):number)|string} sorter A compare function or key.
 * @param {boolean=} opt_reverse Whether or not to reverse sorting.
 * @return {boolean} Whether or not the sort changed.
 */
servo.Collection.prototype.sort = function (sorter, opt_reverse) {
  var compareFunction;

  compareFunction = this.createCompareFunction_(sorter, opt_reverse);

  if (goog.array.isSorted(/** @type {!Array} */ (this.root_), compareFunction)) {
    return false;
  }
  goog.array.sort(this.root_, compareFunction);

  this.dispatchEvent(new servo.events.ParentSetEvent(
    servo.events.EventType.COLLECTION_UPDATE,
    this,
    false
  ));
  this.dispatchEvent(new servo.events.ParentSetEvent(
    servo.events.EventType.COLLECTION_SORT,
    this,
    false
  ));

  return true;
};

/**
 * @private
 * @param {(function(?servo.Model, ?servo.Model):number)|string} sorter
 * @param {boolean|undefined} reverse
 */
servo.Collection.prototype.createCompareFunction_ = function (sorter, reverse) {

  var direction, sortFunction;

  direction = reverse ? -1 : 1;
  sortFunction = goog.isFunction(sorter) ? sorter : function (a, b) {
    return goog.array.defaultCompare(
      a.getPropertyByKey(sorter).getSortValue(),
      b.getPropertyByKey(sorter).getSortValue()
    );
  };

  return function (a, b) {
    return direction * sortFunction(a, b);
  };
};

/**
 * @param {function (?servo.Model): boolean} func An evaluation function.
 * @param {Object=} opt_obj The optional 'this' object.
 * @return {boolean}
 */
servo.Collection.prototype.some = function (func, opt_obj) {
  return goog.array.some(
    goog.array.clone(this.root_),
    func,
    opt_obj
  );
};

/**
 * @param {function (): boolean} func An evaluation function.
 * @param {Object=} opt_obj The optional 'this' object.
 * @return {servo.Model}
 */
servo.Collection.prototype.find = function (func, opt_obj) {
  return /** @type {servo.Model} */(goog.array.find(
    goog.array.clone(this.root_),
    func,
    opt_obj
  ));
};

/**
 * @param {function (): boolean} func An evaluation function.
 * @param {Object=} opt_obj The optional 'this' object.
 * @return {boolean}
 */
servo.Collection.prototype.every = function (func, opt_obj) {
  return goog.array.every(
    goog.array.clone(this.root_),
    func,
    opt_obj
  );
};

/**
 * Set the models for the collection.
 *
 * @param {!Array.<servo.Model|Object>|servo.Model|Object} values
 * @param {boolean=} opt_silent If true, does not trigger a parent update event.
 */
servo.Collection.prototype.set = function (values, opt_silent) {
  var parentUpdateEvent;
  if (values instanceof servo.Model) {
    values = [values];
  }

  this.removeModelsWithoutIds_();

  this.update(values, true);

  parentUpdateEvent = new servo.events.ParentSetEvent(
    servo.events.EventType.COLLECTION_UPDATE,
    this,
    opt_silent
  );
  this.dispatchEvent(parentUpdateEvent);
};

/**
 * Models without ids cannot be updated;
 * @private
 */
servo.Collection.prototype.removeModelsWithoutIds_ = function () {
  var modelsToRemove;

  modelsToRemove = this.filter(function (model) {
    return !goog.isDefAndNotNull(model.id());
  }, this);
  goog.array.forEach(modelsToRemove, function (model) {
    this.removeModel(model);
  }, this);
};

/**
 * Update the models for the collection, updating existing models and removing
 * any models that are not in the updated values.
 *
 * @param {!Array.<servo.Model|Object>|servo.Model|Object} values
 * @param {boolean=} opt_silent If true, does not trigger a parent update event.
 */
servo.Collection.prototype.update = function (values, opt_silent) {
  var updatedIds;

  values = goog.isArray(values) ? values : [values];

  updatedIds = {};
  goog.array.forEach(values, function (value) {
    this.addModel(value, true);
    if (goog.isFunction(value.id)) {
      updatedIds[value.id()] = true;
    } else {
      updatedIds[value.id] = true;
    }
  }, this);

  this.removeMissingModels_(updatedIds);

  if (!opt_silent) {
    this.dispatchEvent(servo.events.EventType.COLLECTION_UPDATE);
  }
};

/**
 * @private
 * @param {Object} updatedIds
 */
servo.Collection.prototype.removeMissingModels_ = function (updatedIds) {
  var missingIds;

  missingIds = goog.array.filter(
    goog.object.getKeys(this.idMap_),
    function (id) {
      return (!updatedIds[id]);
    },
    this
  );

  goog.array.forEach(missingIds, function (id) {
    this.removeModel(id, true);
  }, this);
};

/**
 * Add a model to the end of the collection.
 * @param {!servo.Model|Object} value
 * @param {boolean=} opt_silent If true, does not trigger a parent update event.
 */
servo.Collection.prototype.addModel = function (value, opt_silent) {
  this.addModelAt(value, this.root_.length, opt_silent);
};

/**
 * Add a model to the collection at a particular index.  If a model with the
 * same id already exists in the collection, that model will be updated instead.
 * @param {!servo.Model|Object} value
 * @param {number} index
 * @param {boolean=} opt_silent If true, does not trigger a parent update event.
 */
servo.Collection.prototype.addModelAt = function (value, index, opt_silent) {
  var id;
  if (this.isDisposed()) {
    throw 'Cannot add on disposed collection.';
  }
  if (index < 0 || index > this.root_.length) {
    throw 'addAt requires a proper index.';
  }
  if (value instanceof servo.Model) {
    if (!(value instanceof this.modelClass_)) {
      throw 'Cannot add incorrect model type.';
    }
    id = value.id();
  } else {
    id = value['id'];
  }
  if (this.modelExistsInCollection_(id)) {
    this.updateModelById_(value, id, opt_silent);
  } else {
    this.addNewModel_(value, id, index, opt_silent);
  }
};

/**
 * @private
 * @param {string|number} id
 * @returns {boolean}
 */
servo.Collection.prototype.modelExistsInCollection_ = function (id) {
  return /** @type {boolean} */(goog.isDefAndNotNull(id) && (this.getModelById(id) !== null));
};

/**
 * @private
 * @param {!servo.Model|Object} value
 * @param {*} id
 * @param {number} index
 * @param {boolean=} opt_silent
 */
servo.Collection.prototype.addNewModel_ = function (value, id, index, opt_silent) {
  var model;

  if (value instanceof servo.Model) {
    model = value;
  } else {
    model = this.createModel(value);
  }
  this.root_.splice(index, 0, model);
  // Add model to id map (if applicable).
  if (goog.isDefAndNotNull(id)) {
    this.idMap_[id] = model;
  }
  this.listenForEventsOnModel_(model);

  this.dispatchEvent(new servo.events.RelatedEvent(
    servo.events.EventType.ADD, this, model)
  );
  if (!opt_silent) {
    this.dispatchEvent(
      new goog.events.Event(servo.events.EventType.COLLECTION_UPDATE,
        this));
  }
};

/**
 * @private
 * @param {servo.Model} model
 */
servo.Collection.prototype.listenForEventsOnModel_ = function (model) {
  // Listen to newly added entry.
  this.handler_.listen(
    model,
    servo.events.EventType.DELETE,
    this.handleModelDelete_
  );
  this.handler_.listen(
    model,
    servo.events.EventType.MODEL_UPDATE,
    this.handleModelUpdate_
  );
  this.handler_.listen(
    model,
    servo.events.EventType.REMOVE,
    this.handleModelRemove_
  );
  this.handler_.listen(
    model,
    servo.events.EventType.SYNC,
    this.handleModelSync_
  );
};

/**
 * @protected
 * @param {Object} value
 * @returns {servo.Model}
 */
servo.Collection.prototype.createModel = function (value) {
  return /** @type {servo.Model} */(new this.modelClass_(value));
};

/**
 * Update a model that is already in the collection.
 * @private
 * @param {!servo.Model|Object} value
 * @param {number|string?} id
 * @param {boolean=} opt_silent If true, does not trigger a parent update event.
 */
servo.Collection.prototype.updateModelById_ = function (value, id, opt_silent) {
  var data;

  data = value;
  if (value instanceof servo.Model) {
    // This will override all properties on the model in the collection.
    data = value.get();
  }
  this.getModelById(id).update(data, opt_silent);
};

/**
 * Clear the the collection, disposing models. Does not
 * delete any models.
 * @param {boolean=} opt_bypassDisposal If true does not dispose cleared models.
 */
servo.Collection.prototype.clear = function (opt_bypassDisposal) {
  this.clearInternal_(opt_bypassDisposal);
  this.dispatchEvent(new goog.events.Event(servo.events.EventType.COLLECTION_UPDATE,
      this));
};

/**
 * @param {boolean=} opt_bypassDisposal If true does not dispose cleared models.
 * @private
 */
servo.Collection.prototype.clearInternal_ = function (opt_bypassDisposal) {
  /*
   * Disposing a model alters this.root_ as the model dispatches an
   * event that is captured by the collection and has it remove the model
   * from this.root_
   */
  goog.array.forEach(
    goog.array.clone(this.root_),
    function (model) {
      this.removeModel(model, true, opt_bypassDisposal);
      if (!opt_bypassDisposal) {
        model.dispose();
      }
    },
    this
  );
};

/**
 * Get an array literal for the values in the collection.
 * @return {Array}
 */
servo.Collection.prototype.get = function () {
  return goog.array.map(this.root_, function (value) {
    return value.get();
  });
};

/**
 * Get an object literal for the values in a model.
 * @param {number} index
 * @return {*}
 */
servo.Collection.prototype.getEntryAt = function (index) {
  return this.getModelAt(index).get();
};

/**
 * Get a reference to the collection store.
 * @return {servo.Store}
 */
servo.Collection.prototype.getStore = function () {
  return this.store_;
};

/**
 * Get the event handler used by the collection for subclasses that need to
 * define their own event behavior.
 * @return {goog.events.EventHandler}
 */
servo.Collection.prototype.getHandler = function () {
  return this.handler_;
};

/** @inheritDoc */
servo.Collection.prototype.disposeInternal = function () {
  goog.base(this, 'disposeInternal');
  this.disposeChildren();
  this.root_ = null;
  this.idMap_ = null;
};

servo.Collection.prototype.disposeChildren = function () {
  goog.array.forEach(this.root_, function (model) {
    model.dispose();
  });
};

/**
 * @param {goog.events.Event} event
 * @private
 */
servo.Collection.prototype.handleModelUpdate_ = function (event) {
  /*
   * Dispatching a new event to allow listening simply for all collection
   * updates.
   */
  this.dispatchEvent(new servo.events.PropertiesRelatedEvent(
    servo.events.EventType.MODEL_UPDATE,
    /** @type {Object} */(event.target),
    event.changedProperties,
    this,
    event.parentSet
  ));
  if (!event.parentSet) {
    this.dispatchEvent(new servo.events.ParentSetEvent(
        servo.events.EventType.COLLECTION_UPDATE, this, false));
  }
};

/**
 * @param {goog.events.Event} event
 * @private
 */
servo.Collection.prototype.handleModelRemove_ = function (event) {
  this.removeModel(/** @type {!servo.Model} */(event.target), event.parentSet);
};

/**
 * @private
 */
servo.Collection.prototype.handleModelSync_ = function (event) {
  if (goog.isDefAndNotNull(event.oldId)) {
    delete this.idMap_[event.oldId];
  }
  if (goog.isDefAndNotNull(event.id)) {
    this.idMap_[event.id] = event.target;
  }
};

/**
 * @param {goog.events.Event} event
 * @private
 */
servo.Collection.prototype.handleModelDelete_ = function (event) {
  this.dispatchEvent(new servo.events.RelatedEvent(
    servo.events.EventType.DELETE,
    /** @type {Object|null} */(event.target),
    this
  ));
};

/**
 * Fetch models.
 * @param {*=} opt_args
 */
servo.Collection.prototype.fetch = function (opt_args) {
  if (this.isDisposed()) {
    throw 'Collection is disposed.';
  }
  if (!this.hasSynced_) {
    this.isLoading_ = true;
  }
  this.store_.fetch.apply(this.store_, arguments);
};

/**
 * Get a model by its id.
 * @param {number|string?} id
 * return {servo.Model}
 */
servo.Collection.prototype.getModelById = function (id) {
  return this.idMap_[id] || null;
};

/**
 * Return a model by its index in the collection.
 * @param {number} index
 * @return {servo.Model}
 */
servo.Collection.prototype.getModelAt = function (index) {
  var model;
  model = this.root_[index];
  if (!model) {
    throw 'Invalid index.';
  }
  return model;
};


/**
 * Remove the model at the given index.
 * @param {number} index
 * @param {boolean=} opt_silent If true, does not trigger a parent update event.
 */
servo.Collection.prototype.removeModelAt = function (index, opt_silent) {
  this.removeModel(this.getModelAt(index), opt_silent);
};

/**
 * @private
 * @param {servo.Model|string|number} model The model or id.
 */
servo.Collection.prototype.getModel_ = function (model) {
  return model instanceof this.modelClass_ ? model : this.getModelById(
    /** @type {string|number|null} */(model)
  );
};

/**
 * Remove the given model.
 * @param {servo.Model|string|number} modelOrId
 * @param {boolean=} opt_silent If true, does not trigger a parent update event.
 * @param {boolean=} opt_bypassDisposal If true does not dispose cleared models.
 */
servo.Collection.prototype.removeModel = function (modelOrId, opt_silent, opt_bypassDisposal) {
  var model, id;

  model = this.getModel_(modelOrId);
  if (model === null || goog.array.indexOf(this.root_, model) === -1) {
    throw 'Collection does not contain model.';
  }
  // Remove the id from the map.
  id = model.id();
  if (id !== null) {
    delete this.idMap_[id];
  }

  this.unlistenToModel_(model);
  this.root_.splice(goog.array.indexOf(this.root_, model), 1);

  this.dispatchEvent(
    new servo.events.RelatedEvent(servo.events.EventType.REMOVE, this, model)
  );

  if (!model.isDisposed() && !opt_bypassDisposal) {
    model.dispose();
  }
  if (!opt_silent) {
    this.dispatchEvent(new goog.events.Event(
        servo.events.EventType.COLLECTION_UPDATE, this));
  }
};

/**
 * @private
 * @param {servo.Model} model
 */
servo.Collection.prototype.unlistenToModel_ = function (model) {
  this.handler_.unlisten(
    model,
    servo.events.EventType.DELETE,
    this.handleModelDelete_
  );
  this.handler_.unlisten(
    model,
    servo.events.EventType.MODEL_UPDATE,
    this.handleModelUpdate_
  );
  this.handler_.unlisten(
    model,
    servo.events.EventType.REMOVE,
    this.handleModelRemove_
  );
  this.handler_.unlisten(
    model,
    servo.events.EventType.SYNC,
    this.handleModelSync_
  );
};

/**
 * Loop through each model in the collection.
 * @param {!Function} callback
 * @param {Object=} opt_context Optional 'this' object.
 */
servo.Collection.prototype.forEach = function (callback, opt_context) {
  goog.array.forEach(this.root_, callback, opt_context);
};

/**
 * Find model with an index or by id.
 * @param {!servo.Model|number|string} idOrModel
 * @return {number}
 */
servo.Collection.prototype.indexOf = function (idOrModel) {
  return goog.array.indexOf(this.root_, this.getModel_(idOrModel));
};

/**
 * @param {goog.events.Event} event
 * @protected
 */
servo.Collection.prototype.handleSync_ = function (event) {
  if (event.withRemoval) {
    this.removeModelsOnSync_(event);
  }

  goog.array.forEach(event.parsedData, function (modelData) {
    this.addModel(modelData, true);
  }, this);

  this.isLoading_ = false;
  this.hasSynced_ = true;

  this.dispatchEvent(
    new goog.events.Event(servo.events.EventType.COLLECTION_UPDATE, this)
  );
  this.dispatchEvent(
    new servo.events.StoreSyncedEvent(this, event.parsedData)
  );
};

/**
 * @private
 * @param {goog.events.Event} event
 */
servo.Collection.prototype.removeModelsOnSync_ = function (event) {
  var syncIds;

  syncIds = goog.array.map(
    event.parsedData,
    function (item) {
      return item instanceof servo.Model ? item.id() : item['id'];
    }
  );
  goog.array.forEach(
    goog.array.clone(this.root_),
    function (model) {
      var exists;

      exists = goog.array.find(
        syncIds,
        function (item) {
          return item === model.id();
        }
      );
      if (!exists) {
        this.removeModel(model, true);
      }
    },
    this
  );
};

/**
 * @return {string}
 */
servo.Collection.prototype.describe = function () {
  return 'collection';
};

/**
 * Set the Collection to use a different store.
 * @param {!function (new:servo.Store): undefined} store
 */
servo.Collection.prototype.setStore = function (store) {
  goog.dispose(this.store_);
  this.storeClass_ = store;
  this.store_ = new this.storeClass_();
  this.listenToStoreEvents_();
};

/**
 * Handle events that are fired from the store.
 * @protected
 */
servo.Collection.prototype.listenToStoreEvents_ = function () {
  this.handler_.listen(
    this.store_,
    servo.events.EventType.SYNC,
    this.handleSync_
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
 * Map through the collection and return an array. @see goog.array.map
 * @param {Function} f Function that takes three arguments and is applied
 * to each value.
 * @param {Object=} opt_obj Context object for function.
 * @return {!Array}
 */
servo.Collection.prototype.map = function (f, opt_obj) {
  return goog.array.map(goog.array.clone(this.root_), f, opt_obj);
};


/**
 * Filter a collection and return an array. @see goog.array.filter
 * @param {Function} f Function that takes three arguments and is applied
 * to each value.
 * @param {Object=} opt_obj Context object for function.
 * @return {!Array}
 */
servo.Collection.prototype.filter = function (f, opt_obj) {
  return goog.array.filter(goog.array.clone(this.root_), f, opt_obj);
};

/**
 * @param {Array.<string>} ids
 * @return {!Array}
 */
servo.Collection.prototype.filterByIds = function (ids) {
  return this.filter(function (model) {
    return goog.array.contains(ids, model.id());
  });
};

/**
 * Create a shallow clone of a Collection: all the models still refer to the
 * same object in memory.
 * @return {servo.Collection}
 */
servo.Collection.prototype.clone = function () {
  return new (this.collectionClass_)(goog.array.clone(this.root_));
};

/**
 * @return {boolean}
 */
servo.Collection.prototype.isEmpty = function () {
  return this.length() === 0;
};

/**
 * @type {Array}
 * @protected
 */
servo.Collection.prototype.root_ = null;

/**
 * @type {servo.Store}
 * @private
 */
servo.Collection.prototype.store_ = null;

/**
 * @type {goog.events.EventHandler}
 * @private
 */
servo.Collection.prototype.handler_ = null;
