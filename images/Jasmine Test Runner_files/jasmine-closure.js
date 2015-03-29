goog.require('goog.events');
goog.require('goog.dom.query');
goog.require('goog.testing.net.XhrIo');
goog.require('goog.net.XhrIo');
goog.require('goog.array');
goog.require('goog.Uri.QueryData');
goog.require('ck.Logger');
goog.require('ck.data.service.ServiceRegistry');
goog.require('ck.analytics.Tracker');
goog.require('ck.views.View');
goog.require('ck.i18n.timezones.TimeZones');
goog.require('goog.ui.Component');
goog.require('goog.testing.MockClock');
goog.require('ck.knockout.bindings.component');
goog.require('ck.utility.object');
goog.require('ck.data.Providers');

// Subset of Fixture Capability

var setFixtures = function(html) {
  jasmine.getFixtures().set(html);
};

var spyOnEvent = function(target, eventName) {
  jasmine.Closure.events.spyOn(target, eventName);
};

jasmine.getFixtures = function() {
  return jasmine.currentFixtures_ =
    jasmine.currentFixtures_ || new jasmine.Fixtures();
};

jasmine.Fixtures = function() {
  this.containerId = 'jasmine-fixtures';
};

jasmine.Fixtures.prototype.set = function(html) {
  this.cleanUp();
  this.createContainer_(html);
};

jasmine.Fixtures.prototype.cleanUp = function() {
  var ele = document.getElementById(this.containerId);
  if (ele) {
    ele.parentNode.removeChild(ele);
  }
};

jasmine.Fixtures.prototype.createContainer_ = function(html) {
  var container, body;

  container = document.createElement('div');
  container.setAttribute('id', this.containerId);

  if (goog.dom.isElement(html)) {
    container.innerHTML = html.outerHTML;
  } else {
    container.innerHTML = html;
  }

  body = document.getElementsByTagName("body")[0];
  body.appendChild(container);
};

/**
 * This helps with auto disposal of stale elements sitting around after
 * a test that adds elements to the body
 */
jasmine.removeStaleElements = function removeStaleElements() {
  var elements;

  elements = goog.dom.query('#HTMLReporter + *, div[style*="position: absolute"]');
  elements = goog.array.concat(
    goog.array.toArray(elements),
    goog.array.toArray(goog.dom.query('.ck-widgets-popover')),
    goog.array.toArray(goog.dom.query('.ck_modal')),
    goog.array.toArray(goog.dom.query('.ck_dialog'))
  );

  if (elements.length > 0) {
    goog.dom.removeNode(elements[0]);
    removeStaleElements();
  }
};

jasmine.spyOnRouter = function () {
  spyOn(ck.routing.Router, 'getInstance').andReturn({
    navigate: jasmine.createSpy('navigate')
  });
};

jasmine.popovers = (function () {
  var self = {};
  var registeredPopovers = {};

  function fakePopoverRegistrar(popoverType, content, command) {
    var fake = {};

    var registry = {
      popoverType: popoverType,
      content: content,
      command: command
    };

    fake.pointingTo = function (target, layout) {
      registry.target = target;
      registry.layout = layout;
      return fake;
    };

    fake.withModel = function (model) { registry.model = model; return fake; };

    fake.withData = function (data) { registry.data = data; return fake; };

    fake.isModal = function (modal) { registry.modal = modal; return fake; };

    fake.on = function (event, source, opt_data) {
      registry.event = event;
      registry.source = source;
      if (opt_data) { registry.data = opt_data; }
      return registry;
    };

    return fake;
  }

  function registerPopover(componentId, registry) {
    if (!registeredPopovers[componentId]) {
      registeredPopovers[componentId] = [];
    }
    registeredPopovers[componentId].push(registry);
  }

  self.spyOnPopoverRegistration = function (viewComponent) {
    if (!viewComponent.hasPopover.isSpy) {
      spyOn(viewComponent, 'hasPopover').andCallFake(function (popoverType, content, command) {
        var componentId, popoverRegistrar, originalOn;
        componentId = goog.getUid(this);
        popoverRegistrar = fakePopoverRegistrar(popoverType, content, command);

        popoverRegistrar.__on__ = popoverRegistrar.on;
        popoverRegistrar.on = function (event, source, opt_data) {
          var registry;
          registry = goog.object.clone(popoverRegistrar.__on__(event, source, opt_data));
          registerPopover(componentId, registry);
          return popoverRegistrar;
        };

        return popoverRegistrar;
      });
    }
  };

  self.withContentAndCommand = function (popoverType, content, command) {
    return fakePopoverRegistrar(popoverType, content, command);
  };

  self.registeredPopovers = function (component) {
    var uid;
    uid = goog.getUid(component);
    return registeredPopovers[uid] || [];
  };

  self.clearRegisteredPopovers = function () {
    registeredPopovers = [];
  };

  return self;
}) ();

var spyOnPopoverRegistration = jasmine.popovers.spyOnPopoverRegistration;
var withContentAndCommand = jasmine.popovers.withContentAndCommand;

jasmine.Closure = {};

(function (namespace) {
  var data = {
    spiedEvents:     {},
    handlers:        [],
    targetReference: []
  };

  function getTargetReferenceIndex(target) {
    return goog.array.indexOf(data.targetReference, target);
  }

  namespace.events = {
    spyOn: function(target, eventName) {
      data.targetReference.push(target);
      var handler = function(e) {
        data.spiedEvents[[getTargetReferenceIndex(target), eventName]] = e;
      };
      goog.events.listen(target, eventName, handler);
      data.handlers.push(handler);
    },
    wasTriggered: function(target, eventName) {
      return !!(data.spiedEvents[[getTargetReferenceIndex(target), eventName]]);
    },
    triggeredEvent: function(target, eventName) {
      return data.spiedEvents[[getTargetReferenceIndex(target), eventName]];
    },
    cleanUp: function() {
      data.spiedEvents     = {};
      data.handlers        = [];
      data.targetReference = [];
    }
  };
}(jasmine.Closure));

// Replace ko's apply bindings to check for null elements and prevent
// leaking view models in unit tests.
ko.__ko_apply_bindings__ = ko.applyBindings;
ko.applyBindings = function (viewModel, element) {
  if (!element) {
    throw new Error("Trying to apply bindings to the whole body! Did you forget the second argument for 'applyBindings'?");
  }
  return ko.__ko_apply_bindings__(viewModel, element);
};

// Spies that should survive name mangling
// (but currently don't :()
var spyOnProperty = function (obj, prop) {
  for (var propName in obj) {
    if (obj[propName] === prop) {
      return spyOn(obj, propName);
    }
  }

  throw Error("Property was not found on object");
};

var setCurrentTimeZone = function (tz) {
  var timezones = ck.i18n.timezones.TimeZones.getInstance();
  spyOn(timezones, 'currentTimeZone').andReturn(timezones.get(tz));
};

var lastXhr = function () {
  return goog.array.peek(goog.testing.net.XhrIo.getSendInstances());
};

var lastXhrDataAsJSON = function () {
  var xhr, requestData;
  xhr = lastXhr();
  if (!goog.isDefAndNotNull(xhr)) {
    return null;
  }
  requestData = new goog.Uri.QueryData(xhr.getLastContent());
  return requestData.get('data') && JSON.parse(requestData.get('data'));
};

// This function exists because goog.testing.events.fireClickEvent does not
// work with knockout events applied to dom elements. You can use this to test
// Knockout functionality
var clickOnElement = function (element) {
  var clickEvent;

  clickEvent = document.createEvent('MouseEvent');
  clickEvent.initEvent('click', null, null); // firefox requires a minimum of 3 arguments, IE and chrome don't complain
  element.dispatchEvent(clickEvent);
};

var using = function(name, values, func) {
  var that;
  that = this;

  goog.array.forEach(values, function(value) {
    var args = goog.array.flatten([value]);

    describe(
      name + ' (using "' + args.join(', ') + '")',
      func.bind.apply(func, [that].concat(args))
    );
  });
};

// Mock Clock for time-based tests
var mockClock;

// Global Service Registry Test Wiring

var testServiceRegistryDependencies = [];
var fakeRegistry = {};
var loadedContexts = [];

var addTestDependency = function (result, var_args) {
  var args;

  args = Array.prototype.slice.call(arguments, 1);

  // Allow redefining of test dependencies
  goog.array.removeIf(testServiceRegistryDependencies, function (dependency) {
    return goog.array.equals(dependency.args, args);
  });

  if (args[0] === ck.data.Providers && result instanceof servo.Collection) {
    ck.data.Providers.instance_ =  new ck.data.Providers();
    result.forEach(function (provider) {
      ck.data.Providers.getInstance().addModel(provider);
    });
  }

  testServiceRegistryDependencies.push({
    args: args,
    result: result
  });
};

var loadAllDependencies = function () {
  // forces listenForDependencies to be called for all ViewComponents
  mockClock.tick();

  goog.array.forEach(fakeRegistry.requireHandlers, function (handler) {
    var context, alreadyLoaded;

    if (!goog.isDefAndNotNull(handler.context)) {
      handler.onLoaded();
      return;
    }

    alreadyLoaded = goog.array.contains(loadedContexts, goog.getUid(handler.context));
    if (!alreadyLoaded) {
      handler.onLoaded.apply(handler.context);
      loadedContexts.push(goog.getUid(handler.context));
    }
  });
};

beforeEach(function () {
  mockClock = new goog.testing.MockClock(true);

  goog.global['FEATURES'] = {};
  goog.global['REACH_BASE_PATH'] = '/cloud/000';
  setCurrentTimeZone('America/New_York');
  goog.object.forEach(ko.validation.registeredValidators, function (validator, name) {
    var original;
    original = ko.validation.registeredValidators[name];
    spyOn(ko.validation.registeredValidators, name).andCallFake(function () {
      var result;
      result = original.apply(ko.validation.registeredValidators, arguments);
      result.name = name;
      result.args = arguments;
      return result;
    });
  });

  var objectDiffEnabled = (navigator && navigator.userAgent.indexOf('PhantomJS') === -1);

  // https://code.google.com/p/closure-library/issues/detail?id=109&start=100
  goog.testing.net.XhrIo.prototype.isSuccess = goog.net.XhrIo.prototype.isSuccess;
  goog.testing.net.XhrIo.prototype.isLastUriEffectiveSchemeHttp_ = goog.functions.constant(true);

  goog.net.XhrIo = goog.testing.net.XhrIo;
  goog.global['_csrf_token'] = goog.global['_csrf_token'] || 'test_csrf_token';
  goog.global['SOCKET_IO_CONNECTIONS'] = [['domain', 100]];

  // Globally stub out globals that would make testing awkward

  spyOn(ck.Logger, 'getInstance').andReturn({
    info: jasmine.createSpy('info'),
    error: jasmine.createSpy('error'),
    debug: jasmine.createSpy('debug'),
    warn: jasmine.createSpy('warn')
  });

  spyOn(ck.analytics.Tracker, 'getInstance').andReturn({
    start: jasmine.createSpy('start'),
    trackPageView: jasmine.createSpy('trackPageView'),
    trackCustomerInfo: jasmine.createSpy('trackCustomerInfo'),
    trackConversion: jasmine.createSpy('trackConversion'),
    trackAddToCart: jasmine.createSpy('trackAddToCart'),
    trackCheckout: jasmine.createSpy('trackCheckout'),
    trackClick: jasmine.createSpy('trackClick'),
    startTransaction: jasmine.createSpy('startTransaction'),
    completeTransaction: jasmine.createSpy('completeTransaction'),
    createOrder: jasmine.createSpy('createOrder'),
    trackDialogDisplay: jasmine.createSpy('trackDialogDisplay'),
    trackElementView: jasmine.createSpy('trackElementView')
  });

  spyOn(ck.views.View.prototype, 'setAnalyticsPage').andCallThrough();
  spyOn(ck.views.View.prototype, 'setAnalyticsCategory').andCallThrough();

  jasmine.popovers.clearRegisteredPopovers();

  jasmine.getEnv().currentSpec.__lets__ = {};

  // Globally stub out Service Registry and make addTestDependency work

  function fakeGetDependency() {
    var args, matched;

    args = Array.prototype.slice.call(arguments);
    matched = goog.array.find(testServiceRegistryDependencies, function (dep){
      return goog.array.equals(args, dep.args);
    });

    if (!matched) {
      console.log('Specified dependencies', args);
      console.log('All dependencies', testServiceRegistryDependencies);
      console.trace();

      throw new Error('Dependency not found for ' + args.join(','));
    }

    return matched.result;
  }

  function fakeRequire(dependencies, onLoaded, onError, onTimeout, context) {
    var matched, serviceRegistry, dependency;

    fakeRegistry.requireHandlers.push({
      onLoaded: onLoaded,
      context: context
    });

    matched = goog.array.find(testServiceRegistryDependencies, function (deps) {
      return goog.array.equals(dependencies[0], deps.args);
    });
    dependency = matched && matched.result;
    if (dependency && (dependency.attachEvent || dependency.handler_)) {
      serviceRegistry = ck.data.service.ServiceRegistry.getInstance();
      onLoaded && new goog.events.EventHandler(serviceRegistry).listen(
        dependency,
        servo.events.EventType.SYNC,
        goog.bind(onLoaded, context)
      );
      onError && new goog.events.EventHandler(serviceRegistry).listen(
        dependency,
        servo.events.EventType.ERROR,
        goog.bind(onError, context)
      );
      onTimeout && new goog.events.EventHandler(serviceRegistry).listen(
        dependency,
        servo.events.EventType.TIMEOUT,
        goog.bind(onTimeout, context)
      );
    }
  }
  testServiceRegistryDependencies = [];
  fakeRegistry = {
    getDependency: jasmine.createSpy('getDependency').andCallFake(fakeGetDependency),
    require: jasmine.createSpy('require').andCallFake(fakeRequire),
    requireHandlers: []
  };
  spyOn(ck.data.service.ServiceRegistry, 'getInstance').andReturn(fakeRegistry);

  ck.views.ViewComponent.prototype.serviceRegistry_ = fakeRegistry;
  spyOn(ck.views.ViewComponent.prototype, 'addAggregateDependency');

  spyOn(ck.data.service.PollingOrchestrator, 'getInstance').andReturn({
    register: jasmine.createSpy('register'),
    unregister: jasmine.createSpy('unregister')
  });

  function verifyPayload(context, expectedPayload) {
    context.message = function () {
      return [
        'Expected payload '+ jasmine.pp(context.actual.getLastContent()) + ' to be ' + expectedPayload,
        'Expected payload '+ jasmine.pp(context.actual.getLastContent()) + ' not to be ' + expectedPayload
      ];
    };
    return context.actual.getLastContent() === expectedPayload;
  }

  function messages(positive, negative) {
    return function () {
      return [positive, negative];
    };
  }

  function compare(expected, actual) {
    return objectDiff.diffOwnProperties(
      expected,
      actual,
      ['superClass_']
    );
  }

  function buildHtmlDiff(message, diff) {
    var pre = document.createElement('pre');
    pre.className = 'diff-holder';

    pre.innerHTML = [
      '<div>',
      message,
      '<small>&nbsp;<del class="diff">actual</del><span> x </span><ins class="diff">expected</ins></small>',
      '</div>',
      objectDiff.convertToXMLString(diff)
    ].join('');
    return pre;
  }

  function buildHtmlManyDiffs(message, diffs) {
    var pre, htmlDiffs;
    var pre = document.createElement('pre');
    pre.className = 'diff-holder';

    htmlDiffs = diffs.map(objectDiff.convertToXMLString).map(function (htmlDiff, index) {
      return [
        '<div>Diff #',
        index,
        '<small>&nbsp;<del class="diff">actual</del><span> x </span><ins class="diff">expected</ins></small>',
        '</div>',
        htmlDiff
      ].join('');
    });

    pre.innerHTML = [
      '<div>',
      message,
      '</div>',
    ].concat(htmlDiffs).join('');
    return pre;
  }

  objectDiffEnabled && this.addMatchers({
    toEqual: function (expected) {
      var diff = compare(this.actual, expected);
      this.message = function() {
        return [
          buildHtmlDiff('Expected values to be equal.', diff),
          buildHtmlDiff('Expected values not to be equal.', diff)
        ];
      };
      return this.env.equals_(this.actual, expected);
    },

    toHaveBeenCalledWith: function () {
      var expectedArgs = jasmine.util.argsToArray(arguments);
      if (!jasmine.isSpy(this.actual)) {
        throw new Error('Expected a spy, but got ' + jasmine.pp(this.actual) + '.');
      }

      if (this.actual.argsForCall.length > 0) {
        this.message = function() {
          var allDiffs = this.actual.argsForCall.map(function (args) {
            return compare(args, expectedArgs);
          });

          return [
            buildHtmlManyDiffs(
              'Expected spy "' + this.actual.identity + '" to have been called with specified args. See actual calls below.',
              allDiffs
            ),
            'Expected spy "' + this.actual.identity + '" not to have been called with ' + jasmine.pp(expectedArgs) + ' but it was.'
          ];
        };
      }

      return this.env.contains_(this.actual.argsForCall, expectedArgs);
    }
  });

  function mockGlimpse() {
    var glimpseComponent = {
      hide: jasmine.createSpy('glimpseComponent.hide')
    };

    var glimpseGraph = {
      config: jasmine.createSpy('glimpseGraph.config'),
      render: jasmine.createSpy('glimpseGraph.render'),
      state:  jasmine.createSpy('glimpseGraph.state'),
      component:  jasmine.createSpy('glimpseGraph.component').andReturn(glimpseComponent)
    };

    var graphBuilder = {
      create: jasmine.createSpy('graphBuilder.create').andReturn(glimpseGraph)
    };

    goog.global['glimpse'] = {
      graphBuilder: jasmine.createSpy('glimpse.graphBuilder').andReturn(graphBuilder)
    };
  }
  mockGlimpse();

  this.addMatchers({

    toInclude: function (obj) {
      this.message = function () {
        return [
          "Expected object " + jasmine.pp(this.actual) + " to include " + jasmine.pp(obj),
          "Expected object " + jasmine.pp(this.actual) + " not to include " + jasmine.pp(obj)
        ];
      };

      return goog.array.find(this.actual, function (e) { return e === obj; });
    },

    toEqualArray: function (array) {
      this.message = function () {
        return [
          "Expected object " + jasmine.pp(this.actual) + " to be " + jasmine.pp(array),
          "Expected object " + jasmine.pp(this.actual) + " not to be " + jasmine.pp(array)
        ];
      };

      return goog.array.equals(this.actual, array);
    },

    toStartWith: function (str) {
      return this.actual.indexOf(str) === 0;
    },

    toHaveId: function (elementId) {
      return this.actual.getAttribute('id') === elementId;
    },

    toHaveBeenCalledWithNoArguments: function () {
      if (!jasmine.isSpy(this.actual)) {
        throw new Error('Expected a spy, but got ' + jasmine.pp(this.actual) + '.');
      }

      this.message = function() {
        return [
          'Expected spy "' + this.actual.identity + '" to have been called with no arguments, but it was actually called ' + this.actual.callCount + ' times with ' + jasmine.pp(this.actual.argsForCall),
          'Expected spy "' + this.actual.identity + '" to have been called with some arguments but it was not.'
        ];
      };

      return this.actual.callCount !== 0 &&
        this.env.contains_(this.actual.argsForCall, []);
    },

    toHaveBeenCalledExactlyOnce: function () {
      this.message = function () {
        return [
          'Expected function ' + jasmine.pp(this.actual) + ' to have been called exactly once, but was called ' + this.actual.callCount + ' times',
          'Expected function ' + jasmine.pp(this.actual) + ' not to have been called exactly once'
        ];
      };

      return this.actual.callCount === 1;
    },

    toHaveBeenCalledExactlyTwice: function () {
      this.message = function () {
        return [
          'Expected function ' + jasmine.pp(this.actual) + ' to have been called exactly twice, but was called ' + this.actual.callCount + ' times',
          'Expected function ' + jasmine.pp(this.actual) + ' not to have been called exactly twice'
        ];
      };

      return this.actual.callCount === 2;
    },

    toHaveBeenCalledExactly: function (count) {
      this.message = function () {
        return [
          'Expected function ' + jasmine.pp(this.actual) + ' to have been called exactly ' + count + ' times, but was called ' + this.actual.callCount + ' times',
          'Expected function ' + jasmine.pp(this.actual) + ' not to have been called exactly ' + count + 'times'
        ];
      };

      return this.actual.callCount === count;
    },

    toBeAnInstanceOf: function (selector) {
      this.message = function () {
        return [
          "Expected object " + jasmine.pp(this.actual) + " to be an instance of " + selector,
          "Expected object " + jasmine.pp(this.actual) + " not to be an instance of " + selector
        ];
      };

      return this.actual instanceof selector;
    },

    toHaveTagName: function (selector) {
      this.message = function () {
        return [
          'Expected object ' + jasmine.pp(this.actual) + ' to have tag name ' + selector + ', had ' + this.actual.tagName,
          'Expected object ' + jasmine.pp(this.actual) + ' not to have tag name ' + selector + ', had ' + this.actual.tagName
        ];
      };
      return this.actual.tagName === selector;
    },

    toHaveChild: function (component) {
      this.message = function () {
        return [
          "Expected component to have child " + jasmine.pp(component),
          "Expected component not to have child " + jasmine.pp(component)
        ];
      };
      return this.actual.getChild(component.getId()) !== null;
    },

    toHaveChildWithContent: function (content) {
      this.message = function () {
        return [
          "Expected component to have child with content " + jasmine.pp(content),
          "Expected component not to have child with content " + jasmine.pp(content)
        ];
      };
      return goog.array.find(this.actual.children_, function (child) {
        return child.getContent() === content;
      });
    },

    toHaveClass: function (selector) {
      this.message = function () {
        return [
          'Expected object ' + jasmine.pp(this.actual) + ' to have class "' + selector + '" had "' + this.actual.className + '"',
          'Expected object ' + jasmine.pp(this.actual) + ' not to have class "' + selector + '" had "' + this.actual.className + '"'
        ];
      };
      return goog.dom.classes.has(this.actual, selector);
    },

    toHaveElement: function (selector) {
      this.message = function () {
        return [
          "Expected container to have element matching " + jasmine.pp(selector),
          "Expected container not to have element matching " + jasmine.pp(selector)
        ];
      };
      return !!goog.dom.query(selector, this.actual)[0];
    },

    toBeVisible: function () {
      this.message = function () {
        return [
          "Expected object " + jasmine.pp(goog.dom.getOuterHtml(this.actual)) + " to be visible",
          "Expected object " + jasmine.pp(goog.dom.getOuterHtml(this.actual)) + " not to be visible"
        ];
      };

      return goog.style.isElementShown(this.actual);
    },

    toBeFocused: function () {
      this.message = function () {
        return [
          "Expected object " + jasmine.pp(goog.dom.getOuterHtml(this.actual)) + " to be focused",
          "Expected object " + jasmine.pp(goog.dom.getOuterHtml(this.actual)) + " not to be focused"
        ];
      };

      return document.activeElement === this.actual;
    },

    toBeDisabled: function () {
      this.message = function () {
        return [
          "Expected object " + jasmine.pp(goog.dom.getOuterHtml(this.actual)) + " to be disabled",
          "Expected object " + jasmine.pp(goog.dom.getOuterHtml(this.actual)) + " not to be disabled"
        ];
      };

      return this.actual.disabled === true;
    },

    toBeElement: function () {
      this.message = function () {
        return [
          'Expected object ' + jasmine.pp(this.actual) + ' to be an element',
          'Expected object ' + jasmine.pp(this.actual) + ' not to be an element'
        ];
      };
      return goog.dom.isElement(this.actual);
    },

    toBeDisposed: function () {
      this.message = function () {
        return [
          'Expected object to be disposed.',
          'Expected object not to be disposed.'
        ];
      };
      return this.actual.isDisposed && this.actual.isDisposed();
    },

    toHaveBeenTriggeredOn: function(target) {
      this.message = function() {
        return [
          "Expected event " + jasmine.pp(this.actual) + " to have been triggered on " +
            target,
          "Expected event " + jasmine.pp(this.actual) + " not to have been triggered on " +
            target
        ];
      };
      return jasmine.Closure.events.wasTriggered(target, this.actual);
    },

    toHaveTextContent: function (text) {
      this.message = function() {
        return [
          'Expected object ' + jasmine.pp(goog.dom.getOuterHtml(this.actual)) + ' to contain text \'' + text +
            '\', actually contained \'' + goog.dom.getTextContent(this.actual) + '\'',
          'Expected object ' + jasmine.pp(goog.dom.getOuterHtml(this.actual)) + ' not to contain text \'' + text +
            '\', actually contained \'' + goog.dom.getTextContent(this.actual) + '\''
        ];
      };
      return goog.dom.getTextContent(this.actual).replace(/\n/g, ' ') === text;
    },

    toLinkTo: function (href) {
      var actual = function () {
        return this.actual.getAttribute('href');
      }.bind(this);

      this.message = function() {
        return [
          'Expected element ' + jasmine.pp(goog.dom.getOuterHtml(this.actual)) + ' to contain href \'' + href +
            '\', actually contained \'' + actual() + '\'',
          'Expected element ' + jasmine.pp(goog.dom.getOuterHtml(this.actual)) + ' not to contain href \'' + href +
            '\', actually contained \'' + actual() + '\''
        ];
      };
      return actual() === href;
    },

    toHaveOption: function (expectedValue, expectedContent) {
      this.message = function() {
        return [
          "Expected object " + jasmine.pp(goog.dom.getOuterHtml(this.actual)) + ' to have (value: "' +
            expectedValue + '", content: "' + expectedContent + '")'
          ,
          'Expected object ' + jasmine.pp(goog.dom.getOuterHtml(this.actual)) + ' not to have (value: "' +
            expectedValue + '", content: "' + expectedContent + '")'
          ,
        ];
      };

      return goog.array.some(goog.dom.getChildren(this.actual), function (option) {
        return option.getAttribute('value') === expectedValue && goog.dom.getTextContent(option) === expectedContent;
      });
    },

    toHaveValue: function (value) {
      this.message = function() {
        return [
          "Expected object " + jasmine.pp(goog.dom.getOuterHtml(this.actual)) + " to have value '" +
            value + "', actually contained '" +
            goog.dom.forms.getValue(this.actual) + "'",
          "Expected object " + jasmine.pp(goog.dom.getOuterHtml(this.actual)) + " not to have value '" +
            value + "', had value '" +
            goog.dom.forms.getValue(this.actual) + "'"
        ];
      };

      return goog.dom.forms.getValue(this.actual) === value;
    },

    toHaveTextContents: function (contents) {
      var actualContents = goog.array.map(this.actual, function (element) {
        return goog.dom.getTextContent(element);
      });

      this.message = function () {
        return [
          'Expected elements to contain texts \'[' + contents +
            ']\', actually contained \'[' + actualContents + ']\'',
          'Expected elements not to contain texts \'[' + contents +
            ']\', actually contained \'[' + actualContents + ']\''
        ];
      };

      return goog.array.equals(actualContents, contents);
    },

    toHavePayload: function (payload) {
      return verifyPayload(this, payload);
    },

    toHavePayloadForProxy: function (data) {
      var expectedPayload;

      expectedPayload = new goog.Uri.QueryData();
      expectedPayload.add("csrfmiddlewaretoken", goog.global['_csrf_token']);

      if (data) {
        expectedPayload.add("data", JSON.stringify(data));
      }

      return verifyPayload(this, expectedPayload.toString());
    },

    toHaveUri: function (expectedUri) {
      this.message = function () {
        return [
          'Expected uri '+ jasmine.pp(this.actual.getLastUri()) + ' to be ' + expectedUri,
          'Expected uri '+ jasmine.pp(this.actual.getLastUri()) + ' not to be ' + expectedUri
        ];
      };
      return this.actual.getLastUri() === expectedUri;
    },

    toContainQueryParamWithValue: function (key, value) {
      var actualUri;

      this.message = function () {
        return [
          'Expected  '+ jasmine.pp(this.actual) + ' to have query param ' + key + '=' + value,
          'Expected  '+ jasmine.pp(this.actual) + ' not to query param ' + key + '=' + value
        ];
      };

      actualUri = new goog.Uri(this.actual);
      return actualUri.getQueryData().get(key) === value;
    },

    toHaveMethod: function (method) {
      this.message = function () {
        return [
          'Expected method '+ jasmine.pp(this.actual.getLastMethod()) + ' to be ' + method,
          'Expected method '+ jasmine.pp(this.actual.getLastMethod()) + ' not to be ' + method
        ];
      };

      return this.actual.getLastMethod() === method;
    },

    toHaveRequestHeader: function (header, value) {
      this.message = function () {
        return [
          'Expected  '+ jasmine.pp(this.actual.getLastRequestHeaders()) + ' to have header ' + header + ' set to ' + value,
          'Expected  '+ jasmine.pp(this.actual.getLastRequestHeaders()) + ' not to have header ' + header + ' set to ' + value
        ];
      };

      return this.actual.getLastRequestHeaders()[header] === value;
    },

    toBeGreaterThan: function (number) {
      this.message = function () {
        return [
          "Expect " + this.actual + " to be grater than " + number + ".",
          "Expect " + this.actual + " not to be grater than " + number + "."
        ];
      };
      return this.actual > number;
    },

    toBeLessThan: function (number) {
      this.message = function () {
        return [
          "Expect " + this.actual + " to be less than " + number + ".",
          "Expect " + this.actual + " not to be less than " + number + "."
        ];
      };
      return this.actual < number;
    },

    toHaveValidator: function (expectedValidator) {
      var validatorKey, expectedValidatorDefinition, hasValidator, existingValidatorDefinitions;

      validatorKey = goog.object.getKeys(expectedValidator)[0];

      expectedValidatorDefinition = {
        name: validatorKey,
        args: expectedValidator[validatorKey]
      };

      existingValidatorDefinitions = goog.array.map(this.actual.__validators__ || [], function (v) {
        return { name: v.name, args: v.args };
      });

      hasValidator = !!goog.array.find(existingValidatorDefinitions || [], function (validator) {
        return this.env.equals_(validator, expectedValidatorDefinition);
      });

      var diff = compare(existingValidatorDefinitions, [expectedValidatorDefinition]);
      this.message = function() {
        return [
          buildHtmlDiff('Expected observable to have validator.', diff),
          buildHtmlDiff('Expected observable not to have validator.', diff)
        ];
      };

      return hasValidator;
    },

    toValidateAfter: function (validatesAfter) {
      var foundCount, expectedCount;

      expectedCount = validatesAfter.length;
      foundCount = goog.array.reduce(validatesAfter, function (accumulator, dependentObservable) {
        var found;

        found = goog.array.some(dependentObservable.__validates__ || [], function (foundKey) {
          return this.env.equals_(this.actual, foundKey)
        }, this)

        return found ? accumulator + 1 : accumulator;
      }, 0, this);

      this.message = function () {
        return [
          goog.string.subs(
            'Expected observable to validate after %s observables; validated after %s',
            expectedCount,
            foundCount
          ), goog.string.subs(
            'Expected observable not to validate after %s observables',
            expectedCount
          )
        ]
      }

      return (expectedCount === foundCount)
    },

    toHavePopover: function (expectedRegister) {
      var component, componentPopovers;
      component = this.actual;
      componentPopovers = jasmine.popovers.registeredPopovers(component);

      if (componentPopovers.length === 0) {
        this.message = function () {
          return 'Expected component to have popover with definition: ' + jasmine.pp(expectedRegister) + ', but no popovers were registered.';
        };
      } else if (objectDiffEnabled) {
        this.message = function () {
          var allDiffs = componentPopovers.map(function (popover) {
            return compare(popover, expectedRegister);
          });

          return [
            buildHtmlManyDiffs(
              'Expected component to have popover with specified definition. See actual registered popovers below.',
              allDiffs
            ),
            'Expected component not to have popover with definition: ' + jasmine.pp(expectedRegister) + ', but it did'
          ];
        };
      } else {
        this.message = function () {
          return [
            'Expected component to have popover with definition: ' + jasmine.pp(expectedRegister) + ', but it had ' + jasmine.pp(componentPopovers),
            'Expected component not to have popover with definition: ' + jasmine.pp(expectedRegister) + ', but it did.'
          ];
        };
      }

      return goog.array.some(componentPopovers, function (actualRegister) {
        return actualRegister &&
        actualRegister.content === expectedRegister.content &&
        actualRegister.command === expectedRegister.command &&
        actualRegister.target === expectedRegister.target &&
        actualRegister.layout === expectedRegister.layout &&
        this.env.equals_(actualRegister.model, expectedRegister.model) &&
        this.env.equals_(actualRegister.data, expectedRegister.data) &&
        actualRegister.isModal === expectedRegister.isModal &&
        actualRegister.event === expectedRegister.event &&
        actualRegister.source === expectedRegister.source;
      });
    },

    toHaveListItemWith: function (label, elementId) {
      var detailsList, hasListItem;
      detailsList = this.actual.getDetailsList();
      hasListItem = false;
      detailsList.forEachChild(function (childComponent) {
        var hasLabel, hasElementId, hasBindings;
        hasLabel = this.env.equals_(label, childComponent.getLabel());
        hasElementId = this.env.equals_(elementId, childComponent.getElementId());
        hasListItem = hasListItem || (hasLabel && hasElementId);
      });

      return hasListItem;
    },

    toHaveFormItemWith: function (label, elementId, opt_bindings) {
      var hasFormItem, flattenedBindings;

      hasFormItem = false;
      flattenedBindings = ck.utility.object.flattenBindings(opt_bindings || {});

      this.actual.forEachChild(function (childComponent) {
        var hasLabel, hasElementId, hasBindings, hasBindings;
        if (childComponent instanceof ck.views.create.FormItem) {
          hasLabel = this.env.equals_(label, childComponent.getLabel());
          hasElementId = this.env.equals_(elementId, childComponent.getElementId());
          hasBindings = this.env.equals_(
            flattenedBindings,
            ck.utility.object.flattenBindings(childComponent.getBindings())
          );
        }
        hasFormItem = hasFormItem || (hasLabel && hasElementId && hasBindings);
      });

      return hasFormItem;
    },

    toHaveSectionWith: function (sectionTitle, pageTitle) {
      return goog.array.some(this.actual.getChildIds(), function (childId) {
        var childComponent, hasSectionTitle, hasPageTitle;
        childComponent = this.actual.getChild(childId);
        hasSectionTitle = goog.isFunction(childComponent.getSectionTitle) && this.env.equals_(sectionTitle, childComponent.getSectionTitle());
        hasPageTitle = true;
        if (goog.isDefAndNotNull(pageTitle)) {
          hasPageTitle = goog.isFunction(childComponent.getPageTitle) && this.env.equals_(pageTitle, childComponent.getPageTitle());
        }
        return hasSectionTitle && hasPageTitle;
      }, this);
    },

    toHaveHeader: function (label) {
      var header;
      header = this.actual.getHeader();
      return header.getLabel() === label;
    },

    toBeAttachedAndDisplayed: function () {
      var element, body, parentNode;
      element = this.actual;
      body = goog.dom.query('body')[0];
      parentNode = element;
      while (parentNode !== null && parentNode !== body) {
        parentNode = parentNode.parentNode;
      }

      return parentNode === body && goog.style.isElementShown(element);
    }
  });
});

beforeEach(function () {
  goog.Disposable.INCLUDE_STACK_ON_CREATION = false;
  goog.Disposable.MONITORING_MODE = goog.Disposable.MonitoringMode.INTERACTIVE;
  goog.Disposable.clearUndisposedObjects();
});

afterEach(function () {
  goog.testing.net.XhrIo.cleanup();
  jasmine.getFixtures().cleanUp();
  jasmine.Closure.events.cleanUp();
  goog.events.removeAll();

  goog.array.forEach(goog.Disposable.getUndisposedObjects(), function (obj) {
    if (obj instanceof goog.ui.Component) {
      obj.dispose();
    }
  });

  jasmine.removeStaleElements();
});

