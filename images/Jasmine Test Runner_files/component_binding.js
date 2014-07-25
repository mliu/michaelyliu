goog.provide('ck.knockout.bindings.component');

ck.knockout.bindings.component = function () {
  function handleComponent(element, valueAccessor, all, viewModel) {
    var onChange, componentObservable, component;

    componentObservable = valueAccessor();
    component = ko.utils.unwrapObservable(componentObservable);

    if (!component) {
      return;
    }

    if (ko.isObservable(componentObservable)) {
      onChange = componentObservable['subscribe'](function (previousComponent) {
        onChange['dispose']();
        previousComponent.dispose();
      }, null, 'beforeChange');
    }

    component.render(element);

    ko.utils.domNodeDisposal.addDisposeCallback(element, goog.bind(component.dispose, component));
  }

  return {
    'update': handleComponent
  };
};

goog.exportSymbol('ko.bindingHandlers.component', ck.knockout.bindings.component());
