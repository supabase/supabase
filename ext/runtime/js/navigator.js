const {
  ObjectDefineProperties,
  SymbolFor,
} = globalThis.__bootstrap.primordials;

import * as webidl from "ext:deno_webidl/00_webidl.js";

class Navigator {
  constructor() {
    webidl.illegalConstructor();
  }

  [SymbolFor("Deno.privateCustomInspect")](inspect) {
    return `${this.constructor.name} ${inspect({})}`;
  }
}

const navigator = webidl.createBranded(Navigator);

let numCpus, userAgent, language;

function setNumCpus(val) {
  numCpus = val;
}

function setUserAgent(val) {
  userAgent = val;
}

function setLanguage(val) {
  language = val;
}

ObjectDefineProperties(Navigator.prototype, {
  hardwareConcurrency: {
    configurable: true,
    enumerable: true,
    get() {
      webidl.assertBranded(this, NavigatorPrototype);
      return numCpus;
    },
  },
  userAgent: {
    configurable: true,
    enumerable: true,
    get() {
      webidl.assertBranded(this, NavigatorPrototype);
      return userAgent;
    },
  },
  language: {
    configurable: true,
    enumerable: true,
    get() {
      webidl.assertBranded(this, NavigatorPrototype);
      return language;
    },
  },
  languages: {
    configurable: true,
    enumerable: true,
    get() {
      webidl.assertBranded(this, NavigatorPrototype);
      return [language];
    },
  },
});
const NavigatorPrototype = Navigator.prototype;

export { Navigator, navigator, setLanguage, setNumCpus, setUserAgent };
