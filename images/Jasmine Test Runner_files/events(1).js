goog.provide('servo.events');
goog.provide('servo.events.EventType');
goog.provide('servo.events.PropertyEvent');
goog.provide('servo.events.ModelUpdateEvent');
goog.provide('servo.events.StoreSyncedEvent');
goog.provide('servo.events.RelatedEvent');
goog.provide('servo.events.ParentSetEvent');
goog.provide('servo.events.PropertiesRelatedEvent');
goog.provide('servo.events.StoreErrorEvent');
goog.provide('servo.events.StoreSuccessEvent');
goog.provide('servo.events.StoreTimeoutEvent');
goog.provide('servo.events.StoreProgressEvent');

goog.require('goog.events.Event');
goog.require('goog.object');
goog.require('goog.array');

/**
 * @enum {string}
 */
servo.events.EventType = {
  ADD: goog.events.getUniqueId('ADD'),
  REMOVE: goog.events.getUniqueId('REMOVE'),
  DELETE: goog.events.getUniqueId('DELETE'),
  SYNC: goog.events.getUniqueId('SYNC'),
  PROPERTY_UPDATE: goog.events.getUniqueId('PROPERTY_UPDATE'),
  MODEL_UPDATE: goog.events.getUniqueId('MODEL_UPDATE'),
  COLLECTION_UPDATE: goog.events.getUniqueId('COLLECTION_UPDATE'),
  COLLECTION_SORT: goog.events.getUniqueId('COLLECTION_SORT'),
  SUCCESS: goog.events.getUniqueId('SUCCESS'),
  ERROR: goog.events.getUniqueId('ERROR'),
  TIMEOUT: goog.events.getUniqueId('TIMEOUT'),
  PROGRESS: goog.events.getUniqueId('PROGRESS')
};

/**
 * An event with the added flag for determining if it resulted from
 *   setting (or updating) by a parent (higher model or collection).
 *   This information is mostly useful internally.
 *
 * @param {string} type Event type.
 * @param {Object} target Reference to the object that is the target of
 *     this event. It has to implement the {@code EventTarget} interface
 *     declared at {@link http://developer.mozilla.org/en/DOM/EventTarget}.
 * @param {boolean=} opt_parentSet Whether or not this event was initiated by
 *     parent setting of properties.
 * @constructor
 * @extends {goog.events.Event}
 */
servo.events.ParentSetEvent = function (type, target, opt_parentSet) {
  goog.base(this, type, target);
  /**
   * @type {boolean}
   */
  this.parentSet = !!opt_parentSet || false;
};
goog.inherits(servo.events.ParentSetEvent, goog.events.Event);

/**
 * An event that also contains a value.
 *
 * @param {Object} target Reference to the object that is the target of
 *     this event. It has to implement the {@code EventTarget} interface
 *     declared at {@link http://developer.mozilla.org/en/DOM/EventTarget}.
 * @param {*} value The value contained in this event.
 * @param {boolean=} opt_parentSet Whether or not this event was initiated by
 *     parent setting of properties.
 * @constructor
 * @extends {servo.events.ParentSetEvent}
 */
servo.events.PropertyEvent = function (target, value, opt_parentSet) {
  goog.base(this, servo.events.EventType.PROPERTY_UPDATE, target, opt_parentSet);
  /**
   * The value contained in this event.
   *
   * @type {*}
   */
   this.value = value;
};
goog.inherits(servo.events.PropertyEvent, servo.events.ParentSetEvent);

/**
 * An update event for models that lists properties changed, and their values.
 *
 * @param {Object} target Reference to the object that is the target of
 *     this event. It has to implement the {@code EventTarget} interface
 *     declared at {@link http://developer.mozilla.org/en/DOM/EventTarget}.
 * @param {!Array.<string>} properties The names of properties changed.
 * @param {!Object} data The native object representation of the data's values.
 * @param {boolean=} opt_parentSet Whether or not this event was initiated by
 *     parent setting of properties.
 * @constructor
 * @extends {servo.events.ParentSetEvent}
 */
servo.events.ModelUpdateEvent = function (target, properties, data, opt_parentSet) {
  goog.base(this, servo.events.EventType.MODEL_UPDATE, target, opt_parentSet);
  /**
   * The properties changed.
   * @type {!Array}
   */
  this.changedProperties = properties;
  /**
   * The model's current data.
   * @type {!Object}
   */
  this.data = data;
};
goog.inherits(servo.events.ModelUpdateEvent, servo.events.ParentSetEvent);

/**
 * An sync event for stores that has parsedData and id if relevant.
 *
 * @param {Object} target Reference to the object that is the target of
 *     this event. It has to implement the {@code EventTarget} interface
 *     declared at {@link http://developer.mozilla.org/en/DOM/EventTarget}.
 * @param {Object=} opt_data Optional parsed data.
 * @param {string|number=} opt_id An optional id.
 * @param {string|number=} opt_oldId An optional old id.
 * @param {boolean=} opt_withRemoval Whether to clear absent entries.
 * @constructor
 * @extends {goog.events.Event}
 */
servo.events.StoreSyncedEvent = function (target, opt_data, opt_id, opt_oldId,
    opt_withRemoval) {
  goog.base(this, servo.events.EventType.SYNC, target);
  if (opt_data !== undefined) {
    /**
     * The parsed data.
     * @type {?Object}
     */
    this.parsedData = opt_data;
  }
  if (opt_id !== undefined) {
    /**
     * An optional id
     * @type {string|number}
     */
    this.id = opt_id;
  }
  if (opt_oldId !== undefined) {
    /**
     * An optional old id (useful for updating id map)
     * @type {string|number}
     */
    this.oldId = opt_oldId;
  }
  /**
   * @type {boolean}
   */
  this.withRemoval = !!opt_withRemoval;
};
goog.inherits(servo.events.StoreSyncedEvent, goog.events.Event);

/**
 * An event that signifies an error has occurred in communicating with the
 * store.  The properties of this event are store-specific; a store that
 * communicates with localStorage can throw different type of errors than a
 * REST API.
 *
 * @param {Object} target Reference to the object that is the target of
 *     this event. It has to implement the {@code EventTarget} interface
 *     declared at {@link http://developer.mozilla.org/en/DOM/EventTarget}.
 * @param {string|Object=} opt_data Optional error information.
 * @param {string|number=} opt_code An optional code to distinguish one class
 *     of error from another.
 * @param {string=} opt_statusText
 * @constructor
 * @extends {goog.events.Event}
 */
servo.events.StoreErrorEvent = function (target, opt_data, opt_code, opt_statusText) {
  goog.base(this, servo.events.EventType.ERROR, target);
  if (opt_data !== undefined) {
    /**
     * Optional error information.
     * @public
     * @type {string|Object}
     */
    this.data = opt_data;
  }
  if (opt_code !== undefined) {
    /**
     * A code that distinguishes one class of error from another.
     * @public
     * @type {string|number}
     */
    this.code = opt_code;
  }
  if (opt_statusText !== undefined) {
    /**
     * @public
     * @type {string}
     */
    this.statusText = opt_statusText;
  }
};
goog.inherits(servo.events.StoreErrorEvent, goog.events.Event);

/**
 * An event that signifies that communicating with the store was successful.
 * This event can be used when a StoreSyncedEvent is not appropriate; for
 * example, receiving a 202 Accepted to an action in a REST API will not
 * update any properties on the model.
 *
 * @param {Object} target Reference to the object that is the target of
 *     this event. It has to implement the {@code EventTarget} interface
 *     declared at {@link http://developer.mozilla.org/en/DOM/EventTarget}.
 * @param {string|Object=} opt_data Optional response information.
 * @constructor
 * @extends {goog.events.Event}
 */
servo.events.StoreSuccessEvent = function (target, opt_data) {
  goog.base(this, servo.events.EventType.SUCCESS, target);
  if (opt_data !== undefined) {
    /**
     * Optional response information.
     * @public
     * @type {string|Object}
     */
    this.data = opt_data;
  }
};
goog.inherits(servo.events.StoreSuccessEvent, goog.events.Event);

/**
 * @param {Object} target
 * @param {Object} data
 * @constructor
 * @extends {goog.events.Event}
 */
servo.events.StoreProgressEvent = function (target, data) {
  goog.base(this, servo.events.EventType.PROGRESS, target);
  /**
    * @public
    * @type {string|Object}
    */
  this.data = data;
};
goog.inherits(servo.events.StoreProgressEvent, goog.events.Event);

/**
 * An event that signifies that communicating with the store timed out.
 * This event does not signify success or failure.  It is up to the store
 * implementation to determine exactly how this event fires and what the
 * follow-up actions are.  For example, one HTTP store might abort an
 * XMLHttpRequest after 10 seconds, while another might keep it alive and show
 * eventual success or failure.
 *
 * @param {Object} target Reference to the object that is the target of
 *     this event. It has to implement the {@code EventTarget} interface
 *     declared at {@link http://developer.mozilla.org/en/DOM/EventTarget}.
 * @constructor
 * @extends {goog.events.Event}
 */
servo.events.StoreTimeoutEvent = function (target) {
  goog.base(this, servo.events.EventType.TIMEOUT, target);
};
goog.inherits(servo.events.StoreTimeoutEvent, goog.events.Event);

/**
 * An event that points to a relatedTarget.
 *
 * @param {string} type Event type.
 * @param {Object} target Reference to the object that is the target of
 *     this event. It has to implement the {@code EventTarget} interface
 *     declared at {@link http://developer.mozilla.org/en/DOM/EventTarget}.
 * @param {Object=} opt_relatedTarget The optional
 *     related target.
 * @param {boolean=} opt_parentSet Whether or not this event was initiated by
 *     parent setting of properties.
 * @constructor
 * @extends {servo.events.ParentSetEvent}
 */
servo.events.RelatedEvent = function (type, target, opt_relatedTarget,
    opt_parentSet) {
  goog.base(this, type, target, opt_parentSet);
  /**
   * The related target.
   * @type {Object}
   */
  this.relatedTarget = opt_relatedTarget || null;
};
goog.inherits(servo.events.RelatedEvent, servo.events.ParentSetEvent);

/**
 * An event that points to a relatedTarget and a list of changedProperties.
 *
 * @param {string} type Event type.
 * @param {Object} target Reference to the object that is the target of
 *     this event. It has to implement the {@code EventTarget} interface
 *     declared at {@link http://developer.mozilla.org/en/DOM/EventTarget}.
 * @param {!Array.<string>} properties The names of properties changed.
 * @param {Object=} opt_relatedTarget The optional
 *     related target.
 * @param {boolean=} opt_parentSet Whether or not this event was initiated by
 *     parent setting of properties.
 * @constructor
 * @extends {servo.events.RelatedEvent}
 */
servo.events.PropertiesRelatedEvent = function (type, target, properties,
      opt_relatedTarget, opt_parentSet) {
  goog.base(this, type, target, opt_relatedTarget, opt_parentSet);
  /**
   * @type {Array.<string>}
   */
  this.changedProperties = properties;
};
goog.inherits(servo.events.PropertiesRelatedEvent, servo.events.RelatedEvent);
