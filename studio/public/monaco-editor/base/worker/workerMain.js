/*!-----------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Version: 0.37.0(20c3f8ff1e9176c954b34c052b2a84358d41a030)
 * Released under the MIT license
 * https://github.com/microsoft/vscode/blob/main/LICENSE.txt
 *-----------------------------------------------------------*/ ;(function () {
  var Y = [
      'require',
      'exports',
      'vs/editor/common/core/range',
      'vs/editor/common/core/position',
      'vs/base/common/errors',
      'vs/base/common/strings',
      'vs/editor/common/core/offsetRange',
      'vs/editor/common/diff/algorithms/diffAlgorithm',
      'vs/base/common/platform',
      'vs/base/common/event',
      'vs/base/common/assert',
      'vs/base/common/lifecycle',
      'vs/base/common/objects',
      'vs/base/common/uri',
      'vs/base/common/functional',
      'vs/base/common/iterator',
      'vs/base/common/linkedList',
      'vs/base/common/diff/diff',
      'vs/base/common/types',
      'vs/base/common/uint',
      'vs/editor/common/core/characterClassifier',
      'vs/editor/common/core/lineRange',
      'vs/editor/common/core/wordHelper',
      'vs/editor/common/diff/linesDiffComputer',
      'vs/base/common/stopwatch',
      'vs/nls',
      'vs/base/common/arrays',
      'vs/base/common/cache',
      'vs/base/common/diff/diffChange',
      'vs/base/common/keyCodes',
      'vs/base/common/lazy',
      'vs/base/common/hash',
      'vs/base/common/codicons',
      'vs/editor/common/core/selection',
      'vs/editor/common/core/wordCharacterClassifier',
      'vs/editor/common/diff/algorithms/joinSequenceDiffs',
      'vs/editor/common/diff/algorithms/myersDiffAlgorithm',
      'vs/editor/common/diff/algorithms/utils',
      'vs/editor/common/diff/algorithms/dynamicProgrammingDiffing',
      'vs/editor/common/diff/smartLinesDiffComputer',
      'vs/editor/common/diff/standardLinesDiffComputer',
      'vs/editor/common/diff/linesDiffComputers',
      'vs/editor/common/languages/linkComputer',
      'vs/editor/common/languages/supports/inplaceReplaceSupport',
      'vs/editor/common/model',
      'vs/editor/common/model/prefixSumComputer',
      'vs/editor/common/model/mirrorTextModel',
      'vs/editor/common/model/textModelSearch',
      'vs/editor/common/services/unicodeTextModelHighlighter',
      'vs/editor/common/standalone/standaloneEnums',
      'vs/nls!vs/base/common/platform',
      'vs/base/common/process',
      'vs/base/common/path',
      'vs/base/common/cancellation',
      'vs/editor/common/tokenizationRegistry',
      'vs/editor/common/languages',
      'vs/editor/common/services/editorBaseApi',
      'vs/nls!vs/base/common/worker/simpleWorker',
      'vs/base/common/worker/simpleWorker',
      'vs/editor/common/services/editorSimpleWorker',
    ],
    X = function (x) {
      for (var n = [], R = 0, D = x.length; R < D; R++) n[R] = Y[x[R]]
      return n
    }
  const Ee = this,
    Re = typeof global == 'object' ? global : {}
  var ae
  ;(function (x) {
    x.global = Ee
    class n {
      get isWindows() {
        return this._detect(), this._isWindows
      }
      get isNode() {
        return this._detect(), this._isNode
      }
      get isElectronRenderer() {
        return this._detect(), this._isElectronRenderer
      }
      get isWebWorker() {
        return this._detect(), this._isWebWorker
      }
      get isElectronNodeIntegrationWebWorker() {
        return this._detect(), this._isElectronNodeIntegrationWebWorker
      }
      constructor() {
        ;(this._detected = !1),
          (this._isWindows = !1),
          (this._isNode = !1),
          (this._isElectronRenderer = !1),
          (this._isWebWorker = !1),
          (this._isElectronNodeIntegrationWebWorker = !1)
      }
      _detect() {
        this._detected ||
          ((this._detected = !0),
          (this._isWindows = n._isWindows()),
          (this._isNode = typeof module < 'u' && !!module.exports),
          (this._isElectronRenderer =
            typeof process < 'u' &&
            typeof process.versions < 'u' &&
            typeof process.versions.electron < 'u' &&
            process.type === 'renderer'),
          (this._isWebWorker = typeof x.global.importScripts == 'function'),
          (this._isElectronNodeIntegrationWebWorker =
            this._isWebWorker &&
            typeof process < 'u' &&
            typeof process.versions < 'u' &&
            typeof process.versions.electron < 'u' &&
            process.type === 'worker'))
      }
      static _isWindows() {
        return typeof navigator < 'u' &&
          navigator.userAgent &&
          navigator.userAgent.indexOf('Windows') >= 0
          ? !0
          : typeof process < 'u'
          ? process.platform === 'win32'
          : !1
      }
    }
    x.Environment = n
  })(ae || (ae = {}))
  var ae
  ;(function (x) {
    class n {
      constructor(s, p, L) {
        ;(this.type = s), (this.detail = p), (this.timestamp = L)
      }
    }
    x.LoaderEvent = n
    class R {
      constructor(s) {
        this._events = [new n(1, '', s)]
      }
      record(s, p) {
        this._events.push(new n(s, p, x.Utilities.getHighPerformanceTimestamp()))
      }
      getEvents() {
        return this._events
      }
    }
    x.LoaderEventRecorder = R
    class D {
      record(s, p) {}
      getEvents() {
        return []
      }
    }
    ;(D.INSTANCE = new D()), (x.NullLoaderEventRecorder = D)
  })(ae || (ae = {}))
  var ae
  ;(function (x) {
    class n {
      static fileUriToFilePath(D, i) {
        if (((i = decodeURI(i).replace(/%23/g, '#')), D)) {
          if (/^file:\/\/\//.test(i)) return i.substr(8)
          if (/^file:\/\//.test(i)) return i.substr(5)
        } else if (/^file:\/\//.test(i)) return i.substr(7)
        return i
      }
      static startsWith(D, i) {
        return D.length >= i.length && D.substr(0, i.length) === i
      }
      static endsWith(D, i) {
        return D.length >= i.length && D.substr(D.length - i.length) === i
      }
      static containsQueryString(D) {
        return /^[^\#]*\?/gi.test(D)
      }
      static isAbsolutePath(D) {
        return /^((http:\/\/)|(https:\/\/)|(file:\/\/)|(\/))/.test(D)
      }
      static forEachProperty(D, i) {
        if (D) {
          let s
          for (s in D) D.hasOwnProperty(s) && i(s, D[s])
        }
      }
      static isEmpty(D) {
        let i = !0
        return (
          n.forEachProperty(D, () => {
            i = !1
          }),
          i
        )
      }
      static recursiveClone(D) {
        if (
          !D ||
          typeof D != 'object' ||
          D instanceof RegExp ||
          (!Array.isArray(D) && Object.getPrototypeOf(D) !== Object.prototype)
        )
          return D
        let i = Array.isArray(D) ? [] : {}
        return (
          n.forEachProperty(D, (s, p) => {
            p && typeof p == 'object' ? (i[s] = n.recursiveClone(p)) : (i[s] = p)
          }),
          i
        )
      }
      static generateAnonymousModule() {
        return '===anonymous' + n.NEXT_ANONYMOUS_ID++ + '==='
      }
      static isAnonymousModule(D) {
        return n.startsWith(D, '===anonymous')
      }
      static getHighPerformanceTimestamp() {
        return (
          this.PERFORMANCE_NOW_PROBED ||
            ((this.PERFORMANCE_NOW_PROBED = !0),
            (this.HAS_PERFORMANCE_NOW =
              x.global.performance && typeof x.global.performance.now == 'function')),
          this.HAS_PERFORMANCE_NOW ? x.global.performance.now() : Date.now()
        )
      }
    }
    ;(n.NEXT_ANONYMOUS_ID = 1),
      (n.PERFORMANCE_NOW_PROBED = !1),
      (n.HAS_PERFORMANCE_NOW = !1),
      (x.Utilities = n)
  })(ae || (ae = {}))
  var ae
  ;(function (x) {
    function n(i) {
      if (i instanceof Error) return i
      const s = new Error(i.message || String(i) || 'Unknown Error')
      return i.stack && (s.stack = i.stack), s
    }
    x.ensureError = n
    class R {
      static validateConfigurationOptions(s) {
        function p(L) {
          if (L.phase === 'loading') {
            console.error('Loading "' + L.moduleId + '" failed'),
              console.error(L),
              console.error('Here are the modules that depend on it:'),
              console.error(L.neededBy)
            return
          }
          if (L.phase === 'factory') {
            console.error('The factory function of "' + L.moduleId + '" has thrown an exception'),
              console.error(L),
              console.error('Here are the modules that depend on it:'),
              console.error(L.neededBy)
            return
          }
        }
        if (
          ((s = s || {}),
          typeof s.baseUrl != 'string' && (s.baseUrl = ''),
          typeof s.isBuild != 'boolean' && (s.isBuild = !1),
          typeof s.paths != 'object' && (s.paths = {}),
          typeof s.config != 'object' && (s.config = {}),
          typeof s.catchError > 'u' && (s.catchError = !1),
          typeof s.recordStats > 'u' && (s.recordStats = !1),
          typeof s.urlArgs != 'string' && (s.urlArgs = ''),
          typeof s.onError != 'function' && (s.onError = p),
          Array.isArray(s.ignoreDuplicateModules) || (s.ignoreDuplicateModules = []),
          s.baseUrl.length > 0 && (x.Utilities.endsWith(s.baseUrl, '/') || (s.baseUrl += '/')),
          typeof s.cspNonce != 'string' && (s.cspNonce = ''),
          typeof s.preferScriptTags > 'u' && (s.preferScriptTags = !1),
          s.nodeCachedData &&
            typeof s.nodeCachedData == 'object' &&
            (typeof s.nodeCachedData.seed != 'string' && (s.nodeCachedData.seed = 'seed'),
            (typeof s.nodeCachedData.writeDelay != 'number' || s.nodeCachedData.writeDelay < 0) &&
              (s.nodeCachedData.writeDelay = 1e3 * 7),
            !s.nodeCachedData.path || typeof s.nodeCachedData.path != 'string'))
        ) {
          const L = n(new Error("INVALID cached data configuration, 'path' MUST be set"))
          ;(L.phase = 'configuration'), s.onError(L), (s.nodeCachedData = void 0)
        }
        return s
      }
      static mergeConfigurationOptions(s = null, p = null) {
        let L = x.Utilities.recursiveClone(p || {})
        return (
          x.Utilities.forEachProperty(s, (h, a) => {
            h === 'ignoreDuplicateModules' && typeof L.ignoreDuplicateModules < 'u'
              ? (L.ignoreDuplicateModules = L.ignoreDuplicateModules.concat(a))
              : h === 'paths' && typeof L.paths < 'u'
              ? x.Utilities.forEachProperty(a, (w, e) => (L.paths[w] = e))
              : h === 'config' && typeof L.config < 'u'
              ? x.Utilities.forEachProperty(a, (w, e) => (L.config[w] = e))
              : (L[h] = x.Utilities.recursiveClone(a))
          }),
          R.validateConfigurationOptions(L)
        )
      }
    }
    x.ConfigurationOptionsUtil = R
    class D {
      constructor(s, p) {
        if (
          ((this._env = s),
          (this.options = R.mergeConfigurationOptions(p)),
          this._createIgnoreDuplicateModulesMap(),
          this._createSortedPathsRules(),
          this.options.baseUrl === '' &&
            this.options.nodeRequire &&
            this.options.nodeRequire.main &&
            this.options.nodeRequire.main.filename &&
            this._env.isNode)
        ) {
          let L = this.options.nodeRequire.main.filename,
            h = Math.max(L.lastIndexOf('/'), L.lastIndexOf('\\'))
          this.options.baseUrl = L.substring(0, h + 1)
        }
      }
      _createIgnoreDuplicateModulesMap() {
        this.ignoreDuplicateModulesMap = {}
        for (let s = 0; s < this.options.ignoreDuplicateModules.length; s++)
          this.ignoreDuplicateModulesMap[this.options.ignoreDuplicateModules[s]] = !0
      }
      _createSortedPathsRules() {
        ;(this.sortedPathsRules = []),
          x.Utilities.forEachProperty(this.options.paths, (s, p) => {
            Array.isArray(p)
              ? this.sortedPathsRules.push({ from: s, to: p })
              : this.sortedPathsRules.push({ from: s, to: [p] })
          }),
          this.sortedPathsRules.sort((s, p) => p.from.length - s.from.length)
      }
      cloneAndMerge(s) {
        return new D(this._env, R.mergeConfigurationOptions(s, this.options))
      }
      getOptionsLiteral() {
        return this.options
      }
      _applyPaths(s) {
        let p
        for (let L = 0, h = this.sortedPathsRules.length; L < h; L++)
          if (((p = this.sortedPathsRules[L]), x.Utilities.startsWith(s, p.from))) {
            let a = []
            for (let w = 0, e = p.to.length; w < e; w++) a.push(p.to[w] + s.substr(p.from.length))
            return a
          }
        return [s]
      }
      _addUrlArgsToUrl(s) {
        return x.Utilities.containsQueryString(s)
          ? s + '&' + this.options.urlArgs
          : s + '?' + this.options.urlArgs
      }
      _addUrlArgsIfNecessaryToUrl(s) {
        return this.options.urlArgs ? this._addUrlArgsToUrl(s) : s
      }
      _addUrlArgsIfNecessaryToUrls(s) {
        if (this.options.urlArgs)
          for (let p = 0, L = s.length; p < L; p++) s[p] = this._addUrlArgsToUrl(s[p])
        return s
      }
      moduleIdToPaths(s) {
        if (
          this._env.isNode &&
          this.options.amdModulesPattern instanceof RegExp &&
          !this.options.amdModulesPattern.test(s)
        )
          return this.isBuild() ? ['empty:'] : ['node|' + s]
        let p = s,
          L
        if (!x.Utilities.endsWith(p, '.js') && !x.Utilities.isAbsolutePath(p)) {
          L = this._applyPaths(p)
          for (let h = 0, a = L.length; h < a; h++)
            (this.isBuild() && L[h] === 'empty:') ||
              (x.Utilities.isAbsolutePath(L[h]) || (L[h] = this.options.baseUrl + L[h]),
              !x.Utilities.endsWith(L[h], '.js') &&
                !x.Utilities.containsQueryString(L[h]) &&
                (L[h] = L[h] + '.js'))
        } else
          !x.Utilities.endsWith(p, '.js') && !x.Utilities.containsQueryString(p) && (p = p + '.js'),
            (L = [p])
        return this._addUrlArgsIfNecessaryToUrls(L)
      }
      requireToUrl(s) {
        let p = s
        return (
          x.Utilities.isAbsolutePath(p) ||
            ((p = this._applyPaths(p)[0]),
            x.Utilities.isAbsolutePath(p) || (p = this.options.baseUrl + p)),
          this._addUrlArgsIfNecessaryToUrl(p)
        )
      }
      isBuild() {
        return this.options.isBuild
      }
      shouldInvokeFactory(s) {
        return !!(
          !this.options.isBuild ||
          x.Utilities.isAnonymousModule(s) ||
          (this.options.buildForceInvokeFactory && this.options.buildForceInvokeFactory[s])
        )
      }
      isDuplicateMessageIgnoredFor(s) {
        return this.ignoreDuplicateModulesMap.hasOwnProperty(s)
      }
      getConfigForModule(s) {
        if (this.options.config) return this.options.config[s]
      }
      shouldCatchError() {
        return this.options.catchError
      }
      shouldRecordStats() {
        return this.options.recordStats
      }
      onError(s) {
        this.options.onError(s)
      }
    }
    x.Configuration = D
  })(ae || (ae = {}))
  var ae
  ;(function (x) {
    class n {
      constructor(a) {
        ;(this._env = a), (this._scriptLoader = null), (this._callbackMap = {})
      }
      load(a, w, e, b) {
        if (!this._scriptLoader)
          if (this._env.isWebWorker) this._scriptLoader = new i()
          else if (this._env.isElectronRenderer) {
            const { preferScriptTags: v } = a.getConfig().getOptionsLiteral()
            v ? (this._scriptLoader = new R()) : (this._scriptLoader = new s(this._env))
          } else
            this._env.isNode
              ? (this._scriptLoader = new s(this._env))
              : (this._scriptLoader = new R())
        let f = { callback: e, errorback: b }
        if (this._callbackMap.hasOwnProperty(w)) {
          this._callbackMap[w].push(f)
          return
        }
        ;(this._callbackMap[w] = [f]),
          this._scriptLoader.load(
            a,
            w,
            () => this.triggerCallback(w),
            (v) => this.triggerErrorback(w, v)
          )
      }
      triggerCallback(a) {
        let w = this._callbackMap[a]
        delete this._callbackMap[a]
        for (let e = 0; e < w.length; e++) w[e].callback()
      }
      triggerErrorback(a, w) {
        let e = this._callbackMap[a]
        delete this._callbackMap[a]
        for (let b = 0; b < e.length; b++) e[b].errorback(w)
      }
    }
    class R {
      attachListeners(a, w, e) {
        let b = () => {
            a.removeEventListener('load', f), a.removeEventListener('error', v)
          },
          f = (g) => {
            b(), w()
          },
          v = (g) => {
            b(), e(g)
          }
        a.addEventListener('load', f), a.addEventListener('error', v)
      }
      load(a, w, e, b) {
        if (/^node\|/.test(w)) {
          let f = a.getConfig().getOptionsLiteral(),
            v = p(a.getRecorder(), f.nodeRequire || x.global.nodeRequire),
            g = w.split('|'),
            S = null
          try {
            S = v(g[1])
          } catch (E) {
            b(E)
            return
          }
          a.enqueueDefineAnonymousModule([], () => S), e()
        } else {
          let f = document.createElement('script')
          f.setAttribute('async', 'async'),
            f.setAttribute('type', 'text/javascript'),
            this.attachListeners(f, e, b)
          const { trustedTypesPolicy: v } = a.getConfig().getOptionsLiteral()
          v && (w = v.createScriptURL(w)), f.setAttribute('src', w)
          const { cspNonce: g } = a.getConfig().getOptionsLiteral()
          g && f.setAttribute('nonce', g), document.getElementsByTagName('head')[0].appendChild(f)
        }
      }
    }
    function D(h) {
      const { trustedTypesPolicy: a } = h.getConfig().getOptionsLiteral()
      try {
        return (a ? self.eval(a.createScript('', 'true')) : new Function('true')).call(self), !0
      } catch {
        return !1
      }
    }
    class i {
      constructor() {
        this._cachedCanUseEval = null
      }
      _canUseEval(a) {
        return (
          this._cachedCanUseEval === null && (this._cachedCanUseEval = D(a)), this._cachedCanUseEval
        )
      }
      load(a, w, e, b) {
        if (/^node\|/.test(w)) {
          const f = a.getConfig().getOptionsLiteral(),
            v = p(a.getRecorder(), f.nodeRequire || x.global.nodeRequire),
            g = w.split('|')
          let S = null
          try {
            S = v(g[1])
          } catch (E) {
            b(E)
            return
          }
          a.enqueueDefineAnonymousModule([], function () {
            return S
          }),
            e()
        } else {
          const { trustedTypesPolicy: f } = a.getConfig().getOptionsLiteral()
          if (
            !(
              /^((http:)|(https:)|(file:))/.test(w) &&
              w.substring(0, self.origin.length) !== self.origin
            ) &&
            this._canUseEval(a)
          ) {
            fetch(w)
              .then((g) => {
                if (g.status !== 200) throw new Error(g.statusText)
                return g.text()
              })
              .then((g) => {
                ;(g = `${g}
//# sourceURL=${w}`),
                  (f ? self.eval(f.createScript('', g)) : new Function(g)).call(self),
                  e()
              })
              .then(void 0, b)
            return
          }
          try {
            f && (w = f.createScriptURL(w)), importScripts(w), e()
          } catch (g) {
            b(g)
          }
        }
      }
    }
    class s {
      constructor(a) {
        ;(this._env = a), (this._didInitialize = !1), (this._didPatchNodeRequire = !1)
      }
      _init(a) {
        this._didInitialize ||
          ((this._didInitialize = !0),
          (this._fs = a('fs')),
          (this._vm = a('vm')),
          (this._path = a('path')),
          (this._crypto = a('crypto')))
      }
      _initNodeRequire(a, w) {
        const { nodeCachedData: e } = w.getConfig().getOptionsLiteral()
        if (!e || this._didPatchNodeRequire) return
        this._didPatchNodeRequire = !0
        const b = this,
          f = a('module')
        function v(g) {
          const S = g.constructor
          let E = function (_) {
            try {
              return g.require(_)
            } finally {
            }
          }
          return (
            (E.resolve = function (_, d) {
              return S._resolveFilename(_, g, !1, d)
            }),
            (E.resolve.paths = function (_) {
              return S._resolveLookupPaths(_, g)
            }),
            (E.main = process.mainModule),
            (E.extensions = S._extensions),
            (E.cache = S._cache),
            E
          )
        }
        f.prototype._compile = function (g, S) {
          const E = f.wrap(g.replace(/^#!.*/, '')),
            y = w.getRecorder(),
            _ = b._getCachedDataPath(e, S),
            d = { filename: S }
          let C
          try {
            const N = b._fs.readFileSync(_)
            ;(C = N.slice(0, 16)), (d.cachedData = N.slice(16)), y.record(60, _)
          } catch {
            y.record(61, _)
          }
          const r = new b._vm.Script(E, d),
            u = r.runInThisContext(d),
            o = b._path.dirname(S),
            c = v(this),
            l = [this.exports, c, this, S, o, process, Re, Buffer],
            m = u.apply(this.exports, l)
          return (
            b._handleCachedData(r, E, _, !d.cachedData, w), b._verifyCachedData(r, E, _, C, w), m
          )
        }
      }
      load(a, w, e, b) {
        const f = a.getConfig().getOptionsLiteral(),
          v = p(a.getRecorder(), f.nodeRequire || x.global.nodeRequire),
          g =
            f.nodeInstrumenter ||
            function (E) {
              return E
            }
        this._init(v), this._initNodeRequire(v, a)
        let S = a.getRecorder()
        if (/^node\|/.test(w)) {
          let E = w.split('|'),
            y = null
          try {
            y = v(E[1])
          } catch (_) {
            b(_)
            return
          }
          a.enqueueDefineAnonymousModule([], () => y), e()
        } else {
          w = x.Utilities.fileUriToFilePath(this._env.isWindows, w)
          const E = this._path.normalize(w),
            y = this._getElectronRendererScriptPathOrUri(E),
            _ = Boolean(f.nodeCachedData),
            d = _ ? this._getCachedDataPath(f.nodeCachedData, w) : void 0
          this._readSourceAndCachedData(E, d, S, (C, r, u, o) => {
            if (C) {
              b(C)
              return
            }
            let c
            r.charCodeAt(0) === s._BOM
              ? (c = s._PREFIX + r.substring(1) + s._SUFFIX)
              : (c = s._PREFIX + r + s._SUFFIX),
              (c = g(c, E))
            const l = { filename: y, cachedData: u },
              m = this._createAndEvalScript(a, c, l, e, b)
            this._handleCachedData(m, c, d, _ && !u, a), this._verifyCachedData(m, c, d, o, a)
          })
        }
      }
      _createAndEvalScript(a, w, e, b, f) {
        const v = a.getRecorder()
        v.record(31, e.filename)
        const g = new this._vm.Script(w, e),
          S = g.runInThisContext(e),
          E = a.getGlobalAMDDefineFunc()
        let y = !1
        const _ = function () {
          return (y = !0), E.apply(null, arguments)
        }
        return (
          (_.amd = E.amd),
          S.call(
            x.global,
            a.getGlobalAMDRequireFunc(),
            _,
            e.filename,
            this._path.dirname(e.filename)
          ),
          v.record(32, e.filename),
          y ? b() : f(new Error(`Didn't receive define call in ${e.filename}!`)),
          g
        )
      }
      _getElectronRendererScriptPathOrUri(a) {
        if (!this._env.isElectronRenderer) return a
        let w = a.match(/^([a-z])\:(.*)/i)
        return w
          ? `file:///${(w[1].toUpperCase() + ':' + w[2]).replace(/\\/g, '/')}`
          : `file://${a}`
      }
      _getCachedDataPath(a, w) {
        const e = this._crypto
            .createHash('md5')
            .update(w, 'utf8')
            .update(a.seed, 'utf8')
            .update(process.arch, '')
            .digest('hex'),
          b = this._path.basename(w).replace(/\.js$/, '')
        return this._path.join(a.path, `${b}-${e}.code`)
      }
      _handleCachedData(a, w, e, b, f) {
        a.cachedDataRejected
          ? this._fs.unlink(e, (v) => {
              f.getRecorder().record(62, e),
                this._createAndWriteCachedData(a, w, e, f),
                v && f.getConfig().onError(v)
            })
          : b && this._createAndWriteCachedData(a, w, e, f)
      }
      _createAndWriteCachedData(a, w, e, b) {
        let f = Math.ceil(
            b.getConfig().getOptionsLiteral().nodeCachedData.writeDelay * (1 + Math.random())
          ),
          v = -1,
          g = 0,
          S
        const E = () => {
          setTimeout(() => {
            S || (S = this._crypto.createHash('md5').update(w, 'utf8').digest())
            const y = a.createCachedData()
            if (!(y.length === 0 || y.length === v || g >= 5)) {
              if (y.length < v) {
                E()
                return
              }
              ;(v = y.length),
                this._fs.writeFile(e, Buffer.concat([S, y]), (_) => {
                  _ && b.getConfig().onError(_), b.getRecorder().record(63, e), E()
                })
            }
          }, f * Math.pow(4, g++))
        }
        E()
      }
      _readSourceAndCachedData(a, w, e, b) {
        if (!w) this._fs.readFile(a, { encoding: 'utf8' }, b)
        else {
          let f,
            v,
            g,
            S = 2
          const E = (y) => {
            y ? b(y) : --S === 0 && b(void 0, f, v, g)
          }
          this._fs.readFile(a, { encoding: 'utf8' }, (y, _) => {
            ;(f = _), E(y)
          }),
            this._fs.readFile(w, (y, _) => {
              !y && _ && _.length > 0
                ? ((g = _.slice(0, 16)), (v = _.slice(16)), e.record(60, w))
                : e.record(61, w),
                E()
            })
        }
      }
      _verifyCachedData(a, w, e, b, f) {
        !b ||
          a.cachedDataRejected ||
          setTimeout(() => {
            const v = this._crypto.createHash('md5').update(w, 'utf8').digest()
            b.equals(v) ||
              (f
                .getConfig()
                .onError(
                  new Error(
                    `FAILED TO VERIFY CACHED DATA, deleting stale '${e}' now, but a RESTART IS REQUIRED`
                  )
                ),
              this._fs.unlink(e, (g) => {
                g && f.getConfig().onError(g)
              }))
          }, Math.ceil(5e3 * (1 + Math.random())))
      }
    }
    ;(s._BOM = 65279),
      (s._PREFIX = '(function (require, define, __filename, __dirname) { '),
      (s._SUFFIX = `
});`)
    function p(h, a) {
      if (a.__$__isRecorded) return a
      const w = function (b) {
        h.record(33, b)
        try {
          return a(b)
        } finally {
          h.record(34, b)
        }
      }
      return (w.__$__isRecorded = !0), w
    }
    x.ensureRecordedNodeRequire = p
    function L(h) {
      return new n(h)
    }
    x.createScriptLoader = L
  })(ae || (ae = {}))
  var ae
  ;(function (x) {
    class n {
      constructor(h) {
        let a = h.lastIndexOf('/')
        a !== -1 ? (this.fromModulePath = h.substr(0, a + 1)) : (this.fromModulePath = '')
      }
      static _normalizeModuleId(h) {
        let a = h,
          w
        for (w = /\/\.\//; w.test(a); ) a = a.replace(w, '/')
        for (
          a = a.replace(/^\.\//g, ''),
            w = /\/(([^\/])|([^\/][^\/\.])|([^\/\.][^\/])|([^\/][^\/][^\/]+))\/\.\.\//;
          w.test(a);

        )
          a = a.replace(w, '/')
        return (
          (a = a.replace(
            /^(([^\/])|([^\/][^\/\.])|([^\/\.][^\/])|([^\/][^\/][^\/]+))\/\.\.\//,
            ''
          )),
          a
        )
      }
      resolveModule(h) {
        let a = h
        return (
          x.Utilities.isAbsolutePath(a) ||
            ((x.Utilities.startsWith(a, './') || x.Utilities.startsWith(a, '../')) &&
              (a = n._normalizeModuleId(this.fromModulePath + a))),
          a
        )
      }
    }
    ;(n.ROOT = new n('')), (x.ModuleIdResolver = n)
    class R {
      constructor(h, a, w, e, b, f) {
        ;(this.id = h),
          (this.strId = a),
          (this.dependencies = w),
          (this._callback = e),
          (this._errorback = b),
          (this.moduleIdResolver = f),
          (this.exports = {}),
          (this.error = null),
          (this.exportsPassedIn = !1),
          (this.unresolvedDependenciesCount = this.dependencies.length),
          (this._isComplete = !1)
      }
      static _safeInvokeFunction(h, a) {
        try {
          return { returnedValue: h.apply(x.global, a), producedError: null }
        } catch (w) {
          return { returnedValue: null, producedError: w }
        }
      }
      static _invokeFactory(h, a, w, e) {
        return h.shouldInvokeFactory(a)
          ? h.shouldCatchError()
            ? this._safeInvokeFunction(w, e)
            : { returnedValue: w.apply(x.global, e), producedError: null }
          : { returnedValue: null, producedError: null }
      }
      complete(h, a, w, e) {
        this._isComplete = !0
        let b = null
        if (this._callback)
          if (typeof this._callback == 'function') {
            h.record(21, this.strId)
            let f = R._invokeFactory(a, this.strId, this._callback, w)
            ;(b = f.producedError),
              h.record(22, this.strId),
              !b &&
                typeof f.returnedValue < 'u' &&
                (!this.exportsPassedIn || x.Utilities.isEmpty(this.exports)) &&
                (this.exports = f.returnedValue)
          } else this.exports = this._callback
        if (b) {
          let f = x.ensureError(b)
          ;(f.phase = 'factory'),
            (f.moduleId = this.strId),
            (f.neededBy = e(this.id)),
            (this.error = f),
            a.onError(f)
        }
        ;(this.dependencies = null),
          (this._callback = null),
          (this._errorback = null),
          (this.moduleIdResolver = null)
      }
      onDependencyError(h) {
        return (
          (this._isComplete = !0), (this.error = h), this._errorback ? (this._errorback(h), !0) : !1
        )
      }
      isComplete() {
        return this._isComplete
      }
    }
    x.Module = R
    class D {
      constructor() {
        ;(this._nextId = 0),
          (this._strModuleIdToIntModuleId = new Map()),
          (this._intModuleIdToStrModuleId = []),
          this.getModuleId('exports'),
          this.getModuleId('module'),
          this.getModuleId('require')
      }
      getMaxModuleId() {
        return this._nextId
      }
      getModuleId(h) {
        let a = this._strModuleIdToIntModuleId.get(h)
        return (
          typeof a > 'u' &&
            ((a = this._nextId++),
            this._strModuleIdToIntModuleId.set(h, a),
            (this._intModuleIdToStrModuleId[a] = h)),
          a
        )
      }
      getStrModuleId(h) {
        return this._intModuleIdToStrModuleId[h]
      }
    }
    class i {
      constructor(h) {
        this.id = h
      }
    }
    ;(i.EXPORTS = new i(0)),
      (i.MODULE = new i(1)),
      (i.REQUIRE = new i(2)),
      (x.RegularDependency = i)
    class s {
      constructor(h, a, w) {
        ;(this.id = h), (this.pluginId = a), (this.pluginParam = w)
      }
    }
    x.PluginDependency = s
    class p {
      constructor(h, a, w, e, b = 0) {
        ;(this._env = h),
          (this._scriptLoader = a),
          (this._loaderAvailableTimestamp = b),
          (this._defineFunc = w),
          (this._requireFunc = e),
          (this._moduleIdProvider = new D()),
          (this._config = new x.Configuration(this._env)),
          (this._hasDependencyCycle = !1),
          (this._modules2 = []),
          (this._knownModules2 = []),
          (this._inverseDependencies2 = []),
          (this._inversePluginDependencies2 = new Map()),
          (this._currentAnonymousDefineCall = null),
          (this._recorder = null),
          (this._buildInfoPath = []),
          (this._buildInfoDefineStack = []),
          (this._buildInfoDependencies = [])
      }
      reset() {
        return new p(
          this._env,
          this._scriptLoader,
          this._defineFunc,
          this._requireFunc,
          this._loaderAvailableTimestamp
        )
      }
      getGlobalAMDDefineFunc() {
        return this._defineFunc
      }
      getGlobalAMDRequireFunc() {
        return this._requireFunc
      }
      static _findRelevantLocationInStack(h, a) {
        let w = (f) => f.replace(/\\/g, '/'),
          e = w(h),
          b = a.split(/\n/)
        for (let f = 0; f < b.length; f++) {
          let v = b[f].match(/(.*):(\d+):(\d+)\)?$/)
          if (v) {
            let g = v[1],
              S = v[2],
              E = v[3],
              y = Math.max(g.lastIndexOf(' ') + 1, g.lastIndexOf('(') + 1)
            if (((g = g.substr(y)), (g = w(g)), g === e)) {
              let _ = { line: parseInt(S, 10), col: parseInt(E, 10) }
              return _.line === 1 && (_.col -= 53), _
            }
          }
        }
        throw new Error('Could not correlate define call site for needle ' + h)
      }
      getBuildInfo() {
        if (!this._config.isBuild()) return null
        let h = [],
          a = 0
        for (let w = 0, e = this._modules2.length; w < e; w++) {
          let b = this._modules2[w]
          if (!b) continue
          let f = this._buildInfoPath[b.id] || null,
            v = this._buildInfoDefineStack[b.id] || null,
            g = this._buildInfoDependencies[b.id]
          h[a++] = {
            id: b.strId,
            path: f,
            defineLocation: f && v ? p._findRelevantLocationInStack(f, v) : null,
            dependencies: g,
            shim: null,
            exports: b.exports,
          }
        }
        return h
      }
      getRecorder() {
        return (
          this._recorder ||
            (this._config.shouldRecordStats()
              ? (this._recorder = new x.LoaderEventRecorder(this._loaderAvailableTimestamp))
              : (this._recorder = x.NullLoaderEventRecorder.INSTANCE)),
          this._recorder
        )
      }
      getLoaderEvents() {
        return this.getRecorder().getEvents()
      }
      enqueueDefineAnonymousModule(h, a) {
        if (this._currentAnonymousDefineCall !== null)
          throw new Error('Can only have one anonymous define call per script file')
        let w = null
        this._config.isBuild() && (w = new Error('StackLocation').stack || null),
          (this._currentAnonymousDefineCall = { stack: w, dependencies: h, callback: a })
      }
      defineModule(h, a, w, e, b, f = new n(h)) {
        let v = this._moduleIdProvider.getModuleId(h)
        if (this._modules2[v]) {
          this._config.isDuplicateMessageIgnoredFor(h) ||
            console.warn("Duplicate definition of module '" + h + "'")
          return
        }
        let g = new R(v, h, this._normalizeDependencies(a, f), w, e, f)
        ;(this._modules2[v] = g),
          this._config.isBuild() &&
            ((this._buildInfoDefineStack[v] = b),
            (this._buildInfoDependencies[v] = (g.dependencies || []).map((S) =>
              this._moduleIdProvider.getStrModuleId(S.id)
            ))),
          this._resolve(g)
      }
      _normalizeDependency(h, a) {
        if (h === 'exports') return i.EXPORTS
        if (h === 'module') return i.MODULE
        if (h === 'require') return i.REQUIRE
        let w = h.indexOf('!')
        if (w >= 0) {
          let e = a.resolveModule(h.substr(0, w)),
            b = a.resolveModule(h.substr(w + 1)),
            f = this._moduleIdProvider.getModuleId(e + '!' + b),
            v = this._moduleIdProvider.getModuleId(e)
          return new s(f, v, b)
        }
        return new i(this._moduleIdProvider.getModuleId(a.resolveModule(h)))
      }
      _normalizeDependencies(h, a) {
        let w = [],
          e = 0
        for (let b = 0, f = h.length; b < f; b++) w[e++] = this._normalizeDependency(h[b], a)
        return w
      }
      _relativeRequire(h, a, w, e) {
        if (typeof a == 'string') return this.synchronousRequire(a, h)
        this.defineModule(x.Utilities.generateAnonymousModule(), a, w, e, null, h)
      }
      synchronousRequire(h, a = new n(h)) {
        let w = this._normalizeDependency(h, a),
          e = this._modules2[w.id]
        if (!e)
          throw new Error(
            "Check dependency list! Synchronous require cannot resolve module '" +
              h +
              "'. This is the first mention of this module!"
          )
        if (!e.isComplete())
          throw new Error(
            "Check dependency list! Synchronous require cannot resolve module '" +
              h +
              "'. This module has not been resolved completely yet."
          )
        if (e.error) throw e.error
        return e.exports
      }
      configure(h, a) {
        let w = this._config.shouldRecordStats()
        a
          ? (this._config = new x.Configuration(this._env, h))
          : (this._config = this._config.cloneAndMerge(h)),
          this._config.shouldRecordStats() && !w && (this._recorder = null)
      }
      getConfig() {
        return this._config
      }
      _onLoad(h) {
        if (this._currentAnonymousDefineCall !== null) {
          let a = this._currentAnonymousDefineCall
          ;(this._currentAnonymousDefineCall = null),
            this.defineModule(
              this._moduleIdProvider.getStrModuleId(h),
              a.dependencies,
              a.callback,
              null,
              a.stack
            )
        }
      }
      _createLoadError(h, a) {
        let w = this._moduleIdProvider.getStrModuleId(h),
          e = (this._inverseDependencies2[h] || []).map((f) =>
            this._moduleIdProvider.getStrModuleId(f)
          )
        const b = x.ensureError(a)
        return (b.phase = 'loading'), (b.moduleId = w), (b.neededBy = e), b
      }
      _onLoadError(h, a) {
        const w = this._createLoadError(h, a)
        this._modules2[h] ||
          (this._modules2[h] = new R(
            h,
            this._moduleIdProvider.getStrModuleId(h),
            [],
            () => {},
            null,
            null
          ))
        let e = []
        for (let v = 0, g = this._moduleIdProvider.getMaxModuleId(); v < g; v++) e[v] = !1
        let b = !1,
          f = []
        for (f.push(h), e[h] = !0; f.length > 0; ) {
          let v = f.shift(),
            g = this._modules2[v]
          g && (b = g.onDependencyError(w) || b)
          let S = this._inverseDependencies2[v]
          if (S)
            for (let E = 0, y = S.length; E < y; E++) {
              let _ = S[E]
              e[_] || (f.push(_), (e[_] = !0))
            }
        }
        b || this._config.onError(w)
      }
      _hasDependencyPath(h, a) {
        let w = this._modules2[h]
        if (!w) return !1
        let e = []
        for (let f = 0, v = this._moduleIdProvider.getMaxModuleId(); f < v; f++) e[f] = !1
        let b = []
        for (b.push(w), e[h] = !0; b.length > 0; ) {
          let v = b.shift().dependencies
          if (v)
            for (let g = 0, S = v.length; g < S; g++) {
              let E = v[g]
              if (E.id === a) return !0
              let y = this._modules2[E.id]
              y && !e[E.id] && ((e[E.id] = !0), b.push(y))
            }
        }
        return !1
      }
      _findCyclePath(h, a, w) {
        if (h === a || w === 50) return [h]
        let e = this._modules2[h]
        if (!e) return null
        let b = e.dependencies
        if (b)
          for (let f = 0, v = b.length; f < v; f++) {
            let g = this._findCyclePath(b[f].id, a, w + 1)
            if (g !== null) return g.push(h), g
          }
        return null
      }
      _createRequire(h) {
        let a = (w, e, b) => this._relativeRequire(h, w, e, b)
        return (
          (a.toUrl = (w) => this._config.requireToUrl(h.resolveModule(w))),
          (a.getStats = () => this.getLoaderEvents()),
          (a.hasDependencyCycle = () => this._hasDependencyCycle),
          (a.config = (w, e = !1) => {
            this.configure(w, e)
          }),
          (a.__$__nodeRequire = x.global.nodeRequire),
          a
        )
      }
      _loadModule(h) {
        if (this._modules2[h] || this._knownModules2[h]) return
        this._knownModules2[h] = !0
        let a = this._moduleIdProvider.getStrModuleId(h),
          w = this._config.moduleIdToPaths(a),
          e = /^@[^\/]+\/[^\/]+$/
        this._env.isNode && (a.indexOf('/') === -1 || e.test(a)) && w.push('node|' + a)
        let b = -1,
          f = (v) => {
            if ((b++, b >= w.length)) this._onLoadError(h, v)
            else {
              let g = w[b],
                S = this.getRecorder()
              if (this._config.isBuild() && g === 'empty:') {
                ;(this._buildInfoPath[h] = g),
                  this.defineModule(this._moduleIdProvider.getStrModuleId(h), [], null, null, null),
                  this._onLoad(h)
                return
              }
              S.record(10, g),
                this._scriptLoader.load(
                  this,
                  g,
                  () => {
                    this._config.isBuild() && (this._buildInfoPath[h] = g),
                      S.record(11, g),
                      this._onLoad(h)
                  },
                  (E) => {
                    S.record(12, g), f(E)
                  }
                )
            }
          }
        f(null)
      }
      _loadPluginDependency(h, a) {
        if (this._modules2[a.id] || this._knownModules2[a.id]) return
        this._knownModules2[a.id] = !0
        let w = (e) => {
          this.defineModule(this._moduleIdProvider.getStrModuleId(a.id), [], e, null, null)
        }
        ;(w.error = (e) => {
          this._config.onError(this._createLoadError(a.id, e))
        }),
          h.load(a.pluginParam, this._createRequire(n.ROOT), w, this._config.getOptionsLiteral())
      }
      _resolve(h) {
        let a = h.dependencies
        if (a)
          for (let w = 0, e = a.length; w < e; w++) {
            let b = a[w]
            if (b === i.EXPORTS) {
              ;(h.exportsPassedIn = !0), h.unresolvedDependenciesCount--
              continue
            }
            if (b === i.MODULE) {
              h.unresolvedDependenciesCount--
              continue
            }
            if (b === i.REQUIRE) {
              h.unresolvedDependenciesCount--
              continue
            }
            let f = this._modules2[b.id]
            if (f && f.isComplete()) {
              if (f.error) {
                h.onDependencyError(f.error)
                return
              }
              h.unresolvedDependenciesCount--
              continue
            }
            if (this._hasDependencyPath(b.id, h.id)) {
              ;(this._hasDependencyCycle = !0),
                console.warn(
                  "There is a dependency cycle between '" +
                    this._moduleIdProvider.getStrModuleId(b.id) +
                    "' and '" +
                    this._moduleIdProvider.getStrModuleId(h.id) +
                    "'. The cyclic path follows:"
                )
              let v = this._findCyclePath(b.id, h.id, 0) || []
              v.reverse(),
                v.push(b.id),
                console.warn(
                  v.map((g) => this._moduleIdProvider.getStrModuleId(g)).join(` => 
`)
                ),
                h.unresolvedDependenciesCount--
              continue
            }
            if (
              ((this._inverseDependencies2[b.id] = this._inverseDependencies2[b.id] || []),
              this._inverseDependencies2[b.id].push(h.id),
              b instanceof s)
            ) {
              let v = this._modules2[b.pluginId]
              if (v && v.isComplete()) {
                this._loadPluginDependency(v.exports, b)
                continue
              }
              let g = this._inversePluginDependencies2.get(b.pluginId)
              g || ((g = []), this._inversePluginDependencies2.set(b.pluginId, g)),
                g.push(b),
                this._loadModule(b.pluginId)
              continue
            }
            this._loadModule(b.id)
          }
        h.unresolvedDependenciesCount === 0 && this._onModuleComplete(h)
      }
      _onModuleComplete(h) {
        let a = this.getRecorder()
        if (h.isComplete()) return
        let w = h.dependencies,
          e = []
        if (w)
          for (let g = 0, S = w.length; g < S; g++) {
            let E = w[g]
            if (E === i.EXPORTS) {
              e[g] = h.exports
              continue
            }
            if (E === i.MODULE) {
              e[g] = { id: h.strId, config: () => this._config.getConfigForModule(h.strId) }
              continue
            }
            if (E === i.REQUIRE) {
              e[g] = this._createRequire(h.moduleIdResolver)
              continue
            }
            let y = this._modules2[E.id]
            if (y) {
              e[g] = y.exports
              continue
            }
            e[g] = null
          }
        const b = (g) =>
          (this._inverseDependencies2[g] || []).map((S) => this._moduleIdProvider.getStrModuleId(S))
        h.complete(a, this._config, e, b)
        let f = this._inverseDependencies2[h.id]
        if (((this._inverseDependencies2[h.id] = null), f))
          for (let g = 0, S = f.length; g < S; g++) {
            let E = f[g],
              y = this._modules2[E]
            y.unresolvedDependenciesCount--,
              y.unresolvedDependenciesCount === 0 && this._onModuleComplete(y)
          }
        let v = this._inversePluginDependencies2.get(h.id)
        if (v) {
          this._inversePluginDependencies2.delete(h.id)
          for (let g = 0, S = v.length; g < S; g++) this._loadPluginDependency(h.exports, v[g])
        }
      }
    }
    x.ModuleManager = p
  })(ae || (ae = {}))
  var Q, ae
  ;(function (x) {
    const n = new x.Environment()
    let R = null
    const D = function (L, h, a) {
      typeof L != 'string' && ((a = h), (h = L), (L = null)),
        (typeof h != 'object' || !Array.isArray(h)) && ((a = h), (h = null)),
        h || (h = ['require', 'exports', 'module']),
        L ? R.defineModule(L, h, a, null, null) : R.enqueueDefineAnonymousModule(h, a)
    }
    D.amd = { jQuery: !0 }
    const i = function (L, h = !1) {
        R.configure(L, h)
      },
      s = function () {
        if (arguments.length === 1) {
          if (arguments[0] instanceof Object && !Array.isArray(arguments[0])) {
            i(arguments[0])
            return
          }
          if (typeof arguments[0] == 'string') return R.synchronousRequire(arguments[0])
        }
        if ((arguments.length === 2 || arguments.length === 3) && Array.isArray(arguments[0])) {
          R.defineModule(
            x.Utilities.generateAnonymousModule(),
            arguments[0],
            arguments[1],
            arguments[2],
            null
          )
          return
        }
        throw new Error('Unrecognized require call')
      }
    ;(s.config = i),
      (s.getConfig = function () {
        return R.getConfig().getOptionsLiteral()
      }),
      (s.reset = function () {
        R = R.reset()
      }),
      (s.getBuildInfo = function () {
        return R.getBuildInfo()
      }),
      (s.getStats = function () {
        return R.getLoaderEvents()
      }),
      (s.define = D)
    function p() {
      if (typeof x.global.require < 'u' || typeof require < 'u') {
        const L = x.global.require || require
        if (typeof L == 'function' && typeof L.resolve == 'function') {
          const h = x.ensureRecordedNodeRequire(R.getRecorder(), L)
          ;(x.global.nodeRequire = h), (s.nodeRequire = h), (s.__$__nodeRequire = h)
        }
      }
      n.isNode && !n.isElectronRenderer && !n.isElectronNodeIntegrationWebWorker
        ? (module.exports = s)
        : (n.isElectronRenderer || (x.global.define = D), (x.global.require = s))
    }
    ;(x.init = p),
      (typeof x.global.define != 'function' || !x.global.define.amd) &&
        ((R = new x.ModuleManager(
          n,
          x.createScriptLoader(n),
          D,
          s,
          x.Utilities.getHighPerformanceTimestamp()
        )),
        typeof x.global.require < 'u' &&
          typeof x.global.require != 'function' &&
          s.config(x.global.require),
        (Q = function () {
          return D.apply(null, arguments)
        }),
        (Q.amd = D.amd),
        typeof doNotInitLoader > 'u' && p())
  })(ae || (ae = {}))
  var be =
    (this && this.__awaiter) ||
    function (x, n, R, D) {
      function i(s) {
        return s instanceof R
          ? s
          : new R(function (p) {
              p(s)
            })
      }
      return new (R || (R = Promise))(function (s, p) {
        function L(w) {
          try {
            a(D.next(w))
          } catch (e) {
            p(e)
          }
        }
        function h(w) {
          try {
            a(D.throw(w))
          } catch (e) {
            p(e)
          }
        }
        function a(w) {
          w.done ? s(w.value) : i(w.value).then(L, h)
        }
        a((D = D.apply(x, n || [])).next())
      })
    }
  Q(Y[25], X([0, 1]), function (x, n) {
    'use strict'
    Object.defineProperty(n, '__esModule', { value: !0 }),
      (n.load =
        n.create =
        n.setPseudoTranslation =
        n.getConfiguredDefaultLocale =
        n.localize =
          void 0)
    let R =
      typeof document < 'u' &&
      document.location &&
      document.location.hash.indexOf('pseudo=true') >= 0
    const D = 'i-default'
    function i(v, g) {
      let S
      return (
        g.length === 0
          ? (S = v)
          : (S = v.replace(/\{(\d+)\}/g, (E, y) => {
              const _ = y[0],
                d = g[_]
              let C = E
              return (
                typeof d == 'string'
                  ? (C = d)
                  : (typeof d == 'number' || typeof d == 'boolean' || d === void 0 || d === null) &&
                    (C = String(d)),
                C
              )
            })),
        R && (S = '\uFF3B' + S.replace(/[aouei]/g, '$&$&') + '\uFF3D'),
        S
      )
    }
    function s(v, g) {
      let S = v[g]
      return S || ((S = v['*']), S) ? S : null
    }
    function p(v) {
      return v.charAt(v.length - 1) === '/' ? v : v + '/'
    }
    function L(v, g, S) {
      return be(this, void 0, void 0, function* () {
        const E = p(v) + p(g) + 'vscode/' + p(S),
          y = yield fetch(E)
        if (y.ok) return yield y.json()
        throw new Error(`${y.status} - ${y.statusText}`)
      })
    }
    function h(v) {
      return function (g, S) {
        const E = Array.prototype.slice.call(arguments, 2)
        return i(v[g], E)
      }
    }
    function a(v, g, ...S) {
      return i(g, S)
    }
    n.localize = a
    function w(v) {}
    n.getConfiguredDefaultLocale = w
    function e(v) {
      R = v
    }
    n.setPseudoTranslation = e
    function b(v, g) {
      var S
      return {
        localize: h(g[v]),
        getConfiguredDefaultLocale:
          (S = g.getConfiguredDefaultLocale) !== null && S !== void 0 ? S : (E) => {},
      }
    }
    n.create = b
    function f(v, g, S, E) {
      var y
      const _ = (y = E['vs/nls']) !== null && y !== void 0 ? y : {}
      if (!v || v.length === 0)
        return S({
          localize: a,
          getConfiguredDefaultLocale: () => {
            var o
            return (o = _.availableLanguages) === null || o === void 0 ? void 0 : o['*']
          },
        })
      const d = _.availableLanguages ? s(_.availableLanguages, v) : null,
        C = d === null || d === D
      let r = '.nls'
      C || (r = r + '.' + d)
      const u = (o) => {
        Array.isArray(o) ? (o.localize = h(o)) : (o.localize = h(o[v])),
          (o.getConfiguredDefaultLocale = () => {
            var c
            return (c = _.availableLanguages) === null || c === void 0 ? void 0 : c['*']
          }),
          S(o)
      }
      typeof _.loadBundle == 'function'
        ? _.loadBundle(v, d, (o, c) => {
            o ? g([v + '.nls'], u) : u(c)
          })
        : _.translationServiceUrl && !C
        ? be(this, void 0, void 0, function* () {
            var o
            try {
              const c = yield L(_.translationServiceUrl, d, v)
              return u(c)
            } catch (c) {
              if (!d.includes('-')) return console.error(c), g([v + '.nls'], u)
              try {
                const l = d.split('-')[0],
                  m = yield L(_.translationServiceUrl, l, v)
                return (
                  ((o = _.availableLanguages) !== null && o !== void 0) ||
                    (_.availableLanguages = {}),
                  (_.availableLanguages['*'] = l),
                  u(m)
                )
              } catch (l) {
                return console.error(l), g([v + '.nls'], u)
              }
            }
          })
        : g([v + r], u, (o) => {
            if (r === '.nls') {
              console.error('Failed trying to load default language strings', o)
              return
            }
            console.error(
              `Failed to load message bundle for language ${d}. Falling back to the default language:`,
              o
            ),
              g([v + '.nls'], u)
          })
    }
    n.load = f
  }),
    (function () {
      var x, n
      const R = globalThis.MonacoEnvironment,
        D = R && R.baseUrl ? R.baseUrl : '../../../',
        i =
          typeof ((x = self.trustedTypes) === null || x === void 0 ? void 0 : x.createPolicy) ==
          'function'
            ? (n = self.trustedTypes) === null || n === void 0
              ? void 0
              : n.createPolicy('amdLoader', {
                  createScriptURL: (e) => e,
                  createScript: (e, ...b) => {
                    const f = b.slice(0, -1).join(','),
                      v = b.pop().toString()
                    return `(function anonymous(${f}) { ${v}
})`
                  },
                })
            : void 0
      function s() {
        try {
          return (
            (i ? globalThis.eval(i.createScript('', 'true')) : new Function('true')).call(
              globalThis
            ),
            !0
          )
        } catch {
          return !1
        }
      }
      function p() {
        return new Promise((e, b) => {
          if (typeof globalThis.define == 'function' && globalThis.define.amd) return e()
          const f = D + 'vs/loader.js'
          if (
            !(
              /^((http:)|(https:)|(file:))/.test(f) &&
              f.substring(0, globalThis.origin.length) !== globalThis.origin
            ) &&
            s()
          ) {
            fetch(f)
              .then((g) => {
                if (g.status !== 200) throw new Error(g.statusText)
                return g.text()
              })
              .then((g) => {
                ;(g = `${g}
//# sourceURL=${f}`),
                  (i ? globalThis.eval(i.createScript('', g)) : new Function(g)).call(globalThis),
                  e()
              })
              .then(void 0, b)
            return
          }
          i ? importScripts(i.createScriptURL(f)) : importScripts(f), e()
        })
      }
      function L() {
        require.config({
          baseUrl: D,
          catchError: !0,
          trustedTypesPolicy: i,
          amdModulesPattern: /^vs\//,
        })
      }
      function h(e) {
        p().then(() => {
          L(),
            require([e], function (b) {
              setTimeout(function () {
                const f = b.create((v, g) => {
                  globalThis.postMessage(v, g)
                }, null)
                for (globalThis.onmessage = (v) => f.onmessage(v.data, v.ports); w.length > 0; ) {
                  const v = w.shift()
                  f.onmessage(v.data, v.ports)
                }
              }, 0)
            })
        })
      }
      typeof globalThis.define == 'function' && globalThis.define.amd && L()
      let a = !0
      const w = []
      globalThis.onmessage = (e) => {
        if (!a) {
          w.push(e)
          return
        }
        ;(a = !1), h(e.data)
      }
    })(),
    Q(Y[26], X([0, 1]), function (x, n) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.CallbackIterable =
          n.ArrayQueue =
          n.findMinBy =
          n.findLastMaxBy =
          n.findMaxBy =
          n.numberComparator =
          n.compareBy =
          n.CompareResult =
          n.splice =
          n.insertInto =
          n.asArray =
          n.pushMany =
          n.pushToEnd =
          n.pushToStart =
          n.arrayInsert =
          n.range =
          n.firstOrDefault =
          n.lastIndex =
          n.findLast =
          n.distinct =
          n.isNonEmptyArray =
          n.isFalsyOrEmpty =
          n.coalesceInPlace =
          n.coalesce =
          n.groupBy =
          n.quickSelect =
          n.findFirstInSorted =
          n.binarySearch2 =
          n.binarySearch =
          n.removeFastWithoutKeepingOrder =
          n.equals =
          n.tail2 =
          n.tail =
            void 0)
      function R(F, U = 0) {
        return F[F.length - (1 + U)]
      }
      n.tail = R
      function D(F) {
        if (F.length === 0) throw new Error('Invalid tail call')
        return [F.slice(0, F.length - 1), F[F.length - 1]]
      }
      n.tail2 = D
      function i(F, U, T = (W, t) => W === t) {
        if (F === U) return !0
        if (!F || !U || F.length !== U.length) return !1
        for (let W = 0, t = F.length; W < t; W++) if (!T(F[W], U[W])) return !1
        return !0
      }
      n.equals = i
      function s(F, U) {
        const T = F.length - 1
        U < T && (F[U] = F[T]), F.pop()
      }
      n.removeFastWithoutKeepingOrder = s
      function p(F, U, T) {
        return L(F.length, (W) => T(F[W], U))
      }
      n.binarySearch = p
      function L(F, U) {
        let T = 0,
          W = F - 1
        for (; T <= W; ) {
          const t = ((T + W) / 2) | 0,
            te = U(t)
          if (te < 0) T = t + 1
          else if (te > 0) W = t - 1
          else return t
        }
        return -(T + 1)
      }
      n.binarySearch2 = L
      function h(F, U) {
        let T = 0,
          W = F.length
        if (W === 0) return 0
        for (; T < W; ) {
          const t = Math.floor((T + W) / 2)
          U(F[t]) ? (W = t) : (T = t + 1)
        }
        return T
      }
      n.findFirstInSorted = h
      function a(F, U, T) {
        if (((F = F | 0), F >= U.length)) throw new TypeError('invalid index')
        const W = U[Math.floor(U.length * Math.random())],
          t = [],
          te = [],
          ie = []
        for (const ue of U) {
          const de = T(ue, W)
          de < 0 ? t.push(ue) : de > 0 ? te.push(ue) : ie.push(ue)
        }
        return F < t.length
          ? a(F, t, T)
          : F < t.length + ie.length
          ? ie[0]
          : a(F - (t.length + ie.length), te, T)
      }
      n.quickSelect = a
      function w(F, U) {
        const T = []
        let W
        for (const t of F.slice(0).sort(U))
          !W || U(W[0], t) !== 0 ? ((W = [t]), T.push(W)) : W.push(t)
        return T
      }
      n.groupBy = w
      function e(F) {
        return F.filter((U) => !!U)
      }
      n.coalesce = e
      function b(F) {
        let U = 0
        for (let T = 0; T < F.length; T++) F[T] && ((F[U] = F[T]), (U += 1))
        F.length = U
      }
      n.coalesceInPlace = b
      function f(F) {
        return !Array.isArray(F) || F.length === 0
      }
      n.isFalsyOrEmpty = f
      function v(F) {
        return Array.isArray(F) && F.length > 0
      }
      n.isNonEmptyArray = v
      function g(F, U = (T) => T) {
        const T = new Set()
        return F.filter((W) => {
          const t = U(W)
          return T.has(t) ? !1 : (T.add(t), !0)
        })
      }
      n.distinct = g
      function S(F, U) {
        const T = E(F, U)
        if (T !== -1) return F[T]
      }
      n.findLast = S
      function E(F, U) {
        for (let T = F.length - 1; T >= 0; T--) {
          const W = F[T]
          if (U(W)) return T
        }
        return -1
      }
      n.lastIndex = E
      function y(F, U) {
        return F.length > 0 ? F[0] : U
      }
      n.firstOrDefault = y
      function _(F, U) {
        let T = typeof U == 'number' ? F : 0
        typeof U == 'number' ? (T = F) : ((T = 0), (U = F))
        const W = []
        if (T <= U) for (let t = T; t < U; t++) W.push(t)
        else for (let t = T; t > U; t--) W.push(t)
        return W
      }
      n.range = _
      function d(F, U, T) {
        const W = F.slice(0, U),
          t = F.slice(U)
        return W.concat(T, t)
      }
      n.arrayInsert = d
      function C(F, U) {
        const T = F.indexOf(U)
        T > -1 && (F.splice(T, 1), F.unshift(U))
      }
      n.pushToStart = C
      function r(F, U) {
        const T = F.indexOf(U)
        T > -1 && (F.splice(T, 1), F.push(U))
      }
      n.pushToEnd = r
      function u(F, U) {
        for (const T of U) F.push(T)
      }
      n.pushMany = u
      function o(F) {
        return Array.isArray(F) ? F : [F]
      }
      n.asArray = o
      function c(F, U, T) {
        const W = m(F, U),
          t = F.length,
          te = T.length
        F.length = t + te
        for (let ie = t - 1; ie >= W; ie--) F[ie + te] = F[ie]
        for (let ie = 0; ie < te; ie++) F[ie + W] = T[ie]
      }
      n.insertInto = c
      function l(F, U, T, W) {
        const t = m(F, U),
          te = F.splice(t, T)
        return c(F, t, W), te
      }
      n.splice = l
      function m(F, U) {
        return U < 0 ? Math.max(U + F.length, 0) : Math.min(U, F.length)
      }
      var N
      ;(function (F) {
        function U(t) {
          return t < 0
        }
        F.isLessThan = U
        function T(t) {
          return t > 0
        }
        F.isGreaterThan = T
        function W(t) {
          return t === 0
        }
        ;(F.isNeitherLessOrGreaterThan = W),
          (F.greaterThan = 1),
          (F.lessThan = -1),
          (F.neitherLessOrGreaterThan = 0)
      })((N = n.CompareResult || (n.CompareResult = {})))
      function A(F, U) {
        return (T, W) => U(F(T), F(W))
      }
      n.compareBy = A
      const M = (F, U) => F - U
      n.numberComparator = M
      function k(F, U) {
        if (F.length === 0) return
        let T = F[0]
        for (let W = 1; W < F.length; W++) {
          const t = F[W]
          U(t, T) > 0 && (T = t)
        }
        return T
      }
      n.findMaxBy = k
      function q(F, U) {
        if (F.length === 0) return
        let T = F[0]
        for (let W = 1; W < F.length; W++) {
          const t = F[W]
          U(t, T) >= 0 && (T = t)
        }
        return T
      }
      n.findLastMaxBy = q
      function I(F, U) {
        return k(F, (T, W) => -U(T, W))
      }
      n.findMinBy = I
      class B {
        constructor(U) {
          ;(this.items = U), (this.firstIdx = 0), (this.lastIdx = this.items.length - 1)
        }
        get length() {
          return this.lastIdx - this.firstIdx + 1
        }
        takeWhile(U) {
          let T = this.firstIdx
          for (; T < this.items.length && U(this.items[T]); ) T++
          const W = T === this.firstIdx ? null : this.items.slice(this.firstIdx, T)
          return (this.firstIdx = T), W
        }
        takeFromEndWhile(U) {
          let T = this.lastIdx
          for (; T >= 0 && U(this.items[T]); ) T--
          const W = T === this.lastIdx ? null : this.items.slice(T + 1, this.lastIdx + 1)
          return (this.lastIdx = T), W
        }
        peek() {
          if (this.length !== 0) return this.items[this.firstIdx]
        }
        dequeue() {
          const U = this.items[this.firstIdx]
          return this.firstIdx++, U
        }
        takeCount(U) {
          const T = this.items.slice(this.firstIdx, this.firstIdx + U)
          return (this.firstIdx += U), T
        }
      }
      n.ArrayQueue = B
      class H {
        constructor(U) {
          this.iterate = U
        }
        toArray() {
          const U = []
          return this.iterate((T) => (U.push(T), !0)), U
        }
        filter(U) {
          return new H((T) => this.iterate((W) => (U(W) ? T(W) : !0)))
        }
        map(U) {
          return new H((T) => this.iterate((W) => T(U(W))))
        }
        findLast(U) {
          let T
          return this.iterate((W) => (U(W) && (T = W), !0)), T
        }
        findLastMaxBy(U) {
          let T,
            W = !0
          return (
            this.iterate((t) => ((W || N.isGreaterThan(U(t, T))) && ((W = !1), (T = t)), !0)), T
          )
        }
      }
      ;(H.empty = new H((F) => {})), (n.CallbackIterable = H)
    }),
    Q(Y[27], X([0, 1]), function (x, n) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.CachedFunction = n.LRUCachedFunction = void 0)
      class R {
        constructor(s) {
          ;(this.fn = s), (this.lastCache = void 0), (this.lastArgKey = void 0)
        }
        get(s) {
          const p = JSON.stringify(s)
          return (
            this.lastArgKey !== p && ((this.lastArgKey = p), (this.lastCache = this.fn(s))),
            this.lastCache
          )
        }
      }
      n.LRUCachedFunction = R
      class D {
        get cachedValues() {
          return this._map
        }
        constructor(s) {
          ;(this.fn = s), (this._map = new Map())
        }
        get(s) {
          if (this._map.has(s)) return this._map.get(s)
          const p = this.fn(s)
          return this._map.set(s, p), p
        }
      }
      n.CachedFunction = D
    }),
    Q(Y[28], X([0, 1]), function (x, n) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }), (n.DiffChange = void 0)
      class R {
        constructor(i, s, p, L) {
          ;(this.originalStart = i),
            (this.originalLength = s),
            (this.modifiedStart = p),
            (this.modifiedLength = L)
        }
        getOriginalEnd() {
          return this.originalStart + this.originalLength
        }
        getModifiedEnd() {
          return this.modifiedStart + this.modifiedLength
        }
      }
      n.DiffChange = R
    }),
    Q(Y[4], X([0, 1]), function (x, n) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.BugIndicatingError =
          n.ErrorNoTelemetry =
          n.NotSupportedError =
          n.illegalState =
          n.illegalArgument =
          n.canceled =
          n.CancellationError =
          n.isCancellationError =
          n.transformErrorForSerialization =
          n.onUnexpectedExternalError =
          n.onUnexpectedError =
          n.errorHandler =
          n.ErrorHandler =
            void 0)
      class R {
        constructor() {
          ;(this.listeners = []),
            (this.unexpectedErrorHandler = function (S) {
              setTimeout(() => {
                throw S.stack
                  ? f.isErrorNoTelemetry(S)
                    ? new f(
                        S.message +
                          `

` +
                          S.stack
                      )
                    : new Error(
                        S.message +
                          `

` +
                          S.stack
                      )
                  : S
              }, 0)
            })
        }
        emit(S) {
          this.listeners.forEach((E) => {
            E(S)
          })
        }
        onUnexpectedError(S) {
          this.unexpectedErrorHandler(S), this.emit(S)
        }
        onUnexpectedExternalError(S) {
          this.unexpectedErrorHandler(S)
        }
      }
      ;(n.ErrorHandler = R), (n.errorHandler = new R())
      function D(g) {
        L(g) || n.errorHandler.onUnexpectedError(g)
      }
      n.onUnexpectedError = D
      function i(g) {
        L(g) || n.errorHandler.onUnexpectedExternalError(g)
      }
      n.onUnexpectedExternalError = i
      function s(g) {
        if (g instanceof Error) {
          const { name: S, message: E } = g,
            y = g.stacktrace || g.stack
          return {
            $isError: !0,
            name: S,
            message: E,
            stack: y,
            noTelemetry: f.isErrorNoTelemetry(g),
          }
        }
        return g
      }
      n.transformErrorForSerialization = s
      const p = 'Canceled'
      function L(g) {
        return g instanceof h ? !0 : g instanceof Error && g.name === p && g.message === p
      }
      n.isCancellationError = L
      class h extends Error {
        constructor() {
          super(p), (this.name = this.message)
        }
      }
      n.CancellationError = h
      function a() {
        const g = new Error(p)
        return (g.name = g.message), g
      }
      n.canceled = a
      function w(g) {
        return g ? new Error(`Illegal argument: ${g}`) : new Error('Illegal argument')
      }
      n.illegalArgument = w
      function e(g) {
        return g ? new Error(`Illegal state: ${g}`) : new Error('Illegal state')
      }
      n.illegalState = e
      class b extends Error {
        constructor(S) {
          super('NotSupported'), S && (this.message = S)
        }
      }
      n.NotSupportedError = b
      class f extends Error {
        constructor(S) {
          super(S), (this.name = 'CodeExpectedError')
        }
        static fromError(S) {
          if (S instanceof f) return S
          const E = new f()
          return (E.message = S.message), (E.stack = S.stack), E
        }
        static isErrorNoTelemetry(S) {
          return S.name === 'CodeExpectedError'
        }
      }
      n.ErrorNoTelemetry = f
      class v extends Error {
        constructor(S) {
          super(S || 'An unexpected bug occurred.'), Object.setPrototypeOf(this, v.prototype)
          debugger
        }
      }
      n.BugIndicatingError = v
    }),
    Q(Y[10], X([0, 1, 4]), function (x, n, R) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.checkAdjacentItems = n.assertFn = n.assertNever = n.ok = void 0)
      function D(L, h) {
        if (!L) throw new Error(h ? `Assertion failed (${h})` : 'Assertion Failed')
      }
      n.ok = D
      function i(L, h = 'Unreachable') {
        throw new Error(h)
      }
      n.assertNever = i
      function s(L) {
        if (!L()) {
          debugger
          L(), (0, R.onUnexpectedError)(new R.BugIndicatingError('Assertion Failed'))
        }
      }
      n.assertFn = s
      function p(L, h) {
        let a = 0
        for (; a < L.length - 1; ) {
          const w = L[a],
            e = L[a + 1]
          if (!h(w, e)) return !1
          a++
        }
        return !0
      }
      n.checkAdjacentItems = p
    }),
    Q(Y[14], X([0, 1]), function (x, n) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }), (n.once = void 0)
      function R(D) {
        const i = this
        let s = !1,
          p
        return function () {
          return s || ((s = !0), (p = D.apply(i, arguments))), p
        }
      }
      n.once = R
    }),
    Q(Y[15], X([0, 1]), function (x, n) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }), (n.Iterable = void 0)
      var R
      ;(function (D) {
        function i(d) {
          return d && typeof d == 'object' && typeof d[Symbol.iterator] == 'function'
        }
        D.is = i
        const s = Object.freeze([])
        function p() {
          return s
        }
        D.empty = p
        function* L(d) {
          yield d
        }
        D.single = L
        function h(d) {
          return i(d) ? d : L(d)
        }
        D.wrap = h
        function a(d) {
          return d || s
        }
        D.from = a
        function w(d) {
          return !d || d[Symbol.iterator]().next().done === !0
        }
        D.isEmpty = w
        function e(d) {
          return d[Symbol.iterator]().next().value
        }
        D.first = e
        function b(d, C) {
          for (const r of d) if (C(r)) return !0
          return !1
        }
        D.some = b
        function f(d, C) {
          for (const r of d) if (C(r)) return r
        }
        D.find = f
        function* v(d, C) {
          for (const r of d) C(r) && (yield r)
        }
        D.filter = v
        function* g(d, C) {
          let r = 0
          for (const u of d) yield C(u, r++)
        }
        D.map = g
        function* S(...d) {
          for (const C of d) for (const r of C) yield r
        }
        D.concat = S
        function E(d, C, r) {
          let u = r
          for (const o of d) u = C(u, o)
          return u
        }
        D.reduce = E
        function* y(d, C, r = d.length) {
          for (
            C < 0 && (C += d.length), r < 0 ? (r += d.length) : r > d.length && (r = d.length);
            C < r;
            C++
          )
            yield d[C]
        }
        D.slice = y
        function _(d, C = Number.POSITIVE_INFINITY) {
          const r = []
          if (C === 0) return [r, d]
          const u = d[Symbol.iterator]()
          for (let o = 0; o < C; o++) {
            const c = u.next()
            if (c.done) return [r, D.empty()]
            r.push(c.value)
          }
          return [
            r,
            {
              [Symbol.iterator]() {
                return u
              },
            },
          ]
        }
        D.consume = _
      })((R = n.Iterable || (n.Iterable = {})))
    }),
    Q(Y[29], X([0, 1]), function (x, n) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.KeyChord =
          n.KeyCodeUtils =
          n.IMMUTABLE_KEY_CODE_TO_CODE =
          n.IMMUTABLE_CODE_TO_KEY_CODE =
          n.NATIVE_WINDOWS_KEY_CODE_TO_KEY_CODE =
          n.EVENT_KEY_CODE_MAP =
            void 0)
      class R {
        constructor() {
          ;(this._keyCodeToStr = []), (this._strToKeyCode = Object.create(null))
        }
        define(b, f) {
          ;(this._keyCodeToStr[b] = f), (this._strToKeyCode[f.toLowerCase()] = b)
        }
        keyCodeToStr(b) {
          return this._keyCodeToStr[b]
        }
        strToKeyCode(b) {
          return this._strToKeyCode[b.toLowerCase()] || 0
        }
      }
      const D = new R(),
        i = new R(),
        s = new R()
      ;(n.EVENT_KEY_CODE_MAP = new Array(230)), (n.NATIVE_WINDOWS_KEY_CODE_TO_KEY_CODE = {})
      const p = [],
        L = Object.create(null),
        h = Object.create(null)
      ;(n.IMMUTABLE_CODE_TO_KEY_CODE = []), (n.IMMUTABLE_KEY_CODE_TO_CODE = [])
      for (let e = 0; e <= 193; e++) n.IMMUTABLE_CODE_TO_KEY_CODE[e] = -1
      for (let e = 0; e <= 127; e++) n.IMMUTABLE_KEY_CODE_TO_CODE[e] = -1
      ;(function () {
        const e = '',
          b = [
            [0, 1, 0, 'None', 0, 'unknown', 0, 'VK_UNKNOWN', e, e],
            [0, 1, 1, 'Hyper', 0, e, 0, e, e, e],
            [0, 1, 2, 'Super', 0, e, 0, e, e, e],
            [0, 1, 3, 'Fn', 0, e, 0, e, e, e],
            [0, 1, 4, 'FnLock', 0, e, 0, e, e, e],
            [0, 1, 5, 'Suspend', 0, e, 0, e, e, e],
            [0, 1, 6, 'Resume', 0, e, 0, e, e, e],
            [0, 1, 7, 'Turbo', 0, e, 0, e, e, e],
            [0, 1, 8, 'Sleep', 0, e, 0, 'VK_SLEEP', e, e],
            [0, 1, 9, 'WakeUp', 0, e, 0, e, e, e],
            [31, 0, 10, 'KeyA', 31, 'A', 65, 'VK_A', e, e],
            [32, 0, 11, 'KeyB', 32, 'B', 66, 'VK_B', e, e],
            [33, 0, 12, 'KeyC', 33, 'C', 67, 'VK_C', e, e],
            [34, 0, 13, 'KeyD', 34, 'D', 68, 'VK_D', e, e],
            [35, 0, 14, 'KeyE', 35, 'E', 69, 'VK_E', e, e],
            [36, 0, 15, 'KeyF', 36, 'F', 70, 'VK_F', e, e],
            [37, 0, 16, 'KeyG', 37, 'G', 71, 'VK_G', e, e],
            [38, 0, 17, 'KeyH', 38, 'H', 72, 'VK_H', e, e],
            [39, 0, 18, 'KeyI', 39, 'I', 73, 'VK_I', e, e],
            [40, 0, 19, 'KeyJ', 40, 'J', 74, 'VK_J', e, e],
            [41, 0, 20, 'KeyK', 41, 'K', 75, 'VK_K', e, e],
            [42, 0, 21, 'KeyL', 42, 'L', 76, 'VK_L', e, e],
            [43, 0, 22, 'KeyM', 43, 'M', 77, 'VK_M', e, e],
            [44, 0, 23, 'KeyN', 44, 'N', 78, 'VK_N', e, e],
            [45, 0, 24, 'KeyO', 45, 'O', 79, 'VK_O', e, e],
            [46, 0, 25, 'KeyP', 46, 'P', 80, 'VK_P', e, e],
            [47, 0, 26, 'KeyQ', 47, 'Q', 81, 'VK_Q', e, e],
            [48, 0, 27, 'KeyR', 48, 'R', 82, 'VK_R', e, e],
            [49, 0, 28, 'KeyS', 49, 'S', 83, 'VK_S', e, e],
            [50, 0, 29, 'KeyT', 50, 'T', 84, 'VK_T', e, e],
            [51, 0, 30, 'KeyU', 51, 'U', 85, 'VK_U', e, e],
            [52, 0, 31, 'KeyV', 52, 'V', 86, 'VK_V', e, e],
            [53, 0, 32, 'KeyW', 53, 'W', 87, 'VK_W', e, e],
            [54, 0, 33, 'KeyX', 54, 'X', 88, 'VK_X', e, e],
            [55, 0, 34, 'KeyY', 55, 'Y', 89, 'VK_Y', e, e],
            [56, 0, 35, 'KeyZ', 56, 'Z', 90, 'VK_Z', e, e],
            [22, 0, 36, 'Digit1', 22, '1', 49, 'VK_1', e, e],
            [23, 0, 37, 'Digit2', 23, '2', 50, 'VK_2', e, e],
            [24, 0, 38, 'Digit3', 24, '3', 51, 'VK_3', e, e],
            [25, 0, 39, 'Digit4', 25, '4', 52, 'VK_4', e, e],
            [26, 0, 40, 'Digit5', 26, '5', 53, 'VK_5', e, e],
            [27, 0, 41, 'Digit6', 27, '6', 54, 'VK_6', e, e],
            [28, 0, 42, 'Digit7', 28, '7', 55, 'VK_7', e, e],
            [29, 0, 43, 'Digit8', 29, '8', 56, 'VK_8', e, e],
            [30, 0, 44, 'Digit9', 30, '9', 57, 'VK_9', e, e],
            [21, 0, 45, 'Digit0', 21, '0', 48, 'VK_0', e, e],
            [3, 1, 46, 'Enter', 3, 'Enter', 13, 'VK_RETURN', e, e],
            [9, 1, 47, 'Escape', 9, 'Escape', 27, 'VK_ESCAPE', e, e],
            [1, 1, 48, 'Backspace', 1, 'Backspace', 8, 'VK_BACK', e, e],
            [2, 1, 49, 'Tab', 2, 'Tab', 9, 'VK_TAB', e, e],
            [10, 1, 50, 'Space', 10, 'Space', 32, 'VK_SPACE', e, e],
            [83, 0, 51, 'Minus', 83, '-', 189, 'VK_OEM_MINUS', '-', 'OEM_MINUS'],
            [81, 0, 52, 'Equal', 81, '=', 187, 'VK_OEM_PLUS', '=', 'OEM_PLUS'],
            [87, 0, 53, 'BracketLeft', 87, '[', 219, 'VK_OEM_4', '[', 'OEM_4'],
            [89, 0, 54, 'BracketRight', 89, ']', 221, 'VK_OEM_6', ']', 'OEM_6'],
            [88, 0, 55, 'Backslash', 88, '\\', 220, 'VK_OEM_5', '\\', 'OEM_5'],
            [0, 0, 56, 'IntlHash', 0, e, 0, e, e, e],
            [80, 0, 57, 'Semicolon', 80, ';', 186, 'VK_OEM_1', ';', 'OEM_1'],
            [90, 0, 58, 'Quote', 90, "'", 222, 'VK_OEM_7', "'", 'OEM_7'],
            [86, 0, 59, 'Backquote', 86, '`', 192, 'VK_OEM_3', '`', 'OEM_3'],
            [82, 0, 60, 'Comma', 82, ',', 188, 'VK_OEM_COMMA', ',', 'OEM_COMMA'],
            [84, 0, 61, 'Period', 84, '.', 190, 'VK_OEM_PERIOD', '.', 'OEM_PERIOD'],
            [85, 0, 62, 'Slash', 85, '/', 191, 'VK_OEM_2', '/', 'OEM_2'],
            [8, 1, 63, 'CapsLock', 8, 'CapsLock', 20, 'VK_CAPITAL', e, e],
            [59, 1, 64, 'F1', 59, 'F1', 112, 'VK_F1', e, e],
            [60, 1, 65, 'F2', 60, 'F2', 113, 'VK_F2', e, e],
            [61, 1, 66, 'F3', 61, 'F3', 114, 'VK_F3', e, e],
            [62, 1, 67, 'F4', 62, 'F4', 115, 'VK_F4', e, e],
            [63, 1, 68, 'F5', 63, 'F5', 116, 'VK_F5', e, e],
            [64, 1, 69, 'F6', 64, 'F6', 117, 'VK_F6', e, e],
            [65, 1, 70, 'F7', 65, 'F7', 118, 'VK_F7', e, e],
            [66, 1, 71, 'F8', 66, 'F8', 119, 'VK_F8', e, e],
            [67, 1, 72, 'F9', 67, 'F9', 120, 'VK_F9', e, e],
            [68, 1, 73, 'F10', 68, 'F10', 121, 'VK_F10', e, e],
            [69, 1, 74, 'F11', 69, 'F11', 122, 'VK_F11', e, e],
            [70, 1, 75, 'F12', 70, 'F12', 123, 'VK_F12', e, e],
            [0, 1, 76, 'PrintScreen', 0, e, 0, e, e, e],
            [79, 1, 77, 'ScrollLock', 79, 'ScrollLock', 145, 'VK_SCROLL', e, e],
            [7, 1, 78, 'Pause', 7, 'PauseBreak', 19, 'VK_PAUSE', e, e],
            [19, 1, 79, 'Insert', 19, 'Insert', 45, 'VK_INSERT', e, e],
            [14, 1, 80, 'Home', 14, 'Home', 36, 'VK_HOME', e, e],
            [11, 1, 81, 'PageUp', 11, 'PageUp', 33, 'VK_PRIOR', e, e],
            [20, 1, 82, 'Delete', 20, 'Delete', 46, 'VK_DELETE', e, e],
            [13, 1, 83, 'End', 13, 'End', 35, 'VK_END', e, e],
            [12, 1, 84, 'PageDown', 12, 'PageDown', 34, 'VK_NEXT', e, e],
            [17, 1, 85, 'ArrowRight', 17, 'RightArrow', 39, 'VK_RIGHT', 'Right', e],
            [15, 1, 86, 'ArrowLeft', 15, 'LeftArrow', 37, 'VK_LEFT', 'Left', e],
            [18, 1, 87, 'ArrowDown', 18, 'DownArrow', 40, 'VK_DOWN', 'Down', e],
            [16, 1, 88, 'ArrowUp', 16, 'UpArrow', 38, 'VK_UP', 'Up', e],
            [78, 1, 89, 'NumLock', 78, 'NumLock', 144, 'VK_NUMLOCK', e, e],
            [108, 1, 90, 'NumpadDivide', 108, 'NumPad_Divide', 111, 'VK_DIVIDE', e, e],
            [103, 1, 91, 'NumpadMultiply', 103, 'NumPad_Multiply', 106, 'VK_MULTIPLY', e, e],
            [106, 1, 92, 'NumpadSubtract', 106, 'NumPad_Subtract', 109, 'VK_SUBTRACT', e, e],
            [104, 1, 93, 'NumpadAdd', 104, 'NumPad_Add', 107, 'VK_ADD', e, e],
            [3, 1, 94, 'NumpadEnter', 3, e, 0, e, e, e],
            [94, 1, 95, 'Numpad1', 94, 'NumPad1', 97, 'VK_NUMPAD1', e, e],
            [95, 1, 96, 'Numpad2', 95, 'NumPad2', 98, 'VK_NUMPAD2', e, e],
            [96, 1, 97, 'Numpad3', 96, 'NumPad3', 99, 'VK_NUMPAD3', e, e],
            [97, 1, 98, 'Numpad4', 97, 'NumPad4', 100, 'VK_NUMPAD4', e, e],
            [98, 1, 99, 'Numpad5', 98, 'NumPad5', 101, 'VK_NUMPAD5', e, e],
            [99, 1, 100, 'Numpad6', 99, 'NumPad6', 102, 'VK_NUMPAD6', e, e],
            [100, 1, 101, 'Numpad7', 100, 'NumPad7', 103, 'VK_NUMPAD7', e, e],
            [101, 1, 102, 'Numpad8', 101, 'NumPad8', 104, 'VK_NUMPAD8', e, e],
            [102, 1, 103, 'Numpad9', 102, 'NumPad9', 105, 'VK_NUMPAD9', e, e],
            [93, 1, 104, 'Numpad0', 93, 'NumPad0', 96, 'VK_NUMPAD0', e, e],
            [107, 1, 105, 'NumpadDecimal', 107, 'NumPad_Decimal', 110, 'VK_DECIMAL', e, e],
            [92, 0, 106, 'IntlBackslash', 92, 'OEM_102', 226, 'VK_OEM_102', e, e],
            [58, 1, 107, 'ContextMenu', 58, 'ContextMenu', 93, e, e, e],
            [0, 1, 108, 'Power', 0, e, 0, e, e, e],
            [0, 1, 109, 'NumpadEqual', 0, e, 0, e, e, e],
            [71, 1, 110, 'F13', 71, 'F13', 124, 'VK_F13', e, e],
            [72, 1, 111, 'F14', 72, 'F14', 125, 'VK_F14', e, e],
            [73, 1, 112, 'F15', 73, 'F15', 126, 'VK_F15', e, e],
            [74, 1, 113, 'F16', 74, 'F16', 127, 'VK_F16', e, e],
            [75, 1, 114, 'F17', 75, 'F17', 128, 'VK_F17', e, e],
            [76, 1, 115, 'F18', 76, 'F18', 129, 'VK_F18', e, e],
            [77, 1, 116, 'F19', 77, 'F19', 130, 'VK_F19', e, e],
            [0, 1, 117, 'F20', 0, e, 0, 'VK_F20', e, e],
            [0, 1, 118, 'F21', 0, e, 0, 'VK_F21', e, e],
            [0, 1, 119, 'F22', 0, e, 0, 'VK_F22', e, e],
            [0, 1, 120, 'F23', 0, e, 0, 'VK_F23', e, e],
            [0, 1, 121, 'F24', 0, e, 0, 'VK_F24', e, e],
            [0, 1, 122, 'Open', 0, e, 0, e, e, e],
            [0, 1, 123, 'Help', 0, e, 0, e, e, e],
            [0, 1, 124, 'Select', 0, e, 0, e, e, e],
            [0, 1, 125, 'Again', 0, e, 0, e, e, e],
            [0, 1, 126, 'Undo', 0, e, 0, e, e, e],
            [0, 1, 127, 'Cut', 0, e, 0, e, e, e],
            [0, 1, 128, 'Copy', 0, e, 0, e, e, e],
            [0, 1, 129, 'Paste', 0, e, 0, e, e, e],
            [0, 1, 130, 'Find', 0, e, 0, e, e, e],
            [0, 1, 131, 'AudioVolumeMute', 112, 'AudioVolumeMute', 173, 'VK_VOLUME_MUTE', e, e],
            [0, 1, 132, 'AudioVolumeUp', 113, 'AudioVolumeUp', 175, 'VK_VOLUME_UP', e, e],
            [0, 1, 133, 'AudioVolumeDown', 114, 'AudioVolumeDown', 174, 'VK_VOLUME_DOWN', e, e],
            [105, 1, 134, 'NumpadComma', 105, 'NumPad_Separator', 108, 'VK_SEPARATOR', e, e],
            [110, 0, 135, 'IntlRo', 110, 'ABNT_C1', 193, 'VK_ABNT_C1', e, e],
            [0, 1, 136, 'KanaMode', 0, e, 0, e, e, e],
            [0, 0, 137, 'IntlYen', 0, e, 0, e, e, e],
            [0, 1, 138, 'Convert', 0, e, 0, e, e, e],
            [0, 1, 139, 'NonConvert', 0, e, 0, e, e, e],
            [0, 1, 140, 'Lang1', 0, e, 0, e, e, e],
            [0, 1, 141, 'Lang2', 0, e, 0, e, e, e],
            [0, 1, 142, 'Lang3', 0, e, 0, e, e, e],
            [0, 1, 143, 'Lang4', 0, e, 0, e, e, e],
            [0, 1, 144, 'Lang5', 0, e, 0, e, e, e],
            [0, 1, 145, 'Abort', 0, e, 0, e, e, e],
            [0, 1, 146, 'Props', 0, e, 0, e, e, e],
            [0, 1, 147, 'NumpadParenLeft', 0, e, 0, e, e, e],
            [0, 1, 148, 'NumpadParenRight', 0, e, 0, e, e, e],
            [0, 1, 149, 'NumpadBackspace', 0, e, 0, e, e, e],
            [0, 1, 150, 'NumpadMemoryStore', 0, e, 0, e, e, e],
            [0, 1, 151, 'NumpadMemoryRecall', 0, e, 0, e, e, e],
            [0, 1, 152, 'NumpadMemoryClear', 0, e, 0, e, e, e],
            [0, 1, 153, 'NumpadMemoryAdd', 0, e, 0, e, e, e],
            [0, 1, 154, 'NumpadMemorySubtract', 0, e, 0, e, e, e],
            [0, 1, 155, 'NumpadClear', 126, 'Clear', 12, 'VK_CLEAR', e, e],
            [0, 1, 156, 'NumpadClearEntry', 0, e, 0, e, e, e],
            [5, 1, 0, e, 5, 'Ctrl', 17, 'VK_CONTROL', e, e],
            [4, 1, 0, e, 4, 'Shift', 16, 'VK_SHIFT', e, e],
            [6, 1, 0, e, 6, 'Alt', 18, 'VK_MENU', e, e],
            [57, 1, 0, e, 57, 'Meta', 91, 'VK_COMMAND', e, e],
            [5, 1, 157, 'ControlLeft', 5, e, 0, 'VK_LCONTROL', e, e],
            [4, 1, 158, 'ShiftLeft', 4, e, 0, 'VK_LSHIFT', e, e],
            [6, 1, 159, 'AltLeft', 6, e, 0, 'VK_LMENU', e, e],
            [57, 1, 160, 'MetaLeft', 57, e, 0, 'VK_LWIN', e, e],
            [5, 1, 161, 'ControlRight', 5, e, 0, 'VK_RCONTROL', e, e],
            [4, 1, 162, 'ShiftRight', 4, e, 0, 'VK_RSHIFT', e, e],
            [6, 1, 163, 'AltRight', 6, e, 0, 'VK_RMENU', e, e],
            [57, 1, 164, 'MetaRight', 57, e, 0, 'VK_RWIN', e, e],
            [0, 1, 165, 'BrightnessUp', 0, e, 0, e, e, e],
            [0, 1, 166, 'BrightnessDown', 0, e, 0, e, e, e],
            [0, 1, 167, 'MediaPlay', 0, e, 0, e, e, e],
            [0, 1, 168, 'MediaRecord', 0, e, 0, e, e, e],
            [0, 1, 169, 'MediaFastForward', 0, e, 0, e, e, e],
            [0, 1, 170, 'MediaRewind', 0, e, 0, e, e, e],
            [
              114,
              1,
              171,
              'MediaTrackNext',
              119,
              'MediaTrackNext',
              176,
              'VK_MEDIA_NEXT_TRACK',
              e,
              e,
            ],
            [
              115,
              1,
              172,
              'MediaTrackPrevious',
              120,
              'MediaTrackPrevious',
              177,
              'VK_MEDIA_PREV_TRACK',
              e,
              e,
            ],
            [116, 1, 173, 'MediaStop', 121, 'MediaStop', 178, 'VK_MEDIA_STOP', e, e],
            [0, 1, 174, 'Eject', 0, e, 0, e, e, e],
            [
              117,
              1,
              175,
              'MediaPlayPause',
              122,
              'MediaPlayPause',
              179,
              'VK_MEDIA_PLAY_PAUSE',
              e,
              e,
            ],
            [
              0,
              1,
              176,
              'MediaSelect',
              123,
              'LaunchMediaPlayer',
              181,
              'VK_MEDIA_LAUNCH_MEDIA_SELECT',
              e,
              e,
            ],
            [0, 1, 177, 'LaunchMail', 124, 'LaunchMail', 180, 'VK_MEDIA_LAUNCH_MAIL', e, e],
            [0, 1, 178, 'LaunchApp2', 125, 'LaunchApp2', 183, 'VK_MEDIA_LAUNCH_APP2', e, e],
            [0, 1, 179, 'LaunchApp1', 0, e, 0, 'VK_MEDIA_LAUNCH_APP1', e, e],
            [0, 1, 180, 'SelectTask', 0, e, 0, e, e, e],
            [0, 1, 181, 'LaunchScreenSaver', 0, e, 0, e, e, e],
            [0, 1, 182, 'BrowserSearch', 115, 'BrowserSearch', 170, 'VK_BROWSER_SEARCH', e, e],
            [0, 1, 183, 'BrowserHome', 116, 'BrowserHome', 172, 'VK_BROWSER_HOME', e, e],
            [112, 1, 184, 'BrowserBack', 117, 'BrowserBack', 166, 'VK_BROWSER_BACK', e, e],
            [113, 1, 185, 'BrowserForward', 118, 'BrowserForward', 167, 'VK_BROWSER_FORWARD', e, e],
            [0, 1, 186, 'BrowserStop', 0, e, 0, 'VK_BROWSER_STOP', e, e],
            [0, 1, 187, 'BrowserRefresh', 0, e, 0, 'VK_BROWSER_REFRESH', e, e],
            [0, 1, 188, 'BrowserFavorites', 0, e, 0, 'VK_BROWSER_FAVORITES', e, e],
            [0, 1, 189, 'ZoomToggle', 0, e, 0, e, e, e],
            [0, 1, 190, 'MailReply', 0, e, 0, e, e, e],
            [0, 1, 191, 'MailForward', 0, e, 0, e, e, e],
            [0, 1, 192, 'MailSend', 0, e, 0, e, e, e],
            [109, 1, 0, e, 109, 'KeyInComposition', 229, e, e, e],
            [111, 1, 0, e, 111, 'ABNT_C2', 194, 'VK_ABNT_C2', e, e],
            [91, 1, 0, e, 91, 'OEM_8', 223, 'VK_OEM_8', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_KANA', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_HANGUL', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_JUNJA', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_FINAL', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_HANJA', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_KANJI', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_CONVERT', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_NONCONVERT', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_ACCEPT', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_MODECHANGE', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_SELECT', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_PRINT', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_EXECUTE', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_SNAPSHOT', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_HELP', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_APPS', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_PROCESSKEY', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_PACKET', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_DBE_SBCSCHAR', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_DBE_DBCSCHAR', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_ATTN', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_CRSEL', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_EXSEL', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_EREOF', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_PLAY', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_ZOOM', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_NONAME', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_PA1', e, e],
            [0, 1, 0, e, 0, e, 0, 'VK_OEM_CLEAR', e, e],
          ],
          f = [],
          v = []
        for (const g of b) {
          const [S, E, y, _, d, C, r, u, o, c] = g
          if (
            (v[y] ||
              ((v[y] = !0),
              (p[y] = _),
              (L[_] = y),
              (h[_.toLowerCase()] = y),
              E &&
                ((n.IMMUTABLE_CODE_TO_KEY_CODE[y] = d),
                d !== 0 &&
                  d !== 3 &&
                  d !== 5 &&
                  d !== 4 &&
                  d !== 6 &&
                  d !== 57 &&
                  (n.IMMUTABLE_KEY_CODE_TO_CODE[d] = y))),
            !f[d])
          ) {
            if (((f[d] = !0), !C))
              throw new Error(
                `String representation missing for key code ${d} around scan code ${_}`
              )
            D.define(d, C), i.define(d, o || C), s.define(d, c || o || C)
          }
          r && (n.EVENT_KEY_CODE_MAP[r] = d), u && (n.NATIVE_WINDOWS_KEY_CODE_TO_KEY_CODE[u] = d)
        }
        n.IMMUTABLE_KEY_CODE_TO_CODE[3] = 46
      })()
      var a
      ;(function (e) {
        function b(y) {
          return D.keyCodeToStr(y)
        }
        e.toString = b
        function f(y) {
          return D.strToKeyCode(y)
        }
        e.fromString = f
        function v(y) {
          return i.keyCodeToStr(y)
        }
        e.toUserSettingsUS = v
        function g(y) {
          return s.keyCodeToStr(y)
        }
        e.toUserSettingsGeneral = g
        function S(y) {
          return i.strToKeyCode(y) || s.strToKeyCode(y)
        }
        e.fromUserSettings = S
        function E(y) {
          if (y >= 93 && y <= 108) return null
          switch (y) {
            case 16:
              return 'Up'
            case 18:
              return 'Down'
            case 15:
              return 'Left'
            case 17:
              return 'Right'
          }
          return D.keyCodeToStr(y)
        }
        e.toElectronAccelerator = E
      })((a = n.KeyCodeUtils || (n.KeyCodeUtils = {})))
      function w(e, b) {
        const f = ((b & 65535) << 16) >>> 0
        return (e | f) >>> 0
      }
      n.KeyChord = w
    }),
    Q(Y[30], X([0, 1]), function (x, n) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }), (n.Lazy = void 0)
      class R {
        constructor(i) {
          ;(this.executor = i), (this._didRun = !1)
        }
        get value() {
          if (!this._didRun)
            try {
              this._value = this.executor()
            } catch (i) {
              this._error = i
            } finally {
              this._didRun = !0
            }
          if (this._error) throw this._error
          return this._value
        }
        get rawValue() {
          return this._value
        }
      }
      n.Lazy = R
    }),
    Q(Y[11], X([0, 1, 14, 15]), function (x, n, R, D) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.DisposableMap =
          n.ImmortalReference =
          n.SafeDisposable =
          n.RefCountedDisposable =
          n.MutableDisposable =
          n.Disposable =
          n.DisposableStore =
          n.toDisposable =
          n.combinedDisposable =
          n.dispose =
          n.isDisposable =
          n.markAsSingleton =
          n.setDisposableTracker =
            void 0)
      const i = !1
      let s = null
      function p(u) {
        s = u
      }
      if (((n.setDisposableTracker = p), i)) {
        const u = '__is_disposable_tracked__'
        p(
          new (class {
            trackDisposable(o) {
              const c = new Error('Potentially leaked disposable').stack
              setTimeout(() => {
                o[u] || console.log(c)
              }, 3e3)
            }
            setParent(o, c) {
              if (o && o !== E.None)
                try {
                  o[u] = !0
                } catch {}
            }
            markAsDisposed(o) {
              if (o && o !== E.None)
                try {
                  o[u] = !0
                } catch {}
            }
            markAsSingleton(o) {}
          })()
        )
      }
      function L(u) {
        return s?.trackDisposable(u), u
      }
      function h(u) {
        s?.markAsDisposed(u)
      }
      function a(u, o) {
        s?.setParent(u, o)
      }
      function w(u, o) {
        if (!!s) for (const c of u) s.setParent(c, o)
      }
      function e(u) {
        return s?.markAsSingleton(u), u
      }
      n.markAsSingleton = e
      function b(u) {
        return typeof u.dispose == 'function' && u.dispose.length === 0
      }
      n.isDisposable = b
      function f(u) {
        if (D.Iterable.is(u)) {
          const o = []
          for (const c of u)
            if (c)
              try {
                c.dispose()
              } catch (l) {
                o.push(l)
              }
          if (o.length === 1) throw o[0]
          if (o.length > 1)
            throw new AggregateError(o, 'Encountered errors while disposing of store')
          return Array.isArray(u) ? [] : u
        } else if (u) return u.dispose(), u
      }
      n.dispose = f
      function v(...u) {
        const o = g(() => f(u))
        return w(u, o), o
      }
      n.combinedDisposable = v
      function g(u) {
        const o = L({
          dispose: (0, R.once)(() => {
            h(o), u()
          }),
        })
        return o
      }
      n.toDisposable = g
      class S {
        constructor() {
          ;(this._toDispose = new Set()), (this._isDisposed = !1), L(this)
        }
        dispose() {
          this._isDisposed || (h(this), (this._isDisposed = !0), this.clear())
        }
        get isDisposed() {
          return this._isDisposed
        }
        clear() {
          if (this._toDispose.size !== 0)
            try {
              f(this._toDispose)
            } finally {
              this._toDispose.clear()
            }
        }
        add(o) {
          if (!o) return o
          if (o === this) throw new Error('Cannot register a disposable on itself!')
          return (
            a(o, this),
            this._isDisposed
              ? S.DISABLE_DISPOSED_WARNING ||
                console.warn(
                  new Error(
                    'Trying to add a disposable to a DisposableStore that has already been disposed of. The added object will be leaked!'
                  ).stack
                )
              : this._toDispose.add(o),
            o
          )
        }
      }
      ;(S.DISABLE_DISPOSED_WARNING = !1), (n.DisposableStore = S)
      class E {
        constructor() {
          ;(this._store = new S()), L(this), a(this._store, this)
        }
        dispose() {
          h(this), this._store.dispose()
        }
        _register(o) {
          if (o === this) throw new Error('Cannot register a disposable on itself!')
          return this._store.add(o)
        }
      }
      ;(E.None = Object.freeze({ dispose() {} })), (n.Disposable = E)
      class y {
        constructor() {
          ;(this._isDisposed = !1), L(this)
        }
        get value() {
          return this._isDisposed ? void 0 : this._value
        }
        set value(o) {
          var c
          this._isDisposed ||
            o === this._value ||
            ((c = this._value) === null || c === void 0 || c.dispose(),
            o && a(o, this),
            (this._value = o))
        }
        clear() {
          this.value = void 0
        }
        dispose() {
          var o
          ;(this._isDisposed = !0),
            h(this),
            (o = this._value) === null || o === void 0 || o.dispose(),
            (this._value = void 0)
        }
        clearAndLeak() {
          const o = this._value
          return (this._value = void 0), o && a(o, null), o
        }
      }
      n.MutableDisposable = y
      class _ {
        constructor(o) {
          ;(this._disposable = o), (this._counter = 1)
        }
        acquire() {
          return this._counter++, this
        }
        release() {
          return --this._counter === 0 && this._disposable.dispose(), this
        }
      }
      n.RefCountedDisposable = _
      class d {
        constructor() {
          ;(this.dispose = () => {}), (this.unset = () => {}), (this.isset = () => !1), L(this)
        }
        set(o) {
          let c = o
          return (
            (this.unset = () => (c = void 0)),
            (this.isset = () => c !== void 0),
            (this.dispose = () => {
              c && (c(), (c = void 0), h(this))
            }),
            this
          )
        }
      }
      n.SafeDisposable = d
      class C {
        constructor(o) {
          this.object = o
        }
        dispose() {}
      }
      n.ImmortalReference = C
      class r {
        constructor() {
          ;(this._store = new Map()), (this._isDisposed = !1), L(this)
        }
        dispose() {
          h(this), (this._isDisposed = !0), this.clearAndDisposeAll()
        }
        clearAndDisposeAll() {
          if (!!this._store.size)
            try {
              f(this._store.values())
            } finally {
              this._store.clear()
            }
        }
        get(o) {
          return this._store.get(o)
        }
        set(o, c, l = !1) {
          var m
          this._isDisposed &&
            console.warn(
              new Error(
                'Trying to add a disposable to a DisposableMap that has already been disposed of. The added object will be leaked!'
              ).stack
            ),
            l || (m = this._store.get(o)) === null || m === void 0 || m.dispose(),
            this._store.set(o, c)
        }
        deleteAndDispose(o) {
          var c
          ;(c = this._store.get(o)) === null || c === void 0 || c.dispose(), this._store.delete(o)
        }
        [Symbol.iterator]() {
          return this._store[Symbol.iterator]()
        }
      }
      n.DisposableMap = r
    }),
    Q(Y[16], X([0, 1]), function (x, n) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }), (n.LinkedList = void 0)
      class R {
        constructor(s) {
          ;(this.element = s), (this.next = R.Undefined), (this.prev = R.Undefined)
        }
      }
      R.Undefined = new R(void 0)
      class D {
        constructor() {
          ;(this._first = R.Undefined), (this._last = R.Undefined), (this._size = 0)
        }
        get size() {
          return this._size
        }
        isEmpty() {
          return this._first === R.Undefined
        }
        clear() {
          let s = this._first
          for (; s !== R.Undefined; ) {
            const p = s.next
            ;(s.prev = R.Undefined), (s.next = R.Undefined), (s = p)
          }
          ;(this._first = R.Undefined), (this._last = R.Undefined), (this._size = 0)
        }
        unshift(s) {
          return this._insert(s, !1)
        }
        push(s) {
          return this._insert(s, !0)
        }
        _insert(s, p) {
          const L = new R(s)
          if (this._first === R.Undefined) (this._first = L), (this._last = L)
          else if (p) {
            const a = this._last
            ;(this._last = L), (L.prev = a), (a.next = L)
          } else {
            const a = this._first
            ;(this._first = L), (L.next = a), (a.prev = L)
          }
          this._size += 1
          let h = !1
          return () => {
            h || ((h = !0), this._remove(L))
          }
        }
        shift() {
          if (this._first !== R.Undefined) {
            const s = this._first.element
            return this._remove(this._first), s
          }
        }
        pop() {
          if (this._last !== R.Undefined) {
            const s = this._last.element
            return this._remove(this._last), s
          }
        }
        _remove(s) {
          if (s.prev !== R.Undefined && s.next !== R.Undefined) {
            const p = s.prev
            ;(p.next = s.next), (s.next.prev = p)
          } else s.prev === R.Undefined && s.next === R.Undefined ? ((this._first = R.Undefined), (this._last = R.Undefined)) : s.next === R.Undefined ? ((this._last = this._last.prev), (this._last.next = R.Undefined)) : s.prev === R.Undefined && ((this._first = this._first.next), (this._first.prev = R.Undefined))
          this._size -= 1
        }
        *[Symbol.iterator]() {
          let s = this._first
          for (; s !== R.Undefined; ) yield s.element, (s = s.next)
        }
      }
      n.LinkedList = D
    }),
    Q(Y[5], X([0, 1, 27, 30]), function (x, n, R, D) {
      'use strict'
      var i
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.InvisibleCharacters =
          n.AmbiguousCharacters =
          n.noBreakWhitespace =
          n.getLeftDeleteOffset =
          n.singleLetterHash =
          n.containsUppercaseCharacter =
          n.startsWithUTF8BOM =
          n.UTF8_BOM_CHARACTER =
          n.isEmojiImprecise =
          n.isFullWidthCharacter =
          n.containsUnusualLineTerminators =
          n.UNUSUAL_LINE_TERMINATORS =
          n.isBasicASCII =
          n.containsRTL =
          n.getCharContainingOffset =
          n.prevCharLength =
          n.nextCharLength =
          n.GraphemeIterator =
          n.CodePointIterator =
          n.getNextCodePoint =
          n.computeCodePoint =
          n.isLowSurrogate =
          n.isHighSurrogate =
          n.commonSuffixLength =
          n.commonPrefixLength =
          n.startsWithIgnoreCase =
          n.equalsIgnoreCase =
          n.isUpperAsciiLetter =
          n.isLowerAsciiLetter =
          n.isAsciiDigit =
          n.compareSubstringIgnoreCase =
          n.compareIgnoreCase =
          n.compareSubstring =
          n.compare =
          n.lastNonWhitespaceIndex =
          n.getLeadingWhitespace =
          n.firstNonWhitespaceIndex =
          n.splitLines =
          n.regExpFlags =
          n.regExpLeadsToEndlessLoop =
          n.createRegExp =
          n.stripWildcards =
          n.convertSimple2RegExpPattern =
          n.rtrim =
          n.ltrim =
          n.trim =
          n.escapeRegExpCharacters =
          n.escape =
          n.format =
          n.isFalsyOrWhitespace =
            void 0)
      function s(P) {
        return !P || typeof P != 'string' ? !0 : P.trim().length === 0
      }
      n.isFalsyOrWhitespace = s
      const p = /{(\d+)}/g
      function L(P, ...O) {
        return O.length === 0
          ? P
          : P.replace(p, function (V, j) {
              const Z = parseInt(j, 10)
              return isNaN(Z) || Z < 0 || Z >= O.length ? V : O[Z]
            })
      }
      n.format = L
      function h(P) {
        return P.replace(/[<>&]/g, function (O) {
          switch (O) {
            case '<':
              return '&lt;'
            case '>':
              return '&gt;'
            case '&':
              return '&amp;'
            default:
              return O
          }
        })
      }
      n.escape = h
      function a(P) {
        return P.replace(/[\\\{\}\*\+\?\|\^\$\.\[\]\(\)]/g, '\\$&')
      }
      n.escapeRegExpCharacters = a
      function w(P, O = ' ') {
        const V = e(P, O)
        return b(V, O)
      }
      n.trim = w
      function e(P, O) {
        if (!P || !O) return P
        const V = O.length
        if (V === 0 || P.length === 0) return P
        let j = 0
        for (; P.indexOf(O, j) === j; ) j = j + V
        return P.substring(j)
      }
      n.ltrim = e
      function b(P, O) {
        if (!P || !O) return P
        const V = O.length,
          j = P.length
        if (V === 0 || j === 0) return P
        let Z = j,
          le = -1
        for (; (le = P.lastIndexOf(O, Z - 1)), !(le === -1 || le + V !== Z); ) {
          if (le === 0) return ''
          Z = le
        }
        return P.substring(0, Z)
      }
      n.rtrim = b
      function f(P) {
        return P.replace(/[\-\\\{\}\+\?\|\^\$\.\,\[\]\(\)\#\s]/g, '\\$&').replace(/[\*]/g, '.*')
      }
      n.convertSimple2RegExpPattern = f
      function v(P) {
        return P.replace(/\*/g, '')
      }
      n.stripWildcards = v
      function g(P, O, V = {}) {
        if (!P) throw new Error('Cannot create regex from empty string')
        O || (P = a(P)),
          V.wholeWord &&
            (/\B/.test(P.charAt(0)) || (P = '\\b' + P),
            /\B/.test(P.charAt(P.length - 1)) || (P = P + '\\b'))
        let j = ''
        return (
          V.global && (j += 'g'),
          V.matchCase || (j += 'i'),
          V.multiline && (j += 'm'),
          V.unicode && (j += 'u'),
          new RegExp(P, j)
        )
      }
      n.createRegExp = g
      function S(P) {
        return P.source === '^' || P.source === '^$' || P.source === '$' || P.source === '^\\s*$'
          ? !1
          : !!(P.exec('') && P.lastIndex === 0)
      }
      n.regExpLeadsToEndlessLoop = S
      function E(P) {
        return (
          (P.global ? 'g' : '') +
          (P.ignoreCase ? 'i' : '') +
          (P.multiline ? 'm' : '') +
          (P.unicode ? 'u' : '')
        )
      }
      n.regExpFlags = E
      function y(P) {
        return P.split(/\r\n|\r|\n/)
      }
      n.splitLines = y
      function _(P) {
        for (let O = 0, V = P.length; O < V; O++) {
          const j = P.charCodeAt(O)
          if (j !== 32 && j !== 9) return O
        }
        return -1
      }
      n.firstNonWhitespaceIndex = _
      function d(P, O = 0, V = P.length) {
        for (let j = O; j < V; j++) {
          const Z = P.charCodeAt(j)
          if (Z !== 32 && Z !== 9) return P.substring(O, j)
        }
        return P.substring(O, V)
      }
      n.getLeadingWhitespace = d
      function C(P, O = P.length - 1) {
        for (let V = O; V >= 0; V--) {
          const j = P.charCodeAt(V)
          if (j !== 32 && j !== 9) return V
        }
        return -1
      }
      n.lastNonWhitespaceIndex = C
      function r(P, O) {
        return P < O ? -1 : P > O ? 1 : 0
      }
      n.compare = r
      function u(P, O, V = 0, j = P.length, Z = 0, le = O.length) {
        for (; V < j && Z < le; V++, Z++) {
          const ve = P.charCodeAt(V),
            oe = O.charCodeAt(Z)
          if (ve < oe) return -1
          if (ve > oe) return 1
        }
        const he = j - V,
          ye = le - Z
        return he < ye ? -1 : he > ye ? 1 : 0
      }
      n.compareSubstring = u
      function o(P, O) {
        return c(P, O, 0, P.length, 0, O.length)
      }
      n.compareIgnoreCase = o
      function c(P, O, V = 0, j = P.length, Z = 0, le = O.length) {
        for (; V < j && Z < le; V++, Z++) {
          let ve = P.charCodeAt(V),
            oe = O.charCodeAt(Z)
          if (ve === oe) continue
          if (ve >= 128 || oe >= 128) return u(P.toLowerCase(), O.toLowerCase(), V, j, Z, le)
          m(ve) && (ve -= 32), m(oe) && (oe -= 32)
          const _e = ve - oe
          if (_e !== 0) return _e
        }
        const he = j - V,
          ye = le - Z
        return he < ye ? -1 : he > ye ? 1 : 0
      }
      n.compareSubstringIgnoreCase = c
      function l(P) {
        return P >= 48 && P <= 57
      }
      n.isAsciiDigit = l
      function m(P) {
        return P >= 97 && P <= 122
      }
      n.isLowerAsciiLetter = m
      function N(P) {
        return P >= 65 && P <= 90
      }
      n.isUpperAsciiLetter = N
      function A(P, O) {
        return P.length === O.length && c(P, O) === 0
      }
      n.equalsIgnoreCase = A
      function M(P, O) {
        const V = O.length
        return O.length > P.length ? !1 : c(P, O, 0, V) === 0
      }
      n.startsWithIgnoreCase = M
      function k(P, O) {
        const V = Math.min(P.length, O.length)
        let j
        for (j = 0; j < V; j++) if (P.charCodeAt(j) !== O.charCodeAt(j)) return j
        return V
      }
      n.commonPrefixLength = k
      function q(P, O) {
        const V = Math.min(P.length, O.length)
        let j
        const Z = P.length - 1,
          le = O.length - 1
        for (j = 0; j < V; j++) if (P.charCodeAt(Z - j) !== O.charCodeAt(le - j)) return j
        return V
      }
      n.commonSuffixLength = q
      function I(P) {
        return 55296 <= P && P <= 56319
      }
      n.isHighSurrogate = I
      function B(P) {
        return 56320 <= P && P <= 57343
      }
      n.isLowSurrogate = B
      function H(P, O) {
        return ((P - 55296) << 10) + (O - 56320) + 65536
      }
      n.computeCodePoint = H
      function F(P, O, V) {
        const j = P.charCodeAt(V)
        if (I(j) && V + 1 < O) {
          const Z = P.charCodeAt(V + 1)
          if (B(Z)) return H(j, Z)
        }
        return j
      }
      n.getNextCodePoint = F
      function U(P, O) {
        const V = P.charCodeAt(O - 1)
        if (B(V) && O > 1) {
          const j = P.charCodeAt(O - 2)
          if (I(j)) return H(j, V)
        }
        return V
      }
      class T {
        get offset() {
          return this._offset
        }
        constructor(O, V = 0) {
          ;(this._str = O), (this._len = O.length), (this._offset = V)
        }
        setOffset(O) {
          this._offset = O
        }
        prevCodePoint() {
          const O = U(this._str, this._offset)
          return (this._offset -= O >= 65536 ? 2 : 1), O
        }
        nextCodePoint() {
          const O = F(this._str, this._len, this._offset)
          return (this._offset += O >= 65536 ? 2 : 1), O
        }
        eol() {
          return this._offset >= this._len
        }
      }
      n.CodePointIterator = T
      class W {
        get offset() {
          return this._iterator.offset
        }
        constructor(O, V = 0) {
          this._iterator = new T(O, V)
        }
        nextGraphemeLength() {
          const O = ee.getInstance(),
            V = this._iterator,
            j = V.offset
          let Z = O.getGraphemeBreakType(V.nextCodePoint())
          for (; !V.eol(); ) {
            const le = V.offset,
              he = O.getGraphemeBreakType(V.nextCodePoint())
            if (K(Z, he)) {
              V.setOffset(le)
              break
            }
            Z = he
          }
          return V.offset - j
        }
        prevGraphemeLength() {
          const O = ee.getInstance(),
            V = this._iterator,
            j = V.offset
          let Z = O.getGraphemeBreakType(V.prevCodePoint())
          for (; V.offset > 0; ) {
            const le = V.offset,
              he = O.getGraphemeBreakType(V.prevCodePoint())
            if (K(he, Z)) {
              V.setOffset(le)
              break
            }
            Z = he
          }
          return j - V.offset
        }
        eol() {
          return this._iterator.eol()
        }
      }
      n.GraphemeIterator = W
      function t(P, O) {
        return new W(P, O).nextGraphemeLength()
      }
      n.nextCharLength = t
      function te(P, O) {
        return new W(P, O).prevGraphemeLength()
      }
      n.prevCharLength = te
      function ie(P, O) {
        O > 0 && B(P.charCodeAt(O)) && O--
        const V = O + t(P, O)
        return [V - te(P, V), V]
      }
      n.getCharContainingOffset = ie
      let ue
      function de() {
        return /(?:[\u05BE\u05C0\u05C3\u05C6\u05D0-\u05F4\u0608\u060B\u060D\u061B-\u064A\u066D-\u066F\u0671-\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u0710\u0712-\u072F\u074D-\u07A5\u07B1-\u07EA\u07F4\u07F5\u07FA\u07FE-\u0815\u081A\u0824\u0828\u0830-\u0858\u085E-\u088E\u08A0-\u08C9\u200F\uFB1D\uFB1F-\uFB28\uFB2A-\uFD3D\uFD50-\uFDC7\uFDF0-\uFDFC\uFE70-\uFEFC]|\uD802[\uDC00-\uDD1B\uDD20-\uDE00\uDE10-\uDE35\uDE40-\uDEE4\uDEEB-\uDF35\uDF40-\uDFFF]|\uD803[\uDC00-\uDD23\uDE80-\uDEA9\uDEAD-\uDF45\uDF51-\uDF81\uDF86-\uDFF6]|\uD83A[\uDC00-\uDCCF\uDD00-\uDD43\uDD4B-\uDFFF]|\uD83B[\uDC00-\uDEBB])/
      }
      function Ce(P) {
        return ue || (ue = de()), ue.test(P)
      }
      n.containsRTL = Ce
      const re = /^[\t\n\r\x20-\x7E]*$/
      function se(P) {
        return re.test(P)
      }
      ;(n.isBasicASCII = se), (n.UNUSUAL_LINE_TERMINATORS = /[\u2028\u2029]/)
      function ge(P) {
        return n.UNUSUAL_LINE_TERMINATORS.test(P)
      }
      n.containsUnusualLineTerminators = ge
      function Le(P) {
        return (
          (P >= 11904 && P <= 55215) || (P >= 63744 && P <= 64255) || (P >= 65281 && P <= 65374)
        )
      }
      n.isFullWidthCharacter = Le
      function J(P) {
        return (
          (P >= 127462 && P <= 127487) ||
          P === 8986 ||
          P === 8987 ||
          P === 9200 ||
          P === 9203 ||
          (P >= 9728 && P <= 10175) ||
          P === 11088 ||
          P === 11093 ||
          (P >= 127744 && P <= 128591) ||
          (P >= 128640 && P <= 128764) ||
          (P >= 128992 && P <= 129008) ||
          (P >= 129280 && P <= 129535) ||
          (P >= 129648 && P <= 129782)
        )
      }
      ;(n.isEmojiImprecise = J), (n.UTF8_BOM_CHARACTER = String.fromCharCode(65279))
      function z(P) {
        return !!(P && P.length > 0 && P.charCodeAt(0) === 65279)
      }
      n.startsWithUTF8BOM = z
      function G(P, O = !1) {
        return P ? (O && (P = P.replace(/\\./g, '')), P.toLowerCase() !== P) : !1
      }
      n.containsUppercaseCharacter = G
      function $(P) {
        return (
          (P = P % (2 * 26)),
          P < 26 ? String.fromCharCode(97 + P) : String.fromCharCode(65 + P - 26)
        )
      }
      n.singleLetterHash = $
      function K(P, O) {
        return P === 0
          ? O !== 5 && O !== 7
          : P === 2 && O === 3
          ? !1
          : P === 4 || P === 2 || P === 3 || O === 4 || O === 2 || O === 3
          ? !0
          : !(
              (P === 8 && (O === 8 || O === 9 || O === 11 || O === 12)) ||
              ((P === 11 || P === 9) && (O === 9 || O === 10)) ||
              ((P === 12 || P === 10) && O === 10) ||
              O === 5 ||
              O === 13 ||
              O === 7 ||
              P === 1 ||
              (P === 13 && O === 14) ||
              (P === 6 && O === 6)
            )
      }
      class ee {
        static getInstance() {
          return ee._INSTANCE || (ee._INSTANCE = new ee()), ee._INSTANCE
        }
        constructor() {
          this._data = ne()
        }
        getGraphemeBreakType(O) {
          if (O < 32) return O === 10 ? 3 : O === 13 ? 2 : 4
          if (O < 127) return 0
          const V = this._data,
            j = V.length / 3
          let Z = 1
          for (; Z <= j; )
            if (O < V[3 * Z]) Z = 2 * Z
            else if (O > V[3 * Z + 1]) Z = 2 * Z + 1
            else return V[3 * Z + 2]
          return 0
        }
      }
      ee._INSTANCE = null
      function ne() {
        return JSON.parse(
          '[0,0,0,51229,51255,12,44061,44087,12,127462,127487,6,7083,7085,5,47645,47671,12,54813,54839,12,128678,128678,14,3270,3270,5,9919,9923,14,45853,45879,12,49437,49463,12,53021,53047,12,71216,71218,7,128398,128399,14,129360,129374,14,2519,2519,5,4448,4519,9,9742,9742,14,12336,12336,14,44957,44983,12,46749,46775,12,48541,48567,12,50333,50359,12,52125,52151,12,53917,53943,12,69888,69890,5,73018,73018,5,127990,127990,14,128558,128559,14,128759,128760,14,129653,129655,14,2027,2035,5,2891,2892,7,3761,3761,5,6683,6683,5,8293,8293,4,9825,9826,14,9999,9999,14,43452,43453,5,44509,44535,12,45405,45431,12,46301,46327,12,47197,47223,12,48093,48119,12,48989,49015,12,49885,49911,12,50781,50807,12,51677,51703,12,52573,52599,12,53469,53495,12,54365,54391,12,65279,65279,4,70471,70472,7,72145,72147,7,119173,119179,5,127799,127818,14,128240,128244,14,128512,128512,14,128652,128652,14,128721,128722,14,129292,129292,14,129445,129450,14,129734,129743,14,1476,1477,5,2366,2368,7,2750,2752,7,3076,3076,5,3415,3415,5,4141,4144,5,6109,6109,5,6964,6964,5,7394,7400,5,9197,9198,14,9770,9770,14,9877,9877,14,9968,9969,14,10084,10084,14,43052,43052,5,43713,43713,5,44285,44311,12,44733,44759,12,45181,45207,12,45629,45655,12,46077,46103,12,46525,46551,12,46973,46999,12,47421,47447,12,47869,47895,12,48317,48343,12,48765,48791,12,49213,49239,12,49661,49687,12,50109,50135,12,50557,50583,12,51005,51031,12,51453,51479,12,51901,51927,12,52349,52375,12,52797,52823,12,53245,53271,12,53693,53719,12,54141,54167,12,54589,54615,12,55037,55063,12,69506,69509,5,70191,70193,5,70841,70841,7,71463,71467,5,72330,72342,5,94031,94031,5,123628,123631,5,127763,127765,14,127941,127941,14,128043,128062,14,128302,128317,14,128465,128467,14,128539,128539,14,128640,128640,14,128662,128662,14,128703,128703,14,128745,128745,14,129004,129007,14,129329,129330,14,129402,129402,14,129483,129483,14,129686,129704,14,130048,131069,14,173,173,4,1757,1757,1,2200,2207,5,2434,2435,7,2631,2632,5,2817,2817,5,3008,3008,5,3201,3201,5,3387,3388,5,3542,3542,5,3902,3903,7,4190,4192,5,6002,6003,5,6439,6440,5,6765,6770,7,7019,7027,5,7154,7155,7,8205,8205,13,8505,8505,14,9654,9654,14,9757,9757,14,9792,9792,14,9852,9853,14,9890,9894,14,9937,9937,14,9981,9981,14,10035,10036,14,11035,11036,14,42654,42655,5,43346,43347,7,43587,43587,5,44006,44007,7,44173,44199,12,44397,44423,12,44621,44647,12,44845,44871,12,45069,45095,12,45293,45319,12,45517,45543,12,45741,45767,12,45965,45991,12,46189,46215,12,46413,46439,12,46637,46663,12,46861,46887,12,47085,47111,12,47309,47335,12,47533,47559,12,47757,47783,12,47981,48007,12,48205,48231,12,48429,48455,12,48653,48679,12,48877,48903,12,49101,49127,12,49325,49351,12,49549,49575,12,49773,49799,12,49997,50023,12,50221,50247,12,50445,50471,12,50669,50695,12,50893,50919,12,51117,51143,12,51341,51367,12,51565,51591,12,51789,51815,12,52013,52039,12,52237,52263,12,52461,52487,12,52685,52711,12,52909,52935,12,53133,53159,12,53357,53383,12,53581,53607,12,53805,53831,12,54029,54055,12,54253,54279,12,54477,54503,12,54701,54727,12,54925,54951,12,55149,55175,12,68101,68102,5,69762,69762,7,70067,70069,7,70371,70378,5,70720,70721,7,71087,71087,5,71341,71341,5,71995,71996,5,72249,72249,7,72850,72871,5,73109,73109,5,118576,118598,5,121505,121519,5,127245,127247,14,127568,127569,14,127777,127777,14,127872,127891,14,127956,127967,14,128015,128016,14,128110,128172,14,128259,128259,14,128367,128368,14,128424,128424,14,128488,128488,14,128530,128532,14,128550,128551,14,128566,128566,14,128647,128647,14,128656,128656,14,128667,128673,14,128691,128693,14,128715,128715,14,128728,128732,14,128752,128752,14,128765,128767,14,129096,129103,14,129311,129311,14,129344,129349,14,129394,129394,14,129413,129425,14,129466,129471,14,129511,129535,14,129664,129666,14,129719,129722,14,129760,129767,14,917536,917631,5,13,13,2,1160,1161,5,1564,1564,4,1807,1807,1,2085,2087,5,2307,2307,7,2382,2383,7,2497,2500,5,2563,2563,7,2677,2677,5,2763,2764,7,2879,2879,5,2914,2915,5,3021,3021,5,3142,3144,5,3263,3263,5,3285,3286,5,3398,3400,7,3530,3530,5,3633,3633,5,3864,3865,5,3974,3975,5,4155,4156,7,4229,4230,5,5909,5909,7,6078,6085,7,6277,6278,5,6451,6456,7,6744,6750,5,6846,6846,5,6972,6972,5,7074,7077,5,7146,7148,7,7222,7223,5,7416,7417,5,8234,8238,4,8417,8417,5,9000,9000,14,9203,9203,14,9730,9731,14,9748,9749,14,9762,9763,14,9776,9783,14,9800,9811,14,9831,9831,14,9872,9873,14,9882,9882,14,9900,9903,14,9929,9933,14,9941,9960,14,9974,9974,14,9989,9989,14,10006,10006,14,10062,10062,14,10160,10160,14,11647,11647,5,12953,12953,14,43019,43019,5,43232,43249,5,43443,43443,5,43567,43568,7,43696,43696,5,43765,43765,7,44013,44013,5,44117,44143,12,44229,44255,12,44341,44367,12,44453,44479,12,44565,44591,12,44677,44703,12,44789,44815,12,44901,44927,12,45013,45039,12,45125,45151,12,45237,45263,12,45349,45375,12,45461,45487,12,45573,45599,12,45685,45711,12,45797,45823,12,45909,45935,12,46021,46047,12,46133,46159,12,46245,46271,12,46357,46383,12,46469,46495,12,46581,46607,12,46693,46719,12,46805,46831,12,46917,46943,12,47029,47055,12,47141,47167,12,47253,47279,12,47365,47391,12,47477,47503,12,47589,47615,12,47701,47727,12,47813,47839,12,47925,47951,12,48037,48063,12,48149,48175,12,48261,48287,12,48373,48399,12,48485,48511,12,48597,48623,12,48709,48735,12,48821,48847,12,48933,48959,12,49045,49071,12,49157,49183,12,49269,49295,12,49381,49407,12,49493,49519,12,49605,49631,12,49717,49743,12,49829,49855,12,49941,49967,12,50053,50079,12,50165,50191,12,50277,50303,12,50389,50415,12,50501,50527,12,50613,50639,12,50725,50751,12,50837,50863,12,50949,50975,12,51061,51087,12,51173,51199,12,51285,51311,12,51397,51423,12,51509,51535,12,51621,51647,12,51733,51759,12,51845,51871,12,51957,51983,12,52069,52095,12,52181,52207,12,52293,52319,12,52405,52431,12,52517,52543,12,52629,52655,12,52741,52767,12,52853,52879,12,52965,52991,12,53077,53103,12,53189,53215,12,53301,53327,12,53413,53439,12,53525,53551,12,53637,53663,12,53749,53775,12,53861,53887,12,53973,53999,12,54085,54111,12,54197,54223,12,54309,54335,12,54421,54447,12,54533,54559,12,54645,54671,12,54757,54783,12,54869,54895,12,54981,55007,12,55093,55119,12,55243,55291,10,66045,66045,5,68325,68326,5,69688,69702,5,69817,69818,5,69957,69958,7,70089,70092,5,70198,70199,5,70462,70462,5,70502,70508,5,70750,70750,5,70846,70846,7,71100,71101,5,71230,71230,7,71351,71351,5,71737,71738,5,72000,72000,7,72160,72160,5,72273,72278,5,72752,72758,5,72882,72883,5,73031,73031,5,73461,73462,7,94192,94193,7,119149,119149,7,121403,121452,5,122915,122916,5,126980,126980,14,127358,127359,14,127535,127535,14,127759,127759,14,127771,127771,14,127792,127793,14,127825,127867,14,127897,127899,14,127945,127945,14,127985,127986,14,128000,128007,14,128021,128021,14,128066,128100,14,128184,128235,14,128249,128252,14,128266,128276,14,128335,128335,14,128379,128390,14,128407,128419,14,128444,128444,14,128481,128481,14,128499,128499,14,128526,128526,14,128536,128536,14,128543,128543,14,128556,128556,14,128564,128564,14,128577,128580,14,128643,128645,14,128649,128649,14,128654,128654,14,128660,128660,14,128664,128664,14,128675,128675,14,128686,128689,14,128695,128696,14,128705,128709,14,128717,128719,14,128725,128725,14,128736,128741,14,128747,128748,14,128755,128755,14,128762,128762,14,128981,128991,14,129009,129023,14,129160,129167,14,129296,129304,14,129320,129327,14,129340,129342,14,129356,129356,14,129388,129392,14,129399,129400,14,129404,129407,14,129432,129442,14,129454,129455,14,129473,129474,14,129485,129487,14,129648,129651,14,129659,129660,14,129671,129679,14,129709,129711,14,129728,129730,14,129751,129753,14,129776,129782,14,917505,917505,4,917760,917999,5,10,10,3,127,159,4,768,879,5,1471,1471,5,1536,1541,1,1648,1648,5,1767,1768,5,1840,1866,5,2070,2073,5,2137,2139,5,2274,2274,1,2363,2363,7,2377,2380,7,2402,2403,5,2494,2494,5,2507,2508,7,2558,2558,5,2622,2624,7,2641,2641,5,2691,2691,7,2759,2760,5,2786,2787,5,2876,2876,5,2881,2884,5,2901,2902,5,3006,3006,5,3014,3016,7,3072,3072,5,3134,3136,5,3157,3158,5,3260,3260,5,3266,3266,5,3274,3275,7,3328,3329,5,3391,3392,7,3405,3405,5,3457,3457,5,3536,3537,7,3551,3551,5,3636,3642,5,3764,3772,5,3895,3895,5,3967,3967,7,3993,4028,5,4146,4151,5,4182,4183,7,4226,4226,5,4253,4253,5,4957,4959,5,5940,5940,7,6070,6070,7,6087,6088,7,6158,6158,4,6432,6434,5,6448,6449,7,6679,6680,5,6742,6742,5,6754,6754,5,6783,6783,5,6912,6915,5,6966,6970,5,6978,6978,5,7042,7042,7,7080,7081,5,7143,7143,7,7150,7150,7,7212,7219,5,7380,7392,5,7412,7412,5,8203,8203,4,8232,8232,4,8265,8265,14,8400,8412,5,8421,8432,5,8617,8618,14,9167,9167,14,9200,9200,14,9410,9410,14,9723,9726,14,9733,9733,14,9745,9745,14,9752,9752,14,9760,9760,14,9766,9766,14,9774,9774,14,9786,9786,14,9794,9794,14,9823,9823,14,9828,9828,14,9833,9850,14,9855,9855,14,9875,9875,14,9880,9880,14,9885,9887,14,9896,9897,14,9906,9916,14,9926,9927,14,9935,9935,14,9939,9939,14,9962,9962,14,9972,9972,14,9978,9978,14,9986,9986,14,9997,9997,14,10002,10002,14,10017,10017,14,10055,10055,14,10071,10071,14,10133,10135,14,10548,10549,14,11093,11093,14,12330,12333,5,12441,12442,5,42608,42610,5,43010,43010,5,43045,43046,5,43188,43203,7,43302,43309,5,43392,43394,5,43446,43449,5,43493,43493,5,43571,43572,7,43597,43597,7,43703,43704,5,43756,43757,5,44003,44004,7,44009,44010,7,44033,44059,12,44089,44115,12,44145,44171,12,44201,44227,12,44257,44283,12,44313,44339,12,44369,44395,12,44425,44451,12,44481,44507,12,44537,44563,12,44593,44619,12,44649,44675,12,44705,44731,12,44761,44787,12,44817,44843,12,44873,44899,12,44929,44955,12,44985,45011,12,45041,45067,12,45097,45123,12,45153,45179,12,45209,45235,12,45265,45291,12,45321,45347,12,45377,45403,12,45433,45459,12,45489,45515,12,45545,45571,12,45601,45627,12,45657,45683,12,45713,45739,12,45769,45795,12,45825,45851,12,45881,45907,12,45937,45963,12,45993,46019,12,46049,46075,12,46105,46131,12,46161,46187,12,46217,46243,12,46273,46299,12,46329,46355,12,46385,46411,12,46441,46467,12,46497,46523,12,46553,46579,12,46609,46635,12,46665,46691,12,46721,46747,12,46777,46803,12,46833,46859,12,46889,46915,12,46945,46971,12,47001,47027,12,47057,47083,12,47113,47139,12,47169,47195,12,47225,47251,12,47281,47307,12,47337,47363,12,47393,47419,12,47449,47475,12,47505,47531,12,47561,47587,12,47617,47643,12,47673,47699,12,47729,47755,12,47785,47811,12,47841,47867,12,47897,47923,12,47953,47979,12,48009,48035,12,48065,48091,12,48121,48147,12,48177,48203,12,48233,48259,12,48289,48315,12,48345,48371,12,48401,48427,12,48457,48483,12,48513,48539,12,48569,48595,12,48625,48651,12,48681,48707,12,48737,48763,12,48793,48819,12,48849,48875,12,48905,48931,12,48961,48987,12,49017,49043,12,49073,49099,12,49129,49155,12,49185,49211,12,49241,49267,12,49297,49323,12,49353,49379,12,49409,49435,12,49465,49491,12,49521,49547,12,49577,49603,12,49633,49659,12,49689,49715,12,49745,49771,12,49801,49827,12,49857,49883,12,49913,49939,12,49969,49995,12,50025,50051,12,50081,50107,12,50137,50163,12,50193,50219,12,50249,50275,12,50305,50331,12,50361,50387,12,50417,50443,12,50473,50499,12,50529,50555,12,50585,50611,12,50641,50667,12,50697,50723,12,50753,50779,12,50809,50835,12,50865,50891,12,50921,50947,12,50977,51003,12,51033,51059,12,51089,51115,12,51145,51171,12,51201,51227,12,51257,51283,12,51313,51339,12,51369,51395,12,51425,51451,12,51481,51507,12,51537,51563,12,51593,51619,12,51649,51675,12,51705,51731,12,51761,51787,12,51817,51843,12,51873,51899,12,51929,51955,12,51985,52011,12,52041,52067,12,52097,52123,12,52153,52179,12,52209,52235,12,52265,52291,12,52321,52347,12,52377,52403,12,52433,52459,12,52489,52515,12,52545,52571,12,52601,52627,12,52657,52683,12,52713,52739,12,52769,52795,12,52825,52851,12,52881,52907,12,52937,52963,12,52993,53019,12,53049,53075,12,53105,53131,12,53161,53187,12,53217,53243,12,53273,53299,12,53329,53355,12,53385,53411,12,53441,53467,12,53497,53523,12,53553,53579,12,53609,53635,12,53665,53691,12,53721,53747,12,53777,53803,12,53833,53859,12,53889,53915,12,53945,53971,12,54001,54027,12,54057,54083,12,54113,54139,12,54169,54195,12,54225,54251,12,54281,54307,12,54337,54363,12,54393,54419,12,54449,54475,12,54505,54531,12,54561,54587,12,54617,54643,12,54673,54699,12,54729,54755,12,54785,54811,12,54841,54867,12,54897,54923,12,54953,54979,12,55009,55035,12,55065,55091,12,55121,55147,12,55177,55203,12,65024,65039,5,65520,65528,4,66422,66426,5,68152,68154,5,69291,69292,5,69633,69633,5,69747,69748,5,69811,69814,5,69826,69826,5,69932,69932,7,70016,70017,5,70079,70080,7,70095,70095,5,70196,70196,5,70367,70367,5,70402,70403,7,70464,70464,5,70487,70487,5,70709,70711,7,70725,70725,7,70833,70834,7,70843,70844,7,70849,70849,7,71090,71093,5,71103,71104,5,71227,71228,7,71339,71339,5,71344,71349,5,71458,71461,5,71727,71735,5,71985,71989,7,71998,71998,5,72002,72002,7,72154,72155,5,72193,72202,5,72251,72254,5,72281,72283,5,72344,72345,5,72766,72766,7,72874,72880,5,72885,72886,5,73023,73029,5,73104,73105,5,73111,73111,5,92912,92916,5,94095,94098,5,113824,113827,4,119142,119142,7,119155,119162,4,119362,119364,5,121476,121476,5,122888,122904,5,123184,123190,5,125252,125258,5,127183,127183,14,127340,127343,14,127377,127386,14,127491,127503,14,127548,127551,14,127744,127756,14,127761,127761,14,127769,127769,14,127773,127774,14,127780,127788,14,127796,127797,14,127820,127823,14,127869,127869,14,127894,127895,14,127902,127903,14,127943,127943,14,127947,127950,14,127972,127972,14,127988,127988,14,127992,127994,14,128009,128011,14,128019,128019,14,128023,128041,14,128064,128064,14,128102,128107,14,128174,128181,14,128238,128238,14,128246,128247,14,128254,128254,14,128264,128264,14,128278,128299,14,128329,128330,14,128348,128359,14,128371,128377,14,128392,128393,14,128401,128404,14,128421,128421,14,128433,128434,14,128450,128452,14,128476,128478,14,128483,128483,14,128495,128495,14,128506,128506,14,128519,128520,14,128528,128528,14,128534,128534,14,128538,128538,14,128540,128542,14,128544,128549,14,128552,128555,14,128557,128557,14,128560,128563,14,128565,128565,14,128567,128576,14,128581,128591,14,128641,128642,14,128646,128646,14,128648,128648,14,128650,128651,14,128653,128653,14,128655,128655,14,128657,128659,14,128661,128661,14,128663,128663,14,128665,128666,14,128674,128674,14,128676,128677,14,128679,128685,14,128690,128690,14,128694,128694,14,128697,128702,14,128704,128704,14,128710,128714,14,128716,128716,14,128720,128720,14,128723,128724,14,128726,128727,14,128733,128735,14,128742,128744,14,128746,128746,14,128749,128751,14,128753,128754,14,128756,128758,14,128761,128761,14,128763,128764,14,128884,128895,14,128992,129003,14,129008,129008,14,129036,129039,14,129114,129119,14,129198,129279,14,129293,129295,14,129305,129310,14,129312,129319,14,129328,129328,14,129331,129338,14,129343,129343,14,129351,129355,14,129357,129359,14,129375,129387,14,129393,129393,14,129395,129398,14,129401,129401,14,129403,129403,14,129408,129412,14,129426,129431,14,129443,129444,14,129451,129453,14,129456,129465,14,129472,129472,14,129475,129482,14,129484,129484,14,129488,129510,14,129536,129647,14,129652,129652,14,129656,129658,14,129661,129663,14,129667,129670,14,129680,129685,14,129705,129708,14,129712,129718,14,129723,129727,14,129731,129733,14,129744,129750,14,129754,129759,14,129768,129775,14,129783,129791,14,917504,917504,4,917506,917535,4,917632,917759,4,918000,921599,4,0,9,4,11,12,4,14,31,4,169,169,14,174,174,14,1155,1159,5,1425,1469,5,1473,1474,5,1479,1479,5,1552,1562,5,1611,1631,5,1750,1756,5,1759,1764,5,1770,1773,5,1809,1809,5,1958,1968,5,2045,2045,5,2075,2083,5,2089,2093,5,2192,2193,1,2250,2273,5,2275,2306,5,2362,2362,5,2364,2364,5,2369,2376,5,2381,2381,5,2385,2391,5,2433,2433,5,2492,2492,5,2495,2496,7,2503,2504,7,2509,2509,5,2530,2531,5,2561,2562,5,2620,2620,5,2625,2626,5,2635,2637,5,2672,2673,5,2689,2690,5,2748,2748,5,2753,2757,5,2761,2761,7,2765,2765,5,2810,2815,5,2818,2819,7,2878,2878,5,2880,2880,7,2887,2888,7,2893,2893,5,2903,2903,5,2946,2946,5,3007,3007,7,3009,3010,7,3018,3020,7,3031,3031,5,3073,3075,7,3132,3132,5,3137,3140,7,3146,3149,5,3170,3171,5,3202,3203,7,3262,3262,7,3264,3265,7,3267,3268,7,3271,3272,7,3276,3277,5,3298,3299,5,3330,3331,7,3390,3390,5,3393,3396,5,3402,3404,7,3406,3406,1,3426,3427,5,3458,3459,7,3535,3535,5,3538,3540,5,3544,3550,7,3570,3571,7,3635,3635,7,3655,3662,5,3763,3763,7,3784,3789,5,3893,3893,5,3897,3897,5,3953,3966,5,3968,3972,5,3981,3991,5,4038,4038,5,4145,4145,7,4153,4154,5,4157,4158,5,4184,4185,5,4209,4212,5,4228,4228,7,4237,4237,5,4352,4447,8,4520,4607,10,5906,5908,5,5938,5939,5,5970,5971,5,6068,6069,5,6071,6077,5,6086,6086,5,6089,6099,5,6155,6157,5,6159,6159,5,6313,6313,5,6435,6438,7,6441,6443,7,6450,6450,5,6457,6459,5,6681,6682,7,6741,6741,7,6743,6743,7,6752,6752,5,6757,6764,5,6771,6780,5,6832,6845,5,6847,6862,5,6916,6916,7,6965,6965,5,6971,6971,7,6973,6977,7,6979,6980,7,7040,7041,5,7073,7073,7,7078,7079,7,7082,7082,7,7142,7142,5,7144,7145,5,7149,7149,5,7151,7153,5,7204,7211,7,7220,7221,7,7376,7378,5,7393,7393,7,7405,7405,5,7415,7415,7,7616,7679,5,8204,8204,5,8206,8207,4,8233,8233,4,8252,8252,14,8288,8292,4,8294,8303,4,8413,8416,5,8418,8420,5,8482,8482,14,8596,8601,14,8986,8987,14,9096,9096,14,9193,9196,14,9199,9199,14,9201,9202,14,9208,9210,14,9642,9643,14,9664,9664,14,9728,9729,14,9732,9732,14,9735,9741,14,9743,9744,14,9746,9746,14,9750,9751,14,9753,9756,14,9758,9759,14,9761,9761,14,9764,9765,14,9767,9769,14,9771,9773,14,9775,9775,14,9784,9785,14,9787,9791,14,9793,9793,14,9795,9799,14,9812,9822,14,9824,9824,14,9827,9827,14,9829,9830,14,9832,9832,14,9851,9851,14,9854,9854,14,9856,9861,14,9874,9874,14,9876,9876,14,9878,9879,14,9881,9881,14,9883,9884,14,9888,9889,14,9895,9895,14,9898,9899,14,9904,9905,14,9917,9918,14,9924,9925,14,9928,9928,14,9934,9934,14,9936,9936,14,9938,9938,14,9940,9940,14,9961,9961,14,9963,9967,14,9970,9971,14,9973,9973,14,9975,9977,14,9979,9980,14,9982,9985,14,9987,9988,14,9992,9996,14,9998,9998,14,10000,10001,14,10004,10004,14,10013,10013,14,10024,10024,14,10052,10052,14,10060,10060,14,10067,10069,14,10083,10083,14,10085,10087,14,10145,10145,14,10175,10175,14,11013,11015,14,11088,11088,14,11503,11505,5,11744,11775,5,12334,12335,5,12349,12349,14,12951,12951,14,42607,42607,5,42612,42621,5,42736,42737,5,43014,43014,5,43043,43044,7,43047,43047,7,43136,43137,7,43204,43205,5,43263,43263,5,43335,43345,5,43360,43388,8,43395,43395,7,43444,43445,7,43450,43451,7,43454,43456,7,43561,43566,5,43569,43570,5,43573,43574,5,43596,43596,5,43644,43644,5,43698,43700,5,43710,43711,5,43755,43755,7,43758,43759,7,43766,43766,5,44005,44005,5,44008,44008,5,44012,44012,7,44032,44032,11,44060,44060,11,44088,44088,11,44116,44116,11,44144,44144,11,44172,44172,11,44200,44200,11,44228,44228,11,44256,44256,11,44284,44284,11,44312,44312,11,44340,44340,11,44368,44368,11,44396,44396,11,44424,44424,11,44452,44452,11,44480,44480,11,44508,44508,11,44536,44536,11,44564,44564,11,44592,44592,11,44620,44620,11,44648,44648,11,44676,44676,11,44704,44704,11,44732,44732,11,44760,44760,11,44788,44788,11,44816,44816,11,44844,44844,11,44872,44872,11,44900,44900,11,44928,44928,11,44956,44956,11,44984,44984,11,45012,45012,11,45040,45040,11,45068,45068,11,45096,45096,11,45124,45124,11,45152,45152,11,45180,45180,11,45208,45208,11,45236,45236,11,45264,45264,11,45292,45292,11,45320,45320,11,45348,45348,11,45376,45376,11,45404,45404,11,45432,45432,11,45460,45460,11,45488,45488,11,45516,45516,11,45544,45544,11,45572,45572,11,45600,45600,11,45628,45628,11,45656,45656,11,45684,45684,11,45712,45712,11,45740,45740,11,45768,45768,11,45796,45796,11,45824,45824,11,45852,45852,11,45880,45880,11,45908,45908,11,45936,45936,11,45964,45964,11,45992,45992,11,46020,46020,11,46048,46048,11,46076,46076,11,46104,46104,11,46132,46132,11,46160,46160,11,46188,46188,11,46216,46216,11,46244,46244,11,46272,46272,11,46300,46300,11,46328,46328,11,46356,46356,11,46384,46384,11,46412,46412,11,46440,46440,11,46468,46468,11,46496,46496,11,46524,46524,11,46552,46552,11,46580,46580,11,46608,46608,11,46636,46636,11,46664,46664,11,46692,46692,11,46720,46720,11,46748,46748,11,46776,46776,11,46804,46804,11,46832,46832,11,46860,46860,11,46888,46888,11,46916,46916,11,46944,46944,11,46972,46972,11,47000,47000,11,47028,47028,11,47056,47056,11,47084,47084,11,47112,47112,11,47140,47140,11,47168,47168,11,47196,47196,11,47224,47224,11,47252,47252,11,47280,47280,11,47308,47308,11,47336,47336,11,47364,47364,11,47392,47392,11,47420,47420,11,47448,47448,11,47476,47476,11,47504,47504,11,47532,47532,11,47560,47560,11,47588,47588,11,47616,47616,11,47644,47644,11,47672,47672,11,47700,47700,11,47728,47728,11,47756,47756,11,47784,47784,11,47812,47812,11,47840,47840,11,47868,47868,11,47896,47896,11,47924,47924,11,47952,47952,11,47980,47980,11,48008,48008,11,48036,48036,11,48064,48064,11,48092,48092,11,48120,48120,11,48148,48148,11,48176,48176,11,48204,48204,11,48232,48232,11,48260,48260,11,48288,48288,11,48316,48316,11,48344,48344,11,48372,48372,11,48400,48400,11,48428,48428,11,48456,48456,11,48484,48484,11,48512,48512,11,48540,48540,11,48568,48568,11,48596,48596,11,48624,48624,11,48652,48652,11,48680,48680,11,48708,48708,11,48736,48736,11,48764,48764,11,48792,48792,11,48820,48820,11,48848,48848,11,48876,48876,11,48904,48904,11,48932,48932,11,48960,48960,11,48988,48988,11,49016,49016,11,49044,49044,11,49072,49072,11,49100,49100,11,49128,49128,11,49156,49156,11,49184,49184,11,49212,49212,11,49240,49240,11,49268,49268,11,49296,49296,11,49324,49324,11,49352,49352,11,49380,49380,11,49408,49408,11,49436,49436,11,49464,49464,11,49492,49492,11,49520,49520,11,49548,49548,11,49576,49576,11,49604,49604,11,49632,49632,11,49660,49660,11,49688,49688,11,49716,49716,11,49744,49744,11,49772,49772,11,49800,49800,11,49828,49828,11,49856,49856,11,49884,49884,11,49912,49912,11,49940,49940,11,49968,49968,11,49996,49996,11,50024,50024,11,50052,50052,11,50080,50080,11,50108,50108,11,50136,50136,11,50164,50164,11,50192,50192,11,50220,50220,11,50248,50248,11,50276,50276,11,50304,50304,11,50332,50332,11,50360,50360,11,50388,50388,11,50416,50416,11,50444,50444,11,50472,50472,11,50500,50500,11,50528,50528,11,50556,50556,11,50584,50584,11,50612,50612,11,50640,50640,11,50668,50668,11,50696,50696,11,50724,50724,11,50752,50752,11,50780,50780,11,50808,50808,11,50836,50836,11,50864,50864,11,50892,50892,11,50920,50920,11,50948,50948,11,50976,50976,11,51004,51004,11,51032,51032,11,51060,51060,11,51088,51088,11,51116,51116,11,51144,51144,11,51172,51172,11,51200,51200,11,51228,51228,11,51256,51256,11,51284,51284,11,51312,51312,11,51340,51340,11,51368,51368,11,51396,51396,11,51424,51424,11,51452,51452,11,51480,51480,11,51508,51508,11,51536,51536,11,51564,51564,11,51592,51592,11,51620,51620,11,51648,51648,11,51676,51676,11,51704,51704,11,51732,51732,11,51760,51760,11,51788,51788,11,51816,51816,11,51844,51844,11,51872,51872,11,51900,51900,11,51928,51928,11,51956,51956,11,51984,51984,11,52012,52012,11,52040,52040,11,52068,52068,11,52096,52096,11,52124,52124,11,52152,52152,11,52180,52180,11,52208,52208,11,52236,52236,11,52264,52264,11,52292,52292,11,52320,52320,11,52348,52348,11,52376,52376,11,52404,52404,11,52432,52432,11,52460,52460,11,52488,52488,11,52516,52516,11,52544,52544,11,52572,52572,11,52600,52600,11,52628,52628,11,52656,52656,11,52684,52684,11,52712,52712,11,52740,52740,11,52768,52768,11,52796,52796,11,52824,52824,11,52852,52852,11,52880,52880,11,52908,52908,11,52936,52936,11,52964,52964,11,52992,52992,11,53020,53020,11,53048,53048,11,53076,53076,11,53104,53104,11,53132,53132,11,53160,53160,11,53188,53188,11,53216,53216,11,53244,53244,11,53272,53272,11,53300,53300,11,53328,53328,11,53356,53356,11,53384,53384,11,53412,53412,11,53440,53440,11,53468,53468,11,53496,53496,11,53524,53524,11,53552,53552,11,53580,53580,11,53608,53608,11,53636,53636,11,53664,53664,11,53692,53692,11,53720,53720,11,53748,53748,11,53776,53776,11,53804,53804,11,53832,53832,11,53860,53860,11,53888,53888,11,53916,53916,11,53944,53944,11,53972,53972,11,54000,54000,11,54028,54028,11,54056,54056,11,54084,54084,11,54112,54112,11,54140,54140,11,54168,54168,11,54196,54196,11,54224,54224,11,54252,54252,11,54280,54280,11,54308,54308,11,54336,54336,11,54364,54364,11,54392,54392,11,54420,54420,11,54448,54448,11,54476,54476,11,54504,54504,11,54532,54532,11,54560,54560,11,54588,54588,11,54616,54616,11,54644,54644,11,54672,54672,11,54700,54700,11,54728,54728,11,54756,54756,11,54784,54784,11,54812,54812,11,54840,54840,11,54868,54868,11,54896,54896,11,54924,54924,11,54952,54952,11,54980,54980,11,55008,55008,11,55036,55036,11,55064,55064,11,55092,55092,11,55120,55120,11,55148,55148,11,55176,55176,11,55216,55238,9,64286,64286,5,65056,65071,5,65438,65439,5,65529,65531,4,66272,66272,5,68097,68099,5,68108,68111,5,68159,68159,5,68900,68903,5,69446,69456,5,69632,69632,7,69634,69634,7,69744,69744,5,69759,69761,5,69808,69810,7,69815,69816,7,69821,69821,1,69837,69837,1,69927,69931,5,69933,69940,5,70003,70003,5,70018,70018,7,70070,70078,5,70082,70083,1,70094,70094,7,70188,70190,7,70194,70195,7,70197,70197,7,70206,70206,5,70368,70370,7,70400,70401,5,70459,70460,5,70463,70463,7,70465,70468,7,70475,70477,7,70498,70499,7,70512,70516,5,70712,70719,5,70722,70724,5,70726,70726,5,70832,70832,5,70835,70840,5,70842,70842,5,70845,70845,5,70847,70848,5,70850,70851,5,71088,71089,7,71096,71099,7,71102,71102,7,71132,71133,5,71219,71226,5,71229,71229,5,71231,71232,5,71340,71340,7,71342,71343,7,71350,71350,7,71453,71455,5,71462,71462,7,71724,71726,7,71736,71736,7,71984,71984,5,71991,71992,7,71997,71997,7,71999,71999,1,72001,72001,1,72003,72003,5,72148,72151,5,72156,72159,7,72164,72164,7,72243,72248,5,72250,72250,1,72263,72263,5,72279,72280,7,72324,72329,1,72343,72343,7,72751,72751,7,72760,72765,5,72767,72767,5,72873,72873,7,72881,72881,7,72884,72884,7,73009,73014,5,73020,73021,5,73030,73030,1,73098,73102,7,73107,73108,7,73110,73110,7,73459,73460,5,78896,78904,4,92976,92982,5,94033,94087,7,94180,94180,5,113821,113822,5,118528,118573,5,119141,119141,5,119143,119145,5,119150,119154,5,119163,119170,5,119210,119213,5,121344,121398,5,121461,121461,5,121499,121503,5,122880,122886,5,122907,122913,5,122918,122922,5,123566,123566,5,125136,125142,5,126976,126979,14,126981,127182,14,127184,127231,14,127279,127279,14,127344,127345,14,127374,127374,14,127405,127461,14,127489,127490,14,127514,127514,14,127538,127546,14,127561,127567,14,127570,127743,14,127757,127758,14,127760,127760,14,127762,127762,14,127766,127768,14,127770,127770,14,127772,127772,14,127775,127776,14,127778,127779,14,127789,127791,14,127794,127795,14,127798,127798,14,127819,127819,14,127824,127824,14,127868,127868,14,127870,127871,14,127892,127893,14,127896,127896,14,127900,127901,14,127904,127940,14,127942,127942,14,127944,127944,14,127946,127946,14,127951,127955,14,127968,127971,14,127973,127984,14,127987,127987,14,127989,127989,14,127991,127991,14,127995,127999,5,128008,128008,14,128012,128014,14,128017,128018,14,128020,128020,14,128022,128022,14,128042,128042,14,128063,128063,14,128065,128065,14,128101,128101,14,128108,128109,14,128173,128173,14,128182,128183,14,128236,128237,14,128239,128239,14,128245,128245,14,128248,128248,14,128253,128253,14,128255,128258,14,128260,128263,14,128265,128265,14,128277,128277,14,128300,128301,14,128326,128328,14,128331,128334,14,128336,128347,14,128360,128366,14,128369,128370,14,128378,128378,14,128391,128391,14,128394,128397,14,128400,128400,14,128405,128406,14,128420,128420,14,128422,128423,14,128425,128432,14,128435,128443,14,128445,128449,14,128453,128464,14,128468,128475,14,128479,128480,14,128482,128482,14,128484,128487,14,128489,128494,14,128496,128498,14,128500,128505,14,128507,128511,14,128513,128518,14,128521,128525,14,128527,128527,14,128529,128529,14,128533,128533,14,128535,128535,14,128537,128537,14]'
        )
      }
      function ce(P, O) {
        if (P === 0) return 0
        const V = Se(P, O)
        if (V !== void 0) return V
        const j = new T(O, P)
        return j.prevCodePoint(), j.offset
      }
      n.getLeftDeleteOffset = ce
      function Se(P, O) {
        const V = new T(O, P)
        let j = V.prevCodePoint()
        for (; we(j) || j === 65039 || j === 8419; ) {
          if (V.offset === 0) return
          j = V.prevCodePoint()
        }
        if (!J(j)) return
        let Z = V.offset
        return Z > 0 && V.prevCodePoint() === 8205 && (Z = V.offset), Z
      }
      function we(P) {
        return 127995 <= P && P <= 127999
      }
      n.noBreakWhitespace = '\xA0'
      class fe {
        static getInstance(O) {
          return fe.cache.get(Array.from(O))
        }
        static getLocales() {
          return fe._locales.value
        }
        constructor(O) {
          this.confusableDictionary = O
        }
        isAmbiguous(O) {
          return this.confusableDictionary.has(O)
        }
        getPrimaryConfusable(O) {
          return this.confusableDictionary.get(O)
        }
        getConfusableCodePoints() {
          return new Set(this.confusableDictionary.keys())
        }
      }
      ;(i = fe),
        (fe.ambiguousCharacterData = new D.Lazy(() =>
          JSON.parse(
            '{"_common":[8232,32,8233,32,5760,32,8192,32,8193,32,8194,32,8195,32,8196,32,8197,32,8198,32,8200,32,8201,32,8202,32,8287,32,8199,32,8239,32,2042,95,65101,95,65102,95,65103,95,8208,45,8209,45,8210,45,65112,45,1748,45,8259,45,727,45,8722,45,10134,45,11450,45,1549,44,1643,44,8218,44,184,44,42233,44,894,59,2307,58,2691,58,1417,58,1795,58,1796,58,5868,58,65072,58,6147,58,6153,58,8282,58,1475,58,760,58,42889,58,8758,58,720,58,42237,58,451,33,11601,33,660,63,577,63,2429,63,5038,63,42731,63,119149,46,8228,46,1793,46,1794,46,42510,46,68176,46,1632,46,1776,46,42232,46,1373,96,65287,96,8219,96,8242,96,1370,96,1523,96,8175,96,65344,96,900,96,8189,96,8125,96,8127,96,8190,96,697,96,884,96,712,96,714,96,715,96,756,96,699,96,701,96,700,96,702,96,42892,96,1497,96,2036,96,2037,96,5194,96,5836,96,94033,96,94034,96,65339,91,10088,40,10098,40,12308,40,64830,40,65341,93,10089,41,10099,41,12309,41,64831,41,10100,123,119060,123,10101,125,65342,94,8270,42,1645,42,8727,42,66335,42,5941,47,8257,47,8725,47,8260,47,9585,47,10187,47,10744,47,119354,47,12755,47,12339,47,11462,47,20031,47,12035,47,65340,92,65128,92,8726,92,10189,92,10741,92,10745,92,119311,92,119355,92,12756,92,20022,92,12034,92,42872,38,708,94,710,94,5869,43,10133,43,66203,43,8249,60,10094,60,706,60,119350,60,5176,60,5810,60,5120,61,11840,61,12448,61,42239,61,8250,62,10095,62,707,62,119351,62,5171,62,94015,62,8275,126,732,126,8128,126,8764,126,65372,124,65293,45,120784,50,120794,50,120804,50,120814,50,120824,50,130034,50,42842,50,423,50,1000,50,42564,50,5311,50,42735,50,119302,51,120785,51,120795,51,120805,51,120815,51,120825,51,130035,51,42923,51,540,51,439,51,42858,51,11468,51,1248,51,94011,51,71882,51,120786,52,120796,52,120806,52,120816,52,120826,52,130036,52,5070,52,71855,52,120787,53,120797,53,120807,53,120817,53,120827,53,130037,53,444,53,71867,53,120788,54,120798,54,120808,54,120818,54,120828,54,130038,54,11474,54,5102,54,71893,54,119314,55,120789,55,120799,55,120809,55,120819,55,120829,55,130039,55,66770,55,71878,55,2819,56,2538,56,2666,56,125131,56,120790,56,120800,56,120810,56,120820,56,120830,56,130040,56,547,56,546,56,66330,56,2663,57,2920,57,2541,57,3437,57,120791,57,120801,57,120811,57,120821,57,120831,57,130041,57,42862,57,11466,57,71884,57,71852,57,71894,57,9082,97,65345,97,119834,97,119886,97,119938,97,119990,97,120042,97,120094,97,120146,97,120198,97,120250,97,120302,97,120354,97,120406,97,120458,97,593,97,945,97,120514,97,120572,97,120630,97,120688,97,120746,97,65313,65,119808,65,119860,65,119912,65,119964,65,120016,65,120068,65,120120,65,120172,65,120224,65,120276,65,120328,65,120380,65,120432,65,913,65,120488,65,120546,65,120604,65,120662,65,120720,65,5034,65,5573,65,42222,65,94016,65,66208,65,119835,98,119887,98,119939,98,119991,98,120043,98,120095,98,120147,98,120199,98,120251,98,120303,98,120355,98,120407,98,120459,98,388,98,5071,98,5234,98,5551,98,65314,66,8492,66,119809,66,119861,66,119913,66,120017,66,120069,66,120121,66,120173,66,120225,66,120277,66,120329,66,120381,66,120433,66,42932,66,914,66,120489,66,120547,66,120605,66,120663,66,120721,66,5108,66,5623,66,42192,66,66178,66,66209,66,66305,66,65347,99,8573,99,119836,99,119888,99,119940,99,119992,99,120044,99,120096,99,120148,99,120200,99,120252,99,120304,99,120356,99,120408,99,120460,99,7428,99,1010,99,11429,99,43951,99,66621,99,128844,67,71922,67,71913,67,65315,67,8557,67,8450,67,8493,67,119810,67,119862,67,119914,67,119966,67,120018,67,120174,67,120226,67,120278,67,120330,67,120382,67,120434,67,1017,67,11428,67,5087,67,42202,67,66210,67,66306,67,66581,67,66844,67,8574,100,8518,100,119837,100,119889,100,119941,100,119993,100,120045,100,120097,100,120149,100,120201,100,120253,100,120305,100,120357,100,120409,100,120461,100,1281,100,5095,100,5231,100,42194,100,8558,68,8517,68,119811,68,119863,68,119915,68,119967,68,120019,68,120071,68,120123,68,120175,68,120227,68,120279,68,120331,68,120383,68,120435,68,5024,68,5598,68,5610,68,42195,68,8494,101,65349,101,8495,101,8519,101,119838,101,119890,101,119942,101,120046,101,120098,101,120150,101,120202,101,120254,101,120306,101,120358,101,120410,101,120462,101,43826,101,1213,101,8959,69,65317,69,8496,69,119812,69,119864,69,119916,69,120020,69,120072,69,120124,69,120176,69,120228,69,120280,69,120332,69,120384,69,120436,69,917,69,120492,69,120550,69,120608,69,120666,69,120724,69,11577,69,5036,69,42224,69,71846,69,71854,69,66182,69,119839,102,119891,102,119943,102,119995,102,120047,102,120099,102,120151,102,120203,102,120255,102,120307,102,120359,102,120411,102,120463,102,43829,102,42905,102,383,102,7837,102,1412,102,119315,70,8497,70,119813,70,119865,70,119917,70,120021,70,120073,70,120125,70,120177,70,120229,70,120281,70,120333,70,120385,70,120437,70,42904,70,988,70,120778,70,5556,70,42205,70,71874,70,71842,70,66183,70,66213,70,66853,70,65351,103,8458,103,119840,103,119892,103,119944,103,120048,103,120100,103,120152,103,120204,103,120256,103,120308,103,120360,103,120412,103,120464,103,609,103,7555,103,397,103,1409,103,119814,71,119866,71,119918,71,119970,71,120022,71,120074,71,120126,71,120178,71,120230,71,120282,71,120334,71,120386,71,120438,71,1292,71,5056,71,5107,71,42198,71,65352,104,8462,104,119841,104,119945,104,119997,104,120049,104,120101,104,120153,104,120205,104,120257,104,120309,104,120361,104,120413,104,120465,104,1211,104,1392,104,5058,104,65320,72,8459,72,8460,72,8461,72,119815,72,119867,72,119919,72,120023,72,120179,72,120231,72,120283,72,120335,72,120387,72,120439,72,919,72,120494,72,120552,72,120610,72,120668,72,120726,72,11406,72,5051,72,5500,72,42215,72,66255,72,731,105,9075,105,65353,105,8560,105,8505,105,8520,105,119842,105,119894,105,119946,105,119998,105,120050,105,120102,105,120154,105,120206,105,120258,105,120310,105,120362,105,120414,105,120466,105,120484,105,618,105,617,105,953,105,8126,105,890,105,120522,105,120580,105,120638,105,120696,105,120754,105,1110,105,42567,105,1231,105,43893,105,5029,105,71875,105,65354,106,8521,106,119843,106,119895,106,119947,106,119999,106,120051,106,120103,106,120155,106,120207,106,120259,106,120311,106,120363,106,120415,106,120467,106,1011,106,1112,106,65322,74,119817,74,119869,74,119921,74,119973,74,120025,74,120077,74,120129,74,120181,74,120233,74,120285,74,120337,74,120389,74,120441,74,42930,74,895,74,1032,74,5035,74,5261,74,42201,74,119844,107,119896,107,119948,107,120000,107,120052,107,120104,107,120156,107,120208,107,120260,107,120312,107,120364,107,120416,107,120468,107,8490,75,65323,75,119818,75,119870,75,119922,75,119974,75,120026,75,120078,75,120130,75,120182,75,120234,75,120286,75,120338,75,120390,75,120442,75,922,75,120497,75,120555,75,120613,75,120671,75,120729,75,11412,75,5094,75,5845,75,42199,75,66840,75,1472,108,8739,73,9213,73,65512,73,1633,108,1777,73,66336,108,125127,108,120783,73,120793,73,120803,73,120813,73,120823,73,130033,73,65321,73,8544,73,8464,73,8465,73,119816,73,119868,73,119920,73,120024,73,120128,73,120180,73,120232,73,120284,73,120336,73,120388,73,120440,73,65356,108,8572,73,8467,108,119845,108,119897,108,119949,108,120001,108,120053,108,120105,73,120157,73,120209,73,120261,73,120313,73,120365,73,120417,73,120469,73,448,73,120496,73,120554,73,120612,73,120670,73,120728,73,11410,73,1030,73,1216,73,1493,108,1503,108,1575,108,126464,108,126592,108,65166,108,65165,108,1994,108,11599,73,5825,73,42226,73,93992,73,66186,124,66313,124,119338,76,8556,76,8466,76,119819,76,119871,76,119923,76,120027,76,120079,76,120131,76,120183,76,120235,76,120287,76,120339,76,120391,76,120443,76,11472,76,5086,76,5290,76,42209,76,93974,76,71843,76,71858,76,66587,76,66854,76,65325,77,8559,77,8499,77,119820,77,119872,77,119924,77,120028,77,120080,77,120132,77,120184,77,120236,77,120288,77,120340,77,120392,77,120444,77,924,77,120499,77,120557,77,120615,77,120673,77,120731,77,1018,77,11416,77,5047,77,5616,77,5846,77,42207,77,66224,77,66321,77,119847,110,119899,110,119951,110,120003,110,120055,110,120107,110,120159,110,120211,110,120263,110,120315,110,120367,110,120419,110,120471,110,1400,110,1404,110,65326,78,8469,78,119821,78,119873,78,119925,78,119977,78,120029,78,120081,78,120185,78,120237,78,120289,78,120341,78,120393,78,120445,78,925,78,120500,78,120558,78,120616,78,120674,78,120732,78,11418,78,42208,78,66835,78,3074,111,3202,111,3330,111,3458,111,2406,111,2662,111,2790,111,3046,111,3174,111,3302,111,3430,111,3664,111,3792,111,4160,111,1637,111,1781,111,65359,111,8500,111,119848,111,119900,111,119952,111,120056,111,120108,111,120160,111,120212,111,120264,111,120316,111,120368,111,120420,111,120472,111,7439,111,7441,111,43837,111,959,111,120528,111,120586,111,120644,111,120702,111,120760,111,963,111,120532,111,120590,111,120648,111,120706,111,120764,111,11423,111,4351,111,1413,111,1505,111,1607,111,126500,111,126564,111,126596,111,65259,111,65260,111,65258,111,65257,111,1726,111,64428,111,64429,111,64427,111,64426,111,1729,111,64424,111,64425,111,64423,111,64422,111,1749,111,3360,111,4125,111,66794,111,71880,111,71895,111,66604,111,1984,79,2534,79,2918,79,12295,79,70864,79,71904,79,120782,79,120792,79,120802,79,120812,79,120822,79,130032,79,65327,79,119822,79,119874,79,119926,79,119978,79,120030,79,120082,79,120134,79,120186,79,120238,79,120290,79,120342,79,120394,79,120446,79,927,79,120502,79,120560,79,120618,79,120676,79,120734,79,11422,79,1365,79,11604,79,4816,79,2848,79,66754,79,42227,79,71861,79,66194,79,66219,79,66564,79,66838,79,9076,112,65360,112,119849,112,119901,112,119953,112,120005,112,120057,112,120109,112,120161,112,120213,112,120265,112,120317,112,120369,112,120421,112,120473,112,961,112,120530,112,120544,112,120588,112,120602,112,120646,112,120660,112,120704,112,120718,112,120762,112,120776,112,11427,112,65328,80,8473,80,119823,80,119875,80,119927,80,119979,80,120031,80,120083,80,120187,80,120239,80,120291,80,120343,80,120395,80,120447,80,929,80,120504,80,120562,80,120620,80,120678,80,120736,80,11426,80,5090,80,5229,80,42193,80,66197,80,119850,113,119902,113,119954,113,120006,113,120058,113,120110,113,120162,113,120214,113,120266,113,120318,113,120370,113,120422,113,120474,113,1307,113,1379,113,1382,113,8474,81,119824,81,119876,81,119928,81,119980,81,120032,81,120084,81,120188,81,120240,81,120292,81,120344,81,120396,81,120448,81,11605,81,119851,114,119903,114,119955,114,120007,114,120059,114,120111,114,120163,114,120215,114,120267,114,120319,114,120371,114,120423,114,120475,114,43847,114,43848,114,7462,114,11397,114,43905,114,119318,82,8475,82,8476,82,8477,82,119825,82,119877,82,119929,82,120033,82,120189,82,120241,82,120293,82,120345,82,120397,82,120449,82,422,82,5025,82,5074,82,66740,82,5511,82,42211,82,94005,82,65363,115,119852,115,119904,115,119956,115,120008,115,120060,115,120112,115,120164,115,120216,115,120268,115,120320,115,120372,115,120424,115,120476,115,42801,115,445,115,1109,115,43946,115,71873,115,66632,115,65331,83,119826,83,119878,83,119930,83,119982,83,120034,83,120086,83,120138,83,120190,83,120242,83,120294,83,120346,83,120398,83,120450,83,1029,83,1359,83,5077,83,5082,83,42210,83,94010,83,66198,83,66592,83,119853,116,119905,116,119957,116,120009,116,120061,116,120113,116,120165,116,120217,116,120269,116,120321,116,120373,116,120425,116,120477,116,8868,84,10201,84,128872,84,65332,84,119827,84,119879,84,119931,84,119983,84,120035,84,120087,84,120139,84,120191,84,120243,84,120295,84,120347,84,120399,84,120451,84,932,84,120507,84,120565,84,120623,84,120681,84,120739,84,11430,84,5026,84,42196,84,93962,84,71868,84,66199,84,66225,84,66325,84,119854,117,119906,117,119958,117,120010,117,120062,117,120114,117,120166,117,120218,117,120270,117,120322,117,120374,117,120426,117,120478,117,42911,117,7452,117,43854,117,43858,117,651,117,965,117,120534,117,120592,117,120650,117,120708,117,120766,117,1405,117,66806,117,71896,117,8746,85,8899,85,119828,85,119880,85,119932,85,119984,85,120036,85,120088,85,120140,85,120192,85,120244,85,120296,85,120348,85,120400,85,120452,85,1357,85,4608,85,66766,85,5196,85,42228,85,94018,85,71864,85,8744,118,8897,118,65366,118,8564,118,119855,118,119907,118,119959,118,120011,118,120063,118,120115,118,120167,118,120219,118,120271,118,120323,118,120375,118,120427,118,120479,118,7456,118,957,118,120526,118,120584,118,120642,118,120700,118,120758,118,1141,118,1496,118,71430,118,43945,118,71872,118,119309,86,1639,86,1783,86,8548,86,119829,86,119881,86,119933,86,119985,86,120037,86,120089,86,120141,86,120193,86,120245,86,120297,86,120349,86,120401,86,120453,86,1140,86,11576,86,5081,86,5167,86,42719,86,42214,86,93960,86,71840,86,66845,86,623,119,119856,119,119908,119,119960,119,120012,119,120064,119,120116,119,120168,119,120220,119,120272,119,120324,119,120376,119,120428,119,120480,119,7457,119,1121,119,1309,119,1377,119,71434,119,71438,119,71439,119,43907,119,71919,87,71910,87,119830,87,119882,87,119934,87,119986,87,120038,87,120090,87,120142,87,120194,87,120246,87,120298,87,120350,87,120402,87,120454,87,1308,87,5043,87,5076,87,42218,87,5742,120,10539,120,10540,120,10799,120,65368,120,8569,120,119857,120,119909,120,119961,120,120013,120,120065,120,120117,120,120169,120,120221,120,120273,120,120325,120,120377,120,120429,120,120481,120,5441,120,5501,120,5741,88,9587,88,66338,88,71916,88,65336,88,8553,88,119831,88,119883,88,119935,88,119987,88,120039,88,120091,88,120143,88,120195,88,120247,88,120299,88,120351,88,120403,88,120455,88,42931,88,935,88,120510,88,120568,88,120626,88,120684,88,120742,88,11436,88,11613,88,5815,88,42219,88,66192,88,66228,88,66327,88,66855,88,611,121,7564,121,65369,121,119858,121,119910,121,119962,121,120014,121,120066,121,120118,121,120170,121,120222,121,120274,121,120326,121,120378,121,120430,121,120482,121,655,121,7935,121,43866,121,947,121,8509,121,120516,121,120574,121,120632,121,120690,121,120748,121,1199,121,4327,121,71900,121,65337,89,119832,89,119884,89,119936,89,119988,89,120040,89,120092,89,120144,89,120196,89,120248,89,120300,89,120352,89,120404,89,120456,89,933,89,978,89,120508,89,120566,89,120624,89,120682,89,120740,89,11432,89,1198,89,5033,89,5053,89,42220,89,94019,89,71844,89,66226,89,119859,122,119911,122,119963,122,120015,122,120067,122,120119,122,120171,122,120223,122,120275,122,120327,122,120379,122,120431,122,120483,122,7458,122,43923,122,71876,122,66293,90,71909,90,65338,90,8484,90,8488,90,119833,90,119885,90,119937,90,119989,90,120041,90,120197,90,120249,90,120301,90,120353,90,120405,90,120457,90,918,90,120493,90,120551,90,120609,90,120667,90,120725,90,5059,90,42204,90,71849,90,65282,34,65284,36,65285,37,65286,38,65290,42,65291,43,65294,46,65295,47,65296,48,65297,49,65298,50,65299,51,65300,52,65301,53,65302,54,65303,55,65304,56,65305,57,65308,60,65309,61,65310,62,65312,64,65316,68,65318,70,65319,71,65324,76,65329,81,65330,82,65333,85,65334,86,65335,87,65343,95,65346,98,65348,100,65350,102,65355,107,65357,109,65358,110,65361,113,65362,114,65364,116,65365,117,65367,119,65370,122,65371,123,65373,125,119846,109],"_default":[160,32,8211,45,65374,126,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"cs":[65374,126,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"de":[65374,126,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"es":[8211,45,65374,126,65306,58,65281,33,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"fr":[65374,126,65306,58,65281,33,8216,96,8245,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"it":[160,32,8211,45,65374,126,65306,58,65281,33,8216,96,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"ja":[8211,45,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65292,44,65307,59],"ko":[8211,45,65374,126,65306,58,65281,33,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"pl":[65374,126,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"pt-BR":[65374,126,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"qps-ploc":[160,32,8211,45,65374,126,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"ru":[65374,126,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,12494,47,305,105,921,73,1009,112,215,120,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"tr":[160,32,8211,45,65374,126,65306,58,65281,33,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"zh-hans":[65374,126,65306,58,65281,33,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65288,40,65289,41],"zh-hant":[8211,45,65374,126,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65307,59]}'
          )
        )),
        (fe.cache = new R.LRUCachedFunction((P) => {
          function O(oe) {
            const _e = new Map()
            for (let pe = 0; pe < oe.length; pe += 2) _e.set(oe[pe], oe[pe + 1])
            return _e
          }
          function V(oe, _e) {
            const pe = new Map(oe)
            for (const [Ae, Ne] of _e) pe.set(Ae, Ne)
            return pe
          }
          function j(oe, _e) {
            if (!oe) return _e
            const pe = new Map()
            for (const [Ae, Ne] of oe) _e.has(Ae) && pe.set(Ae, Ne)
            return pe
          }
          const Z = i.ambiguousCharacterData.value
          let le = P.filter((oe) => !oe.startsWith('_') && oe in Z)
          le.length === 0 && (le = ['_default'])
          let he
          for (const oe of le) {
            const _e = O(Z[oe])
            he = j(he, _e)
          }
          const ye = O(Z._common),
            ve = V(ye, he)
          return new fe(ve)
        })),
        (fe._locales = new D.Lazy(() =>
          Object.keys(fe.ambiguousCharacterData.value).filter((P) => !P.startsWith('_'))
        )),
        (n.AmbiguousCharacters = fe)
      class me {
        static getRawData() {
          return JSON.parse(
            '[9,10,11,12,13,32,127,160,173,847,1564,4447,4448,6068,6069,6155,6156,6157,6158,7355,7356,8192,8193,8194,8195,8196,8197,8198,8199,8200,8201,8202,8203,8204,8205,8206,8207,8234,8235,8236,8237,8238,8239,8287,8288,8289,8290,8291,8292,8293,8294,8295,8296,8297,8298,8299,8300,8301,8302,8303,10240,12288,12644,65024,65025,65026,65027,65028,65029,65030,65031,65032,65033,65034,65035,65036,65037,65038,65039,65279,65440,65520,65521,65522,65523,65524,65525,65526,65527,65528,65532,78844,119155,119156,119157,119158,119159,119160,119161,119162,917504,917505,917506,917507,917508,917509,917510,917511,917512,917513,917514,917515,917516,917517,917518,917519,917520,917521,917522,917523,917524,917525,917526,917527,917528,917529,917530,917531,917532,917533,917534,917535,917536,917537,917538,917539,917540,917541,917542,917543,917544,917545,917546,917547,917548,917549,917550,917551,917552,917553,917554,917555,917556,917557,917558,917559,917560,917561,917562,917563,917564,917565,917566,917567,917568,917569,917570,917571,917572,917573,917574,917575,917576,917577,917578,917579,917580,917581,917582,917583,917584,917585,917586,917587,917588,917589,917590,917591,917592,917593,917594,917595,917596,917597,917598,917599,917600,917601,917602,917603,917604,917605,917606,917607,917608,917609,917610,917611,917612,917613,917614,917615,917616,917617,917618,917619,917620,917621,917622,917623,917624,917625,917626,917627,917628,917629,917630,917631,917760,917761,917762,917763,917764,917765,917766,917767,917768,917769,917770,917771,917772,917773,917774,917775,917776,917777,917778,917779,917780,917781,917782,917783,917784,917785,917786,917787,917788,917789,917790,917791,917792,917793,917794,917795,917796,917797,917798,917799,917800,917801,917802,917803,917804,917805,917806,917807,917808,917809,917810,917811,917812,917813,917814,917815,917816,917817,917818,917819,917820,917821,917822,917823,917824,917825,917826,917827,917828,917829,917830,917831,917832,917833,917834,917835,917836,917837,917838,917839,917840,917841,917842,917843,917844,917845,917846,917847,917848,917849,917850,917851,917852,917853,917854,917855,917856,917857,917858,917859,917860,917861,917862,917863,917864,917865,917866,917867,917868,917869,917870,917871,917872,917873,917874,917875,917876,917877,917878,917879,917880,917881,917882,917883,917884,917885,917886,917887,917888,917889,917890,917891,917892,917893,917894,917895,917896,917897,917898,917899,917900,917901,917902,917903,917904,917905,917906,917907,917908,917909,917910,917911,917912,917913,917914,917915,917916,917917,917918,917919,917920,917921,917922,917923,917924,917925,917926,917927,917928,917929,917930,917931,917932,917933,917934,917935,917936,917937,917938,917939,917940,917941,917942,917943,917944,917945,917946,917947,917948,917949,917950,917951,917952,917953,917954,917955,917956,917957,917958,917959,917960,917961,917962,917963,917964,917965,917966,917967,917968,917969,917970,917971,917972,917973,917974,917975,917976,917977,917978,917979,917980,917981,917982,917983,917984,917985,917986,917987,917988,917989,917990,917991,917992,917993,917994,917995,917996,917997,917998,917999]'
          )
        }
        static getData() {
          return this._data || (this._data = new Set(me.getRawData())), this._data
        }
        static isInvisibleCharacter(O) {
          return me.getData().has(O)
        }
        static get codePoints() {
          return me.getData()
        }
      }
      ;(me._data = void 0), (n.InvisibleCharacters = me)
    }),
    Q(Y[31], X([0, 1, 5]), function (x, n, R) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.StringSHA1 = n.toHexString = n.stringHash = n.numberHash = n.doHash = n.hash = void 0)
      function D(g) {
        return i(g, 0)
      }
      n.hash = D
      function i(g, S) {
        switch (typeof g) {
          case 'object':
            return g === null ? s(349, S) : Array.isArray(g) ? h(g, S) : a(g, S)
          case 'string':
            return L(g, S)
          case 'boolean':
            return p(g, S)
          case 'number':
            return s(g, S)
          case 'undefined':
            return s(937, S)
          default:
            return s(617, S)
        }
      }
      n.doHash = i
      function s(g, S) {
        return ((S << 5) - S + g) | 0
      }
      n.numberHash = s
      function p(g, S) {
        return s(g ? 433 : 863, S)
      }
      function L(g, S) {
        S = s(149417, S)
        for (let E = 0, y = g.length; E < y; E++) S = s(g.charCodeAt(E), S)
        return S
      }
      n.stringHash = L
      function h(g, S) {
        return (S = s(104579, S)), g.reduce((E, y) => i(y, E), S)
      }
      function a(g, S) {
        return (
          (S = s(181387, S)),
          Object.keys(g)
            .sort()
            .reduce((E, y) => ((E = L(y, E)), i(g[y], E)), S)
        )
      }
      function w(g, S, E = 32) {
        const y = E - S,
          _ = ~((1 << y) - 1)
        return ((g << S) | ((_ & g) >>> y)) >>> 0
      }
      function e(g, S = 0, E = g.byteLength, y = 0) {
        for (let _ = 0; _ < E; _++) g[S + _] = y
      }
      function b(g, S, E = '0') {
        for (; g.length < S; ) g = E + g
        return g
      }
      function f(g, S = 32) {
        return g instanceof ArrayBuffer
          ? Array.from(new Uint8Array(g))
              .map((E) => E.toString(16).padStart(2, '0'))
              .join('')
          : b((g >>> 0).toString(16), S / 4)
      }
      n.toHexString = f
      class v {
        constructor() {
          ;(this._h0 = 1732584193),
            (this._h1 = 4023233417),
            (this._h2 = 2562383102),
            (this._h3 = 271733878),
            (this._h4 = 3285377520),
            (this._buff = new Uint8Array(64 + 3)),
            (this._buffDV = new DataView(this._buff.buffer)),
            (this._buffLen = 0),
            (this._totalLen = 0),
            (this._leftoverHighSurrogate = 0),
            (this._finished = !1)
        }
        update(S) {
          const E = S.length
          if (E === 0) return
          const y = this._buff
          let _ = this._buffLen,
            d = this._leftoverHighSurrogate,
            C,
            r
          for (d !== 0 ? ((C = d), (r = -1), (d = 0)) : ((C = S.charCodeAt(0)), (r = 0)); ; ) {
            let u = C
            if (R.isHighSurrogate(C))
              if (r + 1 < E) {
                const o = S.charCodeAt(r + 1)
                R.isLowSurrogate(o) ? (r++, (u = R.computeCodePoint(C, o))) : (u = 65533)
              } else {
                d = C
                break
              }
            else R.isLowSurrogate(C) && (u = 65533)
            if (((_ = this._push(y, _, u)), r++, r < E)) C = S.charCodeAt(r)
            else break
          }
          ;(this._buffLen = _), (this._leftoverHighSurrogate = d)
        }
        _push(S, E, y) {
          return (
            y < 128
              ? (S[E++] = y)
              : y < 2048
              ? ((S[E++] = 192 | ((y & 1984) >>> 6)), (S[E++] = 128 | ((y & 63) >>> 0)))
              : y < 65536
              ? ((S[E++] = 224 | ((y & 61440) >>> 12)),
                (S[E++] = 128 | ((y & 4032) >>> 6)),
                (S[E++] = 128 | ((y & 63) >>> 0)))
              : ((S[E++] = 240 | ((y & 1835008) >>> 18)),
                (S[E++] = 128 | ((y & 258048) >>> 12)),
                (S[E++] = 128 | ((y & 4032) >>> 6)),
                (S[E++] = 128 | ((y & 63) >>> 0))),
            E >= 64 &&
              (this._step(),
              (E -= 64),
              (this._totalLen += 64),
              (S[0] = S[64 + 0]),
              (S[1] = S[64 + 1]),
              (S[2] = S[64 + 2])),
            E
          )
        }
        digest() {
          return (
            this._finished ||
              ((this._finished = !0),
              this._leftoverHighSurrogate &&
                ((this._leftoverHighSurrogate = 0),
                (this._buffLen = this._push(this._buff, this._buffLen, 65533))),
              (this._totalLen += this._buffLen),
              this._wrapUp()),
            f(this._h0) + f(this._h1) + f(this._h2) + f(this._h3) + f(this._h4)
          )
        }
        _wrapUp() {
          ;(this._buff[this._buffLen++] = 128),
            e(this._buff, this._buffLen),
            this._buffLen > 56 && (this._step(), e(this._buff))
          const S = 8 * this._totalLen
          this._buffDV.setUint32(56, Math.floor(S / 4294967296), !1),
            this._buffDV.setUint32(60, S % 4294967296, !1),
            this._step()
        }
        _step() {
          const S = v._bigBlock32,
            E = this._buffDV
          for (let l = 0; l < 64; l += 4) S.setUint32(l, E.getUint32(l, !1), !1)
          for (let l = 64; l < 320; l += 4)
            S.setUint32(
              l,
              w(
                S.getUint32(l - 12, !1) ^
                  S.getUint32(l - 32, !1) ^
                  S.getUint32(l - 56, !1) ^
                  S.getUint32(l - 64, !1),
                1
              ),
              !1
            )
          let y = this._h0,
            _ = this._h1,
            d = this._h2,
            C = this._h3,
            r = this._h4,
            u,
            o,
            c
          for (let l = 0; l < 80; l++)
            l < 20
              ? ((u = (_ & d) | (~_ & C)), (o = 1518500249))
              : l < 40
              ? ((u = _ ^ d ^ C), (o = 1859775393))
              : l < 60
              ? ((u = (_ & d) | (_ & C) | (d & C)), (o = 2400959708))
              : ((u = _ ^ d ^ C), (o = 3395469782)),
              (c = (w(y, 5) + u + r + o + S.getUint32(l * 4, !1)) & 4294967295),
              (r = C),
              (C = d),
              (d = w(_, 30)),
              (_ = y),
              (y = c)
          ;(this._h0 = (this._h0 + y) & 4294967295),
            (this._h1 = (this._h1 + _) & 4294967295),
            (this._h2 = (this._h2 + d) & 4294967295),
            (this._h3 = (this._h3 + C) & 4294967295),
            (this._h4 = (this._h4 + r) & 4294967295)
        }
      }
      ;(v._bigBlock32 = new DataView(new ArrayBuffer(320))), (n.StringSHA1 = v)
    }),
    Q(Y[17], X([0, 1, 28, 31]), function (x, n, R, D) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.LcsDiff = n.stringDiff = n.StringDiffSequence = void 0)
      class i {
        constructor(e) {
          this.source = e
        }
        getElements() {
          const e = this.source,
            b = new Int32Array(e.length)
          for (let f = 0, v = e.length; f < v; f++) b[f] = e.charCodeAt(f)
          return b
        }
      }
      n.StringDiffSequence = i
      function s(w, e, b) {
        return new a(new i(w), new i(e)).ComputeDiff(b).changes
      }
      n.stringDiff = s
      class p {
        static Assert(e, b) {
          if (!e) throw new Error(b)
        }
      }
      class L {
        static Copy(e, b, f, v, g) {
          for (let S = 0; S < g; S++) f[v + S] = e[b + S]
        }
        static Copy2(e, b, f, v, g) {
          for (let S = 0; S < g; S++) f[v + S] = e[b + S]
        }
      }
      class h {
        constructor() {
          ;(this.m_changes = []),
            (this.m_originalStart = 1073741824),
            (this.m_modifiedStart = 1073741824),
            (this.m_originalCount = 0),
            (this.m_modifiedCount = 0)
        }
        MarkNextChange() {
          ;(this.m_originalCount > 0 || this.m_modifiedCount > 0) &&
            this.m_changes.push(
              new R.DiffChange(
                this.m_originalStart,
                this.m_originalCount,
                this.m_modifiedStart,
                this.m_modifiedCount
              )
            ),
            (this.m_originalCount = 0),
            (this.m_modifiedCount = 0),
            (this.m_originalStart = 1073741824),
            (this.m_modifiedStart = 1073741824)
        }
        AddOriginalElement(e, b) {
          ;(this.m_originalStart = Math.min(this.m_originalStart, e)),
            (this.m_modifiedStart = Math.min(this.m_modifiedStart, b)),
            this.m_originalCount++
        }
        AddModifiedElement(e, b) {
          ;(this.m_originalStart = Math.min(this.m_originalStart, e)),
            (this.m_modifiedStart = Math.min(this.m_modifiedStart, b)),
            this.m_modifiedCount++
        }
        getChanges() {
          return (
            (this.m_originalCount > 0 || this.m_modifiedCount > 0) && this.MarkNextChange(),
            this.m_changes
          )
        }
        getReverseChanges() {
          return (
            (this.m_originalCount > 0 || this.m_modifiedCount > 0) && this.MarkNextChange(),
            this.m_changes.reverse(),
            this.m_changes
          )
        }
      }
      class a {
        constructor(e, b, f = null) {
          ;(this.ContinueProcessingPredicate = f),
            (this._originalSequence = e),
            (this._modifiedSequence = b)
          const [v, g, S] = a._getElements(e),
            [E, y, _] = a._getElements(b)
          ;(this._hasStrings = S && _),
            (this._originalStringElements = v),
            (this._originalElementsOrHash = g),
            (this._modifiedStringElements = E),
            (this._modifiedElementsOrHash = y),
            (this.m_forwardHistory = []),
            (this.m_reverseHistory = [])
        }
        static _isStringArray(e) {
          return e.length > 0 && typeof e[0] == 'string'
        }
        static _getElements(e) {
          const b = e.getElements()
          if (a._isStringArray(b)) {
            const f = new Int32Array(b.length)
            for (let v = 0, g = b.length; v < g; v++) f[v] = (0, D.stringHash)(b[v], 0)
            return [b, f, !0]
          }
          return b instanceof Int32Array ? [[], b, !1] : [[], new Int32Array(b), !1]
        }
        ElementsAreEqual(e, b) {
          return this._originalElementsOrHash[e] !== this._modifiedElementsOrHash[b]
            ? !1
            : this._hasStrings
            ? this._originalStringElements[e] === this._modifiedStringElements[b]
            : !0
        }
        ElementsAreStrictEqual(e, b) {
          if (!this.ElementsAreEqual(e, b)) return !1
          const f = a._getStrictElement(this._originalSequence, e),
            v = a._getStrictElement(this._modifiedSequence, b)
          return f === v
        }
        static _getStrictElement(e, b) {
          return typeof e.getStrictElement == 'function' ? e.getStrictElement(b) : null
        }
        OriginalElementsAreEqual(e, b) {
          return this._originalElementsOrHash[e] !== this._originalElementsOrHash[b]
            ? !1
            : this._hasStrings
            ? this._originalStringElements[e] === this._originalStringElements[b]
            : !0
        }
        ModifiedElementsAreEqual(e, b) {
          return this._modifiedElementsOrHash[e] !== this._modifiedElementsOrHash[b]
            ? !1
            : this._hasStrings
            ? this._modifiedStringElements[e] === this._modifiedStringElements[b]
            : !0
        }
        ComputeDiff(e) {
          return this._ComputeDiff(
            0,
            this._originalElementsOrHash.length - 1,
            0,
            this._modifiedElementsOrHash.length - 1,
            e
          )
        }
        _ComputeDiff(e, b, f, v, g) {
          const S = [!1]
          let E = this.ComputeDiffRecursive(e, b, f, v, S)
          return g && (E = this.PrettifyChanges(E)), { quitEarly: S[0], changes: E }
        }
        ComputeDiffRecursive(e, b, f, v, g) {
          for (g[0] = !1; e <= b && f <= v && this.ElementsAreEqual(e, f); ) e++, f++
          for (; b >= e && v >= f && this.ElementsAreEqual(b, v); ) b--, v--
          if (e > b || f > v) {
            let C
            return (
              f <= v
                ? (p.Assert(e === b + 1, 'originalStart should only be one more than originalEnd'),
                  (C = [new R.DiffChange(e, 0, f, v - f + 1)]))
                : e <= b
                ? (p.Assert(f === v + 1, 'modifiedStart should only be one more than modifiedEnd'),
                  (C = [new R.DiffChange(e, b - e + 1, f, 0)]))
                : (p.Assert(e === b + 1, 'originalStart should only be one more than originalEnd'),
                  p.Assert(f === v + 1, 'modifiedStart should only be one more than modifiedEnd'),
                  (C = [])),
              C
            )
          }
          const S = [0],
            E = [0],
            y = this.ComputeRecursionPoint(e, b, f, v, S, E, g),
            _ = S[0],
            d = E[0]
          if (y !== null) return y
          if (!g[0]) {
            const C = this.ComputeDiffRecursive(e, _, f, d, g)
            let r = []
            return (
              g[0]
                ? (r = [new R.DiffChange(_ + 1, b - (_ + 1) + 1, d + 1, v - (d + 1) + 1)])
                : (r = this.ComputeDiffRecursive(_ + 1, b, d + 1, v, g)),
              this.ConcatenateChanges(C, r)
            )
          }
          return [new R.DiffChange(e, b - e + 1, f, v - f + 1)]
        }
        WALKTRACE(e, b, f, v, g, S, E, y, _, d, C, r, u, o, c, l, m, N) {
          let A = null,
            M = null,
            k = new h(),
            q = b,
            I = f,
            B = u[0] - l[0] - v,
            H = -1073741824,
            F = this.m_forwardHistory.length - 1
          do {
            const U = B + e
            U === q || (U < I && _[U - 1] < _[U + 1])
              ? ((C = _[U + 1]),
                (o = C - B - v),
                C < H && k.MarkNextChange(),
                (H = C),
                k.AddModifiedElement(C + 1, o),
                (B = U + 1 - e))
              : ((C = _[U - 1] + 1),
                (o = C - B - v),
                C < H && k.MarkNextChange(),
                (H = C - 1),
                k.AddOriginalElement(C, o + 1),
                (B = U - 1 - e)),
              F >= 0 && ((_ = this.m_forwardHistory[F]), (e = _[0]), (q = 1), (I = _.length - 1))
          } while (--F >= -1)
          if (((A = k.getReverseChanges()), N[0])) {
            let U = u[0] + 1,
              T = l[0] + 1
            if (A !== null && A.length > 0) {
              const W = A[A.length - 1]
              ;(U = Math.max(U, W.getOriginalEnd())), (T = Math.max(T, W.getModifiedEnd()))
            }
            M = [new R.DiffChange(U, r - U + 1, T, c - T + 1)]
          } else {
            ;(k = new h()),
              (q = S),
              (I = E),
              (B = u[0] - l[0] - y),
              (H = 1073741824),
              (F = m ? this.m_reverseHistory.length - 1 : this.m_reverseHistory.length - 2)
            do {
              const U = B + g
              U === q || (U < I && d[U - 1] >= d[U + 1])
                ? ((C = d[U + 1] - 1),
                  (o = C - B - y),
                  C > H && k.MarkNextChange(),
                  (H = C + 1),
                  k.AddOriginalElement(C + 1, o + 1),
                  (B = U + 1 - g))
                : ((C = d[U - 1]),
                  (o = C - B - y),
                  C > H && k.MarkNextChange(),
                  (H = C),
                  k.AddModifiedElement(C + 1, o + 1),
                  (B = U - 1 - g)),
                F >= 0 && ((d = this.m_reverseHistory[F]), (g = d[0]), (q = 1), (I = d.length - 1))
            } while (--F >= -1)
            M = k.getChanges()
          }
          return this.ConcatenateChanges(A, M)
        }
        ComputeRecursionPoint(e, b, f, v, g, S, E) {
          let y = 0,
            _ = 0,
            d = 0,
            C = 0,
            r = 0,
            u = 0
          e--,
            f--,
            (g[0] = 0),
            (S[0] = 0),
            (this.m_forwardHistory = []),
            (this.m_reverseHistory = [])
          const o = b - e + (v - f),
            c = o + 1,
            l = new Int32Array(c),
            m = new Int32Array(c),
            N = v - f,
            A = b - e,
            M = e - f,
            k = b - v,
            I = (A - N) % 2 === 0
          ;(l[N] = e), (m[A] = b), (E[0] = !1)
          for (let B = 1; B <= o / 2 + 1; B++) {
            let H = 0,
              F = 0
            ;(d = this.ClipDiagonalBound(N - B, B, N, c)),
              (C = this.ClipDiagonalBound(N + B, B, N, c))
            for (let T = d; T <= C; T += 2) {
              T === d || (T < C && l[T - 1] < l[T + 1]) ? (y = l[T + 1]) : (y = l[T - 1] + 1),
                (_ = y - (T - N) - M)
              const W = y
              for (; y < b && _ < v && this.ElementsAreEqual(y + 1, _ + 1); ) y++, _++
              if (
                ((l[T] = y),
                y + _ > H + F && ((H = y), (F = _)),
                !I && Math.abs(T - A) <= B - 1 && y >= m[T])
              )
                return (
                  (g[0] = y),
                  (S[0] = _),
                  W <= m[T] && 1447 > 0 && B <= 1447 + 1
                    ? this.WALKTRACE(N, d, C, M, A, r, u, k, l, m, y, b, g, _, v, S, I, E)
                    : null
                )
            }
            const U = (H - e + (F - f) - B) / 2
            if (
              this.ContinueProcessingPredicate !== null &&
              !this.ContinueProcessingPredicate(H, U)
            )
              return (
                (E[0] = !0),
                (g[0] = H),
                (S[0] = F),
                U > 0 && 1447 > 0 && B <= 1447 + 1
                  ? this.WALKTRACE(N, d, C, M, A, r, u, k, l, m, y, b, g, _, v, S, I, E)
                  : (e++, f++, [new R.DiffChange(e, b - e + 1, f, v - f + 1)])
              )
            ;(r = this.ClipDiagonalBound(A - B, B, A, c)),
              (u = this.ClipDiagonalBound(A + B, B, A, c))
            for (let T = r; T <= u; T += 2) {
              T === r || (T < u && m[T - 1] >= m[T + 1]) ? (y = m[T + 1] - 1) : (y = m[T - 1]),
                (_ = y - (T - A) - k)
              const W = y
              for (; y > e && _ > f && this.ElementsAreEqual(y, _); ) y--, _--
              if (((m[T] = y), I && Math.abs(T - N) <= B && y <= l[T]))
                return (
                  (g[0] = y),
                  (S[0] = _),
                  W >= l[T] && 1447 > 0 && B <= 1447 + 1
                    ? this.WALKTRACE(N, d, C, M, A, r, u, k, l, m, y, b, g, _, v, S, I, E)
                    : null
                )
            }
            if (B <= 1447) {
              let T = new Int32Array(C - d + 2)
              ;(T[0] = N - d + 1),
                L.Copy2(l, d, T, 1, C - d + 1),
                this.m_forwardHistory.push(T),
                (T = new Int32Array(u - r + 2)),
                (T[0] = A - r + 1),
                L.Copy2(m, r, T, 1, u - r + 1),
                this.m_reverseHistory.push(T)
            }
          }
          return this.WALKTRACE(N, d, C, M, A, r, u, k, l, m, y, b, g, _, v, S, I, E)
        }
        PrettifyChanges(e) {
          for (let b = 0; b < e.length; b++) {
            const f = e[b],
              v = b < e.length - 1 ? e[b + 1].originalStart : this._originalElementsOrHash.length,
              g = b < e.length - 1 ? e[b + 1].modifiedStart : this._modifiedElementsOrHash.length,
              S = f.originalLength > 0,
              E = f.modifiedLength > 0
            for (
              ;
              f.originalStart + f.originalLength < v &&
              f.modifiedStart + f.modifiedLength < g &&
              (!S ||
                this.OriginalElementsAreEqual(
                  f.originalStart,
                  f.originalStart + f.originalLength
                )) &&
              (!E ||
                this.ModifiedElementsAreEqual(f.modifiedStart, f.modifiedStart + f.modifiedLength));

            ) {
              const _ = this.ElementsAreStrictEqual(f.originalStart, f.modifiedStart)
              if (
                this.ElementsAreStrictEqual(
                  f.originalStart + f.originalLength,
                  f.modifiedStart + f.modifiedLength
                ) &&
                !_
              )
                break
              f.originalStart++, f.modifiedStart++
            }
            const y = [null]
            if (b < e.length - 1 && this.ChangesOverlap(e[b], e[b + 1], y)) {
              ;(e[b] = y[0]), e.splice(b + 1, 1), b--
              continue
            }
          }
          for (let b = e.length - 1; b >= 0; b--) {
            const f = e[b]
            let v = 0,
              g = 0
            if (b > 0) {
              const C = e[b - 1]
              ;(v = C.originalStart + C.originalLength), (g = C.modifiedStart + C.modifiedLength)
            }
            const S = f.originalLength > 0,
              E = f.modifiedLength > 0
            let y = 0,
              _ = this._boundaryScore(
                f.originalStart,
                f.originalLength,
                f.modifiedStart,
                f.modifiedLength
              )
            for (let C = 1; ; C++) {
              const r = f.originalStart - C,
                u = f.modifiedStart - C
              if (
                r < v ||
                u < g ||
                (S && !this.OriginalElementsAreEqual(r, r + f.originalLength)) ||
                (E && !this.ModifiedElementsAreEqual(u, u + f.modifiedLength))
              )
                break
              const c =
                (r === v && u === g ? 5 : 0) +
                this._boundaryScore(r, f.originalLength, u, f.modifiedLength)
              c > _ && ((_ = c), (y = C))
            }
            ;(f.originalStart -= y), (f.modifiedStart -= y)
            const d = [null]
            if (b > 0 && this.ChangesOverlap(e[b - 1], e[b], d)) {
              ;(e[b - 1] = d[0]), e.splice(b, 1), b++
              continue
            }
          }
          if (this._hasStrings)
            for (let b = 1, f = e.length; b < f; b++) {
              const v = e[b - 1],
                g = e[b],
                S = g.originalStart - v.originalStart - v.originalLength,
                E = v.originalStart,
                y = g.originalStart + g.originalLength,
                _ = y - E,
                d = v.modifiedStart,
                C = g.modifiedStart + g.modifiedLength,
                r = C - d
              if (S < 5 && _ < 20 && r < 20) {
                const u = this._findBetterContiguousSequence(E, _, d, r, S)
                if (u) {
                  const [o, c] = u
                  ;(o !== v.originalStart + v.originalLength ||
                    c !== v.modifiedStart + v.modifiedLength) &&
                    ((v.originalLength = o - v.originalStart),
                    (v.modifiedLength = c - v.modifiedStart),
                    (g.originalStart = o + S),
                    (g.modifiedStart = c + S),
                    (g.originalLength = y - g.originalStart),
                    (g.modifiedLength = C - g.modifiedStart))
                }
              }
            }
          return e
        }
        _findBetterContiguousSequence(e, b, f, v, g) {
          if (b < g || v < g) return null
          const S = e + b - g + 1,
            E = f + v - g + 1
          let y = 0,
            _ = 0,
            d = 0
          for (let C = e; C < S; C++)
            for (let r = f; r < E; r++) {
              const u = this._contiguousSequenceScore(C, r, g)
              u > 0 && u > y && ((y = u), (_ = C), (d = r))
            }
          return y > 0 ? [_, d] : null
        }
        _contiguousSequenceScore(e, b, f) {
          let v = 0
          for (let g = 0; g < f; g++) {
            if (!this.ElementsAreEqual(e + g, b + g)) return 0
            v += this._originalStringElements[e + g].length
          }
          return v
        }
        _OriginalIsBoundary(e) {
          return e <= 0 || e >= this._originalElementsOrHash.length - 1
            ? !0
            : this._hasStrings && /^\s*$/.test(this._originalStringElements[e])
        }
        _OriginalRegionIsBoundary(e, b) {
          if (this._OriginalIsBoundary(e) || this._OriginalIsBoundary(e - 1)) return !0
          if (b > 0) {
            const f = e + b
            if (this._OriginalIsBoundary(f - 1) || this._OriginalIsBoundary(f)) return !0
          }
          return !1
        }
        _ModifiedIsBoundary(e) {
          return e <= 0 || e >= this._modifiedElementsOrHash.length - 1
            ? !0
            : this._hasStrings && /^\s*$/.test(this._modifiedStringElements[e])
        }
        _ModifiedRegionIsBoundary(e, b) {
          if (this._ModifiedIsBoundary(e) || this._ModifiedIsBoundary(e - 1)) return !0
          if (b > 0) {
            const f = e + b
            if (this._ModifiedIsBoundary(f - 1) || this._ModifiedIsBoundary(f)) return !0
          }
          return !1
        }
        _boundaryScore(e, b, f, v) {
          const g = this._OriginalRegionIsBoundary(e, b) ? 1 : 0,
            S = this._ModifiedRegionIsBoundary(f, v) ? 1 : 0
          return g + S
        }
        ConcatenateChanges(e, b) {
          const f = []
          if (e.length === 0 || b.length === 0) return b.length > 0 ? b : e
          if (this.ChangesOverlap(e[e.length - 1], b[0], f)) {
            const v = new Array(e.length + b.length - 1)
            return (
              L.Copy(e, 0, v, 0, e.length - 1),
              (v[e.length - 1] = f[0]),
              L.Copy(b, 1, v, e.length, b.length - 1),
              v
            )
          } else {
            const v = new Array(e.length + b.length)
            return L.Copy(e, 0, v, 0, e.length), L.Copy(b, 0, v, e.length, b.length), v
          }
        }
        ChangesOverlap(e, b, f) {
          if (
            (p.Assert(
              e.originalStart <= b.originalStart,
              'Left change is not less than or equal to right change'
            ),
            p.Assert(
              e.modifiedStart <= b.modifiedStart,
              'Left change is not less than or equal to right change'
            ),
            e.originalStart + e.originalLength >= b.originalStart ||
              e.modifiedStart + e.modifiedLength >= b.modifiedStart)
          ) {
            const v = e.originalStart
            let g = e.originalLength
            const S = e.modifiedStart
            let E = e.modifiedLength
            return (
              e.originalStart + e.originalLength >= b.originalStart &&
                (g = b.originalStart + b.originalLength - e.originalStart),
              e.modifiedStart + e.modifiedLength >= b.modifiedStart &&
                (E = b.modifiedStart + b.modifiedLength - e.modifiedStart),
              (f[0] = new R.DiffChange(v, g, S, E)),
              !0
            )
          } else return (f[0] = null), !1
        }
        ClipDiagonalBound(e, b, f, v) {
          if (e >= 0 && e < v) return e
          const g = f,
            S = v - f - 1,
            E = b % 2 === 0
          if (e < 0) {
            const y = g % 2 === 0
            return E === y ? 0 : 1
          } else {
            const y = S % 2 === 0
            return E === y ? v - 1 : v - 2
          }
        }
      }
      n.LcsDiff = a
    }),
    Q(Y[18], X([0, 1]), function (x, n) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.withNullAsUndefined =
          n.validateConstraint =
          n.validateConstraints =
          n.isFunction =
          n.assertIsDefined =
          n.assertType =
          n.isUndefinedOrNull =
          n.isDefined =
          n.isUndefined =
          n.isBoolean =
          n.isIterable =
          n.isNumber =
          n.isTypedArray =
          n.isObject =
          n.isString =
            void 0)
      function R(E) {
        return typeof E == 'string'
      }
      n.isString = R
      function D(E) {
        return (
          typeof E == 'object' &&
          E !== null &&
          !Array.isArray(E) &&
          !(E instanceof RegExp) &&
          !(E instanceof Date)
        )
      }
      n.isObject = D
      function i(E) {
        const y = Object.getPrototypeOf(Uint8Array)
        return typeof E == 'object' && E instanceof y
      }
      n.isTypedArray = i
      function s(E) {
        return typeof E == 'number' && !isNaN(E)
      }
      n.isNumber = s
      function p(E) {
        return !!E && typeof E[Symbol.iterator] == 'function'
      }
      n.isIterable = p
      function L(E) {
        return E === !0 || E === !1
      }
      n.isBoolean = L
      function h(E) {
        return typeof E > 'u'
      }
      n.isUndefined = h
      function a(E) {
        return !w(E)
      }
      n.isDefined = a
      function w(E) {
        return h(E) || E === null
      }
      n.isUndefinedOrNull = w
      function e(E, y) {
        if (!E) throw new Error(y ? `Unexpected type, expected '${y}'` : 'Unexpected type')
      }
      n.assertType = e
      function b(E) {
        if (w(E)) throw new Error('Assertion Failed: argument is undefined or null')
        return E
      }
      n.assertIsDefined = b
      function f(E) {
        return typeof E == 'function'
      }
      n.isFunction = f
      function v(E, y) {
        const _ = Math.min(E.length, y.length)
        for (let d = 0; d < _; d++) g(E[d], y[d])
      }
      n.validateConstraints = v
      function g(E, y) {
        if (R(y)) {
          if (typeof E !== y) throw new Error(`argument does not match constraint: typeof ${y}`)
        } else if (f(y)) {
          try {
            if (E instanceof y) return
          } catch {}
          if ((!w(E) && E.constructor === y) || (y.length === 1 && y.call(void 0, E) === !0)) return
          throw new Error(
            'argument does not match one of these constraints: arg instanceof constraint, arg.constructor === constraint, nor constraint(arg) === true'
          )
        }
      }
      n.validateConstraint = g
      function S(E) {
        return E === null ? void 0 : E
      }
      n.withNullAsUndefined = S
    }),
    Q(Y[32], X([0, 1, 18]), function (x, n, R) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.Codicon = n.getCodiconFontCharacters = void 0)
      const D = Object.create(null)
      function i(p, L) {
        if ((0, R.isString)(L)) {
          const h = D[L]
          if (h === void 0) throw new Error(`${p} references an unknown codicon: ${L}`)
          L = h
        }
        return (D[p] = L), { id: p }
      }
      function s() {
        return D
      }
      ;(n.getCodiconFontCharacters = s),
        (n.Codicon = {
          add: i('add', 6e4),
          plus: i('plus', 6e4),
          gistNew: i('gist-new', 6e4),
          repoCreate: i('repo-create', 6e4),
          lightbulb: i('lightbulb', 60001),
          lightBulb: i('light-bulb', 60001),
          repo: i('repo', 60002),
          repoDelete: i('repo-delete', 60002),
          gistFork: i('gist-fork', 60003),
          repoForked: i('repo-forked', 60003),
          gitPullRequest: i('git-pull-request', 60004),
          gitPullRequestAbandoned: i('git-pull-request-abandoned', 60004),
          recordKeys: i('record-keys', 60005),
          keyboard: i('keyboard', 60005),
          tag: i('tag', 60006),
          tagAdd: i('tag-add', 60006),
          tagRemove: i('tag-remove', 60006),
          person: i('person', 60007),
          personFollow: i('person-follow', 60007),
          personOutline: i('person-outline', 60007),
          personFilled: i('person-filled', 60007),
          gitBranch: i('git-branch', 60008),
          gitBranchCreate: i('git-branch-create', 60008),
          gitBranchDelete: i('git-branch-delete', 60008),
          sourceControl: i('source-control', 60008),
          mirror: i('mirror', 60009),
          mirrorPublic: i('mirror-public', 60009),
          star: i('star', 60010),
          starAdd: i('star-add', 60010),
          starDelete: i('star-delete', 60010),
          starEmpty: i('star-empty', 60010),
          comment: i('comment', 60011),
          commentAdd: i('comment-add', 60011),
          alert: i('alert', 60012),
          warning: i('warning', 60012),
          search: i('search', 60013),
          searchSave: i('search-save', 60013),
          logOut: i('log-out', 60014),
          signOut: i('sign-out', 60014),
          logIn: i('log-in', 60015),
          signIn: i('sign-in', 60015),
          eye: i('eye', 60016),
          eyeUnwatch: i('eye-unwatch', 60016),
          eyeWatch: i('eye-watch', 60016),
          circleFilled: i('circle-filled', 60017),
          primitiveDot: i('primitive-dot', 60017),
          closeDirty: i('close-dirty', 60017),
          debugBreakpoint: i('debug-breakpoint', 60017),
          debugBreakpointDisabled: i('debug-breakpoint-disabled', 60017),
          debugHint: i('debug-hint', 60017),
          primitiveSquare: i('primitive-square', 60018),
          edit: i('edit', 60019),
          pencil: i('pencil', 60019),
          info: i('info', 60020),
          issueOpened: i('issue-opened', 60020),
          gistPrivate: i('gist-private', 60021),
          gitForkPrivate: i('git-fork-private', 60021),
          lock: i('lock', 60021),
          mirrorPrivate: i('mirror-private', 60021),
          close: i('close', 60022),
          removeClose: i('remove-close', 60022),
          x: i('x', 60022),
          repoSync: i('repo-sync', 60023),
          sync: i('sync', 60023),
          clone: i('clone', 60024),
          desktopDownload: i('desktop-download', 60024),
          beaker: i('beaker', 60025),
          microscope: i('microscope', 60025),
          vm: i('vm', 60026),
          deviceDesktop: i('device-desktop', 60026),
          file: i('file', 60027),
          fileText: i('file-text', 60027),
          more: i('more', 60028),
          ellipsis: i('ellipsis', 60028),
          kebabHorizontal: i('kebab-horizontal', 60028),
          mailReply: i('mail-reply', 60029),
          reply: i('reply', 60029),
          organization: i('organization', 60030),
          organizationFilled: i('organization-filled', 60030),
          organizationOutline: i('organization-outline', 60030),
          newFile: i('new-file', 60031),
          fileAdd: i('file-add', 60031),
          newFolder: i('new-folder', 60032),
          fileDirectoryCreate: i('file-directory-create', 60032),
          trash: i('trash', 60033),
          trashcan: i('trashcan', 60033),
          history: i('history', 60034),
          clock: i('clock', 60034),
          folder: i('folder', 60035),
          fileDirectory: i('file-directory', 60035),
          symbolFolder: i('symbol-folder', 60035),
          logoGithub: i('logo-github', 60036),
          markGithub: i('mark-github', 60036),
          github: i('github', 60036),
          terminal: i('terminal', 60037),
          console: i('console', 60037),
          repl: i('repl', 60037),
          zap: i('zap', 60038),
          symbolEvent: i('symbol-event', 60038),
          error: i('error', 60039),
          stop: i('stop', 60039),
          variable: i('variable', 60040),
          symbolVariable: i('symbol-variable', 60040),
          array: i('array', 60042),
          symbolArray: i('symbol-array', 60042),
          symbolModule: i('symbol-module', 60043),
          symbolPackage: i('symbol-package', 60043),
          symbolNamespace: i('symbol-namespace', 60043),
          symbolObject: i('symbol-object', 60043),
          symbolMethod: i('symbol-method', 60044),
          symbolFunction: i('symbol-function', 60044),
          symbolConstructor: i('symbol-constructor', 60044),
          symbolBoolean: i('symbol-boolean', 60047),
          symbolNull: i('symbol-null', 60047),
          symbolNumeric: i('symbol-numeric', 60048),
          symbolNumber: i('symbol-number', 60048),
          symbolStructure: i('symbol-structure', 60049),
          symbolStruct: i('symbol-struct', 60049),
          symbolParameter: i('symbol-parameter', 60050),
          symbolTypeParameter: i('symbol-type-parameter', 60050),
          symbolKey: i('symbol-key', 60051),
          symbolText: i('symbol-text', 60051),
          symbolReference: i('symbol-reference', 60052),
          goToFile: i('go-to-file', 60052),
          symbolEnum: i('symbol-enum', 60053),
          symbolValue: i('symbol-value', 60053),
          symbolRuler: i('symbol-ruler', 60054),
          symbolUnit: i('symbol-unit', 60054),
          activateBreakpoints: i('activate-breakpoints', 60055),
          archive: i('archive', 60056),
          arrowBoth: i('arrow-both', 60057),
          arrowDown: i('arrow-down', 60058),
          arrowLeft: i('arrow-left', 60059),
          arrowRight: i('arrow-right', 60060),
          arrowSmallDown: i('arrow-small-down', 60061),
          arrowSmallLeft: i('arrow-small-left', 60062),
          arrowSmallRight: i('arrow-small-right', 60063),
          arrowSmallUp: i('arrow-small-up', 60064),
          arrowUp: i('arrow-up', 60065),
          bell: i('bell', 60066),
          bold: i('bold', 60067),
          book: i('book', 60068),
          bookmark: i('bookmark', 60069),
          debugBreakpointConditionalUnverified: i('debug-breakpoint-conditional-unverified', 60070),
          debugBreakpointConditional: i('debug-breakpoint-conditional', 60071),
          debugBreakpointConditionalDisabled: i('debug-breakpoint-conditional-disabled', 60071),
          debugBreakpointDataUnverified: i('debug-breakpoint-data-unverified', 60072),
          debugBreakpointData: i('debug-breakpoint-data', 60073),
          debugBreakpointDataDisabled: i('debug-breakpoint-data-disabled', 60073),
          debugBreakpointLogUnverified: i('debug-breakpoint-log-unverified', 60074),
          debugBreakpointLog: i('debug-breakpoint-log', 60075),
          debugBreakpointLogDisabled: i('debug-breakpoint-log-disabled', 60075),
          briefcase: i('briefcase', 60076),
          broadcast: i('broadcast', 60077),
          browser: i('browser', 60078),
          bug: i('bug', 60079),
          calendar: i('calendar', 60080),
          caseSensitive: i('case-sensitive', 60081),
          check: i('check', 60082),
          checklist: i('checklist', 60083),
          chevronDown: i('chevron-down', 60084),
          dropDownButton: i('drop-down-button', 60084),
          chevronLeft: i('chevron-left', 60085),
          chevronRight: i('chevron-right', 60086),
          chevronUp: i('chevron-up', 60087),
          chromeClose: i('chrome-close', 60088),
          chromeMaximize: i('chrome-maximize', 60089),
          chromeMinimize: i('chrome-minimize', 60090),
          chromeRestore: i('chrome-restore', 60091),
          circle: i('circle', 60092),
          circleOutline: i('circle-outline', 60092),
          debugBreakpointUnverified: i('debug-breakpoint-unverified', 60092),
          circleSlash: i('circle-slash', 60093),
          circuitBoard: i('circuit-board', 60094),
          clearAll: i('clear-all', 60095),
          clippy: i('clippy', 60096),
          closeAll: i('close-all', 60097),
          cloudDownload: i('cloud-download', 60098),
          cloudUpload: i('cloud-upload', 60099),
          code: i('code', 60100),
          collapseAll: i('collapse-all', 60101),
          colorMode: i('color-mode', 60102),
          commentDiscussion: i('comment-discussion', 60103),
          compareChanges: i('compare-changes', 60157),
          creditCard: i('credit-card', 60105),
          dash: i('dash', 60108),
          dashboard: i('dashboard', 60109),
          database: i('database', 60110),
          debugContinue: i('debug-continue', 60111),
          debugDisconnect: i('debug-disconnect', 60112),
          debugPause: i('debug-pause', 60113),
          debugRestart: i('debug-restart', 60114),
          debugStart: i('debug-start', 60115),
          debugStepInto: i('debug-step-into', 60116),
          debugStepOut: i('debug-step-out', 60117),
          debugStepOver: i('debug-step-over', 60118),
          debugStop: i('debug-stop', 60119),
          debug: i('debug', 60120),
          deviceCameraVideo: i('device-camera-video', 60121),
          deviceCamera: i('device-camera', 60122),
          deviceMobile: i('device-mobile', 60123),
          diffAdded: i('diff-added', 60124),
          diffIgnored: i('diff-ignored', 60125),
          diffModified: i('diff-modified', 60126),
          diffRemoved: i('diff-removed', 60127),
          diffRenamed: i('diff-renamed', 60128),
          diff: i('diff', 60129),
          discard: i('discard', 60130),
          editorLayout: i('editor-layout', 60131),
          emptyWindow: i('empty-window', 60132),
          exclude: i('exclude', 60133),
          extensions: i('extensions', 60134),
          eyeClosed: i('eye-closed', 60135),
          fileBinary: i('file-binary', 60136),
          fileCode: i('file-code', 60137),
          fileMedia: i('file-media', 60138),
          filePdf: i('file-pdf', 60139),
          fileSubmodule: i('file-submodule', 60140),
          fileSymlinkDirectory: i('file-symlink-directory', 60141),
          fileSymlinkFile: i('file-symlink-file', 60142),
          fileZip: i('file-zip', 60143),
          files: i('files', 60144),
          filter: i('filter', 60145),
          flame: i('flame', 60146),
          foldDown: i('fold-down', 60147),
          foldUp: i('fold-up', 60148),
          fold: i('fold', 60149),
          folderActive: i('folder-active', 60150),
          folderOpened: i('folder-opened', 60151),
          gear: i('gear', 60152),
          gift: i('gift', 60153),
          gistSecret: i('gist-secret', 60154),
          gist: i('gist', 60155),
          gitCommit: i('git-commit', 60156),
          gitCompare: i('git-compare', 60157),
          gitMerge: i('git-merge', 60158),
          githubAction: i('github-action', 60159),
          githubAlt: i('github-alt', 60160),
          globe: i('globe', 60161),
          grabber: i('grabber', 60162),
          graph: i('graph', 60163),
          gripper: i('gripper', 60164),
          heart: i('heart', 60165),
          home: i('home', 60166),
          horizontalRule: i('horizontal-rule', 60167),
          hubot: i('hubot', 60168),
          inbox: i('inbox', 60169),
          issueClosed: i('issue-closed', 60324),
          issueReopened: i('issue-reopened', 60171),
          issues: i('issues', 60172),
          italic: i('italic', 60173),
          jersey: i('jersey', 60174),
          json: i('json', 60175),
          bracket: i('bracket', 60175),
          kebabVertical: i('kebab-vertical', 60176),
          key: i('key', 60177),
          law: i('law', 60178),
          lightbulbAutofix: i('lightbulb-autofix', 60179),
          linkExternal: i('link-external', 60180),
          link: i('link', 60181),
          listOrdered: i('list-ordered', 60182),
          listUnordered: i('list-unordered', 60183),
          liveShare: i('live-share', 60184),
          loading: i('loading', 60185),
          location: i('location', 60186),
          mailRead: i('mail-read', 60187),
          mail: i('mail', 60188),
          markdown: i('markdown', 60189),
          megaphone: i('megaphone', 60190),
          mention: i('mention', 60191),
          milestone: i('milestone', 60192),
          mortarBoard: i('mortar-board', 60193),
          move: i('move', 60194),
          multipleWindows: i('multiple-windows', 60195),
          mute: i('mute', 60196),
          noNewline: i('no-newline', 60197),
          note: i('note', 60198),
          octoface: i('octoface', 60199),
          openPreview: i('open-preview', 60200),
          package_: i('package', 60201),
          paintcan: i('paintcan', 60202),
          pin: i('pin', 60203),
          play: i('play', 60204),
          run: i('run', 60204),
          plug: i('plug', 60205),
          preserveCase: i('preserve-case', 60206),
          preview: i('preview', 60207),
          project: i('project', 60208),
          pulse: i('pulse', 60209),
          question: i('question', 60210),
          quote: i('quote', 60211),
          radioTower: i('radio-tower', 60212),
          reactions: i('reactions', 60213),
          references: i('references', 60214),
          refresh: i('refresh', 60215),
          regex: i('regex', 60216),
          remoteExplorer: i('remote-explorer', 60217),
          remote: i('remote', 60218),
          remove: i('remove', 60219),
          replaceAll: i('replace-all', 60220),
          replace: i('replace', 60221),
          repoClone: i('repo-clone', 60222),
          repoForcePush: i('repo-force-push', 60223),
          repoPull: i('repo-pull', 60224),
          repoPush: i('repo-push', 60225),
          report: i('report', 60226),
          requestChanges: i('request-changes', 60227),
          rocket: i('rocket', 60228),
          rootFolderOpened: i('root-folder-opened', 60229),
          rootFolder: i('root-folder', 60230),
          rss: i('rss', 60231),
          ruby: i('ruby', 60232),
          saveAll: i('save-all', 60233),
          saveAs: i('save-as', 60234),
          save: i('save', 60235),
          screenFull: i('screen-full', 60236),
          screenNormal: i('screen-normal', 60237),
          searchStop: i('search-stop', 60238),
          server: i('server', 60240),
          settingsGear: i('settings-gear', 60241),
          settings: i('settings', 60242),
          shield: i('shield', 60243),
          smiley: i('smiley', 60244),
          sortPrecedence: i('sort-precedence', 60245),
          splitHorizontal: i('split-horizontal', 60246),
          splitVertical: i('split-vertical', 60247),
          squirrel: i('squirrel', 60248),
          starFull: i('star-full', 60249),
          starHalf: i('star-half', 60250),
          symbolClass: i('symbol-class', 60251),
          symbolColor: i('symbol-color', 60252),
          symbolCustomColor: i('symbol-customcolor', 60252),
          symbolConstant: i('symbol-constant', 60253),
          symbolEnumMember: i('symbol-enum-member', 60254),
          symbolField: i('symbol-field', 60255),
          symbolFile: i('symbol-file', 60256),
          symbolInterface: i('symbol-interface', 60257),
          symbolKeyword: i('symbol-keyword', 60258),
          symbolMisc: i('symbol-misc', 60259),
          symbolOperator: i('symbol-operator', 60260),
          symbolProperty: i('symbol-property', 60261),
          wrench: i('wrench', 60261),
          wrenchSubaction: i('wrench-subaction', 60261),
          symbolSnippet: i('symbol-snippet', 60262),
          tasklist: i('tasklist', 60263),
          telescope: i('telescope', 60264),
          textSize: i('text-size', 60265),
          threeBars: i('three-bars', 60266),
          thumbsdown: i('thumbsdown', 60267),
          thumbsup: i('thumbsup', 60268),
          tools: i('tools', 60269),
          triangleDown: i('triangle-down', 60270),
          triangleLeft: i('triangle-left', 60271),
          triangleRight: i('triangle-right', 60272),
          triangleUp: i('triangle-up', 60273),
          twitter: i('twitter', 60274),
          unfold: i('unfold', 60275),
          unlock: i('unlock', 60276),
          unmute: i('unmute', 60277),
          unverified: i('unverified', 60278),
          verified: i('verified', 60279),
          versions: i('versions', 60280),
          vmActive: i('vm-active', 60281),
          vmOutline: i('vm-outline', 60282),
          vmRunning: i('vm-running', 60283),
          watch: i('watch', 60284),
          whitespace: i('whitespace', 60285),
          wholeWord: i('whole-word', 60286),
          window: i('window', 60287),
          wordWrap: i('word-wrap', 60288),
          zoomIn: i('zoom-in', 60289),
          zoomOut: i('zoom-out', 60290),
          listFilter: i('list-filter', 60291),
          listFlat: i('list-flat', 60292),
          listSelection: i('list-selection', 60293),
          selection: i('selection', 60293),
          listTree: i('list-tree', 60294),
          debugBreakpointFunctionUnverified: i('debug-breakpoint-function-unverified', 60295),
          debugBreakpointFunction: i('debug-breakpoint-function', 60296),
          debugBreakpointFunctionDisabled: i('debug-breakpoint-function-disabled', 60296),
          debugStackframeActive: i('debug-stackframe-active', 60297),
          circleSmallFilled: i('circle-small-filled', 60298),
          debugStackframeDot: i('debug-stackframe-dot', 60298),
          debugStackframe: i('debug-stackframe', 60299),
          debugStackframeFocused: i('debug-stackframe-focused', 60299),
          debugBreakpointUnsupported: i('debug-breakpoint-unsupported', 60300),
          symbolString: i('symbol-string', 60301),
          debugReverseContinue: i('debug-reverse-continue', 60302),
          debugStepBack: i('debug-step-back', 60303),
          debugRestartFrame: i('debug-restart-frame', 60304),
          callIncoming: i('call-incoming', 60306),
          callOutgoing: i('call-outgoing', 60307),
          menu: i('menu', 60308),
          expandAll: i('expand-all', 60309),
          feedback: i('feedback', 60310),
          groupByRefType: i('group-by-ref-type', 60311),
          ungroupByRefType: i('ungroup-by-ref-type', 60312),
          account: i('account', 60313),
          bellDot: i('bell-dot', 60314),
          debugConsole: i('debug-console', 60315),
          library: i('library', 60316),
          output: i('output', 60317),
          runAll: i('run-all', 60318),
          syncIgnored: i('sync-ignored', 60319),
          pinned: i('pinned', 60320),
          githubInverted: i('github-inverted', 60321),
          debugAlt: i('debug-alt', 60305),
          serverProcess: i('server-process', 60322),
          serverEnvironment: i('server-environment', 60323),
          pass: i('pass', 60324),
          stopCircle: i('stop-circle', 60325),
          playCircle: i('play-circle', 60326),
          record: i('record', 60327),
          debugAltSmall: i('debug-alt-small', 60328),
          vmConnect: i('vm-connect', 60329),
          cloud: i('cloud', 60330),
          merge: i('merge', 60331),
          exportIcon: i('export', 60332),
          graphLeft: i('graph-left', 60333),
          magnet: i('magnet', 60334),
          notebook: i('notebook', 60335),
          redo: i('redo', 60336),
          checkAll: i('check-all', 60337),
          pinnedDirty: i('pinned-dirty', 60338),
          passFilled: i('pass-filled', 60339),
          circleLargeFilled: i('circle-large-filled', 60340),
          circleLarge: i('circle-large', 60341),
          circleLargeOutline: i('circle-large-outline', 60341),
          combine: i('combine', 60342),
          gather: i('gather', 60342),
          table: i('table', 60343),
          variableGroup: i('variable-group', 60344),
          typeHierarchy: i('type-hierarchy', 60345),
          typeHierarchySub: i('type-hierarchy-sub', 60346),
          typeHierarchySuper: i('type-hierarchy-super', 60347),
          gitPullRequestCreate: i('git-pull-request-create', 60348),
          runAbove: i('run-above', 60349),
          runBelow: i('run-below', 60350),
          notebookTemplate: i('notebook-template', 60351),
          debugRerun: i('debug-rerun', 60352),
          workspaceTrusted: i('workspace-trusted', 60353),
          workspaceUntrusted: i('workspace-untrusted', 60354),
          workspaceUnspecified: i('workspace-unspecified', 60355),
          terminalCmd: i('terminal-cmd', 60356),
          terminalDebian: i('terminal-debian', 60357),
          terminalLinux: i('terminal-linux', 60358),
          terminalPowershell: i('terminal-powershell', 60359),
          terminalTmux: i('terminal-tmux', 60360),
          terminalUbuntu: i('terminal-ubuntu', 60361),
          terminalBash: i('terminal-bash', 60362),
          arrowSwap: i('arrow-swap', 60363),
          copy: i('copy', 60364),
          personAdd: i('person-add', 60365),
          filterFilled: i('filter-filled', 60366),
          wand: i('wand', 60367),
          debugLineByLine: i('debug-line-by-line', 60368),
          inspect: i('inspect', 60369),
          layers: i('layers', 60370),
          layersDot: i('layers-dot', 60371),
          layersActive: i('layers-active', 60372),
          compass: i('compass', 60373),
          compassDot: i('compass-dot', 60374),
          compassActive: i('compass-active', 60375),
          azure: i('azure', 60376),
          issueDraft: i('issue-draft', 60377),
          gitPullRequestClosed: i('git-pull-request-closed', 60378),
          gitPullRequestDraft: i('git-pull-request-draft', 60379),
          debugAll: i('debug-all', 60380),
          debugCoverage: i('debug-coverage', 60381),
          runErrors: i('run-errors', 60382),
          folderLibrary: i('folder-library', 60383),
          debugContinueSmall: i('debug-continue-small', 60384),
          beakerStop: i('beaker-stop', 60385),
          graphLine: i('graph-line', 60386),
          graphScatter: i('graph-scatter', 60387),
          pieChart: i('pie-chart', 60388),
          bracketDot: i('bracket-dot', 60389),
          bracketError: i('bracket-error', 60390),
          lockSmall: i('lock-small', 60391),
          azureDevops: i('azure-devops', 60392),
          verifiedFilled: i('verified-filled', 60393),
          newLine: i('newline', 60394),
          layout: i('layout', 60395),
          layoutActivitybarLeft: i('layout-activitybar-left', 60396),
          layoutActivitybarRight: i('layout-activitybar-right', 60397),
          layoutPanelLeft: i('layout-panel-left', 60398),
          layoutPanelCenter: i('layout-panel-center', 60399),
          layoutPanelJustify: i('layout-panel-justify', 60400),
          layoutPanelRight: i('layout-panel-right', 60401),
          layoutPanel: i('layout-panel', 60402),
          layoutSidebarLeft: i('layout-sidebar-left', 60403),
          layoutSidebarRight: i('layout-sidebar-right', 60404),
          layoutStatusbar: i('layout-statusbar', 60405),
          layoutMenubar: i('layout-menubar', 60406),
          layoutCentered: i('layout-centered', 60407),
          layoutSidebarRightOff: i('layout-sidebar-right-off', 60416),
          layoutPanelOff: i('layout-panel-off', 60417),
          layoutSidebarLeftOff: i('layout-sidebar-left-off', 60418),
          target: i('target', 60408),
          indent: i('indent', 60409),
          recordSmall: i('record-small', 60410),
          errorSmall: i('error-small', 60411),
          arrowCircleDown: i('arrow-circle-down', 60412),
          arrowCircleLeft: i('arrow-circle-left', 60413),
          arrowCircleRight: i('arrow-circle-right', 60414),
          arrowCircleUp: i('arrow-circle-up', 60415),
          heartFilled: i('heart-filled', 60420),
          map: i('map', 60421),
          mapFilled: i('map-filled', 60422),
          circleSmall: i('circle-small', 60423),
          bellSlash: i('bell-slash', 60424),
          bellSlashDot: i('bell-slash-dot', 60425),
          commentUnresolved: i('comment-unresolved', 60426),
          gitPullRequestGoToChanges: i('git-pull-request-go-to-changes', 60427),
          gitPullRequestNewChanges: i('git-pull-request-new-changes', 60428),
          searchFuzzy: i('search-fuzzy', 60429),
          commentDraft: i('comment-draft', 60430),
          send: i('send', 60431),
          sparkle: i('sparkle', 60432),
          insert: i('insert', 60433),
          dialogError: i('dialog-error', 'error'),
          dialogWarning: i('dialog-warning', 'warning'),
          dialogInfo: i('dialog-info', 'info'),
          dialogClose: i('dialog-close', 'close'),
          treeItemExpanded: i('tree-item-expanded', 'chevron-down'),
          treeFilterOnTypeOn: i('tree-filter-on-type-on', 'list-filter'),
          treeFilterOnTypeOff: i('tree-filter-on-type-off', 'list-selection'),
          treeFilterClear: i('tree-filter-clear', 'close'),
          treeItemLoading: i('tree-item-loading', 'loading'),
          menuSelection: i('menu-selection', 'check'),
          menuSubmenu: i('menu-submenu', 'chevron-right'),
          menuBarMore: i('menubar-more', 'more'),
          scrollbarButtonLeft: i('scrollbar-button-left', 'triangle-left'),
          scrollbarButtonRight: i('scrollbar-button-right', 'triangle-right'),
          scrollbarButtonUp: i('scrollbar-button-up', 'triangle-up'),
          scrollbarButtonDown: i('scrollbar-button-down', 'triangle-down'),
          toolBarMore: i('toolbar-more', 'more'),
          quickInputBack: i('quick-input-back', 'arrow-left'),
        })
    }),
    Q(Y[12], X([0, 1, 18]), function (x, n, R) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.createProxyObject =
          n.getAllMethodNames =
          n.getAllPropertyNames =
          n.equals =
          n.mixin =
          n.cloneAndChange =
          n.deepFreeze =
          n.deepClone =
            void 0)
      function D(f) {
        if (!f || typeof f != 'object' || f instanceof RegExp) return f
        const v = Array.isArray(f) ? [] : {}
        return (
          Object.entries(f).forEach(([g, S]) => {
            v[g] = S && typeof S == 'object' ? D(S) : S
          }),
          v
        )
      }
      n.deepClone = D
      function i(f) {
        if (!f || typeof f != 'object') return f
        const v = [f]
        for (; v.length > 0; ) {
          const g = v.shift()
          Object.freeze(g)
          for (const S in g)
            if (s.call(g, S)) {
              const E = g[S]
              typeof E == 'object' && !Object.isFrozen(E) && !(0, R.isTypedArray)(E) && v.push(E)
            }
        }
        return f
      }
      n.deepFreeze = i
      const s = Object.prototype.hasOwnProperty
      function p(f, v) {
        return L(f, v, new Set())
      }
      n.cloneAndChange = p
      function L(f, v, g) {
        if ((0, R.isUndefinedOrNull)(f)) return f
        const S = v(f)
        if (typeof S < 'u') return S
        if (Array.isArray(f)) {
          const E = []
          for (const y of f) E.push(L(y, v, g))
          return E
        }
        if ((0, R.isObject)(f)) {
          if (g.has(f)) throw new Error('Cannot clone recursive data-structure')
          g.add(f)
          const E = {}
          for (const y in f) s.call(f, y) && (E[y] = L(f[y], v, g))
          return g.delete(f), E
        }
        return f
      }
      function h(f, v, g = !0) {
        return (0, R.isObject)(f)
          ? ((0, R.isObject)(v) &&
              Object.keys(v).forEach((S) => {
                S in f
                  ? g &&
                    ((0, R.isObject)(f[S]) && (0, R.isObject)(v[S])
                      ? h(f[S], v[S], g)
                      : (f[S] = v[S]))
                  : (f[S] = v[S])
              }),
            f)
          : v
      }
      n.mixin = h
      function a(f, v) {
        if (f === v) return !0
        if (
          f == null ||
          v === null ||
          v === void 0 ||
          typeof f != typeof v ||
          typeof f != 'object' ||
          Array.isArray(f) !== Array.isArray(v)
        )
          return !1
        let g, S
        if (Array.isArray(f)) {
          if (f.length !== v.length) return !1
          for (g = 0; g < f.length; g++) if (!a(f[g], v[g])) return !1
        } else {
          const E = []
          for (S in f) E.push(S)
          E.sort()
          const y = []
          for (S in v) y.push(S)
          if ((y.sort(), !a(E, y))) return !1
          for (g = 0; g < E.length; g++) if (!a(f[E[g]], v[E[g]])) return !1
        }
        return !0
      }
      n.equals = a
      function w(f) {
        let v = [],
          g = Object.getPrototypeOf(f)
        for (; Object.prototype !== g; )
          (v = v.concat(Object.getOwnPropertyNames(g))), (g = Object.getPrototypeOf(g))
        return v
      }
      n.getAllPropertyNames = w
      function e(f) {
        const v = []
        for (const g of w(f)) typeof f[g] == 'function' && v.push(g)
        return v
      }
      n.getAllMethodNames = e
      function b(f, v) {
        const g = (E) =>
            function () {
              const y = Array.prototype.slice.call(arguments, 0)
              return v(E, y)
            },
          S = {}
        for (const E of f) S[E] = g(E)
        return S
      }
      n.createProxyObject = b
    }),
    Q(Y[19], X([0, 1]), function (x, n) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }), (n.toUint32 = n.toUint8 = void 0)
      function R(i) {
        return i < 0 ? 0 : i > 255 ? 255 : i | 0
      }
      n.toUint8 = R
      function D(i) {
        return i < 0 ? 0 : i > 4294967295 ? 4294967295 : i | 0
      }
      n.toUint32 = D
    }),
    Q(Y[20], X([0, 1, 19]), function (x, n, R) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.CharacterSet = n.CharacterClassifier = void 0)
      class D {
        constructor(p) {
          const L = (0, R.toUint8)(p)
          ;(this._defaultValue = L),
            (this._asciiMap = D._createAsciiMap(L)),
            (this._map = new Map())
        }
        static _createAsciiMap(p) {
          const L = new Uint8Array(256)
          return L.fill(p), L
        }
        set(p, L) {
          const h = (0, R.toUint8)(L)
          p >= 0 && p < 256 ? (this._asciiMap[p] = h) : this._map.set(p, h)
        }
        get(p) {
          return p >= 0 && p < 256 ? this._asciiMap[p] : this._map.get(p) || this._defaultValue
        }
        clear() {
          this._asciiMap.fill(this._defaultValue), this._map.clear()
        }
      }
      n.CharacterClassifier = D
      class i {
        constructor() {
          this._actual = new D(0)
        }
        add(p) {
          this._actual.set(p, 1)
        }
        has(p) {
          return this._actual.get(p) === 1
        }
        clear() {
          return this._actual.clear()
        }
      }
      n.CharacterSet = i
    }),
    Q(Y[21], X([0, 1, 4]), function (x, n, R) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }), (n.LineRange = void 0)
      class D {
        static joinMany(s) {
          if (s.length === 0) return []
          let p = s[0]
          for (let L = 1; L < s.length; L++) p = this.join(p, s[L])
          return p
        }
        static join(s, p) {
          if (s.length === 0) return p
          if (p.length === 0) return s
          const L = []
          let h = 0,
            a = 0,
            w = null
          for (; h < s.length || a < p.length; ) {
            let e = null
            if (h < s.length && a < p.length) {
              const b = s[h],
                f = p[a]
              b.startLineNumber < f.startLineNumber ? ((e = b), h++) : ((e = f), a++)
            } else h < s.length ? ((e = s[h]), h++) : ((e = p[a]), a++)
            w === null
              ? (w = e)
              : w.endLineNumberExclusive >= e.startLineNumber
              ? (w = new D(
                  w.startLineNumber,
                  Math.max(w.endLineNumberExclusive, e.endLineNumberExclusive)
                ))
              : (L.push(w), (w = e))
          }
          return w !== null && L.push(w), L
        }
        constructor(s, p) {
          if (s > p)
            throw new R.BugIndicatingError(
              `startLineNumber ${s} cannot be after endLineNumberExclusive ${p}`
            )
          ;(this.startLineNumber = s), (this.endLineNumberExclusive = p)
        }
        contains(s) {
          return this.startLineNumber <= s && s < this.endLineNumberExclusive
        }
        get isEmpty() {
          return this.startLineNumber === this.endLineNumberExclusive
        }
        delta(s) {
          return new D(this.startLineNumber + s, this.endLineNumberExclusive + s)
        }
        get length() {
          return this.endLineNumberExclusive - this.startLineNumber
        }
        join(s) {
          return new D(
            Math.min(this.startLineNumber, s.startLineNumber),
            Math.max(this.endLineNumberExclusive, s.endLineNumberExclusive)
          )
        }
        toString() {
          return `[${this.startLineNumber},${this.endLineNumberExclusive})`
        }
        intersect(s) {
          const p = Math.max(this.startLineNumber, s.startLineNumber),
            L = Math.min(this.endLineNumberExclusive, s.endLineNumberExclusive)
          if (p <= L) return new D(p, L)
        }
        overlapOrTouch(s) {
          return (
            this.startLineNumber <= s.endLineNumberExclusive &&
            s.startLineNumber <= this.endLineNumberExclusive
          )
        }
        equals(s) {
          return (
            this.startLineNumber === s.startLineNumber &&
            this.endLineNumberExclusive === s.endLineNumberExclusive
          )
        }
      }
      n.LineRange = D
    }),
    Q(Y[6], X([0, 1, 4]), function (x, n, R) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }), (n.OffsetRange = void 0)
      class D {
        static addRange(s, p) {
          let L = 0
          for (; L < p.length && p[L].endExclusive < s.start; ) L++
          let h = L
          for (; h < p.length && p[h].start <= s.endExclusive; ) h++
          if (L === h) p.splice(L, 0, s)
          else {
            const a = Math.min(s.start, p[L].start),
              w = Math.max(s.endExclusive, p[h - 1].endExclusive)
            p.splice(L, h - L, new D(a, w))
          }
        }
        static tryCreate(s, p) {
          if (!(s > p)) return new D(s, p)
        }
        constructor(s, p) {
          if (((this.start = s), (this.endExclusive = p), s > p))
            throw new R.BugIndicatingError(`Invalid range: ${this.toString()}`)
        }
        get isEmpty() {
          return this.start === this.endExclusive
        }
        delta(s) {
          return new D(this.start + s, this.endExclusive + s)
        }
        get length() {
          return this.endExclusive - this.start
        }
        toString() {
          return `[${this.start}, ${this.endExclusive})`
        }
        equals(s) {
          return this.start === s.start && this.endExclusive === s.endExclusive
        }
        containsRange(s) {
          return this.start <= s.start && s.endExclusive <= this.endExclusive
        }
        join(s) {
          return new D(Math.min(this.start, s.start), Math.max(this.endExclusive, s.endExclusive))
        }
        intersect(s) {
          const p = Math.max(this.start, s.start),
            L = Math.min(this.endExclusive, s.endExclusive)
          if (p <= L) return new D(p, L)
        }
      }
      n.OffsetRange = D
    }),
    Q(Y[3], X([0, 1]), function (x, n) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }), (n.Position = void 0)
      class R {
        constructor(i, s) {
          ;(this.lineNumber = i), (this.column = s)
        }
        with(i = this.lineNumber, s = this.column) {
          return i === this.lineNumber && s === this.column ? this : new R(i, s)
        }
        delta(i = 0, s = 0) {
          return this.with(this.lineNumber + i, this.column + s)
        }
        equals(i) {
          return R.equals(this, i)
        }
        static equals(i, s) {
          return !i && !s
            ? !0
            : !!i && !!s && i.lineNumber === s.lineNumber && i.column === s.column
        }
        isBefore(i) {
          return R.isBefore(this, i)
        }
        static isBefore(i, s) {
          return i.lineNumber < s.lineNumber
            ? !0
            : s.lineNumber < i.lineNumber
            ? !1
            : i.column < s.column
        }
        isBeforeOrEqual(i) {
          return R.isBeforeOrEqual(this, i)
        }
        static isBeforeOrEqual(i, s) {
          return i.lineNumber < s.lineNumber
            ? !0
            : s.lineNumber < i.lineNumber
            ? !1
            : i.column <= s.column
        }
        static compare(i, s) {
          const p = i.lineNumber | 0,
            L = s.lineNumber | 0
          if (p === L) {
            const h = i.column | 0,
              a = s.column | 0
            return h - a
          }
          return p - L
        }
        clone() {
          return new R(this.lineNumber, this.column)
        }
        toString() {
          return '(' + this.lineNumber + ',' + this.column + ')'
        }
        static lift(i) {
          return new R(i.lineNumber, i.column)
        }
        static isIPosition(i) {
          return i && typeof i.lineNumber == 'number' && typeof i.column == 'number'
        }
      }
      n.Position = R
    }),
    Q(Y[2], X([0, 1, 3]), function (x, n, R) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }), (n.Range = void 0)
      class D {
        constructor(s, p, L, h) {
          s > L || (s === L && p > h)
            ? ((this.startLineNumber = L),
              (this.startColumn = h),
              (this.endLineNumber = s),
              (this.endColumn = p))
            : ((this.startLineNumber = s),
              (this.startColumn = p),
              (this.endLineNumber = L),
              (this.endColumn = h))
        }
        isEmpty() {
          return D.isEmpty(this)
        }
        static isEmpty(s) {
          return s.startLineNumber === s.endLineNumber && s.startColumn === s.endColumn
        }
        containsPosition(s) {
          return D.containsPosition(this, s)
        }
        static containsPosition(s, p) {
          return !(
            p.lineNumber < s.startLineNumber ||
            p.lineNumber > s.endLineNumber ||
            (p.lineNumber === s.startLineNumber && p.column < s.startColumn) ||
            (p.lineNumber === s.endLineNumber && p.column > s.endColumn)
          )
        }
        static strictContainsPosition(s, p) {
          return !(
            p.lineNumber < s.startLineNumber ||
            p.lineNumber > s.endLineNumber ||
            (p.lineNumber === s.startLineNumber && p.column <= s.startColumn) ||
            (p.lineNumber === s.endLineNumber && p.column >= s.endColumn)
          )
        }
        containsRange(s) {
          return D.containsRange(this, s)
        }
        static containsRange(s, p) {
          return !(
            p.startLineNumber < s.startLineNumber ||
            p.endLineNumber < s.startLineNumber ||
            p.startLineNumber > s.endLineNumber ||
            p.endLineNumber > s.endLineNumber ||
            (p.startLineNumber === s.startLineNumber && p.startColumn < s.startColumn) ||
            (p.endLineNumber === s.endLineNumber && p.endColumn > s.endColumn)
          )
        }
        strictContainsRange(s) {
          return D.strictContainsRange(this, s)
        }
        static strictContainsRange(s, p) {
          return !(
            p.startLineNumber < s.startLineNumber ||
            p.endLineNumber < s.startLineNumber ||
            p.startLineNumber > s.endLineNumber ||
            p.endLineNumber > s.endLineNumber ||
            (p.startLineNumber === s.startLineNumber && p.startColumn <= s.startColumn) ||
            (p.endLineNumber === s.endLineNumber && p.endColumn >= s.endColumn)
          )
        }
        plusRange(s) {
          return D.plusRange(this, s)
        }
        static plusRange(s, p) {
          let L, h, a, w
          return (
            p.startLineNumber < s.startLineNumber
              ? ((L = p.startLineNumber), (h = p.startColumn))
              : p.startLineNumber === s.startLineNumber
              ? ((L = p.startLineNumber), (h = Math.min(p.startColumn, s.startColumn)))
              : ((L = s.startLineNumber), (h = s.startColumn)),
            p.endLineNumber > s.endLineNumber
              ? ((a = p.endLineNumber), (w = p.endColumn))
              : p.endLineNumber === s.endLineNumber
              ? ((a = p.endLineNumber), (w = Math.max(p.endColumn, s.endColumn)))
              : ((a = s.endLineNumber), (w = s.endColumn)),
            new D(L, h, a, w)
          )
        }
        intersectRanges(s) {
          return D.intersectRanges(this, s)
        }
        static intersectRanges(s, p) {
          let L = s.startLineNumber,
            h = s.startColumn,
            a = s.endLineNumber,
            w = s.endColumn
          const e = p.startLineNumber,
            b = p.startColumn,
            f = p.endLineNumber,
            v = p.endColumn
          return (
            L < e ? ((L = e), (h = b)) : L === e && (h = Math.max(h, b)),
            a > f ? ((a = f), (w = v)) : a === f && (w = Math.min(w, v)),
            L > a || (L === a && h > w) ? null : new D(L, h, a, w)
          )
        }
        equalsRange(s) {
          return D.equalsRange(this, s)
        }
        static equalsRange(s, p) {
          return !s && !p
            ? !0
            : !!s &&
                !!p &&
                s.startLineNumber === p.startLineNumber &&
                s.startColumn === p.startColumn &&
                s.endLineNumber === p.endLineNumber &&
                s.endColumn === p.endColumn
        }
        getEndPosition() {
          return D.getEndPosition(this)
        }
        static getEndPosition(s) {
          return new R.Position(s.endLineNumber, s.endColumn)
        }
        getStartPosition() {
          return D.getStartPosition(this)
        }
        static getStartPosition(s) {
          return new R.Position(s.startLineNumber, s.startColumn)
        }
        toString() {
          return (
            '[' +
            this.startLineNumber +
            ',' +
            this.startColumn +
            ' -> ' +
            this.endLineNumber +
            ',' +
            this.endColumn +
            ']'
          )
        }
        setEndPosition(s, p) {
          return new D(this.startLineNumber, this.startColumn, s, p)
        }
        setStartPosition(s, p) {
          return new D(s, p, this.endLineNumber, this.endColumn)
        }
        collapseToStart() {
          return D.collapseToStart(this)
        }
        static collapseToStart(s) {
          return new D(s.startLineNumber, s.startColumn, s.startLineNumber, s.startColumn)
        }
        collapseToEnd() {
          return D.collapseToEnd(this)
        }
        static collapseToEnd(s) {
          return new D(s.endLineNumber, s.endColumn, s.endLineNumber, s.endColumn)
        }
        delta(s) {
          return new D(
            this.startLineNumber + s,
            this.startColumn,
            this.endLineNumber + s,
            this.endColumn
          )
        }
        static fromPositions(s, p = s) {
          return new D(s.lineNumber, s.column, p.lineNumber, p.column)
        }
        static lift(s) {
          return s ? new D(s.startLineNumber, s.startColumn, s.endLineNumber, s.endColumn) : null
        }
        static isIRange(s) {
          return (
            s &&
            typeof s.startLineNumber == 'number' &&
            typeof s.startColumn == 'number' &&
            typeof s.endLineNumber == 'number' &&
            typeof s.endColumn == 'number'
          )
        }
        static areIntersectingOrTouching(s, p) {
          return !(
            s.endLineNumber < p.startLineNumber ||
            (s.endLineNumber === p.startLineNumber && s.endColumn < p.startColumn) ||
            p.endLineNumber < s.startLineNumber ||
            (p.endLineNumber === s.startLineNumber && p.endColumn < s.startColumn)
          )
        }
        static areIntersecting(s, p) {
          return !(
            s.endLineNumber < p.startLineNumber ||
            (s.endLineNumber === p.startLineNumber && s.endColumn <= p.startColumn) ||
            p.endLineNumber < s.startLineNumber ||
            (p.endLineNumber === s.startLineNumber && p.endColumn <= s.startColumn)
          )
        }
        static compareRangesUsingStarts(s, p) {
          if (s && p) {
            const a = s.startLineNumber | 0,
              w = p.startLineNumber | 0
            if (a === w) {
              const e = s.startColumn | 0,
                b = p.startColumn | 0
              if (e === b) {
                const f = s.endLineNumber | 0,
                  v = p.endLineNumber | 0
                if (f === v) {
                  const g = s.endColumn | 0,
                    S = p.endColumn | 0
                  return g - S
                }
                return f - v
              }
              return e - b
            }
            return a - w
          }
          return (s ? 1 : 0) - (p ? 1 : 0)
        }
        static compareRangesUsingEnds(s, p) {
          return s.endLineNumber === p.endLineNumber
            ? s.endColumn === p.endColumn
              ? s.startLineNumber === p.startLineNumber
                ? s.startColumn - p.startColumn
                : s.startLineNumber - p.startLineNumber
              : s.endColumn - p.endColumn
            : s.endLineNumber - p.endLineNumber
        }
        static spansMultipleLines(s) {
          return s.endLineNumber > s.startLineNumber
        }
        toJSON() {
          return this
        }
      }
      n.Range = D
    }),
    Q(Y[33], X([0, 1, 3, 2]), function (x, n, R, D) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }), (n.Selection = void 0)
      class i extends D.Range {
        constructor(p, L, h, a) {
          super(p, L, h, a),
            (this.selectionStartLineNumber = p),
            (this.selectionStartColumn = L),
            (this.positionLineNumber = h),
            (this.positionColumn = a)
        }
        toString() {
          return (
            '[' +
            this.selectionStartLineNumber +
            ',' +
            this.selectionStartColumn +
            ' -> ' +
            this.positionLineNumber +
            ',' +
            this.positionColumn +
            ']'
          )
        }
        equalsSelection(p) {
          return i.selectionsEqual(this, p)
        }
        static selectionsEqual(p, L) {
          return (
            p.selectionStartLineNumber === L.selectionStartLineNumber &&
            p.selectionStartColumn === L.selectionStartColumn &&
            p.positionLineNumber === L.positionLineNumber &&
            p.positionColumn === L.positionColumn
          )
        }
        getDirection() {
          return this.selectionStartLineNumber === this.startLineNumber &&
            this.selectionStartColumn === this.startColumn
            ? 0
            : 1
        }
        setEndPosition(p, L) {
          return this.getDirection() === 0
            ? new i(this.startLineNumber, this.startColumn, p, L)
            : new i(p, L, this.startLineNumber, this.startColumn)
        }
        getPosition() {
          return new R.Position(this.positionLineNumber, this.positionColumn)
        }
        getSelectionStart() {
          return new R.Position(this.selectionStartLineNumber, this.selectionStartColumn)
        }
        setStartPosition(p, L) {
          return this.getDirection() === 0
            ? new i(p, L, this.endLineNumber, this.endColumn)
            : new i(this.endLineNumber, this.endColumn, p, L)
        }
        static fromPositions(p, L = p) {
          return new i(p.lineNumber, p.column, L.lineNumber, L.column)
        }
        static fromRange(p, L) {
          return L === 0
            ? new i(p.startLineNumber, p.startColumn, p.endLineNumber, p.endColumn)
            : new i(p.endLineNumber, p.endColumn, p.startLineNumber, p.startColumn)
        }
        static liftSelection(p) {
          return new i(
            p.selectionStartLineNumber,
            p.selectionStartColumn,
            p.positionLineNumber,
            p.positionColumn
          )
        }
        static selectionsArrEqual(p, L) {
          if ((p && !L) || (!p && L)) return !1
          if (!p && !L) return !0
          if (p.length !== L.length) return !1
          for (let h = 0, a = p.length; h < a; h++) if (!this.selectionsEqual(p[h], L[h])) return !1
          return !0
        }
        static isISelection(p) {
          return (
            p &&
            typeof p.selectionStartLineNumber == 'number' &&
            typeof p.selectionStartColumn == 'number' &&
            typeof p.positionLineNumber == 'number' &&
            typeof p.positionColumn == 'number'
          )
        }
        static createWithDirection(p, L, h, a, w) {
          return w === 0 ? new i(p, L, h, a) : new i(h, a, p, L)
        }
      }
      n.Selection = i
    }),
    Q(Y[34], X([0, 1, 20]), function (x, n, R) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.getMapForWordSeparators = n.WordCharacterClassifier = void 0)
      class D extends R.CharacterClassifier {
        constructor(p) {
          super(0)
          for (let L = 0, h = p.length; L < h; L++) this.set(p.charCodeAt(L), 2)
          this.set(32, 1), this.set(9, 1)
        }
      }
      n.WordCharacterClassifier = D
      function i(s) {
        const p = {}
        return (L) => (p.hasOwnProperty(L) || (p[L] = s(L)), p[L])
      }
      n.getMapForWordSeparators = i((s) => new D(s))
    }),
    Q(Y[22], X([0, 1, 15, 16]), function (x, n, R, D) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.getWordAtText =
          n.ensureValidWordDefinition =
          n.DEFAULT_WORD_REGEXP =
          n.USUAL_WORD_SEPARATORS =
            void 0),
        (n.USUAL_WORD_SEPARATORS = '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?')
      function i(a = '') {
        let w = '(-?\\d*\\.\\d\\w*)|([^'
        for (const e of n.USUAL_WORD_SEPARATORS) a.indexOf(e) >= 0 || (w += '\\' + e)
        return (w += '\\s]+)'), new RegExp(w, 'g')
      }
      n.DEFAULT_WORD_REGEXP = i()
      function s(a) {
        let w = n.DEFAULT_WORD_REGEXP
        if (a && a instanceof RegExp)
          if (a.global) w = a
          else {
            let e = 'g'
            a.ignoreCase && (e += 'i'),
              a.multiline && (e += 'm'),
              a.unicode && (e += 'u'),
              (w = new RegExp(a.source, e))
          }
        return (w.lastIndex = 0), w
      }
      n.ensureValidWordDefinition = s
      const p = new D.LinkedList()
      p.unshift({ maxLen: 1e3, windowSize: 15, timeBudget: 150 })
      function L(a, w, e, b, f) {
        if ((f || (f = R.Iterable.first(p)), e.length > f.maxLen)) {
          let y = a - f.maxLen / 2
          return (
            y < 0 ? (y = 0) : (b += y), (e = e.substring(y, a + f.maxLen / 2)), L(a, w, e, b, f)
          )
        }
        const v = Date.now(),
          g = a - 1 - b
        let S = -1,
          E = null
        for (let y = 1; !(Date.now() - v >= f.timeBudget); y++) {
          const _ = g - f.windowSize * y
          w.lastIndex = Math.max(0, _)
          const d = h(w, e, g, S)
          if ((!d && E) || ((E = d), _ <= 0)) break
          S = _
        }
        if (E) {
          const y = {
            word: E[0],
            startColumn: b + 1 + E.index,
            endColumn: b + 1 + E.index + E[0].length,
          }
          return (w.lastIndex = 0), y
        }
        return null
      }
      n.getWordAtText = L
      function h(a, w, e, b) {
        let f
        for (; (f = a.exec(w)); ) {
          const v = f.index || 0
          if (v <= e && a.lastIndex >= e) return f
          if (b > 0 && v > b) return null
        }
        return null
      }
    }),
    Q(Y[7], X([0, 1, 4, 6]), function (x, n, R, D) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.DateTimeout = n.InfiniteTimeout = n.SequenceDiff = n.DiffAlgorithmResult = void 0)
      class i {
        static trivial(a, w) {
          return new i([new s(new D.OffsetRange(0, a.length), new D.OffsetRange(0, w.length))], !1)
        }
        static trivialTimedOut(a, w) {
          return new i([new s(new D.OffsetRange(0, a.length), new D.OffsetRange(0, w.length))], !0)
        }
        constructor(a, w) {
          ;(this.diffs = a), (this.hitTimeout = w)
        }
      }
      n.DiffAlgorithmResult = i
      class s {
        constructor(a, w) {
          ;(this.seq1Range = a), (this.seq2Range = w)
        }
        reverse() {
          return new s(this.seq2Range, this.seq1Range)
        }
        toString() {
          return `${this.seq1Range} <-> ${this.seq2Range}`
        }
        join(a) {
          return new s(this.seq1Range.join(a.seq1Range), this.seq2Range.join(a.seq2Range))
        }
      }
      n.SequenceDiff = s
      class p {
        isValid() {
          return !0
        }
      }
      ;(p.instance = new p()), (n.InfiniteTimeout = p)
      class L {
        constructor(a) {
          if (((this.timeout = a), (this.startTime = Date.now()), (this.valid = !0), a <= 0))
            throw new R.BugIndicatingError('timeout must be positive')
        }
        isValid() {
          if (!(Date.now() - this.startTime < this.timeout) && this.valid) {
            this.valid = !1
            debugger
          }
          return this.valid
        }
      }
      n.DateTimeout = L
    }),
    Q(Y[35], X([0, 1, 6, 7]), function (x, n, R, D) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.shiftSequenceDiffs =
          n.joinSequenceDiffs =
          n.smoothenSequenceDiffs =
          n.optimizeSequenceDiffs =
            void 0)
      function i(a, w, e) {
        let b = e
        return (b = p(a, w, b)), (b = L(a, w, b)), b
      }
      n.optimizeSequenceDiffs = i
      function s(a, w, e) {
        const b = []
        for (const f of e) {
          const v = b[b.length - 1]
          if (!v) {
            b.push(f)
            continue
          }
          f.seq1Range.start - v.seq1Range.endExclusive <= 2 ||
          f.seq2Range.start - v.seq2Range.endExclusive <= 2
            ? (b[b.length - 1] = new D.SequenceDiff(
                v.seq1Range.join(f.seq1Range),
                v.seq2Range.join(f.seq2Range)
              ))
            : b.push(f)
        }
        return b
      }
      n.smoothenSequenceDiffs = s
      function p(a, w, e) {
        const b = []
        e.length > 0 && b.push(e[0])
        for (let f = 1; f < e.length; f++) {
          const v = b[b.length - 1],
            g = e[f]
          if (g.seq1Range.isEmpty) {
            let S = !0
            const E = g.seq1Range.start - v.seq1Range.endExclusive
            for (let y = 1; y <= E; y++)
              if (
                w.getElement(g.seq2Range.start - y) !== w.getElement(g.seq2Range.endExclusive - y)
              ) {
                S = !1
                break
              }
            if (S) {
              b[b.length - 1] = new D.SequenceDiff(
                v.seq1Range,
                new R.OffsetRange(v.seq2Range.start, g.seq2Range.endExclusive - E)
              )
              continue
            }
          }
          b.push(g)
        }
        return b
      }
      n.joinSequenceDiffs = p
      function L(a, w, e) {
        if (!a.getBoundaryScore || !w.getBoundaryScore) return e
        for (let b = 0; b < e.length; b++) {
          const f = e[b]
          if (f.seq1Range.isEmpty) {
            const v = b > 0 ? e[b - 1].seq2Range.endExclusive : -1,
              g = b + 1 < e.length ? e[b + 1].seq2Range.start : w.length
            e[b] = h(f, a, w, g, v)
          } else if (f.seq2Range.isEmpty) {
            const v = b > 0 ? e[b - 1].seq1Range.endExclusive : -1,
              g = b + 1 < e.length ? e[b + 1].seq1Range.start : a.length
            e[b] = h(f.reverse(), w, a, g, v).reverse()
          }
        }
        return e
      }
      n.shiftSequenceDiffs = L
      function h(a, w, e, b, f) {
        let g = 1
        for (
          ;
          a.seq2Range.start - g > f &&
          e.getElement(a.seq2Range.start - g) === e.getElement(a.seq2Range.endExclusive - g) &&
          g < 20;

        )
          g++
        g--
        let S = 0
        for (
          ;
          a.seq2Range.start + S < b &&
          e.getElement(a.seq2Range.start + S) === e.getElement(a.seq2Range.endExclusive + S) &&
          S < 20;

        )
          S++
        if (g === 0 && S === 0) return a
        let E = 0,
          y = -1
        for (let _ = -g; _ <= S; _++) {
          const d = a.seq2Range.start + _,
            C = a.seq2Range.endExclusive + _,
            r = a.seq1Range.start + _,
            u = w.getBoundaryScore(r) + e.getBoundaryScore(d) + e.getBoundaryScore(C)
          u > y && ((y = u), (E = _))
        }
        return E !== 0 ? new D.SequenceDiff(a.seq1Range.delta(E), a.seq2Range.delta(E)) : a
      }
    }),
    Q(Y[36], X([0, 1, 6, 7]), function (x, n, R, D) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }), (n.MyersDiffAlgorithm = void 0)
      class i {
        compute(a, w, e = D.InfiniteTimeout.instance) {
          if (a.length === 0 || w.length === 0) return D.DiffAlgorithmResult.trivial(a, w)
          function b(C, r) {
            for (; C < a.length && r < w.length && a.getElement(C) === w.getElement(r); ) C++, r++
            return C
          }
          let f = 0
          const v = new p()
          v.set(0, b(0, 0))
          const g = new L()
          g.set(0, v.get(0) === 0 ? null : new s(null, 0, 0, v.get(0)))
          let S = 0
          e: for (;;)
            for (f++, S = -f; S <= f; S += 2) {
              if (!e.isValid()) return D.DiffAlgorithmResult.trivialTimedOut(a, w)
              const C = S === f ? -1 : v.get(S + 1),
                r = S === -f ? -1 : v.get(S - 1) + 1,
                u = Math.min(Math.max(C, r), a.length),
                o = u - S,
                c = b(u, o)
              v.set(S, c)
              const l = u === C ? g.get(S + 1) : g.get(S - 1)
              if (
                (g.set(S, c !== u ? new s(l, u, o, c - u) : l),
                v.get(S) === a.length && v.get(S) - S === w.length)
              )
                break e
            }
          let E = g.get(S)
          const y = []
          let _ = a.length,
            d = w.length
          for (;;) {
            const C = E ? E.x + E.length : 0,
              r = E ? E.y + E.length : 0
            if (
              ((C !== _ || r !== d) &&
                y.push(new D.SequenceDiff(new R.OffsetRange(C, _), new R.OffsetRange(r, d))),
              !E)
            )
              break
            ;(_ = E.x), (d = E.y), (E = E.prev)
          }
          return y.reverse(), new D.DiffAlgorithmResult(y, !1)
        }
      }
      n.MyersDiffAlgorithm = i
      class s {
        constructor(a, w, e, b) {
          ;(this.prev = a), (this.x = w), (this.y = e), (this.length = b)
        }
      }
      class p {
        constructor() {
          ;(this.positiveArr = new Int32Array(10)), (this.negativeArr = new Int32Array(10))
        }
        get(a) {
          return a < 0 ? ((a = -a - 1), this.negativeArr[a]) : this.positiveArr[a]
        }
        set(a, w) {
          if (a < 0) {
            if (((a = -a - 1), a >= this.negativeArr.length)) {
              const e = this.negativeArr
              ;(this.negativeArr = new Int32Array(e.length * 2)), this.negativeArr.set(e)
            }
            this.negativeArr[a] = w
          } else {
            if (a >= this.positiveArr.length) {
              const e = this.positiveArr
              ;(this.positiveArr = new Int32Array(e.length * 2)), this.positiveArr.set(e)
            }
            this.positiveArr[a] = w
          }
        }
      }
      class L {
        constructor() {
          ;(this.positiveArr = []), (this.negativeArr = [])
        }
        get(a) {
          return a < 0 ? ((a = -a - 1), this.negativeArr[a]) : this.positiveArr[a]
        }
        set(a, w) {
          a < 0 ? ((a = -a - 1), (this.negativeArr[a] = w)) : (this.positiveArr[a] = w)
        }
      }
    }),
    Q(Y[37], X([0, 1]), function (x, n) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }), (n.Array2D = void 0)
      class R {
        constructor(i, s) {
          ;(this.width = i), (this.height = s), (this.array = []), (this.array = new Array(i * s))
        }
        get(i, s) {
          return this.array[i + s * this.width]
        }
        set(i, s, p) {
          this.array[i + s * this.width] = p
        }
      }
      n.Array2D = R
    }),
    Q(Y[38], X([0, 1, 6, 7, 37]), function (x, n, R, D, i) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }), (n.DynamicProgrammingDiffing = void 0)
      class s {
        compute(L, h, a = D.InfiniteTimeout.instance, w) {
          if (L.length === 0 || h.length === 0) return D.DiffAlgorithmResult.trivial(L, h)
          const e = new i.Array2D(L.length, h.length),
            b = new i.Array2D(L.length, h.length),
            f = new i.Array2D(L.length, h.length)
          for (let d = 0; d < L.length; d++)
            for (let C = 0; C < h.length; C++) {
              if (!a.isValid()) return D.DiffAlgorithmResult.trivialTimedOut(L, h)
              const r = d === 0 ? 0 : e.get(d - 1, C),
                u = C === 0 ? 0 : e.get(d, C - 1)
              let o
              L.getElement(d) === h.getElement(C)
                ? (d === 0 || C === 0 ? (o = 0) : (o = e.get(d - 1, C - 1)),
                  d > 0 && C > 0 && b.get(d - 1, C - 1) === 3 && (o += f.get(d - 1, C - 1)),
                  (o += w ? w(d, C) : 1))
                : (o = -1)
              const c = Math.max(r, u, o)
              if (c === o) {
                const l = d > 0 && C > 0 ? f.get(d - 1, C - 1) : 0
                f.set(d, C, l + 1), b.set(d, C, 3)
              } else
                c === r
                  ? (f.set(d, C, 0), b.set(d, C, 1))
                  : c === u && (f.set(d, C, 0), b.set(d, C, 2))
              e.set(d, C, c)
            }
          const v = []
          let g = L.length,
            S = h.length
          function E(d, C) {
            ;(d + 1 !== g || C + 1 !== S) &&
              v.push(new D.SequenceDiff(new R.OffsetRange(d + 1, g), new R.OffsetRange(C + 1, S))),
              (g = d),
              (S = C)
          }
          let y = L.length - 1,
            _ = h.length - 1
          for (; y >= 0 && _ >= 0; )
            b.get(y, _) === 3 ? (E(y, _), y--, _--) : b.get(y, _) === 1 ? y-- : _--
          return E(-1, -1), v.reverse(), new D.DiffAlgorithmResult(v, !1)
        }
      }
      n.DynamicProgrammingDiffing = s
    }),
    Q(Y[23], X([0, 1]), function (x, n) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.RangeMapping = n.LineRangeMapping = n.LinesDiff = void 0)
      class R {
        constructor(p, L) {
          ;(this.changes = p), (this.hitTimeout = L)
        }
      }
      n.LinesDiff = R
      class D {
        constructor(p, L, h) {
          ;(this.originalRange = p), (this.modifiedRange = L), (this.innerChanges = h)
        }
        toString() {
          return `{${this.originalRange.toString()}->${this.modifiedRange.toString()}}`
        }
      }
      n.LineRangeMapping = D
      class i {
        constructor(p, L) {
          ;(this.originalRange = p), (this.modifiedRange = L)
        }
        toString() {
          return `{${this.originalRange.toString()}->${this.modifiedRange.toString()}}`
        }
      }
      n.RangeMapping = i
    }),
    Q(Y[39], X([0, 1, 17, 23, 5, 2, 10, 21]), function (x, n, R, D, i, s, p, L) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.DiffComputer = n.SmartLinesDiffComputer = void 0)
      const h = 3
      class a {
        computeDiff(C, r, u) {
          var o
          const l = new S(C, r, {
              maxComputationTime: u.maxComputationTimeMs,
              shouldIgnoreTrimWhitespace: u.ignoreTrimWhitespace,
              shouldComputeCharChanges: !0,
              shouldMakePrettyDiff: !0,
              shouldPostProcessCharChanges: !0,
            }).computeDiff(),
            m = []
          let N = null
          for (const A of l.changes) {
            let M
            A.originalEndLineNumber === 0
              ? (M = new L.LineRange(A.originalStartLineNumber + 1, A.originalStartLineNumber + 1))
              : (M = new L.LineRange(A.originalStartLineNumber, A.originalEndLineNumber + 1))
            let k
            A.modifiedEndLineNumber === 0
              ? (k = new L.LineRange(A.modifiedStartLineNumber + 1, A.modifiedStartLineNumber + 1))
              : (k = new L.LineRange(A.modifiedStartLineNumber, A.modifiedEndLineNumber + 1))
            let q = new D.LineRangeMapping(
              M,
              k,
              (o = A.charChanges) === null || o === void 0
                ? void 0
                : o.map(
                    (I) =>
                      new D.RangeMapping(
                        new s.Range(
                          I.originalStartLineNumber,
                          I.originalStartColumn,
                          I.originalEndLineNumber,
                          I.originalEndColumn
                        ),
                        new s.Range(
                          I.modifiedStartLineNumber,
                          I.modifiedStartColumn,
                          I.modifiedEndLineNumber,
                          I.modifiedEndColumn
                        )
                      )
                  )
            )
            N &&
              (N.modifiedRange.endLineNumberExclusive === q.modifiedRange.startLineNumber ||
                N.originalRange.endLineNumberExclusive === q.originalRange.startLineNumber) &&
              ((q = new D.LineRangeMapping(
                N.originalRange.join(q.originalRange),
                N.modifiedRange.join(q.modifiedRange),
                N.innerChanges && q.innerChanges ? N.innerChanges.concat(q.innerChanges) : void 0
              )),
              m.pop()),
              m.push(q),
              (N = q)
          }
          return (
            (0, p.assertFn)(() =>
              (0, p.checkAdjacentItems)(
                m,
                (A, M) =>
                  M.originalRange.startLineNumber - A.originalRange.endLineNumberExclusive ===
                    M.modifiedRange.startLineNumber - A.modifiedRange.endLineNumberExclusive &&
                  A.originalRange.endLineNumberExclusive < M.originalRange.startLineNumber &&
                  A.modifiedRange.endLineNumberExclusive < M.modifiedRange.startLineNumber
              )
            ),
            new D.LinesDiff(m, l.quitEarly)
          )
        }
      }
      n.SmartLinesDiffComputer = a
      function w(d, C, r, u) {
        return new R.LcsDiff(d, C, r).ComputeDiff(u)
      }
      class e {
        constructor(C) {
          const r = [],
            u = []
          for (let o = 0, c = C.length; o < c; o++) (r[o] = E(C[o], 1)), (u[o] = y(C[o], 1))
          ;(this.lines = C), (this._startColumns = r), (this._endColumns = u)
        }
        getElements() {
          const C = []
          for (let r = 0, u = this.lines.length; r < u; r++)
            C[r] = this.lines[r].substring(this._startColumns[r] - 1, this._endColumns[r] - 1)
          return C
        }
        getStrictElement(C) {
          return this.lines[C]
        }
        getStartLineNumber(C) {
          return C + 1
        }
        getEndLineNumber(C) {
          return C + 1
        }
        createCharSequence(C, r, u) {
          const o = [],
            c = [],
            l = []
          let m = 0
          for (let N = r; N <= u; N++) {
            const A = this.lines[N],
              M = C ? this._startColumns[N] : 1,
              k = C ? this._endColumns[N] : A.length + 1
            for (let q = M; q < k; q++)
              (o[m] = A.charCodeAt(q - 1)), (c[m] = N + 1), (l[m] = q), m++
            !C && N < u && ((o[m] = 10), (c[m] = N + 1), (l[m] = A.length + 1), m++)
          }
          return new b(o, c, l)
        }
      }
      class b {
        constructor(C, r, u) {
          ;(this._charCodes = C), (this._lineNumbers = r), (this._columns = u)
        }
        toString() {
          return (
            '[' +
            this._charCodes
              .map(
                (C, r) =>
                  (C === 10 ? '\\n' : String.fromCharCode(C)) +
                  `-(${this._lineNumbers[r]},${this._columns[r]})`
              )
              .join(', ') +
            ']'
          )
        }
        _assertIndex(C, r) {
          if (C < 0 || C >= r.length) throw new Error('Illegal index')
        }
        getElements() {
          return this._charCodes
        }
        getStartLineNumber(C) {
          return C > 0 && C === this._lineNumbers.length
            ? this.getEndLineNumber(C - 1)
            : (this._assertIndex(C, this._lineNumbers), this._lineNumbers[C])
        }
        getEndLineNumber(C) {
          return C === -1
            ? this.getStartLineNumber(C + 1)
            : (this._assertIndex(C, this._lineNumbers),
              this._charCodes[C] === 10 ? this._lineNumbers[C] + 1 : this._lineNumbers[C])
        }
        getStartColumn(C) {
          return C > 0 && C === this._columns.length
            ? this.getEndColumn(C - 1)
            : (this._assertIndex(C, this._columns), this._columns[C])
        }
        getEndColumn(C) {
          return C === -1
            ? this.getStartColumn(C + 1)
            : (this._assertIndex(C, this._columns),
              this._charCodes[C] === 10 ? 1 : this._columns[C] + 1)
        }
      }
      class f {
        constructor(C, r, u, o, c, l, m, N) {
          ;(this.originalStartLineNumber = C),
            (this.originalStartColumn = r),
            (this.originalEndLineNumber = u),
            (this.originalEndColumn = o),
            (this.modifiedStartLineNumber = c),
            (this.modifiedStartColumn = l),
            (this.modifiedEndLineNumber = m),
            (this.modifiedEndColumn = N)
        }
        static createFromDiffChange(C, r, u) {
          const o = r.getStartLineNumber(C.originalStart),
            c = r.getStartColumn(C.originalStart),
            l = r.getEndLineNumber(C.originalStart + C.originalLength - 1),
            m = r.getEndColumn(C.originalStart + C.originalLength - 1),
            N = u.getStartLineNumber(C.modifiedStart),
            A = u.getStartColumn(C.modifiedStart),
            M = u.getEndLineNumber(C.modifiedStart + C.modifiedLength - 1),
            k = u.getEndColumn(C.modifiedStart + C.modifiedLength - 1)
          return new f(o, c, l, m, N, A, M, k)
        }
      }
      function v(d) {
        if (d.length <= 1) return d
        const C = [d[0]]
        let r = C[0]
        for (let u = 1, o = d.length; u < o; u++) {
          const c = d[u],
            l = c.originalStart - (r.originalStart + r.originalLength),
            m = c.modifiedStart - (r.modifiedStart + r.modifiedLength)
          Math.min(l, m) < h
            ? ((r.originalLength = c.originalStart + c.originalLength - r.originalStart),
              (r.modifiedLength = c.modifiedStart + c.modifiedLength - r.modifiedStart))
            : (C.push(c), (r = c))
        }
        return C
      }
      class g {
        constructor(C, r, u, o, c) {
          ;(this.originalStartLineNumber = C),
            (this.originalEndLineNumber = r),
            (this.modifiedStartLineNumber = u),
            (this.modifiedEndLineNumber = o),
            (this.charChanges = c)
        }
        static createFromDiffResult(C, r, u, o, c, l, m) {
          let N, A, M, k, q
          if (
            (r.originalLength === 0
              ? ((N = u.getStartLineNumber(r.originalStart) - 1), (A = 0))
              : ((N = u.getStartLineNumber(r.originalStart)),
                (A = u.getEndLineNumber(r.originalStart + r.originalLength - 1))),
            r.modifiedLength === 0
              ? ((M = o.getStartLineNumber(r.modifiedStart) - 1), (k = 0))
              : ((M = o.getStartLineNumber(r.modifiedStart)),
                (k = o.getEndLineNumber(r.modifiedStart + r.modifiedLength - 1))),
            l &&
              r.originalLength > 0 &&
              r.originalLength < 20 &&
              r.modifiedLength > 0 &&
              r.modifiedLength < 20 &&
              c())
          ) {
            const I = u.createCharSequence(
                C,
                r.originalStart,
                r.originalStart + r.originalLength - 1
              ),
              B = o.createCharSequence(C, r.modifiedStart, r.modifiedStart + r.modifiedLength - 1)
            if (I.getElements().length > 0 && B.getElements().length > 0) {
              let H = w(I, B, c, !0).changes
              m && (H = v(H)), (q = [])
              for (let F = 0, U = H.length; F < U; F++) q.push(f.createFromDiffChange(H[F], I, B))
            }
          }
          return new g(N, A, M, k, q)
        }
      }
      class S {
        constructor(C, r, u) {
          ;(this.shouldComputeCharChanges = u.shouldComputeCharChanges),
            (this.shouldPostProcessCharChanges = u.shouldPostProcessCharChanges),
            (this.shouldIgnoreTrimWhitespace = u.shouldIgnoreTrimWhitespace),
            (this.shouldMakePrettyDiff = u.shouldMakePrettyDiff),
            (this.originalLines = C),
            (this.modifiedLines = r),
            (this.original = new e(C)),
            (this.modified = new e(r)),
            (this.continueLineDiff = _(u.maxComputationTime)),
            (this.continueCharDiff = _(
              u.maxComputationTime === 0 ? 0 : Math.min(u.maxComputationTime, 5e3)
            ))
        }
        computeDiff() {
          if (this.original.lines.length === 1 && this.original.lines[0].length === 0)
            return this.modified.lines.length === 1 && this.modified.lines[0].length === 0
              ? { quitEarly: !1, changes: [] }
              : {
                  quitEarly: !1,
                  changes: [
                    {
                      originalStartLineNumber: 1,
                      originalEndLineNumber: 1,
                      modifiedStartLineNumber: 1,
                      modifiedEndLineNumber: this.modified.lines.length,
                      charChanges: void 0,
                    },
                  ],
                }
          if (this.modified.lines.length === 1 && this.modified.lines[0].length === 0)
            return {
              quitEarly: !1,
              changes: [
                {
                  originalStartLineNumber: 1,
                  originalEndLineNumber: this.original.lines.length,
                  modifiedStartLineNumber: 1,
                  modifiedEndLineNumber: 1,
                  charChanges: void 0,
                },
              ],
            }
          const C = w(
              this.original,
              this.modified,
              this.continueLineDiff,
              this.shouldMakePrettyDiff
            ),
            r = C.changes,
            u = C.quitEarly
          if (this.shouldIgnoreTrimWhitespace) {
            const m = []
            for (let N = 0, A = r.length; N < A; N++)
              m.push(
                g.createFromDiffResult(
                  this.shouldIgnoreTrimWhitespace,
                  r[N],
                  this.original,
                  this.modified,
                  this.continueCharDiff,
                  this.shouldComputeCharChanges,
                  this.shouldPostProcessCharChanges
                )
              )
            return { quitEarly: u, changes: m }
          }
          const o = []
          let c = 0,
            l = 0
          for (let m = -1, N = r.length; m < N; m++) {
            const A = m + 1 < N ? r[m + 1] : null,
              M = A ? A.originalStart : this.originalLines.length,
              k = A ? A.modifiedStart : this.modifiedLines.length
            for (; c < M && l < k; ) {
              const q = this.originalLines[c],
                I = this.modifiedLines[l]
              if (q !== I) {
                {
                  let B = E(q, 1),
                    H = E(I, 1)
                  for (; B > 1 && H > 1; ) {
                    const F = q.charCodeAt(B - 2),
                      U = I.charCodeAt(H - 2)
                    if (F !== U) break
                    B--, H--
                  }
                  ;(B > 1 || H > 1) &&
                    this._pushTrimWhitespaceCharChange(o, c + 1, 1, B, l + 1, 1, H)
                }
                {
                  let B = y(q, 1),
                    H = y(I, 1)
                  const F = q.length + 1,
                    U = I.length + 1
                  for (; B < F && H < U; ) {
                    const T = q.charCodeAt(B - 1),
                      W = q.charCodeAt(H - 1)
                    if (T !== W) break
                    B++, H++
                  }
                  ;(B < F || H < U) &&
                    this._pushTrimWhitespaceCharChange(o, c + 1, B, F, l + 1, H, U)
                }
              }
              c++, l++
            }
            A &&
              (o.push(
                g.createFromDiffResult(
                  this.shouldIgnoreTrimWhitespace,
                  A,
                  this.original,
                  this.modified,
                  this.continueCharDiff,
                  this.shouldComputeCharChanges,
                  this.shouldPostProcessCharChanges
                )
              ),
              (c += A.originalLength),
              (l += A.modifiedLength))
          }
          return { quitEarly: u, changes: o }
        }
        _pushTrimWhitespaceCharChange(C, r, u, o, c, l, m) {
          if (this._mergeTrimWhitespaceCharChange(C, r, u, o, c, l, m)) return
          let N
          this.shouldComputeCharChanges && (N = [new f(r, u, r, o, c, l, c, m)]),
            C.push(new g(r, r, c, c, N))
        }
        _mergeTrimWhitespaceCharChange(C, r, u, o, c, l, m) {
          const N = C.length
          if (N === 0) return !1
          const A = C[N - 1]
          return A.originalEndLineNumber === 0 || A.modifiedEndLineNumber === 0
            ? !1
            : A.originalEndLineNumber === r && A.modifiedEndLineNumber === c
            ? (this.shouldComputeCharChanges &&
                A.charChanges &&
                A.charChanges.push(new f(r, u, r, o, c, l, c, m)),
              !0)
            : A.originalEndLineNumber + 1 === r && A.modifiedEndLineNumber + 1 === c
            ? ((A.originalEndLineNumber = r),
              (A.modifiedEndLineNumber = c),
              this.shouldComputeCharChanges &&
                A.charChanges &&
                A.charChanges.push(new f(r, u, r, o, c, l, c, m)),
              !0)
            : !1
        }
      }
      n.DiffComputer = S
      function E(d, C) {
        const r = i.firstNonWhitespaceIndex(d)
        return r === -1 ? C : r + 1
      }
      function y(d, C) {
        const r = i.lastNonWhitespaceIndex(d)
        return r === -1 ? C : r + 2
      }
      function _(d) {
        if (d === 0) return () => !0
        const C = Date.now()
        return () => Date.now() - C < d
      }
    }),
    Q(
      Y[40],
      X([0, 1, 10, 21, 6, 3, 2, 7, 38, 35, 36, 23]),
      function (x, n, R, D, i, s, p, L, h, a, w, e) {
        'use strict'
        Object.defineProperty(n, '__esModule', { value: !0 }),
          (n.LineSequence =
            n.getLineRangeMapping =
            n.lineRangeMappingFromRangeMappings =
            n.StandardLinesDiffComputer =
              void 0)
        class b {
          constructor() {
            ;(this.dynamicProgrammingDiffing = new h.DynamicProgrammingDiffing()),
              (this.myersDiffingAlgorithm = new w.MyersDiffAlgorithm())
          }
          computeDiff(m, N, A) {
            const M =
                A.maxComputationTimeMs === 0
                  ? L.InfiniteTimeout.instance
                  : new L.DateTimeout(A.maxComputationTimeMs),
              k = !A.ignoreTrimWhitespace,
              q = new Map()
            function I(re) {
              let se = q.get(re)
              return se === void 0 && ((se = q.size), q.set(re, se)), se
            }
            const B = m.map((re) => I(re.trim())),
              H = N.map((re) => I(re.trim())),
              F = new y(B, m),
              U = new y(H, N),
              T = (() =>
                F.length + U.length < 1500
                  ? this.dynamicProgrammingDiffing.compute(F, U, M, (re, se) =>
                      m[re] === N[se]
                        ? N[se].length === 0
                          ? 0.1
                          : 1 + Math.log(1 + N[se].length)
                        : 0.99
                    )
                  : this.myersDiffingAlgorithm.compute(F, U))()
            let W = T.diffs,
              t = T.hitTimeout
            W = (0, a.optimizeSequenceDiffs)(F, U, W)
            const te = [],
              ie = (re) => {
                if (!!k)
                  for (let se = 0; se < re; se++) {
                    const ge = ue + se,
                      Le = de + se
                    if (m[ge] !== N[Le]) {
                      const J = this.refineDiff(
                        m,
                        N,
                        new L.SequenceDiff(
                          new i.OffsetRange(ge, ge + 1),
                          new i.OffsetRange(Le, Le + 1)
                        ),
                        M,
                        k
                      )
                      for (const z of J.mappings) te.push(z)
                      J.hitTimeout && (t = !0)
                    }
                  }
              }
            let ue = 0,
              de = 0
            for (const re of W) {
              ;(0, R.assertFn)(() => re.seq1Range.start - ue === re.seq2Range.start - de)
              const se = re.seq1Range.start - ue
              ie(se), (ue = re.seq1Range.endExclusive), (de = re.seq2Range.endExclusive)
              const ge = this.refineDiff(m, N, re, M, k)
              ge.hitTimeout && (t = !0)
              for (const Le of ge.mappings) te.push(Le)
            }
            ie(m.length - ue)
            const Ce = g(te, m, N)
            return new e.LinesDiff(Ce, t)
          }
          refineDiff(m, N, A, M, k) {
            const q = new d(m, A.seq1Range, k),
              I = new d(N, A.seq2Range, k),
              B =
                q.length + I.length < 500
                  ? this.dynamicProgrammingDiffing.compute(q, I, M)
                  : this.myersDiffingAlgorithm.compute(q, I, M)
            let H = B.diffs
            return (
              (H = (0, a.optimizeSequenceDiffs)(q, I, H)),
              (H = f(q, I, H)),
              (H = (0, a.smoothenSequenceDiffs)(q, I, H)),
              {
                mappings: H.map(
                  (U) =>
                    new e.RangeMapping(q.translateRange(U.seq1Range), I.translateRange(U.seq2Range))
                ),
                hitTimeout: B.hitTimeout,
              }
            )
          }
        }
        n.StandardLinesDiffComputer = b
        function f(l, m, N) {
          const A = []
          let M
          function k() {
            if (!M) return
            const I = M.s1Range.length - M.deleted,
              B = M.s2Range.length - M.added
            Math.max(M.deleted, M.added) + (M.count - 1) > I &&
              A.push(new L.SequenceDiff(M.s1Range, M.s2Range)),
              (M = void 0)
          }
          for (const I of N) {
            let B = function (W, t) {
              var te, ie, ue, de
              if (!M || !M.s1Range.containsRange(W) || !M.s2Range.containsRange(t))
                if (M && !(M.s1Range.endExclusive < W.start && M.s2Range.endExclusive < t.start)) {
                  const se = i.OffsetRange.tryCreate(M.s1Range.endExclusive, W.start),
                    ge = i.OffsetRange.tryCreate(M.s2Range.endExclusive, t.start)
                  ;(M.deleted += (te = se?.length) !== null && te !== void 0 ? te : 0),
                    (M.added += (ie = ge?.length) !== null && ie !== void 0 ? ie : 0),
                    (M.s1Range = M.s1Range.join(W)),
                    (M.s2Range = M.s2Range.join(t))
                } else k(), (M = { added: 0, deleted: 0, count: 0, s1Range: W, s2Range: t })
              const Ce = W.intersect(I.seq1Range),
                re = t.intersect(I.seq2Range)
              M.count++,
                (M.deleted += (ue = Ce?.length) !== null && ue !== void 0 ? ue : 0),
                (M.added += (de = re?.length) !== null && de !== void 0 ? de : 0)
            }
            const H = l.findWordContaining(I.seq1Range.start - 1),
              F = m.findWordContaining(I.seq2Range.start - 1),
              U = l.findWordContaining(I.seq1Range.endExclusive),
              T = m.findWordContaining(I.seq2Range.endExclusive)
            H && U && F && T && H.equals(U) && F.equals(T)
              ? B(H, F)
              : (H && F && B(H, F), U && T && B(U, T))
          }
          return k(), v(N, A)
        }
        function v(l, m) {
          const N = []
          for (; l.length > 0 || m.length > 0; ) {
            const A = l[0],
              M = m[0]
            let k
            A && (!M || A.seq1Range.start < M.seq1Range.start) ? (k = l.shift()) : (k = m.shift()),
              N.length > 0 && N[N.length - 1].seq1Range.endExclusive >= k.seq1Range.start
                ? (N[N.length - 1] = N[N.length - 1].join(k))
                : N.push(k)
          }
          return N
        }
        function g(l, m, N) {
          const A = []
          for (const M of E(
            l.map((k) => S(k, m, N)),
            (k, q) =>
              k.originalRange.overlapOrTouch(q.originalRange) ||
              k.modifiedRange.overlapOrTouch(q.modifiedRange)
          )) {
            const k = M[0],
              q = M[M.length - 1]
            A.push(
              new e.LineRangeMapping(
                k.originalRange.join(q.originalRange),
                k.modifiedRange.join(q.modifiedRange),
                M.map((I) => I.innerChanges[0])
              )
            )
          }
          return (
            (0, R.assertFn)(() =>
              (0, R.checkAdjacentItems)(
                A,
                (M, k) =>
                  k.originalRange.startLineNumber - M.originalRange.endLineNumberExclusive ===
                    k.modifiedRange.startLineNumber - M.modifiedRange.endLineNumberExclusive &&
                  M.originalRange.endLineNumberExclusive < k.originalRange.startLineNumber &&
                  M.modifiedRange.endLineNumberExclusive < k.modifiedRange.startLineNumber
              )
            ),
            A
          )
        }
        n.lineRangeMappingFromRangeMappings = g
        function S(l, m, N) {
          let A = 0,
            M = 0
          l.modifiedRange.startColumn - 1 >= N[l.modifiedRange.startLineNumber - 1].length &&
            l.originalRange.startColumn - 1 >= m[l.originalRange.startLineNumber - 1].length &&
            (A = 1),
            l.modifiedRange.endColumn === 1 &&
              l.originalRange.endColumn === 1 &&
              l.originalRange.startLineNumber + A <= l.originalRange.endLineNumber &&
              l.modifiedRange.startLineNumber + A <= l.modifiedRange.endLineNumber &&
              (M = -1)
          const k = new D.LineRange(
              l.originalRange.startLineNumber + A,
              l.originalRange.endLineNumber + 1 + M
            ),
            q = new D.LineRange(
              l.modifiedRange.startLineNumber + A,
              l.modifiedRange.endLineNumber + 1 + M
            )
          return new e.LineRangeMapping(k, q, [l])
        }
        n.getLineRangeMapping = S
        function* E(l, m) {
          let N, A
          for (const M of l)
            A !== void 0 && m(A, M) ? N.push(M) : (N && (yield N), (N = [M])), (A = M)
          N && (yield N)
        }
        class y {
          constructor(m, N) {
            ;(this.trimmedHash = m), (this.lines = N)
          }
          getElement(m) {
            return this.trimmedHash[m]
          }
          get length() {
            return this.trimmedHash.length
          }
          getBoundaryScore(m) {
            const N = m === 0 ? 0 : _(this.lines[m - 1]),
              A = m === this.lines.length ? 0 : _(this.lines[m])
            return 1e3 - (N + A)
          }
        }
        n.LineSequence = y
        function _(l) {
          let m = 0
          for (; m < l.length && (l.charCodeAt(m) === 32 || l.charCodeAt(m) === 9); ) m++
          return m
        }
        class d {
          constructor(m, N, A) {
            ;(this.lines = m),
              (this.considerWhitespaceChanges = A),
              (this.elements = []),
              (this.firstCharOffsetByLineMinusOne = []),
              (this.offsetByLine = [])
            let M = !1
            N.start > 0 &&
              N.endExclusive >= m.length &&
              ((N = new i.OffsetRange(N.start - 1, N.endExclusive)), (M = !0)),
              (this.lineRange = N)
            for (let k = this.lineRange.start; k < this.lineRange.endExclusive; k++) {
              let q = m[k],
                I = 0
              if (M) (I = q.length), (q = ''), (M = !1)
              else if (!A) {
                const B = q.trimStart()
                ;(I = q.length - B.length), (q = B.trimEnd())
              }
              this.offsetByLine.push(I)
              for (let B = 0; B < q.length; B++) this.elements.push(q.charCodeAt(B))
              k < m.length - 1 &&
                (this.elements.push(
                  `
`.charCodeAt(0)
                ),
                (this.firstCharOffsetByLineMinusOne[k - this.lineRange.start] =
                  this.elements.length))
            }
            this.offsetByLine.push(0)
          }
          toString() {
            return `Slice: "${this.text}"`
          }
          get text() {
            return [...this.elements].map((m) => String.fromCharCode(m)).join('')
          }
          getElement(m) {
            return this.elements[m]
          }
          get length() {
            return this.elements.length
          }
          getBoundaryScore(m) {
            const N = o(m > 0 ? this.elements[m - 1] : -1),
              A = o(m < this.elements.length ? this.elements[m] : -1)
            if (N === 6 && A === 7) return 0
            let M = 0
            return N !== A && ((M += 10), A === 1 && (M += 1)), (M += u(N)), (M += u(A)), M
          }
          translateOffset(m) {
            if (this.lineRange.isEmpty) return new s.Position(this.lineRange.start + 1, 1)
            let N = 0,
              A = this.firstCharOffsetByLineMinusOne.length
            for (; N < A; ) {
              const k = Math.floor((N + A) / 2)
              this.firstCharOffsetByLineMinusOne[k] > m ? (A = k) : (N = k + 1)
            }
            const M = N === 0 ? 0 : this.firstCharOffsetByLineMinusOne[N - 1]
            return new s.Position(this.lineRange.start + N + 1, m - M + 1 + this.offsetByLine[N])
          }
          translateRange(m) {
            return p.Range.fromPositions(
              this.translateOffset(m.start),
              this.translateOffset(m.endExclusive)
            )
          }
          findWordContaining(m) {
            if (m < 0 || m >= this.elements.length || !C(this.elements[m])) return
            let N = m
            for (; N > 0 && C(this.elements[N - 1]); ) N--
            let A = m
            for (; A < this.elements.length && C(this.elements[A]); ) A++
            return new i.OffsetRange(N, A)
          }
        }
        function C(l) {
          return (l >= 97 && l <= 122) || (l >= 65 && l <= 90) || (l >= 48 && l <= 57)
        }
        const r = { [0]: 0, [1]: 0, [2]: 0, [3]: 10, [4]: 2, [5]: 3, [6]: 10, [7]: 10 }
        function u(l) {
          return r[l]
        }
        function o(l) {
          return l === 10
            ? 7
            : l === 13
            ? 6
            : c(l)
            ? 5
            : l >= 97 && l <= 122
            ? 0
            : l >= 65 && l <= 90
            ? 1
            : l >= 48 && l <= 57
            ? 2
            : l === -1
            ? 3
            : 4
        }
        function c(l) {
          return l === 32 || l === 9
        }
      }
    ),
    Q(Y[41], X([0, 1, 39, 40]), function (x, n, R, D) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.linesDiffComputers = void 0),
        (n.linesDiffComputers = {
          smart: new R.SmartLinesDiffComputer(),
          experimental: new D.StandardLinesDiffComputer(),
        })
    }),
    Q(Y[42], X([0, 1, 20]), function (x, n, R) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.computeLinks = n.LinkComputer = n.StateMachine = void 0)
      class D {
        constructor(b, f, v) {
          const g = new Uint8Array(b * f)
          for (let S = 0, E = b * f; S < E; S++) g[S] = v
          ;(this._data = g), (this.rows = b), (this.cols = f)
        }
        get(b, f) {
          return this._data[b * this.cols + f]
        }
        set(b, f, v) {
          this._data[b * this.cols + f] = v
        }
      }
      class i {
        constructor(b) {
          let f = 0,
            v = 0
          for (let S = 0, E = b.length; S < E; S++) {
            const [y, _, d] = b[S]
            _ > f && (f = _), y > v && (v = y), d > v && (v = d)
          }
          f++, v++
          const g = new D(v, f, 0)
          for (let S = 0, E = b.length; S < E; S++) {
            const [y, _, d] = b[S]
            g.set(y, _, d)
          }
          ;(this._states = g), (this._maxCharCode = f)
        }
        nextState(b, f) {
          return f < 0 || f >= this._maxCharCode ? 0 : this._states.get(b, f)
        }
      }
      n.StateMachine = i
      let s = null
      function p() {
        return (
          s === null &&
            (s = new i([
              [1, 104, 2],
              [1, 72, 2],
              [1, 102, 6],
              [1, 70, 6],
              [2, 116, 3],
              [2, 84, 3],
              [3, 116, 4],
              [3, 84, 4],
              [4, 112, 5],
              [4, 80, 5],
              [5, 115, 9],
              [5, 83, 9],
              [5, 58, 10],
              [6, 105, 7],
              [6, 73, 7],
              [7, 108, 8],
              [7, 76, 8],
              [8, 101, 9],
              [8, 69, 9],
              [9, 58, 10],
              [10, 47, 11],
              [11, 47, 12],
            ])),
          s
        )
      }
      let L = null
      function h() {
        if (L === null) {
          L = new R.CharacterClassifier(0)
          const e = ` 	<>'"\u3001\u3002\uFF61\uFF64\uFF0C\uFF0E\uFF1A\uFF1B\u2018\u3008\u300C\u300E\u3014\uFF08\uFF3B\uFF5B\uFF62\uFF63\uFF5D\uFF3D\uFF09\u3015\u300F\u300D\u3009\u2019\uFF40\uFF5E\u2026`
          for (let f = 0; f < e.length; f++) L.set(e.charCodeAt(f), 1)
          const b = '.,;:'
          for (let f = 0; f < b.length; f++) L.set(b.charCodeAt(f), 2)
        }
        return L
      }
      class a {
        static _createLink(b, f, v, g, S) {
          let E = S - 1
          do {
            const y = f.charCodeAt(E)
            if (b.get(y) !== 2) break
            E--
          } while (E > g)
          if (g > 0) {
            const y = f.charCodeAt(g - 1),
              _ = f.charCodeAt(E)
            ;((y === 40 && _ === 41) || (y === 91 && _ === 93) || (y === 123 && _ === 125)) && E--
          }
          return {
            range: { startLineNumber: v, startColumn: g + 1, endLineNumber: v, endColumn: E + 2 },
            url: f.substring(g, E + 1),
          }
        }
        static computeLinks(b, f = p()) {
          const v = h(),
            g = []
          for (let S = 1, E = b.getLineCount(); S <= E; S++) {
            const y = b.getLineContent(S),
              _ = y.length
            let d = 0,
              C = 0,
              r = 0,
              u = 1,
              o = !1,
              c = !1,
              l = !1,
              m = !1
            for (; d < _; ) {
              let N = !1
              const A = y.charCodeAt(d)
              if (u === 13) {
                let M
                switch (A) {
                  case 40:
                    ;(o = !0), (M = 0)
                    break
                  case 41:
                    M = o ? 0 : 1
                    break
                  case 91:
                    ;(l = !0), (c = !0), (M = 0)
                    break
                  case 93:
                    ;(l = !1), (M = c ? 0 : 1)
                    break
                  case 123:
                    ;(m = !0), (M = 0)
                    break
                  case 125:
                    M = m ? 0 : 1
                    break
                  case 39:
                  case 34:
                  case 96:
                    r === A ? (M = 1) : r === 39 || r === 34 || r === 96 ? (M = 0) : (M = 1)
                    break
                  case 42:
                    M = r === 42 ? 1 : 0
                    break
                  case 124:
                    M = r === 124 ? 1 : 0
                    break
                  case 32:
                    M = l ? 0 : 1
                    break
                  default:
                    M = v.get(A)
                }
                M === 1 && (g.push(a._createLink(v, y, S, C, d)), (N = !0))
              } else if (u === 12) {
                let M
                A === 91 ? ((c = !0), (M = 0)) : (M = v.get(A)), M === 1 ? (N = !0) : (u = 13)
              } else (u = f.nextState(u, A)), u === 0 && (N = !0)
              N && ((u = 1), (o = !1), (c = !1), (m = !1), (C = d + 1), (r = A)), d++
            }
            u === 13 && g.push(a._createLink(v, y, S, C, _))
          }
          return g
        }
      }
      n.LinkComputer = a
      function w(e) {
        return !e || typeof e.getLineCount != 'function' || typeof e.getLineContent != 'function'
          ? []
          : a.computeLinks(e)
      }
      n.computeLinks = w
    }),
    Q(Y[43], X([0, 1]), function (x, n) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }), (n.BasicInplaceReplace = void 0)
      class R {
        constructor() {
          this._defaultValueSet = [
            ['true', 'false'],
            ['True', 'False'],
            ['Private', 'Public', 'Friend', 'ReadOnly', 'Partial', 'Protected', 'WriteOnly'],
            ['public', 'protected', 'private'],
          ]
        }
        navigateValueSet(i, s, p, L, h) {
          if (i && s) {
            const a = this.doNavigateValueSet(s, h)
            if (a) return { range: i, value: a }
          }
          if (p && L) {
            const a = this.doNavigateValueSet(L, h)
            if (a) return { range: p, value: a }
          }
          return null
        }
        doNavigateValueSet(i, s) {
          const p = this.numberReplace(i, s)
          return p !== null ? p : this.textReplace(i, s)
        }
        numberReplace(i, s) {
          const p = Math.pow(10, i.length - (i.lastIndexOf('.') + 1))
          let L = Number(i)
          const h = parseFloat(i)
          return !isNaN(L) && !isNaN(h) && L === h
            ? L === 0 && !s
              ? null
              : ((L = Math.floor(L * p)), (L += s ? p : -p), String(L / p))
            : null
        }
        textReplace(i, s) {
          return this.valueSetsReplace(this._defaultValueSet, i, s)
        }
        valueSetsReplace(i, s, p) {
          let L = null
          for (let h = 0, a = i.length; L === null && h < a; h++)
            L = this.valueSetReplace(i[h], s, p)
          return L
        }
        valueSetReplace(i, s, p) {
          let L = i.indexOf(s)
          return L >= 0
            ? ((L += p ? 1 : -1), L < 0 ? (L = i.length - 1) : (L %= i.length), i[L])
            : null
        }
      }
      ;(R.INSTANCE = new R()), (n.BasicInplaceReplace = R)
    }),
    Q(Y[44], X([0, 1, 12]), function (x, n, R) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.shouldSynchronizeModel =
          n.ApplyEditsResult =
          n.SearchData =
          n.ValidAnnotatedEditOperation =
          n.isITextSnapshot =
          n.FindMatch =
          n.TextModelResolvedOptions =
          n.InjectedTextCursorStops =
          n.MinimapPosition =
          n.OverviewRulerLane =
            void 0)
      var D
      ;(function (f) {
        ;(f[(f.Left = 1)] = 'Left'),
          (f[(f.Center = 2)] = 'Center'),
          (f[(f.Right = 4)] = 'Right'),
          (f[(f.Full = 7)] = 'Full')
      })((D = n.OverviewRulerLane || (n.OverviewRulerLane = {})))
      var i
      ;(function (f) {
        ;(f[(f.Inline = 1)] = 'Inline'), (f[(f.Gutter = 2)] = 'Gutter')
      })((i = n.MinimapPosition || (n.MinimapPosition = {})))
      var s
      ;(function (f) {
        ;(f[(f.Both = 0)] = 'Both'),
          (f[(f.Right = 1)] = 'Right'),
          (f[(f.Left = 2)] = 'Left'),
          (f[(f.None = 3)] = 'None')
      })((s = n.InjectedTextCursorStops || (n.InjectedTextCursorStops = {})))
      class p {
        get originalIndentSize() {
          return this._indentSizeIsTabSize ? 'tabSize' : this.indentSize
        }
        constructor(v) {
          ;(this._textModelResolvedOptionsBrand = void 0),
            (this.tabSize = Math.max(1, v.tabSize | 0)),
            v.indentSize === 'tabSize'
              ? ((this.indentSize = this.tabSize), (this._indentSizeIsTabSize = !0))
              : ((this.indentSize = Math.max(1, v.indentSize | 0)),
                (this._indentSizeIsTabSize = !1)),
            (this.insertSpaces = Boolean(v.insertSpaces)),
            (this.defaultEOL = v.defaultEOL | 0),
            (this.trimAutoWhitespace = Boolean(v.trimAutoWhitespace)),
            (this.bracketPairColorizationOptions = v.bracketPairColorizationOptions)
        }
        equals(v) {
          return (
            this.tabSize === v.tabSize &&
            this._indentSizeIsTabSize === v._indentSizeIsTabSize &&
            this.indentSize === v.indentSize &&
            this.insertSpaces === v.insertSpaces &&
            this.defaultEOL === v.defaultEOL &&
            this.trimAutoWhitespace === v.trimAutoWhitespace &&
            (0, R.equals)(this.bracketPairColorizationOptions, v.bracketPairColorizationOptions)
          )
        }
        createChangeEvent(v) {
          return {
            tabSize: this.tabSize !== v.tabSize,
            indentSize: this.indentSize !== v.indentSize,
            insertSpaces: this.insertSpaces !== v.insertSpaces,
            trimAutoWhitespace: this.trimAutoWhitespace !== v.trimAutoWhitespace,
          }
        }
      }
      n.TextModelResolvedOptions = p
      class L {
        constructor(v, g) {
          ;(this._findMatchBrand = void 0), (this.range = v), (this.matches = g)
        }
      }
      n.FindMatch = L
      function h(f) {
        return f && typeof f.read == 'function'
      }
      n.isITextSnapshot = h
      class a {
        constructor(v, g, S, E, y, _) {
          ;(this.identifier = v),
            (this.range = g),
            (this.text = S),
            (this.forceMoveMarkers = E),
            (this.isAutoWhitespaceEdit = y),
            (this._isTracked = _)
        }
      }
      n.ValidAnnotatedEditOperation = a
      class w {
        constructor(v, g, S) {
          ;(this.regex = v), (this.wordSeparators = g), (this.simpleSearch = S)
        }
      }
      n.SearchData = w
      class e {
        constructor(v, g, S) {
          ;(this.reverseEdits = v), (this.changes = g), (this.trimAutoWhitespaceLineNumbers = S)
        }
      }
      n.ApplyEditsResult = e
      function b(f) {
        return !f.isTooLargeForSyncing() && !f.isForSimpleWidget
      }
      n.shouldSynchronizeModel = b
    }),
    Q(Y[45], X([0, 1, 26, 19]), function (x, n, R, D) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.PrefixSumIndexOfResult = n.ConstantTimePrefixSumComputer = n.PrefixSumComputer = void 0)
      class i {
        constructor(h) {
          ;(this.values = h),
            (this.prefixSum = new Uint32Array(h.length)),
            (this.prefixSumValidIndex = new Int32Array(1)),
            (this.prefixSumValidIndex[0] = -1)
        }
        insertValues(h, a) {
          h = (0, D.toUint32)(h)
          const w = this.values,
            e = this.prefixSum,
            b = a.length
          return b === 0
            ? !1
            : ((this.values = new Uint32Array(w.length + b)),
              this.values.set(w.subarray(0, h), 0),
              this.values.set(w.subarray(h), h + b),
              this.values.set(a, h),
              h - 1 < this.prefixSumValidIndex[0] && (this.prefixSumValidIndex[0] = h - 1),
              (this.prefixSum = new Uint32Array(this.values.length)),
              this.prefixSumValidIndex[0] >= 0 &&
                this.prefixSum.set(e.subarray(0, this.prefixSumValidIndex[0] + 1)),
              !0)
        }
        setValue(h, a) {
          return (
            (h = (0, D.toUint32)(h)),
            (a = (0, D.toUint32)(a)),
            this.values[h] === a
              ? !1
              : ((this.values[h] = a),
                h - 1 < this.prefixSumValidIndex[0] && (this.prefixSumValidIndex[0] = h - 1),
                !0)
          )
        }
        removeValues(h, a) {
          ;(h = (0, D.toUint32)(h)), (a = (0, D.toUint32)(a))
          const w = this.values,
            e = this.prefixSum
          if (h >= w.length) return !1
          const b = w.length - h
          return (
            a >= b && (a = b),
            a === 0
              ? !1
              : ((this.values = new Uint32Array(w.length - a)),
                this.values.set(w.subarray(0, h), 0),
                this.values.set(w.subarray(h + a), h),
                (this.prefixSum = new Uint32Array(this.values.length)),
                h - 1 < this.prefixSumValidIndex[0] && (this.prefixSumValidIndex[0] = h - 1),
                this.prefixSumValidIndex[0] >= 0 &&
                  this.prefixSum.set(e.subarray(0, this.prefixSumValidIndex[0] + 1)),
                !0)
          )
        }
        getTotalSum() {
          return this.values.length === 0 ? 0 : this._getPrefixSum(this.values.length - 1)
        }
        getPrefixSum(h) {
          return h < 0 ? 0 : ((h = (0, D.toUint32)(h)), this._getPrefixSum(h))
        }
        _getPrefixSum(h) {
          if (h <= this.prefixSumValidIndex[0]) return this.prefixSum[h]
          let a = this.prefixSumValidIndex[0] + 1
          a === 0 && ((this.prefixSum[0] = this.values[0]), a++),
            h >= this.values.length && (h = this.values.length - 1)
          for (let w = a; w <= h; w++) this.prefixSum[w] = this.prefixSum[w - 1] + this.values[w]
          return (
            (this.prefixSumValidIndex[0] = Math.max(this.prefixSumValidIndex[0], h)),
            this.prefixSum[h]
          )
        }
        getIndexOf(h) {
          ;(h = Math.floor(h)), this.getTotalSum()
          let a = 0,
            w = this.values.length - 1,
            e = 0,
            b = 0,
            f = 0
          for (; a <= w; )
            if (
              ((e = (a + (w - a) / 2) | 0),
              (b = this.prefixSum[e]),
              (f = b - this.values[e]),
              h < f)
            )
              w = e - 1
            else if (h >= b) a = e + 1
            else break
          return new p(e, h - f)
        }
      }
      n.PrefixSumComputer = i
      class s {
        constructor(h) {
          ;(this._values = h),
            (this._isValid = !1),
            (this._validEndIndex = -1),
            (this._prefixSum = []),
            (this._indexBySum = [])
        }
        getTotalSum() {
          return this._ensureValid(), this._indexBySum.length
        }
        getPrefixSum(h) {
          return this._ensureValid(), h === 0 ? 0 : this._prefixSum[h - 1]
        }
        getIndexOf(h) {
          this._ensureValid()
          const a = this._indexBySum[h],
            w = a > 0 ? this._prefixSum[a - 1] : 0
          return new p(a, h - w)
        }
        removeValues(h, a) {
          this._values.splice(h, a), this._invalidate(h)
        }
        insertValues(h, a) {
          ;(this._values = (0, R.arrayInsert)(this._values, h, a)), this._invalidate(h)
        }
        _invalidate(h) {
          ;(this._isValid = !1), (this._validEndIndex = Math.min(this._validEndIndex, h - 1))
        }
        _ensureValid() {
          if (!this._isValid) {
            for (let h = this._validEndIndex + 1, a = this._values.length; h < a; h++) {
              const w = this._values[h],
                e = h > 0 ? this._prefixSum[h - 1] : 0
              this._prefixSum[h] = e + w
              for (let b = 0; b < w; b++) this._indexBySum[e + b] = h
            }
            ;(this._prefixSum.length = this._values.length),
              (this._indexBySum.length = this._prefixSum[this._prefixSum.length - 1]),
              (this._isValid = !0),
              (this._validEndIndex = this._values.length - 1)
          }
        }
        setValue(h, a) {
          this._values[h] !== a && ((this._values[h] = a), this._invalidate(h))
        }
      }
      n.ConstantTimePrefixSumComputer = s
      class p {
        constructor(h, a) {
          ;(this.index = h),
            (this.remainder = a),
            (this._prefixSumIndexOfResultBrand = void 0),
            (this.index = h),
            (this.remainder = a)
        }
      }
      n.PrefixSumIndexOfResult = p
    }),
    Q(Y[46], X([0, 1, 5, 3, 45]), function (x, n, R, D, i) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }), (n.MirrorTextModel = void 0)
      class s {
        constructor(L, h, a, w) {
          ;(this._uri = L),
            (this._lines = h),
            (this._eol = a),
            (this._versionId = w),
            (this._lineStarts = null),
            (this._cachedTextValue = null)
        }
        dispose() {
          this._lines.length = 0
        }
        get version() {
          return this._versionId
        }
        getText() {
          return (
            this._cachedTextValue === null && (this._cachedTextValue = this._lines.join(this._eol)),
            this._cachedTextValue
          )
        }
        onEvents(L) {
          L.eol && L.eol !== this._eol && ((this._eol = L.eol), (this._lineStarts = null))
          const h = L.changes
          for (const a of h)
            this._acceptDeleteRange(a.range),
              this._acceptInsertText(
                new D.Position(a.range.startLineNumber, a.range.startColumn),
                a.text
              )
          ;(this._versionId = L.versionId), (this._cachedTextValue = null)
        }
        _ensureLineStarts() {
          if (!this._lineStarts) {
            const L = this._eol.length,
              h = this._lines.length,
              a = new Uint32Array(h)
            for (let w = 0; w < h; w++) a[w] = this._lines[w].length + L
            this._lineStarts = new i.PrefixSumComputer(a)
          }
        }
        _setLineText(L, h) {
          ;(this._lines[L] = h),
            this._lineStarts &&
              this._lineStarts.setValue(L, this._lines[L].length + this._eol.length)
        }
        _acceptDeleteRange(L) {
          if (L.startLineNumber === L.endLineNumber) {
            if (L.startColumn === L.endColumn) return
            this._setLineText(
              L.startLineNumber - 1,
              this._lines[L.startLineNumber - 1].substring(0, L.startColumn - 1) +
                this._lines[L.startLineNumber - 1].substring(L.endColumn - 1)
            )
            return
          }
          this._setLineText(
            L.startLineNumber - 1,
            this._lines[L.startLineNumber - 1].substring(0, L.startColumn - 1) +
              this._lines[L.endLineNumber - 1].substring(L.endColumn - 1)
          ),
            this._lines.splice(L.startLineNumber, L.endLineNumber - L.startLineNumber),
            this._lineStarts &&
              this._lineStarts.removeValues(L.startLineNumber, L.endLineNumber - L.startLineNumber)
        }
        _acceptInsertText(L, h) {
          if (h.length === 0) return
          const a = (0, R.splitLines)(h)
          if (a.length === 1) {
            this._setLineText(
              L.lineNumber - 1,
              this._lines[L.lineNumber - 1].substring(0, L.column - 1) +
                a[0] +
                this._lines[L.lineNumber - 1].substring(L.column - 1)
            )
            return
          }
          ;(a[a.length - 1] += this._lines[L.lineNumber - 1].substring(L.column - 1)),
            this._setLineText(
              L.lineNumber - 1,
              this._lines[L.lineNumber - 1].substring(0, L.column - 1) + a[0]
            )
          const w = new Uint32Array(a.length - 1)
          for (let e = 1; e < a.length; e++)
            this._lines.splice(L.lineNumber + e - 1, 0, a[e]),
              (w[e - 1] = a[e].length + this._eol.length)
          this._lineStarts && this._lineStarts.insertValues(L.lineNumber, w)
        }
      }
      n.MirrorTextModel = s
    }),
    Q(Y[47], X([0, 1, 5, 34, 3, 2, 44]), function (x, n, R, D, i, s, p) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.Searcher =
          n.isValidMatch =
          n.TextModelSearch =
          n.createFindMatch =
          n.isMultilineRegexSource =
          n.SearchParams =
            void 0)
      const L = 999
      class h {
        constructor(y, _, d, C) {
          ;(this.searchString = y),
            (this.isRegex = _),
            (this.matchCase = d),
            (this.wordSeparators = C)
        }
        parseSearchRequest() {
          if (this.searchString === '') return null
          let y
          this.isRegex
            ? (y = a(this.searchString))
            : (y =
                this.searchString.indexOf(`
`) >= 0)
          let _ = null
          try {
            _ = R.createRegExp(this.searchString, this.isRegex, {
              matchCase: this.matchCase,
              wholeWord: !1,
              multiline: y,
              global: !0,
              unicode: !0,
            })
          } catch {
            return null
          }
          if (!_) return null
          let d = !this.isRegex && !y
          return (
            d &&
              this.searchString.toLowerCase() !== this.searchString.toUpperCase() &&
              (d = this.matchCase),
            new p.SearchData(
              _,
              this.wordSeparators ? (0, D.getMapForWordSeparators)(this.wordSeparators) : null,
              d ? this.searchString : null
            )
          )
        }
      }
      n.SearchParams = h
      function a(E) {
        if (!E || E.length === 0) return !1
        for (let y = 0, _ = E.length; y < _; y++) {
          const d = E.charCodeAt(y)
          if (d === 10) return !0
          if (d === 92) {
            if ((y++, y >= _)) break
            const C = E.charCodeAt(y)
            if (C === 110 || C === 114 || C === 87) return !0
          }
        }
        return !1
      }
      n.isMultilineRegexSource = a
      function w(E, y, _) {
        if (!_) return new p.FindMatch(E, null)
        const d = []
        for (let C = 0, r = y.length; C < r; C++) d[C] = y[C]
        return new p.FindMatch(E, d)
      }
      n.createFindMatch = w
      class e {
        constructor(y) {
          const _ = []
          let d = 0
          for (let C = 0, r = y.length; C < r; C++) y.charCodeAt(C) === 10 && (_[d++] = C)
          this._lineFeedsOffsets = _
        }
        findLineFeedCountBeforeOffset(y) {
          const _ = this._lineFeedsOffsets
          let d = 0,
            C = _.length - 1
          if (C === -1 || y <= _[0]) return 0
          for (; d < C; ) {
            const r = d + (((C - d) / 2) >> 0)
            _[r] >= y ? (C = r - 1) : _[r + 1] >= y ? ((d = r), (C = r)) : (d = r + 1)
          }
          return d + 1
        }
      }
      class b {
        static findMatches(y, _, d, C, r) {
          const u = _.parseSearchRequest()
          return u
            ? u.regex.multiline
              ? this._doFindMatchesMultiline(y, d, new S(u.wordSeparators, u.regex), C, r)
              : this._doFindMatchesLineByLine(y, d, u, C, r)
            : []
        }
        static _getMultilineMatchRange(y, _, d, C, r, u) {
          let o,
            c = 0
          C ? ((c = C.findLineFeedCountBeforeOffset(r)), (o = _ + r + c)) : (o = _ + r)
          let l
          if (C) {
            const M = C.findLineFeedCountBeforeOffset(r + u.length) - c
            l = o + u.length + M
          } else l = o + u.length
          const m = y.getPositionAt(o),
            N = y.getPositionAt(l)
          return new s.Range(m.lineNumber, m.column, N.lineNumber, N.column)
        }
        static _doFindMatchesMultiline(y, _, d, C, r) {
          const u = y.getOffsetAt(_.getStartPosition()),
            o = y.getValueInRange(_, 1),
            c =
              y.getEOL() ===
              `\r
`
                ? new e(o)
                : null,
            l = []
          let m = 0,
            N
          for (d.reset(0); (N = d.next(o)); )
            if (
              ((l[m++] = w(this._getMultilineMatchRange(y, u, o, c, N.index, N[0]), N, C)), m >= r)
            )
              return l
          return l
        }
        static _doFindMatchesLineByLine(y, _, d, C, r) {
          const u = []
          let o = 0
          if (_.startLineNumber === _.endLineNumber) {
            const l = y
              .getLineContent(_.startLineNumber)
              .substring(_.startColumn - 1, _.endColumn - 1)
            return (
              (o = this._findMatchesInLine(d, l, _.startLineNumber, _.startColumn - 1, o, u, C, r)),
              u
            )
          }
          const c = y.getLineContent(_.startLineNumber).substring(_.startColumn - 1)
          o = this._findMatchesInLine(d, c, _.startLineNumber, _.startColumn - 1, o, u, C, r)
          for (let l = _.startLineNumber + 1; l < _.endLineNumber && o < r; l++)
            o = this._findMatchesInLine(d, y.getLineContent(l), l, 0, o, u, C, r)
          if (o < r) {
            const l = y.getLineContent(_.endLineNumber).substring(0, _.endColumn - 1)
            o = this._findMatchesInLine(d, l, _.endLineNumber, 0, o, u, C, r)
          }
          return u
        }
        static _findMatchesInLine(y, _, d, C, r, u, o, c) {
          const l = y.wordSeparators
          if (!o && y.simpleSearch) {
            const A = y.simpleSearch,
              M = A.length,
              k = _.length
            let q = -M
            for (; (q = _.indexOf(A, q + M)) !== -1; )
              if (
                (!l || g(l, _, k, q, M)) &&
                ((u[r++] = new p.FindMatch(new s.Range(d, q + 1 + C, d, q + 1 + M + C), null)),
                r >= c)
              )
                return r
            return r
          }
          const m = new S(y.wordSeparators, y.regex)
          let N
          m.reset(0)
          do
            if (
              ((N = m.next(_)),
              N &&
                ((u[r++] = w(
                  new s.Range(d, N.index + 1 + C, d, N.index + 1 + N[0].length + C),
                  N,
                  o
                )),
                r >= c))
            )
              return r
          while (N)
          return r
        }
        static findNextMatch(y, _, d, C) {
          const r = _.parseSearchRequest()
          if (!r) return null
          const u = new S(r.wordSeparators, r.regex)
          return r.regex.multiline
            ? this._doFindNextMatchMultiline(y, d, u, C)
            : this._doFindNextMatchLineByLine(y, d, u, C)
        }
        static _doFindNextMatchMultiline(y, _, d, C) {
          const r = new i.Position(_.lineNumber, 1),
            u = y.getOffsetAt(r),
            o = y.getLineCount(),
            c = y.getValueInRange(new s.Range(r.lineNumber, r.column, o, y.getLineMaxColumn(o)), 1),
            l =
              y.getEOL() ===
              `\r
`
                ? new e(c)
                : null
          d.reset(_.column - 1)
          const m = d.next(c)
          return m
            ? w(this._getMultilineMatchRange(y, u, c, l, m.index, m[0]), m, C)
            : _.lineNumber !== 1 || _.column !== 1
            ? this._doFindNextMatchMultiline(y, new i.Position(1, 1), d, C)
            : null
        }
        static _doFindNextMatchLineByLine(y, _, d, C) {
          const r = y.getLineCount(),
            u = _.lineNumber,
            o = y.getLineContent(u),
            c = this._findFirstMatchInLine(d, o, u, _.column, C)
          if (c) return c
          for (let l = 1; l <= r; l++) {
            const m = (u + l - 1) % r,
              N = y.getLineContent(m + 1),
              A = this._findFirstMatchInLine(d, N, m + 1, 1, C)
            if (A) return A
          }
          return null
        }
        static _findFirstMatchInLine(y, _, d, C, r) {
          y.reset(C - 1)
          const u = y.next(_)
          return u ? w(new s.Range(d, u.index + 1, d, u.index + 1 + u[0].length), u, r) : null
        }
        static findPreviousMatch(y, _, d, C) {
          const r = _.parseSearchRequest()
          if (!r) return null
          const u = new S(r.wordSeparators, r.regex)
          return r.regex.multiline
            ? this._doFindPreviousMatchMultiline(y, d, u, C)
            : this._doFindPreviousMatchLineByLine(y, d, u, C)
        }
        static _doFindPreviousMatchMultiline(y, _, d, C) {
          const r = this._doFindMatchesMultiline(
            y,
            new s.Range(1, 1, _.lineNumber, _.column),
            d,
            C,
            10 * L
          )
          if (r.length > 0) return r[r.length - 1]
          const u = y.getLineCount()
          return _.lineNumber !== u || _.column !== y.getLineMaxColumn(u)
            ? this._doFindPreviousMatchMultiline(y, new i.Position(u, y.getLineMaxColumn(u)), d, C)
            : null
        }
        static _doFindPreviousMatchLineByLine(y, _, d, C) {
          const r = y.getLineCount(),
            u = _.lineNumber,
            o = y.getLineContent(u).substring(0, _.column - 1),
            c = this._findLastMatchInLine(d, o, u, C)
          if (c) return c
          for (let l = 1; l <= r; l++) {
            const m = (r + u - l - 1) % r,
              N = y.getLineContent(m + 1),
              A = this._findLastMatchInLine(d, N, m + 1, C)
            if (A) return A
          }
          return null
        }
        static _findLastMatchInLine(y, _, d, C) {
          let r = null,
            u
          for (y.reset(0); (u = y.next(_)); )
            r = w(new s.Range(d, u.index + 1, d, u.index + 1 + u[0].length), u, C)
          return r
        }
      }
      n.TextModelSearch = b
      function f(E, y, _, d, C) {
        if (d === 0) return !0
        const r = y.charCodeAt(d - 1)
        if (E.get(r) !== 0 || r === 13 || r === 10) return !0
        if (C > 0) {
          const u = y.charCodeAt(d)
          if (E.get(u) !== 0) return !0
        }
        return !1
      }
      function v(E, y, _, d, C) {
        if (d + C === _) return !0
        const r = y.charCodeAt(d + C)
        if (E.get(r) !== 0 || r === 13 || r === 10) return !0
        if (C > 0) {
          const u = y.charCodeAt(d + C - 1)
          if (E.get(u) !== 0) return !0
        }
        return !1
      }
      function g(E, y, _, d, C) {
        return f(E, y, _, d, C) && v(E, y, _, d, C)
      }
      n.isValidMatch = g
      class S {
        constructor(y, _) {
          ;(this._wordSeparators = y),
            (this._searchRegex = _),
            (this._prevMatchStartIndex = -1),
            (this._prevMatchLength = 0)
        }
        reset(y) {
          ;(this._searchRegex.lastIndex = y),
            (this._prevMatchStartIndex = -1),
            (this._prevMatchLength = 0)
        }
        next(y) {
          const _ = y.length
          let d
          do {
            if (
              this._prevMatchStartIndex + this._prevMatchLength === _ ||
              ((d = this._searchRegex.exec(y)), !d)
            )
              return null
            const C = d.index,
              r = d[0].length
            if (C === this._prevMatchStartIndex && r === this._prevMatchLength) {
              if (r === 0) {
                R.getNextCodePoint(y, _, this._searchRegex.lastIndex) > 65535
                  ? (this._searchRegex.lastIndex += 2)
                  : (this._searchRegex.lastIndex += 1)
                continue
              }
              return null
            }
            if (
              ((this._prevMatchStartIndex = C),
              (this._prevMatchLength = r),
              !this._wordSeparators || g(this._wordSeparators, y, _, C, r))
            )
              return d
          } while (d)
          return null
        }
      }
      n.Searcher = S
    }),
    Q(Y[48], X([0, 1, 2, 47, 5, 10, 22]), function (x, n, R, D, i, s, p) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.UnicodeTextModelHighlighter = void 0)
      class L {
        static computeUnicodeHighlights(b, f, v) {
          const g = v ? v.startLineNumber : 1,
            S = v ? v.endLineNumber : b.getLineCount(),
            E = new a(f),
            y = E.getCandidateCodePoints()
          let _
          y === 'allNonBasicAscii'
            ? (_ = new RegExp('[^\\t\\n\\r\\x20-\\x7E]', 'g'))
            : (_ = new RegExp(`${h(Array.from(y))}`, 'g'))
          const d = new D.Searcher(null, _),
            C = []
          let r = !1,
            u,
            o = 0,
            c = 0,
            l = 0
          e: for (let m = g, N = S; m <= N; m++) {
            const A = b.getLineContent(m),
              M = A.length
            d.reset(0)
            do
              if (((u = d.next(A)), u)) {
                let k = u.index,
                  q = u.index + u[0].length
                if (k > 0) {
                  const F = A.charCodeAt(k - 1)
                  i.isHighSurrogate(F) && k--
                }
                if (q + 1 < M) {
                  const F = A.charCodeAt(q - 1)
                  i.isHighSurrogate(F) && q++
                }
                const I = A.substring(k, q)
                let B = (0, p.getWordAtText)(k + 1, p.DEFAULT_WORD_REGEXP, A, 0)
                B && B.endColumn <= k + 1 && (B = null)
                const H = E.shouldHighlightNonBasicASCII(I, B ? B.word : null)
                if (H !== 0) {
                  H === 3 ? o++ : H === 2 ? c++ : H === 1 ? l++ : (0, s.assertNever)(H)
                  const F = 1e3
                  if (C.length >= F) {
                    r = !0
                    break e
                  }
                  C.push(new R.Range(m, k + 1, m, q + 1))
                }
              }
            while (u)
          }
          return {
            ranges: C,
            hasMore: r,
            ambiguousCharacterCount: o,
            invisibleCharacterCount: c,
            nonBasicAsciiCharacterCount: l,
          }
        }
        static computeUnicodeHighlightReason(b, f) {
          const v = new a(f)
          switch (v.shouldHighlightNonBasicASCII(b, null)) {
            case 0:
              return null
            case 2:
              return { kind: 1 }
            case 3: {
              const S = b.codePointAt(0),
                E = v.ambiguousCharacters.getPrimaryConfusable(S),
                y = i.AmbiguousCharacters.getLocales().filter(
                  (_) =>
                    !i.AmbiguousCharacters.getInstance(
                      new Set([...f.allowedLocales, _])
                    ).isAmbiguous(S)
                )
              return { kind: 0, confusableWith: String.fromCodePoint(E), notAmbiguousInLocales: y }
            }
            case 1:
              return { kind: 2 }
          }
        }
      }
      n.UnicodeTextModelHighlighter = L
      function h(e, b) {
        return `[${i.escapeRegExpCharacters(e.map((v) => String.fromCodePoint(v)).join(''))}]`
      }
      class a {
        constructor(b) {
          ;(this.options = b),
            (this.allowedCodePoints = new Set(b.allowedCodePoints)),
            (this.ambiguousCharacters = i.AmbiguousCharacters.getInstance(
              new Set(b.allowedLocales)
            ))
        }
        getCandidateCodePoints() {
          if (this.options.nonBasicASCII) return 'allNonBasicAscii'
          const b = new Set()
          if (this.options.invisibleCharacters)
            for (const f of i.InvisibleCharacters.codePoints) w(String.fromCodePoint(f)) || b.add(f)
          if (this.options.ambiguousCharacters)
            for (const f of this.ambiguousCharacters.getConfusableCodePoints()) b.add(f)
          for (const f of this.allowedCodePoints) b.delete(f)
          return b
        }
        shouldHighlightNonBasicASCII(b, f) {
          const v = b.codePointAt(0)
          if (this.allowedCodePoints.has(v)) return 0
          if (this.options.nonBasicASCII) return 1
          let g = !1,
            S = !1
          if (f)
            for (const E of f) {
              const y = E.codePointAt(0),
                _ = i.isBasicASCII(E)
              ;(g = g || _),
                !_ &&
                  !this.ambiguousCharacters.isAmbiguous(y) &&
                  !i.InvisibleCharacters.isInvisibleCharacter(y) &&
                  (S = !0)
            }
          return !g && S
            ? 0
            : this.options.invisibleCharacters &&
              !w(b) &&
              i.InvisibleCharacters.isInvisibleCharacter(v)
            ? 2
            : this.options.ambiguousCharacters && this.ambiguousCharacters.isAmbiguous(v)
            ? 3
            : 0
        }
      }
      function w(e) {
        return (
          e === ' ' ||
          e ===
            `
` ||
          e === '	'
        )
      }
    }),
    Q(Y[49], X([0, 1]), function (x, n) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.WrappingIndent =
          n.TrackedRangeStickiness =
          n.TextEditorCursorStyle =
          n.TextEditorCursorBlinkingStyle =
          n.SymbolTag =
          n.SymbolKind =
          n.SignatureHelpTriggerKind =
          n.SelectionDirection =
          n.ScrollbarVisibility =
          n.ScrollType =
          n.RenderMinimap =
          n.RenderLineNumbersType =
          n.PositionAffinity =
          n.OverviewRulerLane =
          n.OverlayWidgetPositionPreference =
          n.MouseTargetType =
          n.MinimapPosition =
          n.MarkerTag =
          n.MarkerSeverity =
          n.KeyCode =
          n.InlineCompletionTriggerKind =
          n.InlayHintKind =
          n.InjectedTextCursorStops =
          n.IndentAction =
          n.EndOfLineSequence =
          n.EndOfLinePreference =
          n.EditorOption =
          n.EditorAutoIndentStrategy =
          n.DocumentHighlightKind =
          n.DefaultEndOfLine =
          n.CursorChangeReason =
          n.ContentWidgetPositionPreference =
          n.CompletionTriggerKind =
          n.CompletionItemTag =
          n.CompletionItemKind =
          n.CompletionItemInsertTextRule =
          n.CodeActionTriggerType =
          n.AccessibilitySupport =
            void 0)
      var R
      ;(function (t) {
        ;(t[(t.Unknown = 0)] = 'Unknown'),
          (t[(t.Disabled = 1)] = 'Disabled'),
          (t[(t.Enabled = 2)] = 'Enabled')
      })((R = n.AccessibilitySupport || (n.AccessibilitySupport = {})))
      var D
      ;(function (t) {
        ;(t[(t.Invoke = 1)] = 'Invoke'), (t[(t.Auto = 2)] = 'Auto')
      })((D = n.CodeActionTriggerType || (n.CodeActionTriggerType = {})))
      var i
      ;(function (t) {
        ;(t[(t.None = 0)] = 'None'),
          (t[(t.KeepWhitespace = 1)] = 'KeepWhitespace'),
          (t[(t.InsertAsSnippet = 4)] = 'InsertAsSnippet')
      })((i = n.CompletionItemInsertTextRule || (n.CompletionItemInsertTextRule = {})))
      var s
      ;(function (t) {
        ;(t[(t.Method = 0)] = 'Method'),
          (t[(t.Function = 1)] = 'Function'),
          (t[(t.Constructor = 2)] = 'Constructor'),
          (t[(t.Field = 3)] = 'Field'),
          (t[(t.Variable = 4)] = 'Variable'),
          (t[(t.Class = 5)] = 'Class'),
          (t[(t.Struct = 6)] = 'Struct'),
          (t[(t.Interface = 7)] = 'Interface'),
          (t[(t.Module = 8)] = 'Module'),
          (t[(t.Property = 9)] = 'Property'),
          (t[(t.Event = 10)] = 'Event'),
          (t[(t.Operator = 11)] = 'Operator'),
          (t[(t.Unit = 12)] = 'Unit'),
          (t[(t.Value = 13)] = 'Value'),
          (t[(t.Constant = 14)] = 'Constant'),
          (t[(t.Enum = 15)] = 'Enum'),
          (t[(t.EnumMember = 16)] = 'EnumMember'),
          (t[(t.Keyword = 17)] = 'Keyword'),
          (t[(t.Text = 18)] = 'Text'),
          (t[(t.Color = 19)] = 'Color'),
          (t[(t.File = 20)] = 'File'),
          (t[(t.Reference = 21)] = 'Reference'),
          (t[(t.Customcolor = 22)] = 'Customcolor'),
          (t[(t.Folder = 23)] = 'Folder'),
          (t[(t.TypeParameter = 24)] = 'TypeParameter'),
          (t[(t.User = 25)] = 'User'),
          (t[(t.Issue = 26)] = 'Issue'),
          (t[(t.Snippet = 27)] = 'Snippet')
      })((s = n.CompletionItemKind || (n.CompletionItemKind = {})))
      var p
      ;(function (t) {
        t[(t.Deprecated = 1)] = 'Deprecated'
      })((p = n.CompletionItemTag || (n.CompletionItemTag = {})))
      var L
      ;(function (t) {
        ;(t[(t.Invoke = 0)] = 'Invoke'),
          (t[(t.TriggerCharacter = 1)] = 'TriggerCharacter'),
          (t[(t.TriggerForIncompleteCompletions = 2)] = 'TriggerForIncompleteCompletions')
      })((L = n.CompletionTriggerKind || (n.CompletionTriggerKind = {})))
      var h
      ;(function (t) {
        ;(t[(t.EXACT = 0)] = 'EXACT'), (t[(t.ABOVE = 1)] = 'ABOVE'), (t[(t.BELOW = 2)] = 'BELOW')
      })((h = n.ContentWidgetPositionPreference || (n.ContentWidgetPositionPreference = {})))
      var a
      ;(function (t) {
        ;(t[(t.NotSet = 0)] = 'NotSet'),
          (t[(t.ContentFlush = 1)] = 'ContentFlush'),
          (t[(t.RecoverFromMarkers = 2)] = 'RecoverFromMarkers'),
          (t[(t.Explicit = 3)] = 'Explicit'),
          (t[(t.Paste = 4)] = 'Paste'),
          (t[(t.Undo = 5)] = 'Undo'),
          (t[(t.Redo = 6)] = 'Redo')
      })((a = n.CursorChangeReason || (n.CursorChangeReason = {})))
      var w
      ;(function (t) {
        ;(t[(t.LF = 1)] = 'LF'), (t[(t.CRLF = 2)] = 'CRLF')
      })((w = n.DefaultEndOfLine || (n.DefaultEndOfLine = {})))
      var e
      ;(function (t) {
        ;(t[(t.Text = 0)] = 'Text'), (t[(t.Read = 1)] = 'Read'), (t[(t.Write = 2)] = 'Write')
      })((e = n.DocumentHighlightKind || (n.DocumentHighlightKind = {})))
      var b
      ;(function (t) {
        ;(t[(t.None = 0)] = 'None'),
          (t[(t.Keep = 1)] = 'Keep'),
          (t[(t.Brackets = 2)] = 'Brackets'),
          (t[(t.Advanced = 3)] = 'Advanced'),
          (t[(t.Full = 4)] = 'Full')
      })((b = n.EditorAutoIndentStrategy || (n.EditorAutoIndentStrategy = {})))
      var f
      ;(function (t) {
        ;(t[(t.acceptSuggestionOnCommitCharacter = 0)] = 'acceptSuggestionOnCommitCharacter'),
          (t[(t.acceptSuggestionOnEnter = 1)] = 'acceptSuggestionOnEnter'),
          (t[(t.accessibilitySupport = 2)] = 'accessibilitySupport'),
          (t[(t.accessibilityPageSize = 3)] = 'accessibilityPageSize'),
          (t[(t.ariaLabel = 4)] = 'ariaLabel'),
          (t[(t.autoClosingBrackets = 5)] = 'autoClosingBrackets'),
          (t[(t.screenReaderAnnounceInlineSuggestion = 6)] =
            'screenReaderAnnounceInlineSuggestion'),
          (t[(t.autoClosingDelete = 7)] = 'autoClosingDelete'),
          (t[(t.autoClosingOvertype = 8)] = 'autoClosingOvertype'),
          (t[(t.autoClosingQuotes = 9)] = 'autoClosingQuotes'),
          (t[(t.autoIndent = 10)] = 'autoIndent'),
          (t[(t.automaticLayout = 11)] = 'automaticLayout'),
          (t[(t.autoSurround = 12)] = 'autoSurround'),
          (t[(t.bracketPairColorization = 13)] = 'bracketPairColorization'),
          (t[(t.guides = 14)] = 'guides'),
          (t[(t.codeLens = 15)] = 'codeLens'),
          (t[(t.codeLensFontFamily = 16)] = 'codeLensFontFamily'),
          (t[(t.codeLensFontSize = 17)] = 'codeLensFontSize'),
          (t[(t.colorDecorators = 18)] = 'colorDecorators'),
          (t[(t.colorDecoratorsLimit = 19)] = 'colorDecoratorsLimit'),
          (t[(t.columnSelection = 20)] = 'columnSelection'),
          (t[(t.comments = 21)] = 'comments'),
          (t[(t.contextmenu = 22)] = 'contextmenu'),
          (t[(t.copyWithSyntaxHighlighting = 23)] = 'copyWithSyntaxHighlighting'),
          (t[(t.cursorBlinking = 24)] = 'cursorBlinking'),
          (t[(t.cursorSmoothCaretAnimation = 25)] = 'cursorSmoothCaretAnimation'),
          (t[(t.cursorStyle = 26)] = 'cursorStyle'),
          (t[(t.cursorSurroundingLines = 27)] = 'cursorSurroundingLines'),
          (t[(t.cursorSurroundingLinesStyle = 28)] = 'cursorSurroundingLinesStyle'),
          (t[(t.cursorWidth = 29)] = 'cursorWidth'),
          (t[(t.disableLayerHinting = 30)] = 'disableLayerHinting'),
          (t[(t.disableMonospaceOptimizations = 31)] = 'disableMonospaceOptimizations'),
          (t[(t.domReadOnly = 32)] = 'domReadOnly'),
          (t[(t.dragAndDrop = 33)] = 'dragAndDrop'),
          (t[(t.dropIntoEditor = 34)] = 'dropIntoEditor'),
          (t[(t.emptySelectionClipboard = 35)] = 'emptySelectionClipboard'),
          (t[(t.experimentalWhitespaceRendering = 36)] = 'experimentalWhitespaceRendering'),
          (t[(t.extraEditorClassName = 37)] = 'extraEditorClassName'),
          (t[(t.fastScrollSensitivity = 38)] = 'fastScrollSensitivity'),
          (t[(t.find = 39)] = 'find'),
          (t[(t.fixedOverflowWidgets = 40)] = 'fixedOverflowWidgets'),
          (t[(t.folding = 41)] = 'folding'),
          (t[(t.foldingStrategy = 42)] = 'foldingStrategy'),
          (t[(t.foldingHighlight = 43)] = 'foldingHighlight'),
          (t[(t.foldingImportsByDefault = 44)] = 'foldingImportsByDefault'),
          (t[(t.foldingMaximumRegions = 45)] = 'foldingMaximumRegions'),
          (t[(t.unfoldOnClickAfterEndOfLine = 46)] = 'unfoldOnClickAfterEndOfLine'),
          (t[(t.fontFamily = 47)] = 'fontFamily'),
          (t[(t.fontInfo = 48)] = 'fontInfo'),
          (t[(t.fontLigatures = 49)] = 'fontLigatures'),
          (t[(t.fontSize = 50)] = 'fontSize'),
          (t[(t.fontWeight = 51)] = 'fontWeight'),
          (t[(t.fontVariations = 52)] = 'fontVariations'),
          (t[(t.formatOnPaste = 53)] = 'formatOnPaste'),
          (t[(t.formatOnType = 54)] = 'formatOnType'),
          (t[(t.glyphMargin = 55)] = 'glyphMargin'),
          (t[(t.gotoLocation = 56)] = 'gotoLocation'),
          (t[(t.hideCursorInOverviewRuler = 57)] = 'hideCursorInOverviewRuler'),
          (t[(t.hover = 58)] = 'hover'),
          (t[(t.inDiffEditor = 59)] = 'inDiffEditor'),
          (t[(t.inlineSuggest = 60)] = 'inlineSuggest'),
          (t[(t.letterSpacing = 61)] = 'letterSpacing'),
          (t[(t.lightbulb = 62)] = 'lightbulb'),
          (t[(t.lineDecorationsWidth = 63)] = 'lineDecorationsWidth'),
          (t[(t.lineHeight = 64)] = 'lineHeight'),
          (t[(t.lineNumbers = 65)] = 'lineNumbers'),
          (t[(t.lineNumbersMinChars = 66)] = 'lineNumbersMinChars'),
          (t[(t.linkedEditing = 67)] = 'linkedEditing'),
          (t[(t.links = 68)] = 'links'),
          (t[(t.matchBrackets = 69)] = 'matchBrackets'),
          (t[(t.minimap = 70)] = 'minimap'),
          (t[(t.mouseStyle = 71)] = 'mouseStyle'),
          (t[(t.mouseWheelScrollSensitivity = 72)] = 'mouseWheelScrollSensitivity'),
          (t[(t.mouseWheelZoom = 73)] = 'mouseWheelZoom'),
          (t[(t.multiCursorMergeOverlapping = 74)] = 'multiCursorMergeOverlapping'),
          (t[(t.multiCursorModifier = 75)] = 'multiCursorModifier'),
          (t[(t.multiCursorPaste = 76)] = 'multiCursorPaste'),
          (t[(t.multiCursorLimit = 77)] = 'multiCursorLimit'),
          (t[(t.occurrencesHighlight = 78)] = 'occurrencesHighlight'),
          (t[(t.overviewRulerBorder = 79)] = 'overviewRulerBorder'),
          (t[(t.overviewRulerLanes = 80)] = 'overviewRulerLanes'),
          (t[(t.padding = 81)] = 'padding'),
          (t[(t.parameterHints = 82)] = 'parameterHints'),
          (t[(t.peekWidgetDefaultFocus = 83)] = 'peekWidgetDefaultFocus'),
          (t[(t.definitionLinkOpensInPeek = 84)] = 'definitionLinkOpensInPeek'),
          (t[(t.quickSuggestions = 85)] = 'quickSuggestions'),
          (t[(t.quickSuggestionsDelay = 86)] = 'quickSuggestionsDelay'),
          (t[(t.readOnly = 87)] = 'readOnly'),
          (t[(t.renameOnType = 88)] = 'renameOnType'),
          (t[(t.renderControlCharacters = 89)] = 'renderControlCharacters'),
          (t[(t.renderFinalNewline = 90)] = 'renderFinalNewline'),
          (t[(t.renderLineHighlight = 91)] = 'renderLineHighlight'),
          (t[(t.renderLineHighlightOnlyWhenFocus = 92)] = 'renderLineHighlightOnlyWhenFocus'),
          (t[(t.renderValidationDecorations = 93)] = 'renderValidationDecorations'),
          (t[(t.renderWhitespace = 94)] = 'renderWhitespace'),
          (t[(t.revealHorizontalRightPadding = 95)] = 'revealHorizontalRightPadding'),
          (t[(t.roundedSelection = 96)] = 'roundedSelection'),
          (t[(t.rulers = 97)] = 'rulers'),
          (t[(t.scrollbar = 98)] = 'scrollbar'),
          (t[(t.scrollBeyondLastColumn = 99)] = 'scrollBeyondLastColumn'),
          (t[(t.scrollBeyondLastLine = 100)] = 'scrollBeyondLastLine'),
          (t[(t.scrollPredominantAxis = 101)] = 'scrollPredominantAxis'),
          (t[(t.selectionClipboard = 102)] = 'selectionClipboard'),
          (t[(t.selectionHighlight = 103)] = 'selectionHighlight'),
          (t[(t.selectOnLineNumbers = 104)] = 'selectOnLineNumbers'),
          (t[(t.showFoldingControls = 105)] = 'showFoldingControls'),
          (t[(t.showUnused = 106)] = 'showUnused'),
          (t[(t.snippetSuggestions = 107)] = 'snippetSuggestions'),
          (t[(t.smartSelect = 108)] = 'smartSelect'),
          (t[(t.smoothScrolling = 109)] = 'smoothScrolling'),
          (t[(t.stickyScroll = 110)] = 'stickyScroll'),
          (t[(t.stickyTabStops = 111)] = 'stickyTabStops'),
          (t[(t.stopRenderingLineAfter = 112)] = 'stopRenderingLineAfter'),
          (t[(t.suggest = 113)] = 'suggest'),
          (t[(t.suggestFontSize = 114)] = 'suggestFontSize'),
          (t[(t.suggestLineHeight = 115)] = 'suggestLineHeight'),
          (t[(t.suggestOnTriggerCharacters = 116)] = 'suggestOnTriggerCharacters'),
          (t[(t.suggestSelection = 117)] = 'suggestSelection'),
          (t[(t.tabCompletion = 118)] = 'tabCompletion'),
          (t[(t.tabIndex = 119)] = 'tabIndex'),
          (t[(t.unicodeHighlighting = 120)] = 'unicodeHighlighting'),
          (t[(t.unusualLineTerminators = 121)] = 'unusualLineTerminators'),
          (t[(t.useShadowDOM = 122)] = 'useShadowDOM'),
          (t[(t.useTabStops = 123)] = 'useTabStops'),
          (t[(t.wordBreak = 124)] = 'wordBreak'),
          (t[(t.wordSeparators = 125)] = 'wordSeparators'),
          (t[(t.wordWrap = 126)] = 'wordWrap'),
          (t[(t.wordWrapBreakAfterCharacters = 127)] = 'wordWrapBreakAfterCharacters'),
          (t[(t.wordWrapBreakBeforeCharacters = 128)] = 'wordWrapBreakBeforeCharacters'),
          (t[(t.wordWrapColumn = 129)] = 'wordWrapColumn'),
          (t[(t.wordWrapOverride1 = 130)] = 'wordWrapOverride1'),
          (t[(t.wordWrapOverride2 = 131)] = 'wordWrapOverride2'),
          (t[(t.wrappingIndent = 132)] = 'wrappingIndent'),
          (t[(t.wrappingStrategy = 133)] = 'wrappingStrategy'),
          (t[(t.showDeprecated = 134)] = 'showDeprecated'),
          (t[(t.inlayHints = 135)] = 'inlayHints'),
          (t[(t.editorClassName = 136)] = 'editorClassName'),
          (t[(t.pixelRatio = 137)] = 'pixelRatio'),
          (t[(t.tabFocusMode = 138)] = 'tabFocusMode'),
          (t[(t.layoutInfo = 139)] = 'layoutInfo'),
          (t[(t.wrappingInfo = 140)] = 'wrappingInfo')
      })((f = n.EditorOption || (n.EditorOption = {})))
      var v
      ;(function (t) {
        ;(t[(t.TextDefined = 0)] = 'TextDefined'),
          (t[(t.LF = 1)] = 'LF'),
          (t[(t.CRLF = 2)] = 'CRLF')
      })((v = n.EndOfLinePreference || (n.EndOfLinePreference = {})))
      var g
      ;(function (t) {
        ;(t[(t.LF = 0)] = 'LF'), (t[(t.CRLF = 1)] = 'CRLF')
      })((g = n.EndOfLineSequence || (n.EndOfLineSequence = {})))
      var S
      ;(function (t) {
        ;(t[(t.None = 0)] = 'None'),
          (t[(t.Indent = 1)] = 'Indent'),
          (t[(t.IndentOutdent = 2)] = 'IndentOutdent'),
          (t[(t.Outdent = 3)] = 'Outdent')
      })((S = n.IndentAction || (n.IndentAction = {})))
      var E
      ;(function (t) {
        ;(t[(t.Both = 0)] = 'Both'),
          (t[(t.Right = 1)] = 'Right'),
          (t[(t.Left = 2)] = 'Left'),
          (t[(t.None = 3)] = 'None')
      })((E = n.InjectedTextCursorStops || (n.InjectedTextCursorStops = {})))
      var y
      ;(function (t) {
        ;(t[(t.Type = 1)] = 'Type'), (t[(t.Parameter = 2)] = 'Parameter')
      })((y = n.InlayHintKind || (n.InlayHintKind = {})))
      var _
      ;(function (t) {
        ;(t[(t.Automatic = 0)] = 'Automatic'), (t[(t.Explicit = 1)] = 'Explicit')
      })((_ = n.InlineCompletionTriggerKind || (n.InlineCompletionTriggerKind = {})))
      var d
      ;(function (t) {
        ;(t[(t.DependsOnKbLayout = -1)] = 'DependsOnKbLayout'),
          (t[(t.Unknown = 0)] = 'Unknown'),
          (t[(t.Backspace = 1)] = 'Backspace'),
          (t[(t.Tab = 2)] = 'Tab'),
          (t[(t.Enter = 3)] = 'Enter'),
          (t[(t.Shift = 4)] = 'Shift'),
          (t[(t.Ctrl = 5)] = 'Ctrl'),
          (t[(t.Alt = 6)] = 'Alt'),
          (t[(t.PauseBreak = 7)] = 'PauseBreak'),
          (t[(t.CapsLock = 8)] = 'CapsLock'),
          (t[(t.Escape = 9)] = 'Escape'),
          (t[(t.Space = 10)] = 'Space'),
          (t[(t.PageUp = 11)] = 'PageUp'),
          (t[(t.PageDown = 12)] = 'PageDown'),
          (t[(t.End = 13)] = 'End'),
          (t[(t.Home = 14)] = 'Home'),
          (t[(t.LeftArrow = 15)] = 'LeftArrow'),
          (t[(t.UpArrow = 16)] = 'UpArrow'),
          (t[(t.RightArrow = 17)] = 'RightArrow'),
          (t[(t.DownArrow = 18)] = 'DownArrow'),
          (t[(t.Insert = 19)] = 'Insert'),
          (t[(t.Delete = 20)] = 'Delete'),
          (t[(t.Digit0 = 21)] = 'Digit0'),
          (t[(t.Digit1 = 22)] = 'Digit1'),
          (t[(t.Digit2 = 23)] = 'Digit2'),
          (t[(t.Digit3 = 24)] = 'Digit3'),
          (t[(t.Digit4 = 25)] = 'Digit4'),
          (t[(t.Digit5 = 26)] = 'Digit5'),
          (t[(t.Digit6 = 27)] = 'Digit6'),
          (t[(t.Digit7 = 28)] = 'Digit7'),
          (t[(t.Digit8 = 29)] = 'Digit8'),
          (t[(t.Digit9 = 30)] = 'Digit9'),
          (t[(t.KeyA = 31)] = 'KeyA'),
          (t[(t.KeyB = 32)] = 'KeyB'),
          (t[(t.KeyC = 33)] = 'KeyC'),
          (t[(t.KeyD = 34)] = 'KeyD'),
          (t[(t.KeyE = 35)] = 'KeyE'),
          (t[(t.KeyF = 36)] = 'KeyF'),
          (t[(t.KeyG = 37)] = 'KeyG'),
          (t[(t.KeyH = 38)] = 'KeyH'),
          (t[(t.KeyI = 39)] = 'KeyI'),
          (t[(t.KeyJ = 40)] = 'KeyJ'),
          (t[(t.KeyK = 41)] = 'KeyK'),
          (t[(t.KeyL = 42)] = 'KeyL'),
          (t[(t.KeyM = 43)] = 'KeyM'),
          (t[(t.KeyN = 44)] = 'KeyN'),
          (t[(t.KeyO = 45)] = 'KeyO'),
          (t[(t.KeyP = 46)] = 'KeyP'),
          (t[(t.KeyQ = 47)] = 'KeyQ'),
          (t[(t.KeyR = 48)] = 'KeyR'),
          (t[(t.KeyS = 49)] = 'KeyS'),
          (t[(t.KeyT = 50)] = 'KeyT'),
          (t[(t.KeyU = 51)] = 'KeyU'),
          (t[(t.KeyV = 52)] = 'KeyV'),
          (t[(t.KeyW = 53)] = 'KeyW'),
          (t[(t.KeyX = 54)] = 'KeyX'),
          (t[(t.KeyY = 55)] = 'KeyY'),
          (t[(t.KeyZ = 56)] = 'KeyZ'),
          (t[(t.Meta = 57)] = 'Meta'),
          (t[(t.ContextMenu = 58)] = 'ContextMenu'),
          (t[(t.F1 = 59)] = 'F1'),
          (t[(t.F2 = 60)] = 'F2'),
          (t[(t.F3 = 61)] = 'F3'),
          (t[(t.F4 = 62)] = 'F4'),
          (t[(t.F5 = 63)] = 'F5'),
          (t[(t.F6 = 64)] = 'F6'),
          (t[(t.F7 = 65)] = 'F7'),
          (t[(t.F8 = 66)] = 'F8'),
          (t[(t.F9 = 67)] = 'F9'),
          (t[(t.F10 = 68)] = 'F10'),
          (t[(t.F11 = 69)] = 'F11'),
          (t[(t.F12 = 70)] = 'F12'),
          (t[(t.F13 = 71)] = 'F13'),
          (t[(t.F14 = 72)] = 'F14'),
          (t[(t.F15 = 73)] = 'F15'),
          (t[(t.F16 = 74)] = 'F16'),
          (t[(t.F17 = 75)] = 'F17'),
          (t[(t.F18 = 76)] = 'F18'),
          (t[(t.F19 = 77)] = 'F19'),
          (t[(t.NumLock = 78)] = 'NumLock'),
          (t[(t.ScrollLock = 79)] = 'ScrollLock'),
          (t[(t.Semicolon = 80)] = 'Semicolon'),
          (t[(t.Equal = 81)] = 'Equal'),
          (t[(t.Comma = 82)] = 'Comma'),
          (t[(t.Minus = 83)] = 'Minus'),
          (t[(t.Period = 84)] = 'Period'),
          (t[(t.Slash = 85)] = 'Slash'),
          (t[(t.Backquote = 86)] = 'Backquote'),
          (t[(t.BracketLeft = 87)] = 'BracketLeft'),
          (t[(t.Backslash = 88)] = 'Backslash'),
          (t[(t.BracketRight = 89)] = 'BracketRight'),
          (t[(t.Quote = 90)] = 'Quote'),
          (t[(t.OEM_8 = 91)] = 'OEM_8'),
          (t[(t.IntlBackslash = 92)] = 'IntlBackslash'),
          (t[(t.Numpad0 = 93)] = 'Numpad0'),
          (t[(t.Numpad1 = 94)] = 'Numpad1'),
          (t[(t.Numpad2 = 95)] = 'Numpad2'),
          (t[(t.Numpad3 = 96)] = 'Numpad3'),
          (t[(t.Numpad4 = 97)] = 'Numpad4'),
          (t[(t.Numpad5 = 98)] = 'Numpad5'),
          (t[(t.Numpad6 = 99)] = 'Numpad6'),
          (t[(t.Numpad7 = 100)] = 'Numpad7'),
          (t[(t.Numpad8 = 101)] = 'Numpad8'),
          (t[(t.Numpad9 = 102)] = 'Numpad9'),
          (t[(t.NumpadMultiply = 103)] = 'NumpadMultiply'),
          (t[(t.NumpadAdd = 104)] = 'NumpadAdd'),
          (t[(t.NUMPAD_SEPARATOR = 105)] = 'NUMPAD_SEPARATOR'),
          (t[(t.NumpadSubtract = 106)] = 'NumpadSubtract'),
          (t[(t.NumpadDecimal = 107)] = 'NumpadDecimal'),
          (t[(t.NumpadDivide = 108)] = 'NumpadDivide'),
          (t[(t.KEY_IN_COMPOSITION = 109)] = 'KEY_IN_COMPOSITION'),
          (t[(t.ABNT_C1 = 110)] = 'ABNT_C1'),
          (t[(t.ABNT_C2 = 111)] = 'ABNT_C2'),
          (t[(t.AudioVolumeMute = 112)] = 'AudioVolumeMute'),
          (t[(t.AudioVolumeUp = 113)] = 'AudioVolumeUp'),
          (t[(t.AudioVolumeDown = 114)] = 'AudioVolumeDown'),
          (t[(t.BrowserSearch = 115)] = 'BrowserSearch'),
          (t[(t.BrowserHome = 116)] = 'BrowserHome'),
          (t[(t.BrowserBack = 117)] = 'BrowserBack'),
          (t[(t.BrowserForward = 118)] = 'BrowserForward'),
          (t[(t.MediaTrackNext = 119)] = 'MediaTrackNext'),
          (t[(t.MediaTrackPrevious = 120)] = 'MediaTrackPrevious'),
          (t[(t.MediaStop = 121)] = 'MediaStop'),
          (t[(t.MediaPlayPause = 122)] = 'MediaPlayPause'),
          (t[(t.LaunchMediaPlayer = 123)] = 'LaunchMediaPlayer'),
          (t[(t.LaunchMail = 124)] = 'LaunchMail'),
          (t[(t.LaunchApp2 = 125)] = 'LaunchApp2'),
          (t[(t.Clear = 126)] = 'Clear'),
          (t[(t.MAX_VALUE = 127)] = 'MAX_VALUE')
      })((d = n.KeyCode || (n.KeyCode = {})))
      var C
      ;(function (t) {
        ;(t[(t.Hint = 1)] = 'Hint'),
          (t[(t.Info = 2)] = 'Info'),
          (t[(t.Warning = 4)] = 'Warning'),
          (t[(t.Error = 8)] = 'Error')
      })((C = n.MarkerSeverity || (n.MarkerSeverity = {})))
      var r
      ;(function (t) {
        ;(t[(t.Unnecessary = 1)] = 'Unnecessary'), (t[(t.Deprecated = 2)] = 'Deprecated')
      })((r = n.MarkerTag || (n.MarkerTag = {})))
      var u
      ;(function (t) {
        ;(t[(t.Inline = 1)] = 'Inline'), (t[(t.Gutter = 2)] = 'Gutter')
      })((u = n.MinimapPosition || (n.MinimapPosition = {})))
      var o
      ;(function (t) {
        ;(t[(t.UNKNOWN = 0)] = 'UNKNOWN'),
          (t[(t.TEXTAREA = 1)] = 'TEXTAREA'),
          (t[(t.GUTTER_GLYPH_MARGIN = 2)] = 'GUTTER_GLYPH_MARGIN'),
          (t[(t.GUTTER_LINE_NUMBERS = 3)] = 'GUTTER_LINE_NUMBERS'),
          (t[(t.GUTTER_LINE_DECORATIONS = 4)] = 'GUTTER_LINE_DECORATIONS'),
          (t[(t.GUTTER_VIEW_ZONE = 5)] = 'GUTTER_VIEW_ZONE'),
          (t[(t.CONTENT_TEXT = 6)] = 'CONTENT_TEXT'),
          (t[(t.CONTENT_EMPTY = 7)] = 'CONTENT_EMPTY'),
          (t[(t.CONTENT_VIEW_ZONE = 8)] = 'CONTENT_VIEW_ZONE'),
          (t[(t.CONTENT_WIDGET = 9)] = 'CONTENT_WIDGET'),
          (t[(t.OVERVIEW_RULER = 10)] = 'OVERVIEW_RULER'),
          (t[(t.SCROLLBAR = 11)] = 'SCROLLBAR'),
          (t[(t.OVERLAY_WIDGET = 12)] = 'OVERLAY_WIDGET'),
          (t[(t.OUTSIDE_EDITOR = 13)] = 'OUTSIDE_EDITOR')
      })((o = n.MouseTargetType || (n.MouseTargetType = {})))
      var c
      ;(function (t) {
        ;(t[(t.TOP_RIGHT_CORNER = 0)] = 'TOP_RIGHT_CORNER'),
          (t[(t.BOTTOM_RIGHT_CORNER = 1)] = 'BOTTOM_RIGHT_CORNER'),
          (t[(t.TOP_CENTER = 2)] = 'TOP_CENTER')
      })((c = n.OverlayWidgetPositionPreference || (n.OverlayWidgetPositionPreference = {})))
      var l
      ;(function (t) {
        ;(t[(t.Left = 1)] = 'Left'),
          (t[(t.Center = 2)] = 'Center'),
          (t[(t.Right = 4)] = 'Right'),
          (t[(t.Full = 7)] = 'Full')
      })((l = n.OverviewRulerLane || (n.OverviewRulerLane = {})))
      var m
      ;(function (t) {
        ;(t[(t.Left = 0)] = 'Left'),
          (t[(t.Right = 1)] = 'Right'),
          (t[(t.None = 2)] = 'None'),
          (t[(t.LeftOfInjectedText = 3)] = 'LeftOfInjectedText'),
          (t[(t.RightOfInjectedText = 4)] = 'RightOfInjectedText')
      })((m = n.PositionAffinity || (n.PositionAffinity = {})))
      var N
      ;(function (t) {
        ;(t[(t.Off = 0)] = 'Off'),
          (t[(t.On = 1)] = 'On'),
          (t[(t.Relative = 2)] = 'Relative'),
          (t[(t.Interval = 3)] = 'Interval'),
          (t[(t.Custom = 4)] = 'Custom')
      })((N = n.RenderLineNumbersType || (n.RenderLineNumbersType = {})))
      var A
      ;(function (t) {
        ;(t[(t.None = 0)] = 'None'), (t[(t.Text = 1)] = 'Text'), (t[(t.Blocks = 2)] = 'Blocks')
      })((A = n.RenderMinimap || (n.RenderMinimap = {})))
      var M
      ;(function (t) {
        ;(t[(t.Smooth = 0)] = 'Smooth'), (t[(t.Immediate = 1)] = 'Immediate')
      })((M = n.ScrollType || (n.ScrollType = {})))
      var k
      ;(function (t) {
        ;(t[(t.Auto = 1)] = 'Auto'),
          (t[(t.Hidden = 2)] = 'Hidden'),
          (t[(t.Visible = 3)] = 'Visible')
      })((k = n.ScrollbarVisibility || (n.ScrollbarVisibility = {})))
      var q
      ;(function (t) {
        ;(t[(t.LTR = 0)] = 'LTR'), (t[(t.RTL = 1)] = 'RTL')
      })((q = n.SelectionDirection || (n.SelectionDirection = {})))
      var I
      ;(function (t) {
        ;(t[(t.Invoke = 1)] = 'Invoke'),
          (t[(t.TriggerCharacter = 2)] = 'TriggerCharacter'),
          (t[(t.ContentChange = 3)] = 'ContentChange')
      })((I = n.SignatureHelpTriggerKind || (n.SignatureHelpTriggerKind = {})))
      var B
      ;(function (t) {
        ;(t[(t.File = 0)] = 'File'),
          (t[(t.Module = 1)] = 'Module'),
          (t[(t.Namespace = 2)] = 'Namespace'),
          (t[(t.Package = 3)] = 'Package'),
          (t[(t.Class = 4)] = 'Class'),
          (t[(t.Method = 5)] = 'Method'),
          (t[(t.Property = 6)] = 'Property'),
          (t[(t.Field = 7)] = 'Field'),
          (t[(t.Constructor = 8)] = 'Constructor'),
          (t[(t.Enum = 9)] = 'Enum'),
          (t[(t.Interface = 10)] = 'Interface'),
          (t[(t.Function = 11)] = 'Function'),
          (t[(t.Variable = 12)] = 'Variable'),
          (t[(t.Constant = 13)] = 'Constant'),
          (t[(t.String = 14)] = 'String'),
          (t[(t.Number = 15)] = 'Number'),
          (t[(t.Boolean = 16)] = 'Boolean'),
          (t[(t.Array = 17)] = 'Array'),
          (t[(t.Object = 18)] = 'Object'),
          (t[(t.Key = 19)] = 'Key'),
          (t[(t.Null = 20)] = 'Null'),
          (t[(t.EnumMember = 21)] = 'EnumMember'),
          (t[(t.Struct = 22)] = 'Struct'),
          (t[(t.Event = 23)] = 'Event'),
          (t[(t.Operator = 24)] = 'Operator'),
          (t[(t.TypeParameter = 25)] = 'TypeParameter')
      })((B = n.SymbolKind || (n.SymbolKind = {})))
      var H
      ;(function (t) {
        t[(t.Deprecated = 1)] = 'Deprecated'
      })((H = n.SymbolTag || (n.SymbolTag = {})))
      var F
      ;(function (t) {
        ;(t[(t.Hidden = 0)] = 'Hidden'),
          (t[(t.Blink = 1)] = 'Blink'),
          (t[(t.Smooth = 2)] = 'Smooth'),
          (t[(t.Phase = 3)] = 'Phase'),
          (t[(t.Expand = 4)] = 'Expand'),
          (t[(t.Solid = 5)] = 'Solid')
      })((F = n.TextEditorCursorBlinkingStyle || (n.TextEditorCursorBlinkingStyle = {})))
      var U
      ;(function (t) {
        ;(t[(t.Line = 1)] = 'Line'),
          (t[(t.Block = 2)] = 'Block'),
          (t[(t.Underline = 3)] = 'Underline'),
          (t[(t.LineThin = 4)] = 'LineThin'),
          (t[(t.BlockOutline = 5)] = 'BlockOutline'),
          (t[(t.UnderlineThin = 6)] = 'UnderlineThin')
      })((U = n.TextEditorCursorStyle || (n.TextEditorCursorStyle = {})))
      var T
      ;(function (t) {
        ;(t[(t.AlwaysGrowsWhenTypingAtEdges = 0)] = 'AlwaysGrowsWhenTypingAtEdges'),
          (t[(t.NeverGrowsWhenTypingAtEdges = 1)] = 'NeverGrowsWhenTypingAtEdges'),
          (t[(t.GrowsOnlyWhenTypingBefore = 2)] = 'GrowsOnlyWhenTypingBefore'),
          (t[(t.GrowsOnlyWhenTypingAfter = 3)] = 'GrowsOnlyWhenTypingAfter')
      })((T = n.TrackedRangeStickiness || (n.TrackedRangeStickiness = {})))
      var W
      ;(function (t) {
        ;(t[(t.None = 0)] = 'None'),
          (t[(t.Same = 1)] = 'Same'),
          (t[(t.Indent = 2)] = 'Indent'),
          (t[(t.DeepIndent = 3)] = 'DeepIndent')
      })((W = n.WrappingIndent || (n.WrappingIndent = {})))
    }),
    Q(Y[50], X([25, 57]), function (x, n) {
      return x.create('vs/base/common/platform', n)
    }),
    Q(Y[8], X([0, 1, 50]), function (x, n, R) {
      'use strict'
      var D
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.isAndroid =
          n.isEdge =
          n.isSafari =
          n.isFirefox =
          n.isChrome =
          n.isLittleEndian =
          n.OS =
          n.setTimeout0 =
          n.setTimeout0IsFaster =
          n.language =
          n.userAgent =
          n.isMobile =
          n.isIOS =
          n.isWebWorker =
          n.isWeb =
          n.isNative =
          n.isLinux =
          n.isMacintosh =
          n.isWindows =
          n.globals =
          n.LANGUAGE_DEFAULT =
            void 0),
        (n.LANGUAGE_DEFAULT = 'en')
      let i = !1,
        s = !1,
        p = !1,
        L = !1,
        h = !1,
        a = !1,
        w = !1,
        e = !1,
        b = !1,
        f = !1,
        v,
        g = n.LANGUAGE_DEFAULT,
        S = n.LANGUAGE_DEFAULT,
        E,
        y
      n.globals = typeof self == 'object' ? self : typeof global == 'object' ? global : {}
      let _
      typeof n.globals.vscode < 'u' && typeof n.globals.vscode.process < 'u'
        ? (_ = n.globals.vscode.process)
        : typeof process < 'u' && (_ = process)
      const d =
          typeof ((D = _?.versions) === null || D === void 0 ? void 0 : D.electron) == 'string',
        C = d && _?.type === 'renderer'
      if (typeof navigator == 'object' && !C)
        (y = navigator.userAgent),
          (i = y.indexOf('Windows') >= 0),
          (s = y.indexOf('Macintosh') >= 0),
          (e =
            (y.indexOf('Macintosh') >= 0 || y.indexOf('iPad') >= 0 || y.indexOf('iPhone') >= 0) &&
            !!navigator.maxTouchPoints &&
            navigator.maxTouchPoints > 0),
          (p = y.indexOf('Linux') >= 0),
          (f = y?.indexOf('Mobi') >= 0),
          (a = !0),
          (v = R.getConfiguredDefaultLocale(R.localize(0, null)) || n.LANGUAGE_DEFAULT),
          (g = v),
          (S = navigator.language)
      else if (typeof _ == 'object') {
        ;(i = _.platform === 'win32'),
          (s = _.platform === 'darwin'),
          (p = _.platform === 'linux'),
          (L = p && !!_.env.SNAP && !!_.env.SNAP_REVISION),
          (w = d),
          (b = !!_.env.CI || !!_.env.BUILD_ARTIFACTSTAGINGDIRECTORY),
          (v = n.LANGUAGE_DEFAULT),
          (g = n.LANGUAGE_DEFAULT)
        const l = _.env.VSCODE_NLS_CONFIG
        if (l)
          try {
            const m = JSON.parse(l),
              N = m.availableLanguages['*']
            ;(v = m.locale),
              (S = m.osLocale),
              (g = N || n.LANGUAGE_DEFAULT),
              (E = m._translationsConfigFile)
          } catch {}
        h = !0
      } else console.error('Unable to resolve platform.')
      let r = 0
      s ? (r = 1) : i ? (r = 3) : p && (r = 2),
        (n.isWindows = i),
        (n.isMacintosh = s),
        (n.isLinux = p),
        (n.isNative = h),
        (n.isWeb = a),
        (n.isWebWorker = a && typeof n.globals.importScripts == 'function'),
        (n.isIOS = e),
        (n.isMobile = f),
        (n.userAgent = y),
        (n.language = g),
        (n.setTimeout0IsFaster =
          typeof n.globals.postMessage == 'function' && !n.globals.importScripts),
        (n.setTimeout0 = (() => {
          if (n.setTimeout0IsFaster) {
            const l = []
            n.globals.addEventListener('message', (N) => {
              if (N.data && N.data.vscodeScheduleAsyncWork)
                for (let A = 0, M = l.length; A < M; A++) {
                  const k = l[A]
                  if (k.id === N.data.vscodeScheduleAsyncWork) {
                    l.splice(A, 1), k.callback()
                    return
                  }
                }
            })
            let m = 0
            return (N) => {
              const A = ++m
              l.push({ id: A, callback: N }),
                n.globals.postMessage({ vscodeScheduleAsyncWork: A }, '*')
            }
          }
          return (l) => setTimeout(l)
        })()),
        (n.OS = s || e ? 2 : i ? 1 : 3)
      let u = !0,
        o = !1
      function c() {
        if (!o) {
          o = !0
          const l = new Uint8Array(2)
          ;(l[0] = 1), (l[1] = 2), (u = new Uint16Array(l.buffer)[0] === (2 << 8) + 1)
        }
        return u
      }
      ;(n.isLittleEndian = c),
        (n.isChrome = !!(n.userAgent && n.userAgent.indexOf('Chrome') >= 0)),
        (n.isFirefox = !!(n.userAgent && n.userAgent.indexOf('Firefox') >= 0)),
        (n.isSafari = !!(!n.isChrome && n.userAgent && n.userAgent.indexOf('Safari') >= 0)),
        (n.isEdge = !!(n.userAgent && n.userAgent.indexOf('Edg/') >= 0)),
        (n.isAndroid = !!(n.userAgent && n.userAgent.indexOf('Android') >= 0))
    }),
    Q(Y[51], X([0, 1, 8]), function (x, n, R) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }), (n.platform = n.env = n.cwd = void 0)
      let D
      if (typeof R.globals.vscode < 'u' && typeof R.globals.vscode.process < 'u') {
        const i = R.globals.vscode.process
        D = {
          get platform() {
            return i.platform
          },
          get arch() {
            return i.arch
          },
          get env() {
            return i.env
          },
          cwd() {
            return i.cwd()
          },
        }
      } else
        typeof process < 'u'
          ? (D = {
              get platform() {
                return process.platform
              },
              get arch() {
                return process.arch
              },
              get env() {
                return process.env
              },
              cwd() {
                return process.env.VSCODE_CWD || process.cwd()
              },
            })
          : (D = {
              get platform() {
                return R.isWindows ? 'win32' : R.isMacintosh ? 'darwin' : 'linux'
              },
              get arch() {},
              get env() {
                return {}
              },
              cwd() {
                return '/'
              },
            })
      ;(n.cwd = D.cwd), (n.env = D.env), (n.platform = D.platform)
    }),
    Q(Y[52], X([0, 1, 51]), function (x, n, R) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.sep =
          n.extname =
          n.basename =
          n.dirname =
          n.relative =
          n.resolve =
          n.normalize =
          n.posix =
          n.win32 =
            void 0)
      const D = 65,
        i = 97,
        s = 90,
        p = 122,
        L = 46,
        h = 47,
        a = 92,
        w = 58,
        e = 63
      class b extends Error {
        constructor(u, o, c) {
          let l
          typeof o == 'string' && o.indexOf('not ') === 0
            ? ((l = 'must not be'), (o = o.replace(/^not /, '')))
            : (l = 'must be')
          const m = u.indexOf('.') !== -1 ? 'property' : 'argument'
          let N = `The "${u}" ${m} ${l} of type ${o}`
          ;(N += `. Received type ${typeof c}`), super(N), (this.code = 'ERR_INVALID_ARG_TYPE')
        }
      }
      function f(r, u) {
        if (r === null || typeof r != 'object') throw new b(u, 'Object', r)
      }
      function v(r, u) {
        if (typeof r != 'string') throw new b(u, 'string', r)
      }
      const g = R.platform === 'win32'
      function S(r) {
        return r === h || r === a
      }
      function E(r) {
        return r === h
      }
      function y(r) {
        return (r >= D && r <= s) || (r >= i && r <= p)
      }
      function _(r, u, o, c) {
        let l = '',
          m = 0,
          N = -1,
          A = 0,
          M = 0
        for (let k = 0; k <= r.length; ++k) {
          if (k < r.length) M = r.charCodeAt(k)
          else {
            if (c(M)) break
            M = h
          }
          if (c(M)) {
            if (!(N === k - 1 || A === 1))
              if (A === 2) {
                if (
                  l.length < 2 ||
                  m !== 2 ||
                  l.charCodeAt(l.length - 1) !== L ||
                  l.charCodeAt(l.length - 2) !== L
                ) {
                  if (l.length > 2) {
                    const q = l.lastIndexOf(o)
                    q === -1
                      ? ((l = ''), (m = 0))
                      : ((l = l.slice(0, q)), (m = l.length - 1 - l.lastIndexOf(o))),
                      (N = k),
                      (A = 0)
                    continue
                  } else if (l.length !== 0) {
                    ;(l = ''), (m = 0), (N = k), (A = 0)
                    continue
                  }
                }
                u && ((l += l.length > 0 ? `${o}..` : '..'), (m = 2))
              } else
                l.length > 0 ? (l += `${o}${r.slice(N + 1, k)}`) : (l = r.slice(N + 1, k)),
                  (m = k - N - 1)
            ;(N = k), (A = 0)
          } else M === L && A !== -1 ? ++A : (A = -1)
        }
        return l
      }
      function d(r, u) {
        f(u, 'pathObject')
        const o = u.dir || u.root,
          c = u.base || `${u.name || ''}${u.ext || ''}`
        return o ? (o === u.root ? `${o}${c}` : `${o}${r}${c}`) : c
      }
      n.win32 = {
        resolve(...r) {
          let u = '',
            o = '',
            c = !1
          for (let l = r.length - 1; l >= -1; l--) {
            let m
            if (l >= 0) {
              if (((m = r[l]), v(m, 'path'), m.length === 0)) continue
            } else
              u.length === 0
                ? (m = R.cwd())
                : ((m = R.env[`=${u}`] || R.cwd()),
                  (m === void 0 ||
                    (m.slice(0, 2).toLowerCase() !== u.toLowerCase() && m.charCodeAt(2) === a)) &&
                    (m = `${u}\\`))
            const N = m.length
            let A = 0,
              M = '',
              k = !1
            const q = m.charCodeAt(0)
            if (N === 1) S(q) && ((A = 1), (k = !0))
            else if (S(q))
              if (((k = !0), S(m.charCodeAt(1)))) {
                let I = 2,
                  B = I
                for (; I < N && !S(m.charCodeAt(I)); ) I++
                if (I < N && I !== B) {
                  const H = m.slice(B, I)
                  for (B = I; I < N && S(m.charCodeAt(I)); ) I++
                  if (I < N && I !== B) {
                    for (B = I; I < N && !S(m.charCodeAt(I)); ) I++
                    ;(I === N || I !== B) && ((M = `\\\\${H}\\${m.slice(B, I)}`), (A = I))
                  }
                }
              } else A = 1
            else
              y(q) &&
                m.charCodeAt(1) === w &&
                ((M = m.slice(0, 2)), (A = 2), N > 2 && S(m.charCodeAt(2)) && ((k = !0), (A = 3)))
            if (M.length > 0)
              if (u.length > 0) {
                if (M.toLowerCase() !== u.toLowerCase()) continue
              } else u = M
            if (c) {
              if (u.length > 0) break
            } else if (((o = `${m.slice(A)}\\${o}`), (c = k), k && u.length > 0)) break
          }
          return (o = _(o, !c, '\\', S)), c ? `${u}\\${o}` : `${u}${o}` || '.'
        },
        normalize(r) {
          v(r, 'path')
          const u = r.length
          if (u === 0) return '.'
          let o = 0,
            c,
            l = !1
          const m = r.charCodeAt(0)
          if (u === 1) return E(m) ? '\\' : r
          if (S(m))
            if (((l = !0), S(r.charCodeAt(1)))) {
              let A = 2,
                M = A
              for (; A < u && !S(r.charCodeAt(A)); ) A++
              if (A < u && A !== M) {
                const k = r.slice(M, A)
                for (M = A; A < u && S(r.charCodeAt(A)); ) A++
                if (A < u && A !== M) {
                  for (M = A; A < u && !S(r.charCodeAt(A)); ) A++
                  if (A === u) return `\\\\${k}\\${r.slice(M)}\\`
                  A !== M && ((c = `\\\\${k}\\${r.slice(M, A)}`), (o = A))
                }
              }
            } else o = 1
          else
            y(m) &&
              r.charCodeAt(1) === w &&
              ((c = r.slice(0, 2)), (o = 2), u > 2 && S(r.charCodeAt(2)) && ((l = !0), (o = 3)))
          let N = o < u ? _(r.slice(o), !l, '\\', S) : ''
          return (
            N.length === 0 && !l && (N = '.'),
            N.length > 0 && S(r.charCodeAt(u - 1)) && (N += '\\'),
            c === void 0 ? (l ? `\\${N}` : N) : l ? `${c}\\${N}` : `${c}${N}`
          )
        },
        isAbsolute(r) {
          v(r, 'path')
          const u = r.length
          if (u === 0) return !1
          const o = r.charCodeAt(0)
          return S(o) || (u > 2 && y(o) && r.charCodeAt(1) === w && S(r.charCodeAt(2)))
        },
        join(...r) {
          if (r.length === 0) return '.'
          let u, o
          for (let m = 0; m < r.length; ++m) {
            const N = r[m]
            v(N, 'path'), N.length > 0 && (u === void 0 ? (u = o = N) : (u += `\\${N}`))
          }
          if (u === void 0) return '.'
          let c = !0,
            l = 0
          if (typeof o == 'string' && S(o.charCodeAt(0))) {
            ++l
            const m = o.length
            m > 1 && S(o.charCodeAt(1)) && (++l, m > 2 && (S(o.charCodeAt(2)) ? ++l : (c = !1)))
          }
          if (c) {
            for (; l < u.length && S(u.charCodeAt(l)); ) l++
            l >= 2 && (u = `\\${u.slice(l)}`)
          }
          return n.win32.normalize(u)
        },
        relative(r, u) {
          if ((v(r, 'from'), v(u, 'to'), r === u)) return ''
          const o = n.win32.resolve(r),
            c = n.win32.resolve(u)
          if (o === c || ((r = o.toLowerCase()), (u = c.toLowerCase()), r === u)) return ''
          let l = 0
          for (; l < r.length && r.charCodeAt(l) === a; ) l++
          let m = r.length
          for (; m - 1 > l && r.charCodeAt(m - 1) === a; ) m--
          const N = m - l
          let A = 0
          for (; A < u.length && u.charCodeAt(A) === a; ) A++
          let M = u.length
          for (; M - 1 > A && u.charCodeAt(M - 1) === a; ) M--
          const k = M - A,
            q = N < k ? N : k
          let I = -1,
            B = 0
          for (; B < q; B++) {
            const F = r.charCodeAt(l + B)
            if (F !== u.charCodeAt(A + B)) break
            F === a && (I = B)
          }
          if (B !== q) {
            if (I === -1) return c
          } else {
            if (k > q) {
              if (u.charCodeAt(A + B) === a) return c.slice(A + B + 1)
              if (B === 2) return c.slice(A + B)
            }
            N > q && (r.charCodeAt(l + B) === a ? (I = B) : B === 2 && (I = 3)), I === -1 && (I = 0)
          }
          let H = ''
          for (B = l + I + 1; B <= m; ++B)
            (B === m || r.charCodeAt(B) === a) && (H += H.length === 0 ? '..' : '\\..')
          return (
            (A += I),
            H.length > 0 ? `${H}${c.slice(A, M)}` : (c.charCodeAt(A) === a && ++A, c.slice(A, M))
          )
        },
        toNamespacedPath(r) {
          if (typeof r != 'string' || r.length === 0) return r
          const u = n.win32.resolve(r)
          if (u.length <= 2) return r
          if (u.charCodeAt(0) === a) {
            if (u.charCodeAt(1) === a) {
              const o = u.charCodeAt(2)
              if (o !== e && o !== L) return `\\\\?\\UNC\\${u.slice(2)}`
            }
          } else if (y(u.charCodeAt(0)) && u.charCodeAt(1) === w && u.charCodeAt(2) === a)
            return `\\\\?\\${u}`
          return r
        },
        dirname(r) {
          v(r, 'path')
          const u = r.length
          if (u === 0) return '.'
          let o = -1,
            c = 0
          const l = r.charCodeAt(0)
          if (u === 1) return S(l) ? r : '.'
          if (S(l)) {
            if (((o = c = 1), S(r.charCodeAt(1)))) {
              let A = 2,
                M = A
              for (; A < u && !S(r.charCodeAt(A)); ) A++
              if (A < u && A !== M) {
                for (M = A; A < u && S(r.charCodeAt(A)); ) A++
                if (A < u && A !== M) {
                  for (M = A; A < u && !S(r.charCodeAt(A)); ) A++
                  if (A === u) return r
                  A !== M && (o = c = A + 1)
                }
              }
            }
          } else
            y(l) && r.charCodeAt(1) === w && ((o = u > 2 && S(r.charCodeAt(2)) ? 3 : 2), (c = o))
          let m = -1,
            N = !0
          for (let A = u - 1; A >= c; --A)
            if (S(r.charCodeAt(A))) {
              if (!N) {
                m = A
                break
              }
            } else N = !1
          if (m === -1) {
            if (o === -1) return '.'
            m = o
          }
          return r.slice(0, m)
        },
        basename(r, u) {
          u !== void 0 && v(u, 'ext'), v(r, 'path')
          let o = 0,
            c = -1,
            l = !0,
            m
          if (
            (r.length >= 2 && y(r.charCodeAt(0)) && r.charCodeAt(1) === w && (o = 2),
            u !== void 0 && u.length > 0 && u.length <= r.length)
          ) {
            if (u === r) return ''
            let N = u.length - 1,
              A = -1
            for (m = r.length - 1; m >= o; --m) {
              const M = r.charCodeAt(m)
              if (S(M)) {
                if (!l) {
                  o = m + 1
                  break
                }
              } else
                A === -1 && ((l = !1), (A = m + 1)),
                  N >= 0 && (M === u.charCodeAt(N) ? --N === -1 && (c = m) : ((N = -1), (c = A)))
            }
            return o === c ? (c = A) : c === -1 && (c = r.length), r.slice(o, c)
          }
          for (m = r.length - 1; m >= o; --m)
            if (S(r.charCodeAt(m))) {
              if (!l) {
                o = m + 1
                break
              }
            } else c === -1 && ((l = !1), (c = m + 1))
          return c === -1 ? '' : r.slice(o, c)
        },
        extname(r) {
          v(r, 'path')
          let u = 0,
            o = -1,
            c = 0,
            l = -1,
            m = !0,
            N = 0
          r.length >= 2 && r.charCodeAt(1) === w && y(r.charCodeAt(0)) && (u = c = 2)
          for (let A = r.length - 1; A >= u; --A) {
            const M = r.charCodeAt(A)
            if (S(M)) {
              if (!m) {
                c = A + 1
                break
              }
              continue
            }
            l === -1 && ((m = !1), (l = A + 1)),
              M === L ? (o === -1 ? (o = A) : N !== 1 && (N = 1)) : o !== -1 && (N = -1)
          }
          return o === -1 || l === -1 || N === 0 || (N === 1 && o === l - 1 && o === c + 1)
            ? ''
            : r.slice(o, l)
        },
        format: d.bind(null, '\\'),
        parse(r) {
          v(r, 'path')
          const u = { root: '', dir: '', base: '', ext: '', name: '' }
          if (r.length === 0) return u
          const o = r.length
          let c = 0,
            l = r.charCodeAt(0)
          if (o === 1) return S(l) ? ((u.root = u.dir = r), u) : ((u.base = u.name = r), u)
          if (S(l)) {
            if (((c = 1), S(r.charCodeAt(1)))) {
              let I = 2,
                B = I
              for (; I < o && !S(r.charCodeAt(I)); ) I++
              if (I < o && I !== B) {
                for (B = I; I < o && S(r.charCodeAt(I)); ) I++
                if (I < o && I !== B) {
                  for (B = I; I < o && !S(r.charCodeAt(I)); ) I++
                  I === o ? (c = I) : I !== B && (c = I + 1)
                }
              }
            }
          } else if (y(l) && r.charCodeAt(1) === w) {
            if (o <= 2) return (u.root = u.dir = r), u
            if (((c = 2), S(r.charCodeAt(2)))) {
              if (o === 3) return (u.root = u.dir = r), u
              c = 3
            }
          }
          c > 0 && (u.root = r.slice(0, c))
          let m = -1,
            N = c,
            A = -1,
            M = !0,
            k = r.length - 1,
            q = 0
          for (; k >= c; --k) {
            if (((l = r.charCodeAt(k)), S(l))) {
              if (!M) {
                N = k + 1
                break
              }
              continue
            }
            A === -1 && ((M = !1), (A = k + 1)),
              l === L ? (m === -1 ? (m = k) : q !== 1 && (q = 1)) : m !== -1 && (q = -1)
          }
          return (
            A !== -1 &&
              (m === -1 || q === 0 || (q === 1 && m === A - 1 && m === N + 1)
                ? (u.base = u.name = r.slice(N, A))
                : ((u.name = r.slice(N, m)), (u.base = r.slice(N, A)), (u.ext = r.slice(m, A)))),
            N > 0 && N !== c ? (u.dir = r.slice(0, N - 1)) : (u.dir = u.root),
            u
          )
        },
        sep: '\\',
        delimiter: ';',
        win32: null,
        posix: null,
      }
      const C = (() => {
        if (g) {
          const r = /\\/g
          return () => {
            const u = R.cwd().replace(r, '/')
            return u.slice(u.indexOf('/'))
          }
        }
        return () => R.cwd()
      })()
      ;(n.posix = {
        resolve(...r) {
          let u = '',
            o = !1
          for (let c = r.length - 1; c >= -1 && !o; c--) {
            const l = c >= 0 ? r[c] : C()
            v(l, 'path'), l.length !== 0 && ((u = `${l}/${u}`), (o = l.charCodeAt(0) === h))
          }
          return (u = _(u, !o, '/', E)), o ? `/${u}` : u.length > 0 ? u : '.'
        },
        normalize(r) {
          if ((v(r, 'path'), r.length === 0)) return '.'
          const u = r.charCodeAt(0) === h,
            o = r.charCodeAt(r.length - 1) === h
          return (
            (r = _(r, !u, '/', E)),
            r.length === 0 ? (u ? '/' : o ? './' : '.') : (o && (r += '/'), u ? `/${r}` : r)
          )
        },
        isAbsolute(r) {
          return v(r, 'path'), r.length > 0 && r.charCodeAt(0) === h
        },
        join(...r) {
          if (r.length === 0) return '.'
          let u
          for (let o = 0; o < r.length; ++o) {
            const c = r[o]
            v(c, 'path'), c.length > 0 && (u === void 0 ? (u = c) : (u += `/${c}`))
          }
          return u === void 0 ? '.' : n.posix.normalize(u)
        },
        relative(r, u) {
          if (
            (v(r, 'from'),
            v(u, 'to'),
            r === u || ((r = n.posix.resolve(r)), (u = n.posix.resolve(u)), r === u))
          )
            return ''
          const o = 1,
            c = r.length,
            l = c - o,
            m = 1,
            N = u.length - m,
            A = l < N ? l : N
          let M = -1,
            k = 0
          for (; k < A; k++) {
            const I = r.charCodeAt(o + k)
            if (I !== u.charCodeAt(m + k)) break
            I === h && (M = k)
          }
          if (k === A)
            if (N > A) {
              if (u.charCodeAt(m + k) === h) return u.slice(m + k + 1)
              if (k === 0) return u.slice(m + k)
            } else l > A && (r.charCodeAt(o + k) === h ? (M = k) : k === 0 && (M = 0))
          let q = ''
          for (k = o + M + 1; k <= c; ++k)
            (k === c || r.charCodeAt(k) === h) && (q += q.length === 0 ? '..' : '/..')
          return `${q}${u.slice(m + M)}`
        },
        toNamespacedPath(r) {
          return r
        },
        dirname(r) {
          if ((v(r, 'path'), r.length === 0)) return '.'
          const u = r.charCodeAt(0) === h
          let o = -1,
            c = !0
          for (let l = r.length - 1; l >= 1; --l)
            if (r.charCodeAt(l) === h) {
              if (!c) {
                o = l
                break
              }
            } else c = !1
          return o === -1 ? (u ? '/' : '.') : u && o === 1 ? '//' : r.slice(0, o)
        },
        basename(r, u) {
          u !== void 0 && v(u, 'ext'), v(r, 'path')
          let o = 0,
            c = -1,
            l = !0,
            m
          if (u !== void 0 && u.length > 0 && u.length <= r.length) {
            if (u === r) return ''
            let N = u.length - 1,
              A = -1
            for (m = r.length - 1; m >= 0; --m) {
              const M = r.charCodeAt(m)
              if (M === h) {
                if (!l) {
                  o = m + 1
                  break
                }
              } else
                A === -1 && ((l = !1), (A = m + 1)),
                  N >= 0 && (M === u.charCodeAt(N) ? --N === -1 && (c = m) : ((N = -1), (c = A)))
            }
            return o === c ? (c = A) : c === -1 && (c = r.length), r.slice(o, c)
          }
          for (m = r.length - 1; m >= 0; --m)
            if (r.charCodeAt(m) === h) {
              if (!l) {
                o = m + 1
                break
              }
            } else c === -1 && ((l = !1), (c = m + 1))
          return c === -1 ? '' : r.slice(o, c)
        },
        extname(r) {
          v(r, 'path')
          let u = -1,
            o = 0,
            c = -1,
            l = !0,
            m = 0
          for (let N = r.length - 1; N >= 0; --N) {
            const A = r.charCodeAt(N)
            if (A === h) {
              if (!l) {
                o = N + 1
                break
              }
              continue
            }
            c === -1 && ((l = !1), (c = N + 1)),
              A === L ? (u === -1 ? (u = N) : m !== 1 && (m = 1)) : u !== -1 && (m = -1)
          }
          return u === -1 || c === -1 || m === 0 || (m === 1 && u === c - 1 && u === o + 1)
            ? ''
            : r.slice(u, c)
        },
        format: d.bind(null, '/'),
        parse(r) {
          v(r, 'path')
          const u = { root: '', dir: '', base: '', ext: '', name: '' }
          if (r.length === 0) return u
          const o = r.charCodeAt(0) === h
          let c
          o ? ((u.root = '/'), (c = 1)) : (c = 0)
          let l = -1,
            m = 0,
            N = -1,
            A = !0,
            M = r.length - 1,
            k = 0
          for (; M >= c; --M) {
            const q = r.charCodeAt(M)
            if (q === h) {
              if (!A) {
                m = M + 1
                break
              }
              continue
            }
            N === -1 && ((A = !1), (N = M + 1)),
              q === L ? (l === -1 ? (l = M) : k !== 1 && (k = 1)) : l !== -1 && (k = -1)
          }
          if (N !== -1) {
            const q = m === 0 && o ? 1 : m
            l === -1 || k === 0 || (k === 1 && l === N - 1 && l === m + 1)
              ? (u.base = u.name = r.slice(q, N))
              : ((u.name = r.slice(q, l)), (u.base = r.slice(q, N)), (u.ext = r.slice(l, N)))
          }
          return m > 0 ? (u.dir = r.slice(0, m - 1)) : o && (u.dir = '/'), u
        },
        sep: '/',
        delimiter: ':',
        win32: null,
        posix: null,
      }),
        (n.posix.win32 = n.win32.win32 = n.win32),
        (n.posix.posix = n.win32.posix = n.posix),
        (n.normalize = g ? n.win32.normalize : n.posix.normalize),
        (n.resolve = g ? n.win32.resolve : n.posix.resolve),
        (n.relative = g ? n.win32.relative : n.posix.relative),
        (n.dirname = g ? n.win32.dirname : n.posix.dirname),
        (n.basename = g ? n.win32.basename : n.posix.basename),
        (n.extname = g ? n.win32.extname : n.posix.extname),
        (n.sep = g ? n.win32.sep : n.posix.sep)
    }),
    Q(Y[24], X([0, 1, 8]), function (x, n, R) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }), (n.StopWatch = void 0)
      const D = R.globals.performance && typeof R.globals.performance.now == 'function'
      class i {
        static create(p = !0) {
          return new i(p)
        }
        constructor(p) {
          ;(this._highResolution = D && p), (this._startTime = this._now()), (this._stopTime = -1)
        }
        stop() {
          this._stopTime = this._now()
        }
        elapsed() {
          return this._stopTime !== -1
            ? this._stopTime - this._startTime
            : this._now() - this._startTime
        }
        _now() {
          return this._highResolution ? R.globals.performance.now() : Date.now()
        }
      }
      n.StopWatch = i
    }),
    Q(Y[9], X([0, 1, 4, 14, 11, 16, 24]), function (x, n, R, D, i, s, p) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.Relay =
          n.EventBufferer =
          n.EventMultiplexer =
          n.MicrotaskEmitter =
          n.DebounceEmitter =
          n.PauseableEmitter =
          n.EventDeliveryQueue =
          n.Emitter =
          n.EventProfiling =
          n.Event =
            void 0)
      const L = !1,
        h = !1
      var a
      ;(function (c) {
        c.None = () => i.Disposable.None
        function l(J) {
          if (h) {
            const { onDidAddListener: z } = J,
              G = f.create()
            let $ = 0
            J.onDidAddListener = () => {
              ++$ === 2 &&
                (console.warn(
                  'snapshotted emitter LIKELY used public and SHOULD HAVE BEEN created with DisposableStore. snapshotted here'
                ),
                G.print()),
                z?.()
            }
          }
        }
        function m(J, z) {
          return F(J, () => {}, 0, void 0, !0, void 0, z)
        }
        c.defer = m
        function N(J) {
          return (z, G = null, $) => {
            let K = !1,
              ee
            return (
              (ee = J(
                (ne) => {
                  if (!K) return ee ? ee.dispose() : (K = !0), z.call(G, ne)
                },
                null,
                $
              )),
              K && ee.dispose(),
              ee
            )
          }
        }
        c.once = N
        function A(J, z, G) {
          return H(($, K = null, ee) => J((ne) => $.call(K, z(ne)), null, ee), G)
        }
        c.map = A
        function M(J, z, G) {
          return H(
            ($, K = null, ee) =>
              J(
                (ne) => {
                  z(ne), $.call(K, ne)
                },
                null,
                ee
              ),
            G
          )
        }
        c.forEach = M
        function k(J, z, G) {
          return H(($, K = null, ee) => J((ne) => z(ne) && $.call(K, ne), null, ee), G)
        }
        c.filter = k
        function q(J) {
          return J
        }
        c.signal = q
        function I(...J) {
          return (z, G = null, $) =>
            (0, i.combinedDisposable)(...J.map((K) => K((ee) => z.call(G, ee), null, $)))
        }
        c.any = I
        function B(J, z, G, $) {
          let K = G
          return A(J, (ee) => ((K = z(K, ee)), K), $)
        }
        c.reduce = B
        function H(J, z) {
          let G
          const $ = {
            onWillAddFirstListener() {
              G = J(K.fire, K)
            },
            onDidRemoveLastListener() {
              G?.dispose()
            },
          }
          z || l($)
          const K = new g($)
          return z?.add(K), K.event
        }
        function F(J, z, G = 100, $ = !1, K = !1, ee, ne) {
          let ce,
            Se,
            we,
            fe = 0,
            me
          const P = {
            leakWarningThreshold: ee,
            onWillAddFirstListener() {
              ce = J((V) => {
                fe++,
                  (Se = z(Se, V)),
                  $ && !we && (O.fire(Se), (Se = void 0)),
                  (me = () => {
                    const j = Se
                    ;(Se = void 0), (we = void 0), (!$ || fe > 1) && O.fire(j), (fe = 0)
                  }),
                  typeof G == 'number'
                    ? (clearTimeout(we), (we = setTimeout(me, G)))
                    : we === void 0 && ((we = 0), queueMicrotask(me))
              })
            },
            onWillRemoveListener() {
              K && fe > 0 && me?.()
            },
            onDidRemoveLastListener() {
              ;(me = void 0), ce.dispose()
            },
          }
          ne || l(P)
          const O = new g(P)
          return ne?.add(O), O.event
        }
        c.debounce = F
        function U(J, z = 0, G) {
          return c.debounce(J, ($, K) => ($ ? ($.push(K), $) : [K]), z, void 0, !0, void 0, G)
        }
        c.accumulate = U
        function T(J, z = ($, K) => $ === K, G) {
          let $ = !0,
            K
          return k(
            J,
            (ee) => {
              const ne = $ || !z(ee, K)
              return ($ = !1), (K = ee), ne
            },
            G
          )
        }
        c.latch = T
        function W(J, z, G) {
          return [c.filter(J, z, G), c.filter(J, ($) => !z($), G)]
        }
        c.split = W
        function t(J, z = !1, G = []) {
          let $ = G.slice(),
            K = J((ce) => {
              $ ? $.push(ce) : ne.fire(ce)
            })
          const ee = () => {
              $?.forEach((ce) => ne.fire(ce)), ($ = null)
            },
            ne = new g({
              onWillAddFirstListener() {
                K || (K = J((ce) => ne.fire(ce)))
              },
              onDidAddFirstListener() {
                $ && (z ? setTimeout(ee) : ee())
              },
              onDidRemoveLastListener() {
                K && K.dispose(), (K = null)
              },
            })
          return ne.event
        }
        c.buffer = t
        class te {
          constructor(z) {
            ;(this.event = z), (this.disposables = new i.DisposableStore())
          }
          map(z) {
            return new te(A(this.event, z, this.disposables))
          }
          forEach(z) {
            return new te(M(this.event, z, this.disposables))
          }
          filter(z) {
            return new te(k(this.event, z, this.disposables))
          }
          reduce(z, G) {
            return new te(B(this.event, z, G, this.disposables))
          }
          latch() {
            return new te(T(this.event, void 0, this.disposables))
          }
          debounce(z, G = 100, $ = !1, K = !1, ee) {
            return new te(F(this.event, z, G, $, K, ee, this.disposables))
          }
          on(z, G, $) {
            return this.event(z, G, $)
          }
          once(z, G, $) {
            return N(this.event)(z, G, $)
          }
          dispose() {
            this.disposables.dispose()
          }
        }
        function ie(J) {
          return new te(J)
        }
        c.chain = ie
        function ue(J, z, G = ($) => $) {
          const $ = (...ce) => ne.fire(G(...ce)),
            K = () => J.on(z, $),
            ee = () => J.removeListener(z, $),
            ne = new g({ onWillAddFirstListener: K, onDidRemoveLastListener: ee })
          return ne.event
        }
        c.fromNodeEventEmitter = ue
        function de(J, z, G = ($) => $) {
          const $ = (...ce) => ne.fire(G(...ce)),
            K = () => J.addEventListener(z, $),
            ee = () => J.removeEventListener(z, $),
            ne = new g({ onWillAddFirstListener: K, onDidRemoveLastListener: ee })
          return ne.event
        }
        c.fromDOMEventEmitter = de
        function Ce(J) {
          return new Promise((z) => N(J)(z))
        }
        c.toPromise = Ce
        function re(J, z) {
          return z(void 0), J((G) => z(G))
        }
        c.runAndSubscribe = re
        function se(J, z) {
          let G = null
          function $(ee) {
            G?.dispose(), (G = new i.DisposableStore()), z(ee, G)
          }
          $(void 0)
          const K = J((ee) => $(ee))
          return (0, i.toDisposable)(() => {
            K.dispose(), G?.dispose()
          })
        }
        c.runAndSubscribeWithStore = se
        class ge {
          constructor(z, G) {
            ;(this.obs = z), (this._counter = 0), (this._hasChanged = !1)
            const $ = {
              onWillAddFirstListener: () => {
                z.addObserver(this)
              },
              onDidRemoveLastListener: () => {
                z.removeObserver(this)
              },
            }
            G || l($), (this.emitter = new g($)), G && G.add(this.emitter)
          }
          beginUpdate(z) {
            this._counter++
          }
          handleChange(z, G) {
            this._hasChanged = !0
          }
          endUpdate(z) {
            --this._counter === 0 &&
              this._hasChanged &&
              ((this._hasChanged = !1), this.emitter.fire(this.obs.get()))
          }
        }
        function Le(J, z) {
          return new ge(J, z).emitter.event
        }
        c.fromObservable = Le
      })((a = n.Event || (n.Event = {})))
      class w {
        constructor(l) {
          ;(this.listenerCount = 0),
            (this.invocationCount = 0),
            (this.elapsedOverall = 0),
            (this.durations = []),
            (this.name = `${l}_${w._idPool++}`),
            w.all.add(this)
        }
        start(l) {
          ;(this._stopWatch = new p.StopWatch(!0)), (this.listenerCount = l)
        }
        stop() {
          if (this._stopWatch) {
            const l = this._stopWatch.elapsed()
            this.durations.push(l),
              (this.elapsedOverall += l),
              (this.invocationCount += 1),
              (this._stopWatch = void 0)
          }
        }
      }
      ;(w.all = new Set()), (w._idPool = 0), (n.EventProfiling = w)
      let e = -1
      class b {
        constructor(l, m = Math.random().toString(18).slice(2, 5)) {
          ;(this.threshold = l), (this.name = m), (this._warnCountdown = 0)
        }
        dispose() {
          var l
          ;(l = this._stacks) === null || l === void 0 || l.clear()
        }
        check(l, m) {
          const N = this.threshold
          if (N <= 0 || m < N) return
          this._stacks || (this._stacks = new Map())
          const A = this._stacks.get(l.value) || 0
          if (
            (this._stacks.set(l.value, A + 1), (this._warnCountdown -= 1), this._warnCountdown <= 0)
          ) {
            this._warnCountdown = N * 0.5
            let M,
              k = 0
            for (const [q, I] of this._stacks) (!M || k < I) && ((M = q), (k = I))
            console.warn(
              `[${this.name}] potential listener LEAK detected, having ${m} listeners already. MOST frequent listener (${k}):`
            ),
              console.warn(M)
          }
          return () => {
            const M = this._stacks.get(l.value) || 0
            this._stacks.set(l.value, M - 1)
          }
        }
      }
      class f {
        static create() {
          var l
          return new f((l = new Error().stack) !== null && l !== void 0 ? l : '')
        }
        constructor(l) {
          this.value = l
        }
        print() {
          console.warn(
            this.value
              .split(
                `
`
              )
              .slice(2).join(`
`)
          )
        }
      }
      class v {
        constructor(l, m, N) {
          ;(this.callback = l),
            (this.callbackThis = m),
            (this.stack = N),
            (this.subscription = new i.SafeDisposable())
        }
        invoke(l) {
          this.callback.call(this.callbackThis, l)
        }
      }
      class g {
        constructor(l) {
          var m, N, A, M, k
          ;(this._disposed = !1),
            (this._options = l),
            (this._leakageMon =
              e > 0 ||
              ((m = this._options) === null || m === void 0 ? void 0 : m.leakWarningThreshold)
                ? new b(
                    (A =
                      (N = this._options) === null || N === void 0
                        ? void 0
                        : N.leakWarningThreshold) !== null && A !== void 0
                      ? A
                      : e
                  )
                : void 0),
            (this._perfMon =
              !((M = this._options) === null || M === void 0) && M._profName
                ? new w(this._options._profName)
                : void 0),
            (this._deliveryQueue =
              (k = this._options) === null || k === void 0 ? void 0 : k.deliveryQueue)
        }
        dispose() {
          var l, m, N, A
          if (!this._disposed) {
            if (((this._disposed = !0), this._listeners)) {
              if (L) {
                const M = Array.from(this._listeners)
                queueMicrotask(() => {
                  var k
                  for (const q of M)
                    q.subscription.isset() &&
                      (q.subscription.unset(), (k = q.stack) === null || k === void 0 || k.print())
                })
              }
              this._listeners.clear()
            }
            ;(l = this._deliveryQueue) === null || l === void 0 || l.clear(this),
              (N =
                (m = this._options) === null || m === void 0
                  ? void 0
                  : m.onDidRemoveLastListener) === null ||
                N === void 0 ||
                N.call(m),
              (A = this._leakageMon) === null || A === void 0 || A.dispose()
          }
        }
        get event() {
          return (
            this._event ||
              (this._event = (l, m, N) => {
                var A, M, k
                if (
                  (this._listeners || (this._listeners = new s.LinkedList()),
                  this._leakageMon && this._listeners.size > this._leakageMon.threshold * 3)
                )
                  return (
                    console.warn(
                      `[${this._leakageMon.name}] REFUSES to accept new listeners because it exceeded its threshold by far`
                    ),
                    i.Disposable.None
                  )
                const q = this._listeners.isEmpty()
                q &&
                  ((A = this._options) === null || A === void 0
                    ? void 0
                    : A.onWillAddFirstListener) &&
                  this._options.onWillAddFirstListener(this)
                let I, B
                this._leakageMon &&
                  this._listeners.size >= Math.ceil(this._leakageMon.threshold * 0.2) &&
                  ((B = f.create()), (I = this._leakageMon.check(B, this._listeners.size + 1))),
                  L && (B = B ?? f.create())
                const H = new v(l, m, B),
                  F = this._listeners.push(H)
                q &&
                  ((M = this._options) === null || M === void 0
                    ? void 0
                    : M.onDidAddFirstListener) &&
                  this._options.onDidAddFirstListener(this),
                  !((k = this._options) === null || k === void 0) &&
                    k.onDidAddListener &&
                    this._options.onDidAddListener(this, l, m)
                const U = H.subscription.set(() => {
                  var T, W
                  I?.(),
                    this._disposed ||
                      ((W =
                        (T = this._options) === null || T === void 0
                          ? void 0
                          : T.onWillRemoveListener) === null ||
                        W === void 0 ||
                        W.call(T, this),
                      F(),
                      this._options &&
                        this._options.onDidRemoveLastListener &&
                        ((this._listeners && !this._listeners.isEmpty()) ||
                          this._options.onDidRemoveLastListener(this)))
                })
                return N instanceof i.DisposableStore ? N.add(U) : Array.isArray(N) && N.push(U), U
              }),
            this._event
          )
        }
        fire(l) {
          var m, N, A
          if (this._listeners) {
            this._deliveryQueue ||
              (this._deliveryQueue = new E(
                (m = this._options) === null || m === void 0 ? void 0 : m.onListenerError
              ))
            for (const M of this._listeners) this._deliveryQueue.push(this, M, l)
            ;(N = this._perfMon) === null || N === void 0 || N.start(this._deliveryQueue.size),
              this._deliveryQueue.deliver(),
              (A = this._perfMon) === null || A === void 0 || A.stop()
          }
        }
        hasListeners() {
          return this._listeners ? !this._listeners.isEmpty() : !1
        }
      }
      n.Emitter = g
      class S {
        constructor(l = R.onUnexpectedError) {
          ;(this._onListenerError = l), (this._queue = new s.LinkedList())
        }
        get size() {
          return this._queue.size
        }
        push(l, m, N) {
          this._queue.push(new y(l, m, N))
        }
        clear(l) {
          const m = new s.LinkedList()
          for (const N of this._queue) N.emitter !== l && m.push(N)
          this._queue = m
        }
        deliver() {
          for (; this._queue.size > 0; ) {
            const l = this._queue.shift()
            try {
              l.listener.invoke(l.event)
            } catch (m) {
              this._onListenerError(m)
            }
          }
        }
      }
      n.EventDeliveryQueue = S
      class E extends S {
        clear(l) {
          this._queue.clear()
        }
      }
      class y {
        constructor(l, m, N) {
          ;(this.emitter = l), (this.listener = m), (this.event = N)
        }
      }
      class _ extends g {
        constructor(l) {
          super(l),
            (this._isPaused = 0),
            (this._eventQueue = new s.LinkedList()),
            (this._mergeFn = l?.merge)
        }
        pause() {
          this._isPaused++
        }
        resume() {
          if (this._isPaused !== 0 && --this._isPaused === 0)
            if (this._mergeFn) {
              if (this._eventQueue.size > 0) {
                const l = Array.from(this._eventQueue)
                this._eventQueue.clear(), super.fire(this._mergeFn(l))
              }
            } else
              for (; !this._isPaused && this._eventQueue.size !== 0; )
                super.fire(this._eventQueue.shift())
        }
        fire(l) {
          this._listeners && (this._isPaused !== 0 ? this._eventQueue.push(l) : super.fire(l))
        }
      }
      n.PauseableEmitter = _
      class d extends _ {
        constructor(l) {
          var m
          super(l), (this._delay = (m = l.delay) !== null && m !== void 0 ? m : 100)
        }
        fire(l) {
          this._handle ||
            (this.pause(),
            (this._handle = setTimeout(() => {
              ;(this._handle = void 0), this.resume()
            }, this._delay))),
            super.fire(l)
        }
      }
      n.DebounceEmitter = d
      class C extends g {
        constructor(l) {
          super(l), (this._queuedEvents = []), (this._mergeFn = l?.merge)
        }
        fire(l) {
          !this.hasListeners() ||
            (this._queuedEvents.push(l),
            this._queuedEvents.length === 1 &&
              queueMicrotask(() => {
                this._mergeFn
                  ? super.fire(this._mergeFn(this._queuedEvents))
                  : this._queuedEvents.forEach((m) => super.fire(m)),
                  (this._queuedEvents = [])
              }))
        }
      }
      n.MicrotaskEmitter = C
      class r {
        constructor() {
          ;(this.hasListeners = !1),
            (this.events = []),
            (this.emitter = new g({
              onWillAddFirstListener: () => this.onFirstListenerAdd(),
              onDidRemoveLastListener: () => this.onLastListenerRemove(),
            }))
        }
        get event() {
          return this.emitter.event
        }
        add(l) {
          const m = { event: l, listener: null }
          this.events.push(m), this.hasListeners && this.hook(m)
          const N = () => {
            this.hasListeners && this.unhook(m)
            const A = this.events.indexOf(m)
            this.events.splice(A, 1)
          }
          return (0, i.toDisposable)((0, D.once)(N))
        }
        onFirstListenerAdd() {
          ;(this.hasListeners = !0), this.events.forEach((l) => this.hook(l))
        }
        onLastListenerRemove() {
          ;(this.hasListeners = !1), this.events.forEach((l) => this.unhook(l))
        }
        hook(l) {
          l.listener = l.event((m) => this.emitter.fire(m))
        }
        unhook(l) {
          l.listener && l.listener.dispose(), (l.listener = null)
        }
        dispose() {
          this.emitter.dispose()
        }
      }
      n.EventMultiplexer = r
      class u {
        constructor() {
          this.buffers = []
        }
        wrapEvent(l) {
          return (m, N, A) =>
            l(
              (M) => {
                const k = this.buffers[this.buffers.length - 1]
                k ? k.push(() => m.call(N, M)) : m.call(N, M)
              },
              void 0,
              A
            )
        }
        bufferEvents(l) {
          const m = []
          this.buffers.push(m)
          const N = l()
          return this.buffers.pop(), m.forEach((A) => A()), N
        }
      }
      n.EventBufferer = u
      class o {
        constructor() {
          ;(this.listening = !1),
            (this.inputEvent = a.None),
            (this.inputEventListener = i.Disposable.None),
            (this.emitter = new g({
              onDidAddFirstListener: () => {
                ;(this.listening = !0),
                  (this.inputEventListener = this.inputEvent(this.emitter.fire, this.emitter))
              },
              onDidRemoveLastListener: () => {
                ;(this.listening = !1), this.inputEventListener.dispose()
              },
            })),
            (this.event = this.emitter.event)
        }
        set input(l) {
          ;(this.inputEvent = l),
            this.listening &&
              (this.inputEventListener.dispose(),
              (this.inputEventListener = l(this.emitter.fire, this.emitter)))
        }
        dispose() {
          this.inputEventListener.dispose(), this.emitter.dispose()
        }
      }
      n.Relay = o
    }),
    Q(Y[53], X([0, 1, 9]), function (x, n, R) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.CancellationTokenSource = n.CancellationToken = void 0)
      const D = Object.freeze(function (L, h) {
        const a = setTimeout(L.bind(h), 0)
        return {
          dispose() {
            clearTimeout(a)
          },
        }
      })
      var i
      ;(function (L) {
        function h(a) {
          return a === L.None || a === L.Cancelled || a instanceof s
            ? !0
            : !a || typeof a != 'object'
            ? !1
            : typeof a.isCancellationRequested == 'boolean' &&
              typeof a.onCancellationRequested == 'function'
        }
        ;(L.isCancellationToken = h),
          (L.None = Object.freeze({
            isCancellationRequested: !1,
            onCancellationRequested: R.Event.None,
          })),
          (L.Cancelled = Object.freeze({ isCancellationRequested: !0, onCancellationRequested: D }))
      })((i = n.CancellationToken || (n.CancellationToken = {})))
      class s {
        constructor() {
          ;(this._isCancelled = !1), (this._emitter = null)
        }
        cancel() {
          this._isCancelled ||
            ((this._isCancelled = !0),
            this._emitter && (this._emitter.fire(void 0), this.dispose()))
        }
        get isCancellationRequested() {
          return this._isCancelled
        }
        get onCancellationRequested() {
          return this._isCancelled
            ? D
            : (this._emitter || (this._emitter = new R.Emitter()), this._emitter.event)
        }
        dispose() {
          this._emitter && (this._emitter.dispose(), (this._emitter = null))
        }
      }
      class p {
        constructor(h) {
          ;(this._token = void 0),
            (this._parentListener = void 0),
            (this._parentListener = h && h.onCancellationRequested(this.cancel, this))
        }
        get token() {
          return this._token || (this._token = new s()), this._token
        }
        cancel() {
          this._token
            ? this._token instanceof s && this._token.cancel()
            : (this._token = i.Cancelled)
        }
        dispose(h = !1) {
          var a
          h && this.cancel(),
            (a = this._parentListener) === null || a === void 0 || a.dispose(),
            this._token ? this._token instanceof s && this._token.dispose() : (this._token = i.None)
        }
      }
      n.CancellationTokenSource = p
    }),
    Q(Y[13], X([0, 1, 52, 8]), function (x, n, R, D) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }), (n.uriToFsPath = n.URI = void 0)
      const i = /^\w[\w\d+.-]*$/,
        s = /^\//,
        p = /^\/\//
      function L(o, c) {
        if (!o.scheme && c)
          throw new Error(
            `[UriError]: Scheme is missing: {scheme: "", authority: "${o.authority}", path: "${o.path}", query: "${o.query}", fragment: "${o.fragment}"}`
          )
        if (o.scheme && !i.test(o.scheme))
          throw new Error('[UriError]: Scheme contains illegal characters.')
        if (o.path) {
          if (o.authority) {
            if (!s.test(o.path))
              throw new Error(
                '[UriError]: If a URI contains an authority component, then the path component must either be empty or begin with a slash ("/") character'
              )
          } else if (p.test(o.path))
            throw new Error(
              '[UriError]: If a URI does not contain an authority component, then the path cannot begin with two slash characters ("//")'
            )
        }
      }
      function h(o, c) {
        return !o && !c ? 'file' : o
      }
      function a(o, c) {
        switch (o) {
          case 'https':
          case 'http':
          case 'file':
            c ? c[0] !== e && (c = e + c) : (c = e)
            break
        }
        return c
      }
      const w = '',
        e = '/',
        b = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/
      class f {
        static isUri(c) {
          return c instanceof f
            ? !0
            : c
            ? typeof c.authority == 'string' &&
              typeof c.fragment == 'string' &&
              typeof c.path == 'string' &&
              typeof c.query == 'string' &&
              typeof c.scheme == 'string' &&
              typeof c.fsPath == 'string' &&
              typeof c.with == 'function' &&
              typeof c.toString == 'function'
            : !1
        }
        constructor(c, l, m, N, A, M = !1) {
          typeof c == 'object'
            ? ((this.scheme = c.scheme || w),
              (this.authority = c.authority || w),
              (this.path = c.path || w),
              (this.query = c.query || w),
              (this.fragment = c.fragment || w))
            : ((this.scheme = h(c, M)),
              (this.authority = l || w),
              (this.path = a(this.scheme, m || w)),
              (this.query = N || w),
              (this.fragment = A || w),
              L(this, M))
        }
        get fsPath() {
          return _(this, !1)
        }
        with(c) {
          if (!c) return this
          let { scheme: l, authority: m, path: N, query: A, fragment: M } = c
          return (
            l === void 0 ? (l = this.scheme) : l === null && (l = w),
            m === void 0 ? (m = this.authority) : m === null && (m = w),
            N === void 0 ? (N = this.path) : N === null && (N = w),
            A === void 0 ? (A = this.query) : A === null && (A = w),
            M === void 0 ? (M = this.fragment) : M === null && (M = w),
            l === this.scheme &&
            m === this.authority &&
            N === this.path &&
            A === this.query &&
            M === this.fragment
              ? this
              : new g(l, m, N, A, M)
          )
        }
        static parse(c, l = !1) {
          const m = b.exec(c)
          return m
            ? new g(m[2] || w, u(m[4] || w), u(m[5] || w), u(m[7] || w), u(m[9] || w), l)
            : new g(w, w, w, w, w)
        }
        static file(c) {
          let l = w
          if ((D.isWindows && (c = c.replace(/\\/g, e)), c[0] === e && c[1] === e)) {
            const m = c.indexOf(e, 2)
            m === -1
              ? ((l = c.substring(2)), (c = e))
              : ((l = c.substring(2, m)), (c = c.substring(m) || e))
          }
          return new g('file', l, c, w, w)
        }
        static from(c) {
          const l = new g(c.scheme, c.authority, c.path, c.query, c.fragment)
          return L(l, !0), l
        }
        static joinPath(c, ...l) {
          if (!c.path) throw new Error('[UriError]: cannot call joinPath on URI without path')
          let m
          return (
            D.isWindows && c.scheme === 'file'
              ? (m = f.file(R.win32.join(_(c, !0), ...l)).path)
              : (m = R.posix.join(c.path, ...l)),
            c.with({ path: m })
          )
        }
        toString(c = !1) {
          return d(this, c)
        }
        toJSON() {
          return this
        }
        static revive(c) {
          if (c) {
            if (c instanceof f) return c
            {
              const l = new g(c)
              return (l._formatted = c.external), (l._fsPath = c._sep === v ? c.fsPath : null), l
            }
          } else return c
        }
      }
      n.URI = f
      const v = D.isWindows ? 1 : void 0
      class g extends f {
        constructor() {
          super(...arguments), (this._formatted = null), (this._fsPath = null)
        }
        get fsPath() {
          return this._fsPath || (this._fsPath = _(this, !1)), this._fsPath
        }
        toString(c = !1) {
          return c
            ? d(this, !0)
            : (this._formatted || (this._formatted = d(this, !1)), this._formatted)
        }
        toJSON() {
          const c = { $mid: 1 }
          return (
            this._fsPath && ((c.fsPath = this._fsPath), (c._sep = v)),
            this._formatted && (c.external = this._formatted),
            this.path && (c.path = this.path),
            this.scheme && (c.scheme = this.scheme),
            this.authority && (c.authority = this.authority),
            this.query && (c.query = this.query),
            this.fragment && (c.fragment = this.fragment),
            c
          )
        }
      }
      const S = {
        [58]: '%3A',
        [47]: '%2F',
        [63]: '%3F',
        [35]: '%23',
        [91]: '%5B',
        [93]: '%5D',
        [64]: '%40',
        [33]: '%21',
        [36]: '%24',
        [38]: '%26',
        [39]: '%27',
        [40]: '%28',
        [41]: '%29',
        [42]: '%2A',
        [43]: '%2B',
        [44]: '%2C',
        [59]: '%3B',
        [61]: '%3D',
        [32]: '%20',
      }
      function E(o, c, l) {
        let m,
          N = -1
        for (let A = 0; A < o.length; A++) {
          const M = o.charCodeAt(A)
          if (
            (M >= 97 && M <= 122) ||
            (M >= 65 && M <= 90) ||
            (M >= 48 && M <= 57) ||
            M === 45 ||
            M === 46 ||
            M === 95 ||
            M === 126 ||
            (c && M === 47) ||
            (l && M === 91) ||
            (l && M === 93) ||
            (l && M === 58)
          )
            N !== -1 && ((m += encodeURIComponent(o.substring(N, A))), (N = -1)),
              m !== void 0 && (m += o.charAt(A))
          else {
            m === void 0 && (m = o.substr(0, A))
            const k = S[M]
            k !== void 0
              ? (N !== -1 && ((m += encodeURIComponent(o.substring(N, A))), (N = -1)), (m += k))
              : N === -1 && (N = A)
          }
        }
        return N !== -1 && (m += encodeURIComponent(o.substring(N))), m !== void 0 ? m : o
      }
      function y(o) {
        let c
        for (let l = 0; l < o.length; l++) {
          const m = o.charCodeAt(l)
          m === 35 || m === 63
            ? (c === void 0 && (c = o.substr(0, l)), (c += S[m]))
            : c !== void 0 && (c += o[l])
        }
        return c !== void 0 ? c : o
      }
      function _(o, c) {
        let l
        return (
          o.authority && o.path.length > 1 && o.scheme === 'file'
            ? (l = `//${o.authority}${o.path}`)
            : o.path.charCodeAt(0) === 47 &&
              ((o.path.charCodeAt(1) >= 65 && o.path.charCodeAt(1) <= 90) ||
                (o.path.charCodeAt(1) >= 97 && o.path.charCodeAt(1) <= 122)) &&
              o.path.charCodeAt(2) === 58
            ? c
              ? (l = o.path.substr(1))
              : (l = o.path[1].toLowerCase() + o.path.substr(2))
            : (l = o.path),
          D.isWindows && (l = l.replace(/\//g, '\\')),
          l
        )
      }
      n.uriToFsPath = _
      function d(o, c) {
        const l = c ? y : E
        let m = '',
          { scheme: N, authority: A, path: M, query: k, fragment: q } = o
        if ((N && ((m += N), (m += ':')), (A || N === 'file') && ((m += e), (m += e)), A)) {
          let I = A.indexOf('@')
          if (I !== -1) {
            const B = A.substr(0, I)
            ;(A = A.substr(I + 1)),
              (I = B.lastIndexOf(':')),
              I === -1
                ? (m += l(B, !1, !1))
                : ((m += l(B.substr(0, I), !1, !1)), (m += ':'), (m += l(B.substr(I + 1), !1, !0))),
              (m += '@')
          }
          ;(A = A.toLowerCase()),
            (I = A.lastIndexOf(':')),
            I === -1 ? (m += l(A, !1, !0)) : ((m += l(A.substr(0, I), !1, !0)), (m += A.substr(I)))
        }
        if (M) {
          if (M.length >= 3 && M.charCodeAt(0) === 47 && M.charCodeAt(2) === 58) {
            const I = M.charCodeAt(1)
            I >= 65 && I <= 90 && (M = `/${String.fromCharCode(I + 32)}:${M.substr(3)}`)
          } else if (M.length >= 2 && M.charCodeAt(1) === 58) {
            const I = M.charCodeAt(0)
            I >= 65 && I <= 90 && (M = `${String.fromCharCode(I + 32)}:${M.substr(2)}`)
          }
          m += l(M, !0, !1)
        }
        return (
          k && ((m += '?'), (m += l(k, !1, !1))), q && ((m += '#'), (m += c ? q : E(q, !1, !1))), m
        )
      }
      function C(o) {
        try {
          return decodeURIComponent(o)
        } catch {
          return o.length > 3 ? o.substr(0, 3) + C(o.substr(3)) : o
        }
      }
      const r = /(%[0-9A-Za-z][0-9A-Za-z])+/g
      function u(o) {
        return o.match(r) ? o.replace(r, (c) => C(c)) : o
      }
    }),
    Q(Y[58], X([0, 1, 4, 9, 11, 12, 8, 5]), function (x, n, R, D, i, s, p, L) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.create =
          n.SimpleWorkerServer =
          n.SimpleWorkerClient =
          n.logOnceWebWorkerWarning =
            void 0)
      const h = '$initialize'
      let a = !1
      function w(u) {
        !p.isWeb ||
          (a ||
            ((a = !0),
            console.warn(
              'Could not create web worker(s). Falling back to loading web worker code in main thread, which might cause UI freezes. Please see https://github.com/microsoft/monaco-editor#faq'
            )),
          console.warn(u.message))
      }
      n.logOnceWebWorkerWarning = w
      class e {
        constructor(o, c, l, m) {
          ;(this.vsWorker = o), (this.req = c), (this.method = l), (this.args = m), (this.type = 0)
        }
      }
      class b {
        constructor(o, c, l, m) {
          ;(this.vsWorker = o), (this.seq = c), (this.res = l), (this.err = m), (this.type = 1)
        }
      }
      class f {
        constructor(o, c, l, m) {
          ;(this.vsWorker = o),
            (this.req = c),
            (this.eventName = l),
            (this.arg = m),
            (this.type = 2)
        }
      }
      class v {
        constructor(o, c, l) {
          ;(this.vsWorker = o), (this.req = c), (this.event = l), (this.type = 3)
        }
      }
      class g {
        constructor(o, c) {
          ;(this.vsWorker = o), (this.req = c), (this.type = 4)
        }
      }
      class S {
        constructor(o) {
          ;(this._workerId = -1),
            (this._handler = o),
            (this._lastSentReq = 0),
            (this._pendingReplies = Object.create(null)),
            (this._pendingEmitters = new Map()),
            (this._pendingEvents = new Map())
        }
        setWorkerId(o) {
          this._workerId = o
        }
        sendMessage(o, c) {
          const l = String(++this._lastSentReq)
          return new Promise((m, N) => {
            ;(this._pendingReplies[l] = { resolve: m, reject: N }),
              this._send(new e(this._workerId, l, o, c))
          })
        }
        listen(o, c) {
          let l = null
          const m = new D.Emitter({
            onWillAddFirstListener: () => {
              ;(l = String(++this._lastSentReq)),
                this._pendingEmitters.set(l, m),
                this._send(new f(this._workerId, l, o, c))
            },
            onDidRemoveLastListener: () => {
              this._pendingEmitters.delete(l), this._send(new g(this._workerId, l)), (l = null)
            },
          })
          return m.event
        }
        handleMessage(o) {
          !o ||
            !o.vsWorker ||
            (this._workerId !== -1 && o.vsWorker !== this._workerId) ||
            this._handleMessage(o)
        }
        _handleMessage(o) {
          switch (o.type) {
            case 1:
              return this._handleReplyMessage(o)
            case 0:
              return this._handleRequestMessage(o)
            case 2:
              return this._handleSubscribeEventMessage(o)
            case 3:
              return this._handleEventMessage(o)
            case 4:
              return this._handleUnsubscribeEventMessage(o)
          }
        }
        _handleReplyMessage(o) {
          if (!this._pendingReplies[o.seq]) {
            console.warn('Got reply to unknown seq')
            return
          }
          const c = this._pendingReplies[o.seq]
          if ((delete this._pendingReplies[o.seq], o.err)) {
            let l = o.err
            o.err.$isError &&
              ((l = new Error()),
              (l.name = o.err.name),
              (l.message = o.err.message),
              (l.stack = o.err.stack)),
              c.reject(l)
            return
          }
          c.resolve(o.res)
        }
        _handleRequestMessage(o) {
          const c = o.req
          this._handler.handleMessage(o.method, o.args).then(
            (m) => {
              this._send(new b(this._workerId, c, m, void 0))
            },
            (m) => {
              m.detail instanceof Error &&
                (m.detail = (0, R.transformErrorForSerialization)(m.detail)),
                this._send(
                  new b(this._workerId, c, void 0, (0, R.transformErrorForSerialization)(m))
                )
            }
          )
        }
        _handleSubscribeEventMessage(o) {
          const c = o.req,
            l = this._handler.handleEvent(
              o.eventName,
              o.arg
            )((m) => {
              this._send(new v(this._workerId, c, m))
            })
          this._pendingEvents.set(c, l)
        }
        _handleEventMessage(o) {
          if (!this._pendingEmitters.has(o.req)) {
            console.warn('Got event for unknown req')
            return
          }
          this._pendingEmitters.get(o.req).fire(o.event)
        }
        _handleUnsubscribeEventMessage(o) {
          if (!this._pendingEvents.has(o.req)) {
            console.warn('Got unsubscribe for unknown req')
            return
          }
          this._pendingEvents.get(o.req).dispose(), this._pendingEvents.delete(o.req)
        }
        _send(o) {
          const c = []
          if (o.type === 0)
            for (let l = 0; l < o.args.length; l++)
              o.args[l] instanceof ArrayBuffer && c.push(o.args[l])
          else o.type === 1 && o.res instanceof ArrayBuffer && c.push(o.res)
          this._handler.sendMessage(o, c)
        }
      }
      class E extends i.Disposable {
        constructor(o, c, l) {
          super()
          let m = null
          ;(this._worker = this._register(
            o.create(
              'vs/base/common/worker/simpleWorker',
              (I) => {
                this._protocol.handleMessage(I)
              },
              (I) => {
                m?.(I)
              }
            )
          )),
            (this._protocol = new S({
              sendMessage: (I, B) => {
                this._worker.postMessage(I, B)
              },
              handleMessage: (I, B) => {
                if (typeof l[I] != 'function')
                  return Promise.reject(new Error('Missing method ' + I + ' on main thread host.'))
                try {
                  return Promise.resolve(l[I].apply(l, B))
                } catch (H) {
                  return Promise.reject(H)
                }
              },
              handleEvent: (I, B) => {
                if (_(I)) {
                  const H = l[I].call(l, B)
                  if (typeof H != 'function')
                    throw new Error(`Missing dynamic event ${I} on main thread host.`)
                  return H
                }
                if (y(I)) {
                  const H = l[I]
                  if (typeof H != 'function')
                    throw new Error(`Missing event ${I} on main thread host.`)
                  return H
                }
                throw new Error(`Malformed event name ${I}`)
              },
            })),
            this._protocol.setWorkerId(this._worker.getId())
          let N = null
          const A = globalThis.require
          typeof A < 'u' && typeof A.getConfig == 'function'
            ? (N = A.getConfig())
            : typeof globalThis.requirejs < 'u' && (N = globalThis.requirejs.s.contexts._.config)
          const M = (0, s.getAllMethodNames)(l)
          this._onModuleLoaded = this._protocol.sendMessage(h, [
            this._worker.getId(),
            JSON.parse(JSON.stringify(N)),
            c,
            M,
          ])
          const k = (I, B) => this._request(I, B),
            q = (I, B) => this._protocol.listen(I, B)
          this._lazyProxy = new Promise((I, B) => {
            ;(m = B),
              this._onModuleLoaded.then(
                (H) => {
                  I(d(H, k, q))
                },
                (H) => {
                  B(H), this._onError('Worker failed to load ' + c, H)
                }
              )
          })
        }
        getProxyObject() {
          return this._lazyProxy
        }
        _request(o, c) {
          return new Promise((l, m) => {
            this._onModuleLoaded.then(() => {
              this._protocol.sendMessage(o, c).then(l, m)
            }, m)
          })
        }
        _onError(o, c) {
          console.error(o), console.info(c)
        }
      }
      n.SimpleWorkerClient = E
      function y(u) {
        return u[0] === 'o' && u[1] === 'n' && L.isUpperAsciiLetter(u.charCodeAt(2))
      }
      function _(u) {
        return /^onDynamic/.test(u) && L.isUpperAsciiLetter(u.charCodeAt(9))
      }
      function d(u, o, c) {
        const l = (A) =>
            function () {
              const M = Array.prototype.slice.call(arguments, 0)
              return o(A, M)
            },
          m = (A) =>
            function (M) {
              return c(A, M)
            },
          N = {}
        for (const A of u) {
          if (_(A)) {
            N[A] = m(A)
            continue
          }
          if (y(A)) {
            N[A] = c(A, void 0)
            continue
          }
          N[A] = l(A)
        }
        return N
      }
      class C {
        constructor(o, c) {
          ;(this._requestHandlerFactory = c),
            (this._requestHandler = null),
            (this._protocol = new S({
              sendMessage: (l, m) => {
                o(l, m)
              },
              handleMessage: (l, m) => this._handleMessage(l, m),
              handleEvent: (l, m) => this._handleEvent(l, m),
            }))
        }
        onmessage(o) {
          this._protocol.handleMessage(o)
        }
        _handleMessage(o, c) {
          if (o === h) return this.initialize(c[0], c[1], c[2], c[3])
          if (!this._requestHandler || typeof this._requestHandler[o] != 'function')
            return Promise.reject(new Error('Missing requestHandler or method: ' + o))
          try {
            return Promise.resolve(this._requestHandler[o].apply(this._requestHandler, c))
          } catch (l) {
            return Promise.reject(l)
          }
        }
        _handleEvent(o, c) {
          if (!this._requestHandler) throw new Error('Missing requestHandler')
          if (_(o)) {
            const l = this._requestHandler[o].call(this._requestHandler, c)
            if (typeof l != 'function')
              throw new Error(`Missing dynamic event ${o} on request handler.`)
            return l
          }
          if (y(o)) {
            const l = this._requestHandler[o]
            if (typeof l != 'function') throw new Error(`Missing event ${o} on request handler.`)
            return l
          }
          throw new Error(`Malformed event name ${o}`)
        }
        initialize(o, c, l, m) {
          this._protocol.setWorkerId(o)
          const M = d(
            m,
            (k, q) => this._protocol.sendMessage(k, q),
            (k, q) => this._protocol.listen(k, q)
          )
          return this._requestHandlerFactory
            ? ((this._requestHandler = this._requestHandlerFactory(M)),
              Promise.resolve((0, s.getAllMethodNames)(this._requestHandler)))
            : (c &&
                (typeof c.baseUrl < 'u' && delete c.baseUrl,
                typeof c.paths < 'u' && typeof c.paths.vs < 'u' && delete c.paths.vs,
                typeof c.trustedTypesPolicy !== void 0 && delete c.trustedTypesPolicy,
                (c.catchError = !0),
                globalThis.require.config(c)),
              new Promise((k, q) => {
                ;(globalThis.require || x)(
                  [l],
                  (B) => {
                    if (((this._requestHandler = B.create(M)), !this._requestHandler)) {
                      q(new Error('No RequestHandler!'))
                      return
                    }
                    k((0, s.getAllMethodNames)(this._requestHandler))
                  },
                  q
                )
              }))
        }
      }
      n.SimpleWorkerServer = C
      function r(u) {
        return new C(u, null)
      }
      n.create = r
    }),
    Q(Y[54], X([0, 1, 9, 11]), function (x, n, R, D) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }), (n.TokenizationRegistry = void 0)
      class i {
        constructor() {
          ;(this._tokenizationSupports = new Map()),
            (this._factories = new Map()),
            (this._onDidChange = new R.Emitter()),
            (this.onDidChange = this._onDidChange.event),
            (this._colorMap = null)
        }
        handleChange(L) {
          this._onDidChange.fire({ changedLanguages: L, changedColorMap: !1 })
        }
        register(L, h) {
          return (
            this._tokenizationSupports.set(L, h),
            this.handleChange([L]),
            (0, D.toDisposable)(() => {
              this._tokenizationSupports.get(L) === h &&
                (this._tokenizationSupports.delete(L), this.handleChange([L]))
            })
          )
        }
        get(L) {
          return this._tokenizationSupports.get(L) || null
        }
        registerFactory(L, h) {
          var a
          ;(a = this._factories.get(L)) === null || a === void 0 || a.dispose()
          const w = new s(this, L, h)
          return (
            this._factories.set(L, w),
            (0, D.toDisposable)(() => {
              const e = this._factories.get(L)
              !e || e !== w || (this._factories.delete(L), e.dispose())
            })
          )
        }
        getOrCreate(L) {
          return be(this, void 0, void 0, function* () {
            const h = this.get(L)
            if (h) return h
            const a = this._factories.get(L)
            return !a || a.isResolved ? null : (yield a.resolve(), this.get(L))
          })
        }
        isResolved(L) {
          if (this.get(L)) return !0
          const a = this._factories.get(L)
          return !!(!a || a.isResolved)
        }
        setColorMap(L) {
          ;(this._colorMap = L),
            this._onDidChange.fire({
              changedLanguages: Array.from(this._tokenizationSupports.keys()),
              changedColorMap: !0,
            })
        }
        getColorMap() {
          return this._colorMap
        }
        getDefaultBackground() {
          return this._colorMap && this._colorMap.length > 2 ? this._colorMap[2] : null
        }
      }
      n.TokenizationRegistry = i
      class s extends D.Disposable {
        get isResolved() {
          return this._isResolved
        }
        constructor(L, h, a) {
          super(),
            (this._registry = L),
            (this._languageId = h),
            (this._factory = a),
            (this._isDisposed = !1),
            (this._resolvePromise = null),
            (this._isResolved = !1)
        }
        dispose() {
          ;(this._isDisposed = !0), super.dispose()
        }
        resolve() {
          return be(this, void 0, void 0, function* () {
            return (
              this._resolvePromise || (this._resolvePromise = this._create()), this._resolvePromise
            )
          })
        }
        _create() {
          return be(this, void 0, void 0, function* () {
            const L = yield this._factory.tokenizationSupport
            ;(this._isResolved = !0),
              L && !this._isDisposed && this._register(this._registry.register(this._languageId, L))
          })
        }
      }
    }),
    Q(Y[55], X([0, 1, 32, 13, 2, 54]), function (x, n, R, D, i, s) {
      'use strict'
      Object.defineProperty(n, '__esModule', { value: !0 }),
        (n.TokenizationRegistry =
          n.LazyTokenizationSupport =
          n.InlayHintKind =
          n.Command =
          n.FoldingRangeKind =
          n.SymbolKinds =
          n.isLocationLink =
          n.DocumentHighlightKind =
          n.SignatureHelpTriggerKind =
          n.InlineCompletionTriggerKind =
          n.CompletionItemKinds =
          n.EncodedTokenizationResult =
          n.TokenizationResult =
          n.Token =
            void 0)
      class p {
        constructor(d, C, r) {
          ;(this.offset = d), (this.type = C), (this.language = r), (this._tokenBrand = void 0)
        }
        toString() {
          return '(' + this.offset + ', ' + this.type + ')'
        }
      }
      n.Token = p
      class L {
        constructor(d, C) {
          ;(this.tokens = d), (this.endState = C), (this._tokenizationResultBrand = void 0)
        }
      }
      n.TokenizationResult = L
      class h {
        constructor(d, C) {
          ;(this.tokens = d), (this.endState = C), (this._encodedTokenizationResultBrand = void 0)
        }
      }
      n.EncodedTokenizationResult = h
      var a
      ;(function (_) {
        const d = new Map()
        d.set(0, R.Codicon.symbolMethod),
          d.set(1, R.Codicon.symbolFunction),
          d.set(2, R.Codicon.symbolConstructor),
          d.set(3, R.Codicon.symbolField),
          d.set(4, R.Codicon.symbolVariable),
          d.set(5, R.Codicon.symbolClass),
          d.set(6, R.Codicon.symbolStruct),
          d.set(7, R.Codicon.symbolInterface),
          d.set(8, R.Codicon.symbolModule),
          d.set(9, R.Codicon.symbolProperty),
          d.set(10, R.Codicon.symbolEvent),
          d.set(11, R.Codicon.symbolOperator),
          d.set(12, R.Codicon.symbolUnit),
          d.set(13, R.Codicon.symbolValue),
          d.set(15, R.Codicon.symbolEnum),
          d.set(14, R.Codicon.symbolConstant),
          d.set(15, R.Codicon.symbolEnum),
          d.set(16, R.Codicon.symbolEnumMember),
          d.set(17, R.Codicon.symbolKeyword),
          d.set(27, R.Codicon.symbolSnippet),
          d.set(18, R.Codicon.symbolText),
          d.set(19, R.Codicon.symbolColor),
          d.set(20, R.Codicon.symbolFile),
          d.set(21, R.Codicon.symbolReference),
          d.set(22, R.Codicon.symbolCustomColor),
          d.set(23, R.Codicon.symbolFolder),
          d.set(24, R.Codicon.symbolTypeParameter),
          d.set(25, R.Codicon.account),
          d.set(26, R.Codicon.issues)
        function C(o) {
          let c = d.get(o)
          return (
            c ||
              (console.info('No codicon found for CompletionItemKind ' + o),
              (c = R.Codicon.symbolProperty)),
            c
          )
        }
        _.toIcon = C
        const r = new Map()
        r.set('method', 0),
          r.set('function', 1),
          r.set('constructor', 2),
          r.set('field', 3),
          r.set('variable', 4),
          r.set('class', 5),
          r.set('struct', 6),
          r.set('interface', 7),
          r.set('module', 8),
          r.set('property', 9),
          r.set('event', 10),
          r.set('operator', 11),
          r.set('unit', 12),
          r.set('value', 13),
          r.set('constant', 14),
          r.set('enum', 15),
          r.set('enum-member', 16),
          r.set('enumMember', 16),
          r.set('keyword', 17),
          r.set('snippet', 27),
          r.set('text', 18),
          r.set('color', 19),
          r.set('file', 20),
          r.set('reference', 21),
          r.set('customcolor', 22),
          r.set('folder', 23),
          r.set('type-parameter', 24),
          r.set('typeParameter', 24),
          r.set('account', 25),
          r.set('issue', 26)
        function u(o, c) {
          let l = r.get(o)
          return typeof l > 'u' && !c && (l = 9), l
        }
        _.fromString = u
      })((a = n.CompletionItemKinds || (n.CompletionItemKinds = {})))
      var w
      ;(function (_) {
        ;(_[(_.Automatic = 0)] = 'Automatic'), (_[(_.Explicit = 1)] = 'Explicit')
      })((w = n.InlineCompletionTriggerKind || (n.InlineCompletionTriggerKind = {})))
      var e
      ;(function (_) {
        ;(_[(_.Invoke = 1)] = 'Invoke'),
          (_[(_.TriggerCharacter = 2)] = 'TriggerCharacter'),
          (_[(_.ContentChange = 3)] = 'ContentChange')
      })((e = n.SignatureHelpTriggerKind || (n.SignatureHelpTriggerKind = {})))
      var b
      ;(function (_) {
        ;(_[(_.Text = 0)] = 'Text'), (_[(_.Read = 1)] = 'Read'), (_[(_.Write = 2)] = 'Write')
      })((b = n.DocumentHighlightKind || (n.DocumentHighlightKind = {})))
      function f(_) {
        return (
          _ &&
          D.URI.isUri(_.uri) &&
          i.Range.isIRange(_.range) &&
          (i.Range.isIRange(_.originSelectionRange) || i.Range.isIRange(_.targetSelectionRange))
        )
      }
      n.isLocationLink = f
      var v
      ;(function (_) {
        const d = new Map()
        d.set(0, R.Codicon.symbolFile),
          d.set(1, R.Codicon.symbolModule),
          d.set(2, R.Codicon.symbolNamespace),
          d.set(3, R.Codicon.symbolPackage),
          d.set(4, R.Codicon.symbolClass),
          d.set(5, R.Codicon.symbolMethod),
          d.set(6, R.Codicon.symbolProperty),
          d.set(7, R.Codicon.symbolField),
          d.set(8, R.Codicon.symbolConstructor),
          d.set(9, R.Codicon.symbolEnum),
          d.set(10, R.Codicon.symbolInterface),
          d.set(11, R.Codicon.symbolFunction),
          d.set(12, R.Codicon.symbolVariable),
          d.set(13, R.Codicon.symbolConstant),
          d.set(14, R.Codicon.symbolString),
          d.set(15, R.Codicon.symbolNumber),
          d.set(16, R.Codicon.symbolBoolean),
          d.set(17, R.Codicon.symbolArray),
          d.set(18, R.Codicon.symbolObject),
          d.set(19, R.Codicon.symbolKey),
          d.set(20, R.Codicon.symbolNull),
          d.set(21, R.Codicon.symbolEnumMember),
          d.set(22, R.Codicon.symbolStruct),
          d.set(23, R.Codicon.symbolEvent),
          d.set(24, R.Codicon.symbolOperator),
          d.set(25, R.Codicon.symbolTypeParameter)
        function C(r) {
          let u = d.get(r)
          return (
            u ||
              (console.info('No codicon found for SymbolKind ' + r),
              (u = R.Codicon.symbolProperty)),
            u
          )
        }
        _.toIcon = C
      })((v = n.SymbolKinds || (n.SymbolKinds = {})))
      class g {
        static fromValue(d) {
          switch (d) {
            case 'comment':
              return g.Comment
            case 'imports':
              return g.Imports
            case 'region':
              return g.Region
          }
          return new g(d)
        }
        constructor(d) {
          this.value = d
        }
      }
      ;(g.Comment = new g('comment')),
        (g.Imports = new g('imports')),
        (g.Region = new g('region')),
        (n.FoldingRangeKind = g)
      var S
      ;(function (_) {
        function d(C) {
          return !C || typeof C != 'object'
            ? !1
            : typeof C.id == 'string' && typeof C.title == 'string'
        }
        _.is = d
      })((S = n.Command || (n.Command = {})))
      var E
      ;(function (_) {
        ;(_[(_.Type = 1)] = 'Type'), (_[(_.Parameter = 2)] = 'Parameter')
      })((E = n.InlayHintKind || (n.InlayHintKind = {})))
      class y {
        constructor(d) {
          ;(this.createSupport = d), (this._tokenizationSupport = null)
        }
        dispose() {
          this._tokenizationSupport &&
            this._tokenizationSupport.then((d) => {
              d && d.dispose()
            })
        }
        get tokenizationSupport() {
          return (
            this._tokenizationSupport || (this._tokenizationSupport = this.createSupport()),
            this._tokenizationSupport
          )
        }
      }
      ;(n.LazyTokenizationSupport = y), (n.TokenizationRegistry = new s.TokenizationRegistry())
    }),
    Q(
      Y[56],
      X([0, 1, 53, 9, 29, 13, 3, 2, 33, 55, 49]),
      function (x, n, R, D, i, s, p, L, h, a, w) {
        'use strict'
        Object.defineProperty(n, '__esModule', { value: !0 }),
          (n.createMonacoBaseAPI = n.KeyMod = void 0)
        class e {
          static chord(v, g) {
            return (0, i.KeyChord)(v, g)
          }
        }
        ;(e.CtrlCmd = 2048), (e.Shift = 1024), (e.Alt = 512), (e.WinCtrl = 256), (n.KeyMod = e)
        function b() {
          return {
            editor: void 0,
            languages: void 0,
            CancellationTokenSource: R.CancellationTokenSource,
            Emitter: D.Emitter,
            KeyCode: w.KeyCode,
            KeyMod: e,
            Position: p.Position,
            Range: L.Range,
            Selection: h.Selection,
            SelectionDirection: w.SelectionDirection,
            MarkerSeverity: w.MarkerSeverity,
            MarkerTag: w.MarkerTag,
            Uri: s.URI,
            Token: a.Token,
          }
        }
        n.createMonacoBaseAPI = b
      }
    ),
    Q(
      Y[59],
      X([0, 1, 17, 13, 3, 2, 46, 22, 42, 43, 56, 24, 48, 41, 12]),
      function (x, n, R, D, i, s, p, L, h, a, w, e, b, f, v) {
        'use strict'
        Object.defineProperty(n, '__esModule', { value: !0 }),
          (n.create = n.EditorSimpleWorker = void 0)
        class g extends p.MirrorTextModel {
          get uri() {
            return this._uri
          }
          get eol() {
            return this._eol
          }
          getValue() {
            return this.getText()
          }
          getLinesContent() {
            return this._lines.slice(0)
          }
          getLineCount() {
            return this._lines.length
          }
          getLineContent(_) {
            return this._lines[_ - 1]
          }
          getWordAtPosition(_, d) {
            const C = (0, L.getWordAtText)(
              _.column,
              (0, L.ensureValidWordDefinition)(d),
              this._lines[_.lineNumber - 1],
              0
            )
            return C ? new s.Range(_.lineNumber, C.startColumn, _.lineNumber, C.endColumn) : null
          }
          words(_) {
            const d = this._lines,
              C = this._wordenize.bind(this)
            let r = 0,
              u = '',
              o = 0,
              c = []
            return {
              *[Symbol.iterator]() {
                for (;;)
                  if (o < c.length) {
                    const l = u.substring(c[o].start, c[o].end)
                    ;(o += 1), yield l
                  } else if (r < d.length) (u = d[r]), (c = C(u, _)), (o = 0), (r += 1)
                  else break
              },
            }
          }
          getLineWords(_, d) {
            const C = this._lines[_ - 1],
              r = this._wordenize(C, d),
              u = []
            for (const o of r)
              u.push({
                word: C.substring(o.start, o.end),
                startColumn: o.start + 1,
                endColumn: o.end + 1,
              })
            return u
          }
          _wordenize(_, d) {
            const C = []
            let r
            for (d.lastIndex = 0; (r = d.exec(_)) && r[0].length !== 0; )
              C.push({ start: r.index, end: r.index + r[0].length })
            return C
          }
          getValueInRange(_) {
            if (((_ = this._validateRange(_)), _.startLineNumber === _.endLineNumber))
              return this._lines[_.startLineNumber - 1].substring(
                _.startColumn - 1,
                _.endColumn - 1
              )
            const d = this._eol,
              C = _.startLineNumber - 1,
              r = _.endLineNumber - 1,
              u = []
            u.push(this._lines[C].substring(_.startColumn - 1))
            for (let o = C + 1; o < r; o++) u.push(this._lines[o])
            return u.push(this._lines[r].substring(0, _.endColumn - 1)), u.join(d)
          }
          offsetAt(_) {
            return (
              (_ = this._validatePosition(_)),
              this._ensureLineStarts(),
              this._lineStarts.getPrefixSum(_.lineNumber - 2) + (_.column - 1)
            )
          }
          positionAt(_) {
            ;(_ = Math.floor(_)), (_ = Math.max(0, _)), this._ensureLineStarts()
            const d = this._lineStarts.getIndexOf(_),
              C = this._lines[d.index].length
            return { lineNumber: 1 + d.index, column: 1 + Math.min(d.remainder, C) }
          }
          _validateRange(_) {
            const d = this._validatePosition({
                lineNumber: _.startLineNumber,
                column: _.startColumn,
              }),
              C = this._validatePosition({ lineNumber: _.endLineNumber, column: _.endColumn })
            return d.lineNumber !== _.startLineNumber ||
              d.column !== _.startColumn ||
              C.lineNumber !== _.endLineNumber ||
              C.column !== _.endColumn
              ? {
                  startLineNumber: d.lineNumber,
                  startColumn: d.column,
                  endLineNumber: C.lineNumber,
                  endColumn: C.column,
                }
              : _
          }
          _validatePosition(_) {
            if (!i.Position.isIPosition(_)) throw new Error('bad position')
            let { lineNumber: d, column: C } = _,
              r = !1
            if (d < 1) (d = 1), (C = 1), (r = !0)
            else if (d > this._lines.length)
              (d = this._lines.length), (C = this._lines[d - 1].length + 1), (r = !0)
            else {
              const u = this._lines[d - 1].length + 1
              C < 1 ? ((C = 1), (r = !0)) : C > u && ((C = u), (r = !0))
            }
            return r ? { lineNumber: d, column: C } : _
          }
        }
        class S {
          constructor(_, d) {
            ;(this._host = _),
              (this._models = Object.create(null)),
              (this._foreignModuleFactory = d),
              (this._foreignModule = null)
          }
          dispose() {
            this._models = Object.create(null)
          }
          _getModel(_) {
            return this._models[_]
          }
          _getModels() {
            const _ = []
            return Object.keys(this._models).forEach((d) => _.push(this._models[d])), _
          }
          acceptNewModel(_) {
            this._models[_.url] = new g(D.URI.parse(_.url), _.lines, _.EOL, _.versionId)
          }
          acceptModelChanged(_, d) {
            if (!this._models[_]) return
            this._models[_].onEvents(d)
          }
          acceptRemovedModel(_) {
            !this._models[_] || delete this._models[_]
          }
          computeUnicodeHighlights(_, d, C) {
            return be(this, void 0, void 0, function* () {
              const r = this._getModel(_)
              return r
                ? b.UnicodeTextModelHighlighter.computeUnicodeHighlights(r, d, C)
                : {
                    ranges: [],
                    hasMore: !1,
                    ambiguousCharacterCount: 0,
                    invisibleCharacterCount: 0,
                    nonBasicAsciiCharacterCount: 0,
                  }
            })
          }
          computeDiff(_, d, C, r) {
            return be(this, void 0, void 0, function* () {
              const u = this._getModel(_),
                o = this._getModel(d)
              return !u || !o ? null : S.computeDiff(u, o, C, r)
            })
          }
          static computeDiff(_, d, C, r) {
            const u =
                r === 'experimental'
                  ? f.linesDiffComputers.experimental
                  : f.linesDiffComputers.smart,
              o = _.getLinesContent(),
              c = d.getLinesContent(),
              l = u.computeDiff(o, c, C)
            return {
              identical: l.changes.length > 0 ? !1 : this._modelsAreIdentical(_, d),
              quitEarly: l.hitTimeout,
              changes: l.changes.map((N) => {
                var A
                return [
                  N.originalRange.startLineNumber,
                  N.originalRange.endLineNumberExclusive,
                  N.modifiedRange.startLineNumber,
                  N.modifiedRange.endLineNumberExclusive,
                  (A = N.innerChanges) === null || A === void 0
                    ? void 0
                    : A.map((M) => [
                        M.originalRange.startLineNumber,
                        M.originalRange.startColumn,
                        M.originalRange.endLineNumber,
                        M.originalRange.endColumn,
                        M.modifiedRange.startLineNumber,
                        M.modifiedRange.startColumn,
                        M.modifiedRange.endLineNumber,
                        M.modifiedRange.endColumn,
                      ]),
                ]
              }),
            }
          }
          static _modelsAreIdentical(_, d) {
            const C = _.getLineCount(),
              r = d.getLineCount()
            if (C !== r) return !1
            for (let u = 1; u <= C; u++) {
              const o = _.getLineContent(u),
                c = d.getLineContent(u)
              if (o !== c) return !1
            }
            return !0
          }
          computeMoreMinimalEdits(_, d, C) {
            return be(this, void 0, void 0, function* () {
              const r = this._getModel(_)
              if (!r) return d
              const u = []
              let o
              d = d.slice(0).sort((c, l) => {
                if (c.range && l.range) return s.Range.compareRangesUsingStarts(c.range, l.range)
                const m = c.range ? 0 : 1,
                  N = l.range ? 0 : 1
                return m - N
              })
              for (let { range: c, text: l, eol: m } of d) {
                if ((typeof m == 'number' && (o = m), s.Range.isEmpty(c) && !l)) continue
                const N = r.getValueInRange(c)
                if (((l = l.replace(/\r\n|\n|\r/g, r.eol)), N === l)) continue
                if (Math.max(l.length, N.length) > S._diffLimit) {
                  u.push({ range: c, text: l })
                  continue
                }
                const A = (0, R.stringDiff)(N, l, C),
                  M = r.offsetAt(s.Range.lift(c).getStartPosition())
                for (const k of A) {
                  const q = r.positionAt(M + k.originalStart),
                    I = r.positionAt(M + k.originalStart + k.originalLength),
                    B = {
                      text: l.substr(k.modifiedStart, k.modifiedLength),
                      range: {
                        startLineNumber: q.lineNumber,
                        startColumn: q.column,
                        endLineNumber: I.lineNumber,
                        endColumn: I.column,
                      },
                    }
                  r.getValueInRange(B.range) !== B.text && u.push(B)
                }
              }
              return (
                typeof o == 'number' &&
                  u.push({
                    eol: o,
                    text: '',
                    range: { startLineNumber: 0, startColumn: 0, endLineNumber: 0, endColumn: 0 },
                  }),
                u
              )
            })
          }
          computeLinks(_) {
            return be(this, void 0, void 0, function* () {
              const d = this._getModel(_)
              return d ? (0, h.computeLinks)(d) : null
            })
          }
          textualSuggest(_, d, C, r) {
            return be(this, void 0, void 0, function* () {
              const u = new e.StopWatch(!0),
                o = new RegExp(C, r),
                c = new Set()
              e: for (const l of _) {
                const m = this._getModel(l)
                if (!!m) {
                  for (const N of m.words(o))
                    if (!(N === d || !isNaN(Number(N))) && (c.add(N), c.size > S._suggestionsLimit))
                      break e
                }
              }
              return { words: Array.from(c), duration: u.elapsed() }
            })
          }
          computeWordRanges(_, d, C, r) {
            return be(this, void 0, void 0, function* () {
              const u = this._getModel(_)
              if (!u) return Object.create(null)
              const o = new RegExp(C, r),
                c = Object.create(null)
              for (let l = d.startLineNumber; l < d.endLineNumber; l++) {
                const m = u.getLineWords(l, o)
                for (const N of m) {
                  if (!isNaN(Number(N.word))) continue
                  let A = c[N.word]
                  A || ((A = []), (c[N.word] = A)),
                    A.push({
                      startLineNumber: l,
                      startColumn: N.startColumn,
                      endLineNumber: l,
                      endColumn: N.endColumn,
                    })
                }
              }
              return c
            })
          }
          navigateValueSet(_, d, C, r, u) {
            return be(this, void 0, void 0, function* () {
              const o = this._getModel(_)
              if (!o) return null
              const c = new RegExp(r, u)
              d.startColumn === d.endColumn &&
                (d = {
                  startLineNumber: d.startLineNumber,
                  startColumn: d.startColumn,
                  endLineNumber: d.endLineNumber,
                  endColumn: d.endColumn + 1,
                })
              const l = o.getValueInRange(d),
                m = o.getWordAtPosition({ lineNumber: d.startLineNumber, column: d.startColumn }, c)
              if (!m) return null
              const N = o.getValueInRange(m)
              return a.BasicInplaceReplace.INSTANCE.navigateValueSet(d, l, m, N, C)
            })
          }
          loadForeignModule(_, d, C) {
            const r = (c, l) => this._host.fhr(c, l),
              o = { host: (0, v.createProxyObject)(C, r), getMirrorModels: () => this._getModels() }
            return this._foreignModuleFactory
              ? ((this._foreignModule = this._foreignModuleFactory(o, d)),
                Promise.resolve((0, v.getAllMethodNames)(this._foreignModule)))
              : new Promise((c, l) => {
                  x(
                    [_],
                    (m) => {
                      ;(this._foreignModule = m.create(o, d)),
                        c((0, v.getAllMethodNames)(this._foreignModule))
                    },
                    l
                  )
                })
          }
          fmr(_, d) {
            if (!this._foreignModule || typeof this._foreignModule[_] != 'function')
              return Promise.reject(new Error('Missing requestHandler or method: ' + _))
            try {
              return Promise.resolve(this._foreignModule[_].apply(this._foreignModule, d))
            } catch (C) {
              return Promise.reject(C)
            }
          }
        }
        ;(S._diffLimit = 1e5), (S._suggestionsLimit = 1e4), (n.EditorSimpleWorker = S)
        function E(y) {
          return new S(y, null)
        }
        ;(n.create = E),
          typeof importScripts == 'function' && (globalThis.monaco = (0, w.createMonacoBaseAPI)())
      }
    )
}).call(this)

//# sourceMappingURL=../../../../min-maps/vs/base/worker/workerMain.js.map
