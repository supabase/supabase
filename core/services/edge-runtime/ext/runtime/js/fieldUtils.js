import * as console from "ext:deno_console/01_console.js";

const {
  ObjectPrototypeIsPrototypeOf,
  ErrorPrototype,
} = globalThis.__bootstrap.primordials;

function nonEnumerable(value) {
  return {
    value,
    writable: true,
    enumerable: false,
    configurable: true,
  };
}

function writable(value) {
  return {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  };
}

function readOnly(value) {
  return {
    value,
    enumerable: true,
    writable: false,
    configurable: true,
  };
}

function getterOnly(getter) {
  return {
    get: getter,
    set() {},
    enumerable: true,
    configurable: true,
  };
}

function formatException(error) {
  if (ObjectPrototypeIsPrototypeOf(ErrorPrototype, error)) {
    return null;
  } else if (typeof error == "string") {
    return `Uncaught ${
      console.inspectArgs([console.quoteString(error)], {
        colors: false,
      })
    }`;
  } else {
    return `Uncaught ${console.inspectArgs([error], { colors: false })}`;
  }
}

export { formatException, getterOnly, nonEnumerable, readOnly, writable };
