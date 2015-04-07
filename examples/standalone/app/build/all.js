(function (global){


var ym = {"project":{"namespace":"ym","jsonpPrefix":"","loadLimit":500},"env":{}};

var _backup_modules = this['modules'];
/**
 * Modules
 *
 * Copyright (c) 2013 Filatov Dmitry (dfilatov@yandex-team.ru)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 * @version 0.1.0
 */

(function(global) {

var undef,

    DECL_STATES = {
        NOT_RESOLVED : 'NOT_RESOLVED',
        IN_RESOLVING : 'IN_RESOLVING',
        RESOLVED     : 'RESOLVED'
    },

    /**
     * Creates a new instance of modular system
     * @returns {Object}
     */
    create = function() {
        var curOptions = {
                trackCircularDependencies : true,
                allowMultipleDeclarations : true
            },

            modulesStorage = {},
            waitForNextTick = false,
            pendingRequires = [],

            /**
             * Defines module
             * @param {String} name
             * @param {String[]} [deps]
             * @param {Function} declFn
             */
            define = function(name, deps, declFn) {
                if(!declFn) {
                    declFn = deps;
                    deps = [];
                }

                var module = modulesStorage[name];
                if(!module) {
                    module = modulesStorage[name] = {
                        name : name,
                        decl : undef
                    };
                }

                module.decl = {
                    name       : name,
                    prev       : module.decl,
                    fn         : declFn,
                    state      : DECL_STATES.NOT_RESOLVED,
                    deps       : deps,
                    dependents : [],
                    exports    : undef
                };
            },

            /**
             * Requires modules
             * @param {String|String[]} modules
             * @param {Function} cb
             * @param {Function} [errorCb]
             */
            require = function(modules, cb, errorCb) {
                if(typeof modules === 'string') {
                    modules = [modules];
                }

                if(!waitForNextTick) {
                    waitForNextTick = true;
                    nextTick(onNextTick);
                }

                pendingRequires.push({
                    deps : modules,
                    cb   : function(exports, error) {
                        error?
                            (errorCb || onError)(error) :
                            cb.apply(global, exports);
                    }
                });
            },

            /**
             * Returns state of module
             * @param {String} name
             * @returns {String} state, possible values are NOT_DEFINED, NOT_RESOLVED, IN_RESOLVING, RESOLVED
             */
            getState = function(name) {
                var module = modulesStorage[name];
                return module?
                    DECL_STATES[module.decl.state] :
                    'NOT_DEFINED';
            },

            /**
             * Returns dependencies of module
             * @param {String} name
             * @returns {String[]|null}
             */
            getDependencies = function (name) {
                var module = modulesStorage[name];
                return module ? module.decl.deps : null;
            },

            /**
             * Returns whether the module is defined
             * @param {String} name
             * @returns {Boolean}
             */
            isDefined = function(name) {
                return !!modulesStorage[name];
            },

            /**
             * Sets options
             * @param {Object} options
             */
            setOptions = function(options) {
                for(var name in options) {
                    if(options.hasOwnProperty(name)) {
                        curOptions[name] = options[name];
                    }
                }
            },

            onNextTick = function() {
                waitForNextTick = false;
                applyRequires();
            },

            applyRequires = function() {
                var requiresToProcess = pendingRequires,
                    i = 0, require;

                pendingRequires = [];

                while(require = requiresToProcess[i++]) {
                    requireDeps(null, require.deps, [], require.cb);
                }
            },

            requireDeps = function(fromDecl, deps, path, cb) {
                var unresolvedDepsCnt = deps.length;
                if(!unresolvedDepsCnt) {
                    cb([]);
                }

                var decls = [],
                    onDeclResolved = function(_, error) {
                        if(error) {
                            cb(null, error);
                            return;
                        }

                        if(!--unresolvedDepsCnt) {
                            var exports = [],
                                i = 0, decl;
                            while(decl = decls[i++]) {
                                exports.push(decl.exports);
                            }
                            cb(exports);
                        }
                    },
                    i = 0, len = unresolvedDepsCnt,
                    dep, decl;

                while(i < len) {
                    dep = deps[i++];
                    if(typeof dep === 'string') {
                        if(!modulesStorage[dep]) {
                            cb(null, buildModuleNotFoundError(dep, fromDecl));
                            return;
                        }

                        decl = modulesStorage[dep].decl;
                    }
                    else {
                        decl = dep;
                    }

                    decls.push(decl);

                    startDeclResolving(decl, path, onDeclResolved);
                }
            },

            startDeclResolving = function(decl, path, cb) {
                if(decl.state === DECL_STATES.RESOLVED) {
                    cb(decl.exports);
                    return;
                }
                else if(decl.state === DECL_STATES.IN_RESOLVING) {
                    curOptions.trackCircularDependencies && isDependenceCircular(decl, path)?
                        cb(null, buildCircularDependenceError(decl, path)) :
                        decl.dependents.push(cb);
                    return;
                }

                decl.dependents.push(cb);

                if(decl.prev && !curOptions.allowMultipleDeclarations) {
                    provideError(decl, buildMultipleDeclarationError(decl));
                    return;
                }

                curOptions.trackCircularDependencies && (path = path.slice()).push(decl);

                var isProvided = false,
                    deps = decl.prev? decl.deps.concat([decl.prev]) : decl.deps;

                decl.state = DECL_STATES.IN_RESOLVING;
                requireDeps(
                    decl,
                    deps,
                    path,
                    function(depDeclsExports, error) {
                        if(error) {
                            provideError(decl, error);
                            return;
                        }

                        depDeclsExports.unshift(function(exports, error) {
                            if(isProvided) {
                                cb(null, buildDeclAreadyProvidedError(decl));
                                return;
                            }

                            isProvided = true;
                            error?
                                provideError(decl, error) :
                                provideDecl(decl, exports);
                        });

                        decl.fn.apply(
                            {
                                name   : decl.name,
                                deps   : decl.deps,
                                global : global
                            },
                            depDeclsExports);
                    });
            },

            provideDecl = function(decl, exports) {
                decl.exports = exports;
                decl.state = DECL_STATES.RESOLVED;

                var i = 0, dependent;
                while(dependent = decl.dependents[i++]) {
                    dependent(exports);
                }

                decl.dependents = undef;
            },

            provideError = function(decl, error) {
                decl.state = DECL_STATES.NOT_RESOLVED;

                var i = 0, dependent;
                while(dependent = decl.dependents[i++]) {
                    dependent(null, error);
                }

                decl.dependents = [];
            };

        return {
            create          : create,
            define          : define,
            require         : require,
            getState        : getState,
            getDependencies : getDependencies,
            isDefined       : isDefined,
            setOptions      : setOptions,
            flush           : onNextTick
        };
    },

    onError = function(e) {
        nextTick(function() {
            throw e;
        });
    },

    buildModuleNotFoundError = function(name, decl) {
        return Error(decl?
            'Module "' + decl.name + '": can\'t resolve dependence "' + name + '"' :
            'Required module "' + name + '" can\'t be resolved');
    },

    buildCircularDependenceError = function(decl, path) {
        var strPath = [],
            i = 0, pathDecl;
        while(pathDecl = path[i++]) {
            strPath.push(pathDecl.name);
        }
        strPath.push(decl.name);

        return Error('Circular dependence has been detected: "' + strPath.join(' -> ') + '"');
    },

    buildDeclAreadyProvidedError = function(decl) {
        return Error('Declaration of module "' + decl.name + '" has already been provided');
    },

    buildMultipleDeclarationError = function(decl) {
        return Error('Multiple declarations of module "' + decl.name + '" have been detected');
    },

    isDependenceCircular = function(decl, path) {
        var i = 0, pathDecl;
        while(pathDecl = path[i++]) {
            if(decl === pathDecl) {
                return true;
            }
        }
        return false;
    },

    nextTick = (function() {
        var fns = [],
            enqueueFn = function(fn) {
                return fns.push(fn) === 1;
            },
            callFns = function() {
                var fnsToCall = fns, i = 0, len = fns.length;
                fns = [];
                while(i < len) {
                    fnsToCall[i++]();
                }
            };

        if(typeof process === 'object' && process.nextTick) { // nodejs
            return function(fn) {
                enqueueFn(fn) && process.nextTick(callFns);
            };
        }

        if(global.setImmediate) { // ie10
            return function(fn) {
                enqueueFn(fn) && global.setImmediate(callFns);
            };
        }

        if(global.postMessage && !global.opera) { // modern browsers
            var isPostMessageAsync = true;
            if(global.attachEvent) {
                var checkAsync = function() {
                        isPostMessageAsync = false;
                    };
                global.attachEvent('onmessage', checkAsync);
                global.postMessage('__checkAsync', '*');
                global.detachEvent('onmessage', checkAsync);
            }

            if(isPostMessageAsync) {
                var msg = '__modules' + (+new Date()),
                    onMessage = function(e) {
                        if(e.data === msg) {
                            e.stopPropagation && e.stopPropagation();
                            callFns();
                        }
                    };

                global.addEventListener?
                    global.addEventListener('message', onMessage, true) :
                    global.attachEvent('onmessage', onMessage);

                return function(fn) {
                    enqueueFn(fn) && global.postMessage(msg, '*');
                };
            }
        }

        var doc = global.document;
        if('onreadystatechange' in doc.createElement('script')) { // ie6-ie8
            var head = doc.getElementsByTagName('head')[0],
                createScript = function() {
                    var script = doc.createElement('script');
                    script.onreadystatechange = function() {
                        script.parentNode.removeChild(script);
                        script = script.onreadystatechange = null;
                        callFns();
                    };
                    head.appendChild(script);
                };

            return function(fn) {
                enqueueFn(fn) && createScript();
            };
        }

        return function(fn) { // old browsers
            enqueueFn(fn) && setTimeout(callFns, 0);
        };
    })();

if(typeof exports === 'object') {
    module.exports = create();
}
else {
    global.modules = create();
}

})(this);

ym['modules'] = this['modules'];
this['modules'] = _backup_modules;
_backup_modules = undefined;var ymModules = ym.modules;
ym.modules.setOptions({
   trackCircularDependencies: true,
   allowMultipleDeclarations: false
});

var _backup_vow = this['vow'];
/**
 * @module vow
 * @author Filatov Dmitry <dfilatov@yandex-team.ru>
 * @version 0.4.7
 * @license
 * Dual licensed under the MIT and GPL licenses:
 *   * http://www.opensource.org/licenses/mit-license.php
 *   * http://www.gnu.org/licenses/gpl.html
 */

(function(global) {

var undef,
    nextTick = (function() {
        var fns = [],
            enqueueFn = function(fn) {
                return fns.push(fn) === 1;
            },
            callFns = function() {
                var fnsToCall = fns, i = 0, len = fns.length;
                fns = [];
                while(i < len) {
                    fnsToCall[i++]();
                }
            };

        if(typeof setImmediate === 'function') { // ie10, nodejs >= 0.10
            return function(fn) {
                enqueueFn(fn) && setImmediate(callFns);
            };
        }

        if(typeof process === 'object' && process.nextTick) { // nodejs < 0.10
            return function(fn) {
                enqueueFn(fn) && process.nextTick(callFns);
            };
        }

        if(global.postMessage) { // modern browsers
            var isPostMessageAsync = true;
            if(global.attachEvent) {
                var checkAsync = function() {
                        isPostMessageAsync = false;
                    };
                global.attachEvent('onmessage', checkAsync);
                global.postMessage('__checkAsync', '*');
                global.detachEvent('onmessage', checkAsync);
            }

            if(isPostMessageAsync) {
                var msg = '__promise' + +new Date,
                    onMessage = function(e) {
                        if(e.data === msg) {
                            e.stopPropagation && e.stopPropagation();
                            callFns();
                        }
                    };

                global.addEventListener?
                    global.addEventListener('message', onMessage, true) :
                    global.attachEvent('onmessage', onMessage);

                return function(fn) {
                    enqueueFn(fn) && global.postMessage(msg, '*');
                };
            }
        }

        var doc = global.document;
        if('onreadystatechange' in doc.createElement('script')) { // ie6-ie8
            var createScript = function() {
                    var script = doc.createElement('script');
                    script.onreadystatechange = function() {
                        script.parentNode.removeChild(script);
                        script = script.onreadystatechange = null;
                        callFns();
                };
                (doc.documentElement || doc.body).appendChild(script);
            };

            return function(fn) {
                enqueueFn(fn) && createScript();
            };
        }

        return function(fn) { // old browsers
            enqueueFn(fn) && setTimeout(callFns, 0);
        };
    })(),
    safeExec = function(func, onError, ctx) {
        if (vow.debug) {
            ctx ? func.call(ctx) : func();
        } else {
            try {
                ctx ? func.call(ctx) : func();
            } catch (e) {
                ctx ? onError.call(ctx, e) : onError(e);
                return false;
            }
        }

        return true;
    },
    throwException = function(e) {
        nextTick(function() {
            throw e;
        });
    },
    isFunction = function(obj) {
        return typeof obj === 'function';
    },
    isObject = function(obj) {
        return obj !== null && typeof obj === 'object';
    },
    toStr = Object.prototype.toString,
    isArray = Array.isArray || function(obj) {
        return toStr.call(obj) === '[object Array]';
    },
    getArrayKeys = function(arr) {
        var res = [],
            i = 0, len = arr.length;
        while(i < len) {
            res.push(i++);
        }
        return res;
    },
    getObjectKeys = Object.keys || function(obj) {
        var res = [];
        for(var i in obj) {
            obj.hasOwnProperty(i) && res.push(i);
        }
        return res;
    },
    defineCustomErrorType = function(name) {
        var res = function(message) {
            this.name = name;
            this.message = message;
        };

        res.prototype = new Error();

        return res;
    },
    wrapOnFulfilled = function(onFulfilled, idx) {
        return function(val) {
            onFulfilled.call(this, val, idx);
        };
    };

/**
 * @class Deferred
 * @exports vow:Deferred
 * @description
 * The `Deferred` class is used to encapsulate newly-created promise object along with functions that resolve, reject or notify it.
 */

/**
 * @constructor
 * @description
 * You can use `vow.defer()` instead of using this constructor.
 *
 * `new vow.Deferred()` gives the same result as `vow.defer()`.
 */
var Deferred = function() {
    this._promise = new Promise();
};

Deferred.prototype = /** @lends Deferred.prototype */{
    /**
     * Returns corresponding promise.
     *
     * @returns {vow:Promise}
     */
    promise : function() {
        return this._promise;
    },

    /**
     * Resolves corresponding promise with given `value`.
     *
     * @param {*} value
     *
     * @example
     * ```js
     * var defer = vow.defer(),
     *     promise = defer.promise();
     *
     * promise.then(function(value) {
     *     // value is "'success'" here
     * });
     *
     * defer.resolve('success');
     * ```
     */
    resolve : function(value) {
        this._promise.isResolved() || this._promise._resolve(value);
    },

    /**
     * Rejects corresponding promise with given `reason`.
     *
     * @param {*} reason
     *
     * @example
     * ```js
     * var defer = vow.defer(),
     *     promise = defer.promise();
     *
     * promise.fail(function(reason) {
     *     // reason is "'something is wrong'" here
     * });
     *
     * defer.reject('something is wrong');
     * ```
     */
    reject : function(reason) {
        if(this._promise.isResolved()) {
            return;
        }

        if(vow.isPromise(reason)) {
            reason = reason.then(function(val) {
                var defer = vow.defer();
                defer.reject(val);
                return defer.promise();
            });
            this._promise._resolve(reason);
        }
        else {
            this._promise._reject(reason);
        }
    },

    /**
     * Notifies corresponding promise with given `value`.
     *
     * @param {*} value
     *
     * @example
     * ```js
     * var defer = vow.defer(),
     *     promise = defer.promise();
     *
     * promise.progress(function(value) {
     *     // value is "'20%'", "'40%'" here
     * });
     *
     * defer.notify('20%');
     * defer.notify('40%');
     * ```
     */
    notify : function(value) {
        this._promise.isResolved() || this._promise._notify(value);
    }
};

var PROMISE_STATUS = {
    PENDING   : 0,
    RESOLVED  : 1,
    FULFILLED : 2,
    REJECTED  : 3
};

/**
 * @class Promise
 * @exports vow:Promise
 * @description
 * The `Promise` class is used when you want to give to the caller something to subscribe to,
 * but not the ability to resolve or reject the deferred.
 */

/**
 * @constructor
 * @param {Function} resolver See https://github.com/domenic/promises-unwrapping/blob/master/README.md#the-promise-constructor for details.
 * @description
 * You should use this constructor directly only if you are going to use `vow` as DOM Promises implementation.
 * In other case you should use `vow.defer()` and `defer.promise()` methods.
 * @example
 * ```js
 * function fetchJSON(url) {
 *     return new vow.Promise(function(resolve, reject, notify) {
 *         var xhr = new XMLHttpRequest();
 *         xhr.open('GET', url);
 *         xhr.responseType = 'json';
 *         xhr.send();
 *         xhr.onload = function() {
 *             if(xhr.response) {
 *                 resolve(xhr.response);
 *             }
 *             else {
 *                 reject(new TypeError());
 *             }
 *         };
 *     });
 * }
 * ```
 */
var Promise = function(resolver) {
    this._value = undef;
    this._status = PROMISE_STATUS.PENDING;

    this._fulfilledCallbacks = [];
    this._rejectedCallbacks = [];
    this._progressCallbacks = [];

    if(resolver) { // NOTE: see https://github.com/domenic/promises-unwrapping/blob/master/README.md
        var _this = this,
            resolverFnLen = resolver.length;

        resolver(
            function(val) {
                _this.isResolved() || _this._resolve(val);
            },
            resolverFnLen > 1?
                function(reason) {
                    _this.isResolved() || _this._reject(reason);
                } :
                undef,
            resolverFnLen > 2?
                function(val) {
                    _this.isResolved() || _this._notify(val);
                } :
                undef);
    }
};

Promise.prototype = /** @lends Promise.prototype */ {
    /**
     * Returns value of fulfilled promise or reason in case of rejection.
     *
     * @returns {*}
     */
    valueOf : function() {
        return this._value;
    },

    /**
     * Returns `true` if promise is resolved.
     *
     * @returns {Boolean}
     */
    isResolved : function() {
        return this._status !== PROMISE_STATUS.PENDING;
    },

    /**
     * Returns `true` if promise is fulfilled.
     *
     * @returns {Boolean}
     */
    isFulfilled : function() {
        return this._status === PROMISE_STATUS.FULFILLED;
    },

    /**
     * Returns `true` if promise is rejected.
     *
     * @returns {Boolean}
     */
    isRejected : function() {
        return this._status === PROMISE_STATUS.REJECTED;
    },

    /**
     * Adds reactions to promise.
     *
     * @param {Function} [onFulfilled] Callback that will to be invoked with the value after promise has been fulfilled
     * @param {Function} [onRejected] Callback that will to be invoked with the reason after promise has been rejected
     * @param {Function} [onProgress] Callback that will to be invoked with the value after promise has been notified
     * @param {Object} [ctx] Context of callbacks execution
     * @returns {vow:Promise} A new promise, see https://github.com/promises-aplus/promises-spec for details
     */
    then : function(onFulfilled, onRejected, onProgress, ctx) {
        var defer = new Deferred();
        this._addCallbacks(defer, onFulfilled, onRejected, onProgress, ctx);
        return defer.promise();
    },

    /**
     * Adds rejection reaction only. It is shortcut for `promise.then(undefined, onRejected)`.
     *
     * @param {Function} onRejected Callback to be called with the value after promise has been rejected
     * @param {Object} [ctx] Context of callback execution
     * @returns {vow:Promise}
     */
    'catch' : function(onRejected, ctx) {
        return this.then(undef, onRejected, ctx);
    },

    /**
     * Adds rejection reaction only. It is shortcut for `promise.then(null, onRejected)`. It's alias for `catch`.
     *
     * @param {Function} onRejected Callback to be called with the value after promise has been rejected
     * @param {Object} [ctx] Context of callback execution
     * @returns {vow:Promise}
     */
    fail : function(onRejected, ctx) {
        return this.then(undef, onRejected, ctx);
    },

    /**
     * Adds resolving reaction (to fulfillment and rejection both).
     *
     * @param {Function} onResolved Callback that to be called with the value after promise has been rejected
     * @param {Object} [ctx] Context of callback execution
     * @returns {vow:Promise}
     */
    always : function(onResolved, ctx) {
        var _this = this,
            cb = function() {
                return onResolved.call(this, _this);
            };

        return this.then(cb, cb, ctx);
    },

    /**
     * Adds progress reaction.
     *
     * @param {Function} onProgress Callback to be called with the value when promise has been notified
     * @param {Object} [ctx] Context of callback execution
     * @returns {vow:Promise}
     */
    progress : function(onProgress, ctx) {
        return this.then(undef, undef, onProgress, ctx);
    },

    /**
     * Like `promise.then`, but "spreads" the array into a variadic value handler.
     * It is useful with `vow.all` and `vow.allResolved` methods.
     *
     * @param {Function} [onFulfilled] Callback that will to be invoked with the value after promise has been fulfilled
     * @param {Function} [onRejected] Callback that will to be invoked with the reason after promise has been rejected
     * @param {Object} [ctx] Context of callbacks execution
     * @returns {vow:Promise}
     *
     * @example
     * ```js
     * var defer1 = vow.defer(),
     *     defer2 = vow.defer();
     *
     * vow.all([defer1.promise(), defer2.promise()]).spread(function(arg1, arg2) {
     *     // arg1 is "1", arg2 is "'two'" here
     * });
     *
     * defer1.resolve(1);
     * defer2.resolve('two');
     * ```
     */
    spread : function(onFulfilled, onRejected, ctx) {
        return this.then(
            function(val) {
                return onFulfilled.apply(this, val);
            },
            onRejected,
            ctx);
    },

    /**
     * Like `then`, but terminates a chain of promises.
     * If the promise has been rejected, throws it as an exception in a future turn of the event loop.
     *
     * @param {Function} [onFulfilled] Callback that will to be invoked with the value after promise has been fulfilled
     * @param {Function} [onRejected] Callback that will to be invoked with the reason after promise has been rejected
     * @param {Function} [onProgress] Callback that will to be invoked with the value after promise has been notified
     * @param {Object} [ctx] Context of callbacks execution
     *
     * @example
     * ```js
     * var defer = vow.defer();
     * defer.reject(Error('Internal error'));
     * defer.promise().done(); // exception to be thrown
     * ```
     */
    done : function(onFulfilled, onRejected, onProgress, ctx) {
        this
            .then(onFulfilled, onRejected, onProgress, ctx)
            .fail(throwException);
    },

    /**
     * Returns a new promise that will be fulfilled in `delay` milliseconds if the promise is fulfilled,
     * or immediately rejected if promise is rejected.
     *
     * @param {Number} delay
     * @returns {vow:Promise}
     */
    delay : function(delay) {
        var timer,
            promise = this.then(function(val) {
                var defer = new Deferred();
                timer = setTimeout(
                    function() {
                        defer.resolve(val);
                    },
                    delay);

                return defer.promise();
            });

        promise.always(function() {
            clearTimeout(timer);
        });

        return promise;
    },

    /**
     * Returns a new promise that will be rejected in `timeout` milliseconds
     * if the promise is not resolved beforehand.
     *
     * @param {Number} timeout
     * @returns {vow:Promise}
     *
     * @example
     * ```js
     * var defer = vow.defer(),
     *     promiseWithTimeout1 = defer.promise().timeout(50),
     *     promiseWithTimeout2 = defer.promise().timeout(200);
     *
     * setTimeout(
     *     function() {
     *         defer.resolve('ok');
     *     },
     *     100);
     *
     * promiseWithTimeout1.fail(function(reason) {
     *     // promiseWithTimeout to be rejected in 50ms
     * });
     *
     * promiseWithTimeout2.then(function(value) {
     *     // promiseWithTimeout to be fulfilled with "'ok'" value
     * });
     * ```
     */
    timeout : function(timeout) {
        var defer = new Deferred(),
            timer = setTimeout(
                function() {
                    defer.reject(new vow.TimedOutError('timed out'));
                },
                timeout);

        this.then(
            function(val) {
                defer.resolve(val);
            },
            function(reason) {
                defer.reject(reason);
            });

        defer.promise().always(function() {
            clearTimeout(timer);
        });

        return defer.promise();
    },

    _vow : true,

    _resolve : function(val) {
        if(this._status > PROMISE_STATUS.RESOLVED) {
            return;
        }

        if(val === this) {
            this._reject(TypeError('Can\'t resolve promise with itself'));
            return;
        }

        this._status = PROMISE_STATUS.RESOLVED;

        if(val && !!val._vow) { // shortpath for vow.Promise
            val.isFulfilled()?
                this._fulfill(val.valueOf()) :
                val.isRejected()?
                    this._reject(val.valueOf()) :
                    val.then(
                        this._fulfill,
                        this._reject,
                        this._notify,
                        this);
            return;
        }

        if(isObject(val) || isFunction(val)) {
            var then,
                callSuccess = safeExec(function() {
                    then = val.then;
                }, function (e) {
                    this._reject(e);
                }, this);

            if (!callSuccess) {
                return;
            }

            if(isFunction(then)) {
                var _this = this,
                    isResolved = false;

                safeExec(function() {
                    then.call(
                        val,
                        function(val) {
                            if(isResolved) {
                                return;
                            }

                            isResolved = true;
                            _this._resolve(val);
                        },
                        function(err) {
                            if(isResolved) {
                                return;
                            }

                            isResolved = true;
                            _this._reject(err);
                        },
                        function(val) {
                            _this._notify(val);
                        });
                }, function(e) {
                    isResolved || this._reject(e);
                }, this);

                return;
            }
        }

        this._fulfill(val);
    },

    _fulfill : function(val) {
        if(this._status > PROMISE_STATUS.RESOLVED) {
            return;
        }

        this._status = PROMISE_STATUS.FULFILLED;
        this._value = val;

        this._callCallbacks(this._fulfilledCallbacks, val);
        this._fulfilledCallbacks = this._rejectedCallbacks = this._progressCallbacks = undef;
    },

    _reject : function(reason) {
        if(this._status > PROMISE_STATUS.RESOLVED) {
            return;
        }

        this._status = PROMISE_STATUS.REJECTED;
        this._value = reason;

        this._callCallbacks(this._rejectedCallbacks, reason);
        this._fulfilledCallbacks = this._rejectedCallbacks = this._progressCallbacks = undef;
    },

    _notify : function(val) {
        this._callCallbacks(this._progressCallbacks, val);
    },

    _addCallbacks : function(defer, onFulfilled, onRejected, onProgress, ctx) {
        if(onRejected && !isFunction(onRejected)) {
            ctx = onRejected;
            onRejected = undef;
        }
        else if(onProgress && !isFunction(onProgress)) {
            ctx = onProgress;
            onProgress = undef;
        }

        var cb;

        if(!this.isRejected()) {
            cb = { defer : defer, fn : isFunction(onFulfilled)? onFulfilled : undef, ctx : ctx };
            this.isFulfilled()?
                this._callCallbacks([cb], this._value) :
                this._fulfilledCallbacks.push(cb);
        }

        if(!this.isFulfilled()) {
            cb = { defer : defer, fn : onRejected, ctx : ctx };
            this.isRejected()?
                this._callCallbacks([cb], this._value) :
                this._rejectedCallbacks.push(cb);
        }

        if(this._status <= PROMISE_STATUS.RESOLVED) {
            this._progressCallbacks.push({ defer : defer, fn : onProgress, ctx : ctx });
        }
    },

    _callCallbacks : function(callbacks, arg) {
        var len = callbacks.length;
        if(!len) {
            return;
        }

        var isResolved = this.isResolved(),
            isFulfilled = this.isFulfilled();

        nextTick(function() {
            var i = 0, cb, defer, fn;
            while(i < len) {
                cb = callbacks[i++];
                defer = cb.defer;
                fn = cb.fn;

                if(fn) {
                    var ctx = cb.ctx,
                        res,
                        callSuccess = safeExec(function() {
                            res = ctx? fn.call(ctx, arg) : fn(arg);
                        }, function(e) {
                            defer.reject(e);
                        });

                    if (!callSuccess) {
                        continue;
                    }

                    isResolved?
                        defer.resolve(res) :
                        defer.notify(res);
                }
                else {
                    isResolved?
                        isFulfilled?
                            defer.resolve(arg) :
                            defer.reject(arg) :
                        defer.notify(arg);
                }
            }
        });
    }
};

/** @lends Promise */
var staticMethods = {
    /**
     * Coerces given `value` to a promise, or returns the `value` if it's already a promise.
     *
     * @param {*} value
     * @returns {vow:Promise}
     */
    cast : function(value) {
        return vow.cast(value);
    },

    /**
     * Returns a promise to be fulfilled only after all the items in `iterable` are fulfilled,
     * or to be rejected when any of the `iterable` is rejected.
     *
     * @param {Array|Object} iterable
     * @returns {vow:Promise}
     */
    all : function(iterable) {
        return vow.all(iterable);
    },

    /**
     * Returns a promise to be fulfilled only when any of the items in `iterable` are fulfilled,
     * or to be rejected when the first item is rejected.
     *
     * @param {Array} iterable
     * @returns {vow:Promise}
     */
    race : function(iterable) {
        return vow.anyResolved(iterable);
    },

    /**
     * Returns a promise that has already been resolved with the given `value`.
     * If `value` is a promise, returned promise will be adopted with the state of given promise.
     *
     * @param {*} value
     * @returns {vow:Promise}
     */
    resolve : function(value) {
        return vow.resolve(value);
    },

    /**
     * Returns a promise that has already been rejected with the given `reason`.
     *
     * @param {*} reason
     * @returns {vow:Promise}
     */
    reject : function(reason) {
        return vow.reject(reason);
    }
};

for(var prop in staticMethods) {
    staticMethods.hasOwnProperty(prop) &&
        (Promise[prop] = staticMethods[prop]);
}

var vow = /** @exports vow */ {
    /**
     * @property {boolean}
     * @default
     * Disables rejection of promises by throwing exceptions. Will cause all exceptions be thrown during runtime.
     */
    debug : false,

    Deferred : Deferred,

    Promise : Promise,

    /**
     * Creates a new deferred. This method is a factory method for `vow:Deferred` class.
     * It's equivalent to `new vow.Deferred()`.
     *
     * @returns {vow:Deferred}
     */
    defer : function() {
        return new Deferred();
    },

    /**
     * Static equivalent to `promise.then`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Function} [onFulfilled] Callback that will to be invoked with the value after promise has been fulfilled
     * @param {Function} [onRejected] Callback that will to be invoked with the reason after promise has been rejected
     * @param {Function} [onProgress] Callback that will to be invoked with the value after promise has been notified
     * @param {Object} [ctx] Context of callbacks execution
     * @returns {vow:Promise}
     */
    when : function(value, onFulfilled, onRejected, onProgress, ctx) {
        return vow.cast(value).then(onFulfilled, onRejected, onProgress, ctx);
    },

    /**
     * Static equivalent to `promise.fail`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Function} onRejected Callback that will to be invoked with the reason after promise has been rejected
     * @param {Object} [ctx] Context of callback execution
     * @returns {vow:Promise}
     */
    fail : function(value, onRejected, ctx) {
        return vow.when(value, undef, onRejected, ctx);
    },

    /**
     * Static equivalent to `promise.always`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Function} onResolved Callback that will to be invoked with the reason after promise has been resolved
     * @param {Object} [ctx] Context of callback execution
     * @returns {vow:Promise}
     */
    always : function(value, onResolved, ctx) {
        return vow.when(value).always(onResolved, ctx);
    },

    /**
     * Static equivalent to `promise.progress`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Function} onProgress Callback that will to be invoked with the reason after promise has been notified
     * @param {Object} [ctx] Context of callback execution
     * @returns {vow:Promise}
     */
    progress : function(value, onProgress, ctx) {
        return vow.when(value).progress(onProgress, ctx);
    },

    /**
     * Static equivalent to `promise.spread`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Function} [onFulfilled] Callback that will to be invoked with the value after promise has been fulfilled
     * @param {Function} [onRejected] Callback that will to be invoked with the reason after promise has been rejected
     * @param {Object} [ctx] Context of callbacks execution
     * @returns {vow:Promise}
     */
    spread : function(value, onFulfilled, onRejected, ctx) {
        return vow.when(value).spread(onFulfilled, onRejected, ctx);
    },

    /**
     * Static equivalent to `promise.done`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Function} [onFulfilled] Callback that will to be invoked with the value after promise has been fulfilled
     * @param {Function} [onRejected] Callback that will to be invoked with the reason after promise has been rejected
     * @param {Function} [onProgress] Callback that will to be invoked with the value after promise has been notified
     * @param {Object} [ctx] Context of callbacks execution
     */
    done : function(value, onFulfilled, onRejected, onProgress, ctx) {
        vow.when(value).done(onFulfilled, onRejected, onProgress, ctx);
    },

    /**
     * Checks whether the given `value` is a promise-like object
     *
     * @param {*} value
     * @returns {Boolean}
     *
     * @example
     * ```js
     * vow.isPromise('something'); // returns false
     * vow.isPromise(vow.defer().promise()); // returns true
     * vow.isPromise({ then : function() { }); // returns true
     * ```
     */
    isPromise : function(value) {
        return isObject(value) && isFunction(value.then);
    },

    /**
     * Coerces given `value` to a promise, or returns the `value` if it's already a promise.
     *
     * @param {*} value
     * @returns {vow:Promise}
     */
    cast : function(value) {
        return vow.isPromise(value)?
            value :
            vow.resolve(value);
    },

    /**
     * Static equivalent to `promise.valueOf`.
     * If given `value` is not an instance of `vow.Promise`, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @returns {*}
     */
    valueOf : function(value) {
        return value && isFunction(value.valueOf)? value.valueOf() : value;
    },

    /**
     * Static equivalent to `promise.isFulfilled`.
     * If given `value` is not an instance of `vow.Promise`, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @returns {Boolean}
     */
    isFulfilled : function(value) {
        return value && isFunction(value.isFulfilled)? value.isFulfilled() : true;
    },

    /**
     * Static equivalent to `promise.isRejected`.
     * If given `value` is not an instance of `vow.Promise`, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @returns {Boolean}
     */
    isRejected : function(value) {
        return value && isFunction(value.isRejected)? value.isRejected() : false;
    },

    /**
     * Static equivalent to `promise.isResolved`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @returns {Boolean}
     */
    isResolved : function(value) {
        return value && isFunction(value.isResolved)? value.isResolved() : true;
    },

    /**
     * Returns a promise that has already been resolved with the given `value`.
     * If `value` is a promise, returned promise will be adopted with the state of given promise.
     *
     * @param {*} value
     * @returns {vow:Promise}
     */
    resolve : function(value) {
        var res = vow.defer();
        res.resolve(value);
        return res.promise();
    },

    /**
     * Returns a promise that has already been fulfilled with the given `value`.
     * If `value` is a promise, returned promise will be fulfilled with fulfill/rejection value of given promise.
     *
     * @param {*} value
     * @returns {vow:Promise}
     */
    fulfill : function(value) {
        var defer = vow.defer(),
            promise = defer.promise();

        defer.resolve(value);

        return promise.isFulfilled()?
            promise :
            promise.then(null, function(reason) {
                return reason;
            });
    },

    /**
     * Returns a promise that has already been rejected with the given `reason`.
     * If `reason` is a promise, returned promise will be rejected with fulfill/rejection value of given promise.
     *
     * @param {*} reason
     * @returns {vow:Promise}
     */
    reject : function(reason) {
        var defer = vow.defer();
        defer.reject(reason);
        return defer.promise();
    },

    /**
     * Invokes a given function `fn` with arguments `args`
     *
     * @param {Function} fn
     * @param {...*} [args]
     * @returns {vow:Promise}
     *
     * @example
     * ```js
     * var promise1 = vow.invoke(function(value) {
     *         return value;
     *     }, 'ok'),
     *     promise2 = vow.invoke(function() {
     *         throw Error();
     *     });
     *
     * promise1.isFulfilled(); // true
     * promise1.valueOf(); // 'ok'
     * promise2.isRejected(); // true
     * promise2.valueOf(); // instance of Error
     * ```
     */
    invoke : function(fn, args) {
        var len = Math.max(arguments.length - 1, 0),
            callArgs,
            res;
        if(len) { // optimization for V8
            callArgs = Array(len);
            var i = 0;
            while(i < len) {
                callArgs[i++] = arguments[i];
            }
        }

        safeExec(function () {
            res = vow.resolve(callArgs?
                fn.apply(global, callArgs) :
                fn.call(global));
        }, function(e) {
            res = vow.reject(e);
        });

        return res;
    },

    /**
     * Returns a promise to be fulfilled only after all the items in `iterable` are fulfilled,
     * or to be rejected when any of the `iterable` is rejected.
     *
     * @param {Array|Object} iterable
     * @returns {vow:Promise}
     *
     * @example
     * with array:
     * ```js
     * var defer1 = vow.defer(),
     *     defer2 = vow.defer();
     *
     * vow.all([defer1.promise(), defer2.promise(), 3])
     *     .then(function(value) {
     *          // value is "[1, 2, 3]" here
     *     });
     *
     * defer1.resolve(1);
     * defer2.resolve(2);
     * ```
     *
     * @example
     * with object:
     * ```js
     * var defer1 = vow.defer(),
     *     defer2 = vow.defer();
     *
     * vow.all({ p1 : defer1.promise(), p2 : defer2.promise(), p3 : 3 })
     *     .then(function(value) {
     *          // value is "{ p1 : 1, p2 : 2, p3 : 3 }" here
     *     });
     *
     * defer1.resolve(1);
     * defer2.resolve(2);
     * ```
     */
    all : function(iterable) {
        var defer = new Deferred(),
            isPromisesArray = isArray(iterable),
            keys = isPromisesArray?
                getArrayKeys(iterable) :
                getObjectKeys(iterable),
            len = keys.length,
            res = isPromisesArray? [] : {};

        if(!len) {
            defer.resolve(res);
            return defer.promise();
        }

        var i = len;
        vow._forEach(
            iterable,
            function(value, idx) {
                res[keys[idx]] = value;
                if(!--i) {
                    defer.resolve(res);
                }
            },
            defer.reject,
            defer.notify,
            defer,
            keys);

        return defer.promise();
    },

    /**
     * Returns a promise to be fulfilled only after all the items in `iterable` are resolved.
     *
     * @param {Array|Object} iterable
     * @returns {vow:Promise}
     *
     * @example
     * ```js
     * var defer1 = vow.defer(),
     *     defer2 = vow.defer();
     *
     * vow.allResolved([defer1.promise(), defer2.promise()]).spread(function(promise1, promise2) {
     *     promise1.isRejected(); // returns true
     *     promise1.valueOf(); // returns "'error'"
     *     promise2.isFulfilled(); // returns true
     *     promise2.valueOf(); // returns "'ok'"
     * });
     *
     * defer1.reject('error');
     * defer2.resolve('ok');
     * ```
     */
    allResolved : function(iterable) {
        var defer = new Deferred(),
            isPromisesArray = isArray(iterable),
            keys = isPromisesArray?
                getArrayKeys(iterable) :
                getObjectKeys(iterable),
            i = keys.length,
            res = isPromisesArray? [] : {};

        if(!i) {
            defer.resolve(res);
            return defer.promise();
        }

        var onResolved = function() {
                --i || defer.resolve(iterable);
            };

        vow._forEach(
            iterable,
            onResolved,
            onResolved,
            defer.notify,
            defer,
            keys);

        return defer.promise();
    },

    allPatiently : function(iterable) {
        return vow.allResolved(iterable).then(function() {
            var isPromisesArray = isArray(iterable),
                keys = isPromisesArray?
                    getArrayKeys(iterable) :
                    getObjectKeys(iterable),
                rejectedPromises, fulfilledPromises,
                len = keys.length, i = 0, key, promise;

            if(!len) {
                return isPromisesArray? [] : {};
            }

            while(i < len) {
                key = keys[i++];
                promise = iterable[key];
                if(vow.isRejected(promise)) {
                    rejectedPromises || (rejectedPromises = isPromisesArray? [] : {});
                    isPromisesArray?
                        rejectedPromises.push(promise.valueOf()) :
                        rejectedPromises[key] = promise.valueOf();
                }
                else if(!rejectedPromises) {
                    (fulfilledPromises || (fulfilledPromises = isPromisesArray? [] : {}))[key] = vow.valueOf(promise);
                }
            }

            if(rejectedPromises) {
                return vow.reject(rejectedPromises);
            }

            return fulfilledPromises;
        });
    },

    /**
     * Returns a promise to be fulfilled only when any of the items in `iterable` is fulfilled,
     * or to be rejected when all the items are rejected (with the reason of the first rejected item).
     *
     * @param {Array} iterable
     * @returns {vow:Promise}
     */
    any : function(iterable) {
        var defer = new Deferred(),
            len = iterable.length;

        if(!len) {
            defer.reject(Error());
            return defer.promise();
        }

        var i = 0, reason;
        vow._forEach(
            iterable,
            defer.resolve,
            function(e) {
                i || (reason = e);
                ++i === len && defer.reject(reason);
            },
            defer.notify,
            defer);

        return defer.promise();
    },

    /**
     * Returns a promise to be fulfilled only when any of the items in `iterable` is fulfilled,
     * or to be rejected when the first item is rejected.
     *
     * @param {Array} iterable
     * @returns {vow:Promise}
     */
    anyResolved : function(iterable) {
        var defer = new Deferred(),
            len = iterable.length;

        if(!len) {
            defer.reject(Error());
            return defer.promise();
        }

        vow._forEach(
            iterable,
            defer.resolve,
            defer.reject,
            defer.notify,
            defer);

        return defer.promise();
    },

    /**
     * Static equivalent to `promise.delay`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Number} delay
     * @returns {vow:Promise}
     */
    delay : function(value, delay) {
        return vow.resolve(value).delay(delay);
    },

    /**
     * Static equivalent to `promise.timeout`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Number} timeout
     * @returns {vow:Promise}
     */
    timeout : function(value, timeout) {
        return vow.resolve(value).timeout(timeout);
    },

    _forEach : function(promises, onFulfilled, onRejected, onProgress, ctx, keys) {
        var len = keys? keys.length : promises.length,
            i = 0;

        while(i < len) {
            vow.when(
                promises[keys? keys[i] : i],
                wrapOnFulfilled(onFulfilled, i),
                onRejected,
                onProgress,
                ctx);
            ++i;
        }
    },

    TimedOutError : defineCustomErrorType('TimedOut')
};

var defineAsGlobal = true;
if(typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = vow;
    defineAsGlobal = false;
}

if(typeof modules === 'object') {
    modules.define('vow', function(provide) {
        provide(vow);
    });
    defineAsGlobal = false;
}

if(typeof define === 'function') {
    define(function(require, exports, module) {
        module.exports = vow;
    });
    defineAsGlobal = false;
}

defineAsGlobal && (global.vow = vow);

})(this);

ym['vow'] = this['vow'];
this['vow'] = _backup_vow;
_backup_vow = undefined;
var _backup_modules = this['modules'];
/**
 * Специальная прослойка, которая добавляет промисы, фоллбеки, динамические зависимости и алиасы в модульную систему.
 */
(function(global, modulesSystem, undef) {
    var vow = ym.vow,

        slice = Array.prototype.slice,
    
        moduleByAliases = {},
        entries = {},
        
        keyNotFoundError = function (storage, key) { 
            return new Error("The key \"" + key + "\" isn't declared in \"" + storage + "\" storage."); 
        },
        dynamicDependNotFoundError = function (dynamicDepend) {
            return new Error("The dynamic depend \"" + dynamicDepend + "\" not found.");
        };

    var api = {
        fallbacks: new FallbackManager(),
 
        define: function (moduleName, depends, callback, context) {
            var storage, key, dynamicDepends;
            if (typeof depends == 'function') {
                callback = depends;
                context = callback;
                depends = null;
            }
            else if (typeof moduleName == 'object') {
                var data = moduleName;
                moduleName = data.name;
                depends = data.depends;
                callback = data.declaration;
                context = data.context;
                dynamicDepends = data.dynamicDepends;
                
                storage = data.storage;
                key = data.key;
            }
            
            if (!entries.hasOwnProperty(moduleName)) {
                entries[moduleName] = {name: moduleName};
            }
            
            entries[moduleName].callback = callback;
            entries[moduleName].context = context;
            
            if (storage && key) {
                if (typeof key != 'string') {
                    for (var i = 0, l = key.length; i < l; i++) {
                        this._createKeyStorageRef(moduleName, key[i], storage);
                    }
                } else {
                    this._createKeyStorageRef(moduleName, key, storage);
                }
                
                entries[moduleName].key = key;
                entries[moduleName].storage = storage;
            }
            
            if (dynamicDepends) {
                entries[moduleName].dynamicDepends = dynamicDepends;
            }

            var onModuleLoad = api._createPathedCallback(moduleName);
            
            if (depends != null) {
                var deps = [];
                for (var i = 0, l = depends.length; i < l; i++) {
                    deps[i] = this._processModuleName(depends[i]);
                }            
                modulesSystem.define(moduleName, deps, onModuleLoad);
            } else {
                modulesSystem.define(moduleName, onModuleLoad);
            }

            return this;
        },
        
        require: function (moduleNames, successCallback, errorCallback, context) {
            var deferred = vow.defer(),
                data = undef;

            if (arguments.length == 3 && typeof errorCallback != 'function') {
                context = errorCallback;
                errorCallback = null;
            } else if (!moduleNames.hasOwnProperty('length') && typeof moduleNames == 'object') {
                var obj = moduleNames;
                moduleNames = obj.modules;
                successCallback = obj.successCallback;
                errorCallback = obj.errorCallback;
                context = obj.context;
                if (obj.hasOwnProperty('data')) {
                    data = obj.data;
                }
            }

            moduleNames = (typeof moduleNames == 'string' || !moduleNames.hasOwnProperty('length')) ? [moduleNames] : moduleNames;
            var moduleNamesLength = moduleNames.length,
                result = this._processModuleList(moduleNames, data);
            moduleNames = result.list;
            if (result.error) {
                deferred.reject(result.error);
            } else {
                modulesSystem.require(moduleNames, function () {
                    // TODO потенцально опасный код.
                    // Для сокращения ожидания и кол-ва кода основной запрос и все динамические зависимости обрабатываются одним require.
                    // Чтобы модули из динамических зависимостей отрабатывали раньше, чем явно запрощенные модули, они добалявляются в начало массива.
                    // Если вдруг в модульной системе измениться порядок выполнения модулей, то что-то может сломаться.
                    var array = slice.call(arguments, arguments.length - moduleNamesLength);
                    deferred.resolve(array);
                    successCallback && successCallback.apply(context || global, array);
                }, function (err) {
                    // TODO потенциально опасный код.
                    // `retrieve` может разрешить промис, но `require` по разным причинам может продолжать не выполняться, что вызовет зацикливание.
                    api.fallbacks.retrieve(moduleNames).then(function () {
                        deferred.resolve(api.require(moduleNames, successCallback, errorCallback, context));
                    }, function (err) {
                        deferred.reject(err);
                        errorCallback && errorCallback.call(context || global, err);
                    });
                });
            }

            return deferred.promise();
        },
        
        defineSync: function (moduleName, module) {
            // Этот метод пока не светится наружу.
            var storage, key;
            if (typeof moduleName == 'object') {
                var data = moduleName;
                module = data.module;
                storage = data.storage;
                key = data.key;
                moduleName = data.name;
            }
            
            if (api.isDefined(moduleName)) {
                var entry = entries[moduleName];
                entry.name = moduleName;
                entry.module = module;
                entry.callback = function (provide) {
                    provide(module);
                };
                entry.context = null;
            } else {
                entries[moduleName] = {
                    name: moduleName,
                    module: module
                };
                // Добавляем в модульную систему, чтобы можно было обращатьсяв зависимостях.
                api.define(moduleName, function (provide) {
                    provide(module);
                }); 
            }

            if (key && storage) {
                entries[moduleName].key = key;
                entries[moduleName].storage = storage;
                this._createKeyStorageRef(moduleName, key, storage);
            }
        },
        
        requireSync: function (name, data) {
            // Этот метод пока не светится наружу.
            var definition = this.getDefinition(name),
                result = null;
            if (definition) {
                result = definition.getModuleSync.apply(definition, slice.call(arguments, 1));
            }
            return result;
        },
        
        getDefinition: function (name) {
            var result = null;
            name = this._processModuleName(name);
            
            if (entries.hasOwnProperty(name)) {
                result = new Definition(entries[name]);
            }

            return result;
        },
        
        getState: function (name) {
            return modulesSystem.getState(this._processModuleName(name));
        },
        
        isDefined: function (name) {
            return modulesSystem.isDefined(this._processModuleName(name));
        },
        
        setOptions: function (options) {
            return modulesSystem.setOptions(options);
        },
        
        flush: function () {
            return modulesSystem.flush();
        },
        
        nextTick: function (func) {
            return modulesSystem.nextTick(func);
        },
        
        _createPathedCallback: function (moduleName) {
            return function () {
                var entry = entries[moduleName],
                    array = slice.call(arguments, 0),
                    callback = entry.callback,
                    context = entry.context;
                array[0] = api._patchProvideFunction(array[0], moduleName);
                callback && callback.apply(context || this, array);
            };
        },
        
        _processModuleList: function (moduleList, data, ignoreCurrentNode) {
            var state = {
                list: []
            };
            
            for (var i = 0, l = moduleList.length; i < l; i++) {
                var moduleName = this._processModuleName(moduleList[i]);

                if (!moduleName) {
                    state.error = keyNotFoundError(moduleList[i].storage, moduleList[i].key);
                    break;
                }
 
                if (typeof data != 'undefined') {
                    var depends = modulesSystem.getDepends(moduleName),
                        entry = entries[moduleName];
                    if (depends) {
                        var dependsResult = this._processModuleList(depends, data, true);
                        if (dependsResult.error) {
                            state.error = dependsResult.error;
                            break;
                        } else {
                            state.list = state.list.concat(dependsResult.list);
                        }
                    }
                    
                    if (entry && entry.dynamicDepends) {
                        var dynamicDepends = [];
                        for (var key in entry.dynamicDepends) {
                            var depend = entry.dynamicDepends[key](data);
                            // TOOD обсудить в ревью
                            if (this._isDepend(depend)) {
                                dynamicDepends.push(depend);
                            }
                        }
                        var dependsResult = this._processModuleList(dynamicDepends, data);
                        if (dependsResult.error) {
                            state.error = dependsResult.error;
                            break;
                        } else {
                            state.list = state.list.concat(dependsResult.list);
                        }
                    }
                }
                
                if (!ignoreCurrentNode) {
                    state.list.push(moduleName);
                }
            }
            
            return state;
        },
        
        _createKeyStorageRef: function (moduleName, key, storage) {
            if (!moduleByAliases.hasOwnProperty(storage)) {
                moduleByAliases[storage] = {};
            }
            moduleByAliases[storage][key] = moduleName;
        },
        
        _processModuleName: function (moduleName) {
            if (typeof moduleName != 'string') {
                var storage = moduleName.storage;
                if (moduleByAliases.hasOwnProperty(storage)) {
                    moduleName = moduleByAliases[storage][moduleName.key] || null;
                } else {
                    moduleName = null;
                }
            }
            return moduleName;
        },
        
        _patchProvideFunction: function (provide, moduleName) {
            var patchedProvide = function (module, error) {
                var entry = entries[moduleName];
                entry.module = module;
                provide(module, error);
                if (!error) {
                    delete entry.callback;
                    delete entry.context;
                }
            };
            patchedProvide.provide = patchedProvide;
            patchedProvide.dynamicDepends = {
                getValue: function (key, data) {
                    var deferred = vow.defer(),
                        entry = entries[moduleName];
                    if (entry.dynamicDepends && entry.dynamicDepends.hasOwnProperty(key)) {
                        var depend = entry.dynamicDepends[key](data);
                        deferred.resolve(
                            api._isDepend(depend) ? 
                                api.getDefinition(depend).getModule(data) :
                                [depend]
                        );
                    } else {
                        deferred.reject(dynamicDependNotFoundError(key));
                    }
                    return deferred.promise();
                },
                
                getValueSync: function (key, data) {
                    var result = undef,
                        entry = entries[moduleName];
                    if (entry.dynamicDepends && entry.dynamicDepends.hasOwnProperty(key)) {
                        var depend = entry.dynamicDepends[key](data);
                        result = api._isDepend(depend) ? 
                            api.getDefinition(depend).getModuleSync(data) :
                            depend;
                    }
                    return result;
                }
            };
            return patchedProvide;
        },
        
        _isDepend: function (depend) {
            return (typeof depend == 'string') || (depend && depend.key && depend.storage);
        }
    };
    
    function Definition (entry) {
        this.entry = entry; 
    }
    
    Definition.prototype.getModuleKey = function () {
        return this.entry.key;
    };
    
    Definition.prototype.getModuleStorage = function () {
        return this.entry.storage;
    };
    
    Definition.prototype.getModuleName = function () {
        return this.entry.name;
    };
    
    Definition.prototype.getModuleSync = function (data) {
        if (arguments.length > 0) {
            var dynamicDepends = this.entry.dynamicDepends;
            for (var key in dynamicDepends) {
                var depend = dynamicDepends[key](data);
                if (api._isDepend(depend) && !api.getDefinition(depend).getModuleSync(data)) {
                    return undef;
                }
            }
        }
        return this.entry.module;
    };
    
    Definition.prototype.getModule = function (data) {
        var params = {
                modules: [
                    this.entry.name
                ]
            };
        if (data) {
            params.data = data;
        }
        return api.require(params);
    };

    function FallbackManager () {
        this._fallbacks = [];
    }

    FallbackManager.prototype.register = function (filter, fallback) {
        this._fallbacks[filter ? 'unshift' : 'push']({
            filter: filter,
            fallback: fallback
        });
    };

    FallbackManager.prototype.retrieve = function (moduleNames) {
        var definePromises = [];

        for (var i = 0, l = moduleNames.length; i < l; i++) {
            var deferred = vow.defer(),
                moduleName = moduleNames[i];

            definePromises[i] = deferred.promise();

            if (api.isDefined(moduleName)) {
                deferred.resolve(true);

                continue;
            }

            var fallback = this.find(moduleName);

            if (!fallback) {
                deferred.reject('Undefined module `' + moduleName + '` with no matching fallback.');

                break;
            }

            deferred.resolve(fallback.retrieve(moduleName));
        }

        return vow.all(definePromises);
    };

    FallbackManager.prototype.find = function (moduleName) {
        for (var i = 0, l = this._fallbacks.length; i < l; i++) {
            var filter = this._fallbacks[i].filter,
                fallback = this._fallbacks[i].fallback;

            if (filter === null) {
                return fallback;
            }

            if (typeof filter == 'function' && filter(moduleName)) {
                return fallback;
            }

            if (moduleName.match(filter)) {
                return fallback;
            }
        }

        return null;
    };

    global.modules = api;
})(this, ymModules);
ym['modules'] = this['modules'];
this['modules'] = _backup_modules;
_backup_modules = undefined;

(function (global) {
    ym.ready = ready;

    var vow = ym.vow,
        domReady = document.readyState == 'complete',
        deferred = vow.defer(),
        promise = deferred.promise(),
        modulesReady = false;

    if (!domReady) {
        function onDomReady () {
            if (!domReady) {
                domReady = true;
                check();
            }
        }

        if (document.addEventListener) {
            document.addEventListener('DOMContentLoaded', onDomReady, false);
            window.addEventListener('load', onDomReady, false);
        } else if (document.attachEvent) {
            window.attachEvent('onload', onDomReady);
        }
    }

    function ready (modules) {
        check();

        if (!modules) {
            return promise;
        }

        return promise.then(function () {
            return ym.modules.require(modules);
        });
    }
    
    function check () {
        // TODO We don't fill namespace, so we don't need to wait while modules are being required.
        if (/*modulesReady && */domReady) {
            deferred.resolve();
        }
    }
})(this);

(function (global) {
    registerNamespace(global, ym.project.namespace, {
        modules: ym.modules,
        ready: ym.ready
    });

    function registerNamespace (parentNs, path, data) {
        if (path) {
            var subObj = parentNs;
            path = path.split('.');
            var i = 0, l = path.length - 1, name;
            for (; i < l; i++) {
                if (path[i]) {
                    subObj = subObj[name = path[i]] || (subObj[name] = {});
                }
            }
            subObj[path[l]] = data;
            return subObj[path[l]];
        } else {
            return data;
        }
    }
})(this);

ym.modules.define('config', function (provide) {
    provide({
        location: {
            default: 'ru',
            ru: 'Russia',
            us: 'USA',
            uk: 'United Kingdom'
        }
    });
});
ym.modules.define('Game', ['util.defineClass', 'user.Player'], function (provide, defineClass, Player) {
    function Game () {
        this._players = [];
    }

    defineClass(Game, {
        addPlayer: function (name, from) {
            this._players.push(new Player(name, from));
        },

        start: function () {
            for (var i = 0, l = this._players.length; i < l; i++) {
                this._players[i].play();
            }

            this._setupView();
        },

        _setupView: function () {
            document.body.innerHTML += 'Players in game: ' + this._getPlayerNames();
        },

        _getPlayerNames: function () {
            var names = [];

            for (var i = 0, l = this._players.length; i < l; i++) {
                names.push(this._players[i].getName());
            }

            return names.join(', ');
        }
    });

    provide(Game);
});
ym.modules.define('package.game', ['util.providePackage', 'Game'], function (provide, providePackage) {
    providePackage(this, arguments);
});
ym.modules.define('system.createNs', function (provide) {
    provide(function (parentNs, path, data) {
        if (path) {
            var subObj = parentNs;
            path = path.split('.');
            var i = 0, l = path.length - 1, name;
            for (; i < l; i++) {
                if (path[i]) {
                    subObj = subObj[name = path[i]] || (subObj[name] = {});
                }
            }
            subObj[path[l]] = data;
            return subObj[path[l]];
        } else {
            return data;
        }
    });
});
// TODO refactoring

ym.modules.define('system.mergeImports', [], function (provide) {
    function createNS (parentNs, path, data) {
        if (path) {
            var subObj = parentNs;
            path = path.split('.');
            var i = 0, l = path.length - 1, name;
            for (; i < l; i++) {
                if (path[i]) {//в начале может быть точка
                    subObj = subObj[name = path[i]] || (subObj[name] = {});
                }
            }
            subObj[path[l]] = data;
            return subObj[path[l]];
        } else {
            return data;
        }
    }


    function depsSort (a, b) {
        return a[2] - b[2];
    }

    function _isPackage (name) {
        return name.indexOf('package.') === 0;
    }

    function packageExtend (imports, ns) {
        for (var i in ns) {
            if (ns.hasOwnProperty(i)) {
                if (imports.hasOwnProperty(i)) {
                    //console.log('deep', i, typeof imports[i], typeof ns[i], ns[i] === imports[i]);
                    if (typeof imports[i] == 'object') {
                        packageExtend(imports[i], ns[i]);
                    }
                } else {
                    imports[i] = ns[i];
                }
            }
        }
    }

    function joinPackage (imports, deps, args) {
        var modules = [],
            checkList = {};
        for (var i = 0, l = deps.length; i < l; ++i) {
            var packageInfo = args[i].__package;
            if (!packageInfo) {
                createNS(imports, deps[i], args[i]);
                if (!checkList[deps[i]]) {
                    modules.push([deps[i], args[i]]);
                    checkList[deps[i]] = 1;
                }
            } else {
                for (var j = 0; j < packageInfo.length; ++j) {
                    if (!checkList[packageInfo[j][0]]) {
                        createNS(imports, packageInfo[j][0], packageInfo[j][1]);
                        modules.push([packageInfo[j][0], packageInfo[j][1]]);
                        checkList[packageInfo[j][0]] = 1;
                    }
                }
            }
        }
        imports.__package = modules;
        return imports;
    }

    function joinImports (thisName, imports, deps, args) {
        var ordered = [];
        var iAmPackage = _isPackage(thisName);
        if (iAmPackage) {
            return joinPackage(imports, deps, args);
        } else {
            for (var i = 0, l = deps.length; i < l; ++i) {
                ordered.push([deps[i], i, deps[i].length]);
            }
            ordered.sort(depsSort);
            for (var i = 0, l = ordered.length; i < l; ++i) {
                var order = ordered[i][1],
                    depName = deps[order];
                if (_isPackage(depName)) {
                    var packageInfo = args[order].__package;
                    for (var j = 0; j < packageInfo.length; ++j) {
                        createNS(imports, packageInfo[j][0], packageInfo[j][1]);
                    }
                    //console.error(thisName, 'loads', depName, '(its not good idea to load package from module)');
                    //depName = '';
                    //packageExtend(imports, args[order]);
                } else {
                    createNS(imports, depName, args[order]);
                }
            }
        }
        return imports;
    }

    provide({
        isPackage: _isPackage,
        joinImports: joinImports,
        createNS: createNS
    });
});
/**
 * @fileOverview
 * Парсер шаблонов.
 * Количество зависимостей было сведено к минимуму из-за того, что
 * тот класс используется в сборщике.
 */
ym.modules.define("template.Parser", [
    "util.id"
], function (provide, utilId) {

    // TODO хорошо бы перенести в отдельный модуль. 
    // Главное не забыть в билдере подключить файл.
    var trimRegExp = /^\s+|\s+$/g,
        nativeTrim = typeof String.prototype.trim == 'function';

    function trim (str) {
        return nativeTrim ? str.trim() : str.replace(trimRegExp, '');
    }

    function escape (str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '&#39;')
            .replace(/"/g, '&quot;');
    }

    function getKeyValuePairs (str) {
        var pairs = [],
            parts = trim(str).replace(/\s*=\s*/g, '=').replace(/\s+/g, ' ').split(' ');

        for (var i = 0, l = parts.length; i < l; i++) {
            pairs.push(parts[i].split('=', 2));
        }

        return pairs;
    }

    function removeQuotes (string) {
        var firstSymbol = trim(string).charAt(0);
        if (firstSymbol == "'" || firstSymbol == '"') {
            return string.slice(1, string.length - 1);
        }
        return string;
    }

    function parseExpression (expression) {
        var parenthesesRegExp = /'|"/g,
            l = 0,
            tokens = [],
            match;

        while (match = parenthesesRegExp.exec(expression)) {
            var pos = match.index;

            if (pos >= l) {
                var endPos = expression.indexOf(match[0], pos + 1);
                if (l != pos) {
                    parseExpressionSubstitutes(tokens, expression.slice(l, pos));
                }
                tokens.push(expression.slice(pos, endPos + 1));
                l = endPos + 1;
            }
        }

        if (l < expression.length) {
            parseExpressionSubstitutes(tokens, expression.slice(l));
        }

        return tokens.join('');
    }

    var DataLogger = function (dataManager) {
        this._dataManager = dataManager;
        this._renderedValues = {};
        this._contexts = {};
    };

    DataLogger.prototype.get = function (key) {
        if (this._renderedValues.hasOwnProperty(key)) {
            return this._renderedValues[key].value;
        }

        var dotIndex = key.indexOf('.'),
            keyPart = (dotIndex > -1) ? trim(key.substring(0, dotIndex)) : trim(key);
        if (this._contexts.hasOwnProperty(keyPart)) {
            key = key.replace(keyPart, this._contexts[keyPart]);
        }

        var value = this._dataManager.get(key);
        this.set(key, value);
        return value;
    };

    DataLogger.prototype.setContext = function (key1, key2) {
        this._contexts[key1] = key2;
    };

    DataLogger.prototype.set = function (key, value) {
        // http://jsperf.com/split-vs-indexof
        if (key.indexOf('.') > -1) {
            var parts = key.split('.'),
                currentKey = "";
            // Записываем все промежуточные значения. 
            for (var i = 0, l = parts.length - 1; i < l; i++) {
                currentKey += ((i === 0) ? "" : ".") + parts[i];
                this._renderedValues[currentKey] = { value: this._dataManager.get(currentKey) };
            }
        }
        this._renderedValues[key] = { value: value };
    };

    DataLogger.prototype.getRenderedValues = function () {
        return this._renderedValues;
    };

    var stopWords = {
        'true': true,
        'false': true,
        'undefined': true,
        'null': true,
        'typeof': true
    };

    function parseExpressionSubstitutes (tokens, expression) {
        var variablesRegExp = /(^|[^\w\$])([A-Za-z_\$][\w\$\.]*)(?:[^\w\d_\$]|$)/g,
            l = 0,
            match;

        while (match = variablesRegExp.exec(expression)) {
            var pos = match.index + match[1].length,
                key = match[2],
                endPos = pos + key.length;

            if (pos > l) {
                tokens.push(expression.slice(l, pos));
            }

            if (stopWords[key]) {
                tokens.push(key);
            } else {
                tokens.push('data.get("' + key + '")');
            }

            l = endPos;
        }

        if (l < expression.length) {
            tokens.push(expression.slice(l));
        }
    }

    function evaluateExpression (expression, data) {
        var result;
        eval('result = ' + expression);
        return result;
    }

    // Токен контента
    var CONTENT = 0,
        startTokenRegExp = new RegExp([
            '\\$\\[\\[', '\\$\\[(?!\\])', '\\[if',
            '\\[else\\]', '\\[endif\\]', '\\{\\{', '\\{%'].join('|'), 'g');

    /**
     * @ignore
     * @class Парсер шаблонов.
     */
    var Parser = function () { };

    /**
     * @ignore
     * @class Парсер шаблонов.
     */

    Parser.prototype.scanners = {};
    Parser.prototype.builders = {};

    Parser.prototype.parse = function (text) {
        var tokens = [],
            pos = 0, startTokenPos, endTokenPos, contentPos,
            match;

        startTokenRegExp.lastIndex = 0;

        while (match = startTokenRegExp.exec(text)) {
            if (match.index >= pos) {
                startTokenPos = match.index;
                contentPos = startTokenPos + match[0].length;

                if (pos != startTokenPos) {
                    tokens.push(CONTENT, text.slice(pos, startTokenPos));
                }

                var scanner = this.scanners[match[0]];

                if (scanner.token) {
                    tokens.push(scanner.token, null);
                    pos = contentPos;
                } else {
                    endTokenPos = text.indexOf(scanner.stopToken, contentPos);
                    scanner.scan(tokens, text.slice(contentPos, endTokenPos));
                    pos = endTokenPos + scanner.stopToken.length;
                }
            }
        }

        if (pos < text.length) {
            tokens.push(CONTENT, text.slice(pos));
        }

        return tokens;
    };

    Parser.prototype.build = function (tree, data) {
        var result = {
            nodes: tree,
            left: 0,
            right: tree.length,
            empty: true,
            subnodes: [],
            sublayouts: [],
            strings: [],
            data: new DataLogger(data)
        };
        this._buildTree(result);
        result.renderedValues = result.data.getRenderedValues();
        return result;
    };

    Parser.prototype._buildTree = function (tree) {
        var nodes = tree.nodes,
            strings = tree.strings;
        while (tree.left < tree.right) {
            var node = nodes[tree.left];
            if (node == CONTENT) {
                strings.push(nodes[tree.left + 1]);
                tree.empty = false;
                tree.left += 2;
            } else {
                this.builders[node](tree, this);
            }
        }
    };

    // Токены старого синтаксиса
    var OLD_SUBSTITUTE = 1001,
        OLD_SUBLAYOUT = 1002,
        OLD_IF = 1003,
        OLD_ELSE = 1004,
        OLD_ENDIF = 1005;

    Parser.prototype.scanners['$[['] = {
        stopToken: ']]',
        scan: function (tokens, text) {
            var parts = text.match(/^(\S+)\s*(\S.*)?$/);
            tokens.push(OLD_SUBLAYOUT, [parts[1], parts[2] ? getKeyValuePairs(parts[2]) : []]);
        }
    };

    Parser.prototype.scanners['$['] = {
        stopToken: ']',
        scan: function (tokens, text) {
            var parts = text.split('|', 2);
            tokens.push(OLD_SUBSTITUTE, parts);
        }
    };

    Parser.prototype.scanners['[if'] = {
        stopToken: ']',
        scan: function (tokens, text) {
            var parts = text.match(/^(def)? (.+)$/),
                substitutes = parseExpression(parts[2]);

            tokens.push(OLD_IF, [parts[1], substitutes]);
        }
    };

    Parser.prototype.scanners['[else]'] = {
        token: OLD_ELSE
    };

    Parser.prototype.scanners['[endif]'] = {
        token: OLD_ENDIF
    };

    Parser.prototype.builders[OLD_SUBSTITUTE] = function (tree, parser) {
        var key = tree.nodes[tree.left + 1][0],
            value = tree.data.get(key);

        if (typeof value == 'undefined') {
            value = tree.nodes[tree.left + 1][1];
        }

        tree.strings.push(value);
        tree.left += 2;
        tree.empty = tree.empty && !value;
    };

    Parser.prototype.builders[OLD_SUBLAYOUT] = function (tree, parser) {
        var id = utilId.prefix() + utilId.gen(),
            key = tree.nodes[tree.left + 1][0];

        tree.strings.push('<ymaps id="' + id + '"></ymaps>');

        var sublayoutInfo = {
                id: id,
                key: key,
                value: tree.data.get(key) || key
            },
            monitorValues = [],
            splitDefault = [];

        var params = tree.nodes[tree.left + 1][1];

        for (var i = 0, l = params.length; i < l; i++) {
            var pair = params[i],
                k = pair[0],
                v = pair[1] || "true",
                end = v.length - 1,
                val;

            // если значение в кавычках, парсим как строку
            if (
                (v.charAt(0) == '"' && v.charAt(end) == '"') ||
                (v.charAt(0) == '\'' && v.charAt(end) == '\'')
                ) {
                val = v.substring(1, end);

                // если цифра или true|false - как есть
            } else if (!isNaN(Number(v))) {
                val = v;

            } else if (v == "true") {
                val = true;

            } else if (v == "false") {
                val = false;

                // иначе - ищем в данных
            } else {
                splitDefault = v.split('|');
                val = tree.data.get(splitDefault[0], splitDefault[1]);
                monitorValues.push(splitDefault[0]);
            }

            sublayoutInfo[k] = val;
        }

        sublayoutInfo.monitorValues = monitorValues;

        tree.sublayouts.push(sublayoutInfo);
        tree.left += 2;
    };

    Parser.prototype.builders[OLD_IF] = function (tree, parser) {
        var nodes = tree.nodes,
            left = tree.left,
            ifdef = nodes[left + 1][0],
            expression = nodes[left + 1][1],
            result = evaluateExpression(expression, tree.data),
            isTrue = ifdef ? typeof result != "undefined" : !!result,
            l,
            i = tree.left + 2,
            r = tree.right,
            counter = 1,
            elsePosition,
            endIfPosition;

        while (i < r) {
            if (nodes[i] == OLD_IF) {
                counter++;
            } else if (nodes[i] == OLD_ELSE) {
                if (counter == 1) {
                    elsePosition = i;
                }
            } else if (nodes[i] == OLD_ENDIF) {
                if (!--counter) {
                    endIfPosition = i;
                }
            }
            if (endIfPosition) {
                break;
            }
            i += 2;
        }

        if (isTrue) {
            l = tree.left + 2;
            r = elsePosition ? elsePosition : endIfPosition;
        } else {
            l = elsePosition ? elsePosition + 2 : endIfPosition;
            r = endIfPosition;
        }

        if (l != r) {
            var oldRight = tree.right,
                oldEmpty = tree.empty;

            tree.left = l;
            tree.right = r;

            parser._buildTree(tree);

            tree.empty = tree.empty && oldEmpty;
            tree.right = oldRight;
        }

        tree.left = endIfPosition + 2;
    };

    // Токены нового синтаксиса
    var SUBSTITUTE = 2001,
        INCLUDE = 2002,
        IF = 2003,
        ELSE = 2004,
        ENDIF = 2005,
        FOR = 2006,
        ENDFOR = 2007,
        ELSEIF = 2008;

    Parser.prototype.scanners['{{'] = {
        stopToken: '}}',
        scan: function (tokens, text) {
            var parts = trim(text).split('|'),
                filters = [];
            for (var i = 1, l = parts.length; i < l; i++) {
                var match = parts[i].split(':', 2),
                    filter = trim(match[0]),
                    filterValue = match[1];//null;

                if (match[1]) {
                    if (filter != 'default') {
                        filterValue = parseExpression(removeQuotes(match[1]));
                    } else {
                        filterValue = trim(match[1]);
                    }
                }
                filters.push([filter, filterValue]);
            }
            tokens.push(SUBSTITUTE, [parts[0], filters]);
        }
    };

    Parser.prototype.scanners['{%'] = {
        stopToken: '%}',
        scan: function (tokens, text) {
            var match = trim(text).match(/^([A-Za-z]+)(\s+\S.*)?$/),
                operator = match[1],
                expression = match[2] ? trim(match[2]) : null;

            switch (operator) {
                case 'if':
                    tokens.push(IF, parseExpression(expression));
                    break;
                case 'else':
                    tokens.push(ELSE, null);
                    break;
                case 'elseif':
                    tokens.push(ELSEIF, parseExpression(expression));
                    break;
                case 'endif':
                    tokens.push(ENDIF, null);
                    break;
                case 'include':
                    var conditions = getKeyValuePairs(expression);
                    tokens.push(INCLUDE, [removeQuotes(conditions[0][0]), conditions.slice(1)]);
                    break;
                case 'for':
                    tokens.push(FOR, expression);
                    break;
                case 'endfor':
                    tokens.push(ENDFOR, null);
                    break;
            }
        }
    };

    Parser.prototype.builders[SUBSTITUTE] = function (tree, parser) {
        // Для ключей вида object[0], object["test"][0] и т.д.
        var keyWithSquareBracketsRegExp  = /\[\s*([0-9]+|\'[^\']+\'|\"[^\"]+\")\s*\]/g,
            treeValue = tree.nodes[tree.left + 1],
            key = treeValue[0],
            value,
            filters = treeValue[1],
            needEscape = true,
            i,
            l;

        if (!keyWithSquareBracketsRegExp.test(key)) {
            value = tree.data.get(key);
        } else {
            var path = key.match(keyWithSquareBracketsRegExp);
            key = key.split(path[0])[0];

            for (i = 0, l = path.length; i < l; i++) {
                path[i] = trim(path[i].replace('[', '').replace(']', ''));
                path[i] = removeQuotes(path[i]);

            }
            value = tree.data.get(key + '.' + path.join('.'));
        }

        for (i = 0, l = filters.length; i < l; i++) {
            var filter = filters[i];
            switch (filter[0]) {
                case 'default':
                    if (typeof value == 'undefined') {
                        key = filter[1];
                        var word = removeQuotes(key);
                        if (key.length == word.length) {
                            if (!isNaN(word)) {
                                value = word;
                            } else {
                                value = tree.data.get(key);
                            }
                        } else {
                            value = word;
                        }
                    }
                    break;
                case 'raw':
                    needEscape = false;
                    break;
            }
        }

        if (needEscape && typeof value == 'string') {
            value = escape(value);
        }

        tree.strings.push(value);
        tree.left += 2;
        tree.empty = tree.empty && !value;
    };

    Parser.prototype.builders[INCLUDE] = Parser.prototype.builders[OLD_SUBLAYOUT];

    Parser.prototype.builders[FOR] = function (tree, parser) {
        var nodes = tree.nodes,
            i = tree.left + 2,
            left,
            right = tree.right,
            counter = 1,
            endForPosition;

        // Определяем область действия for.
        while (i < right) {
            if (nodes[i] == FOR) {
                counter++;
            } else if (nodes[i] == ENDFOR) {
                if (!--counter) {
                    endForPosition = i;
                }
            }
            if (endForPosition) {
                break;
            }
            i += 2;
        }

        left = tree.left + 2;
        right = endForPosition;

        if (left != right) {
            var expressionParts = nodes[tree.left + 1].split(/\sin\s/),
                beforeIn = trim(expressionParts[0]),
                afterIn = trim(expressionParts[1]),
                list = tree.data.get(afterIn),
                params = beforeIn.split(','),
                paramsLength = params.length;

            // Создаем временное дерево для обработки блока. 
            var originRight = tree.right,
                originEmpty = tree.empty,
                originLogger = tree.data,
                tmpDataLogger = new DataLogger(originLogger);

            tree.data = tmpDataLogger;

            for (var property in list) {
                tree.left = left;
                tree.right = right;

                if (list.hasOwnProperty(property)) {
                    if (paramsLength == 1) {
                        tmpDataLogger.setContext(beforeIn, afterIn + "." + property);
                    } else {
                        tmpDataLogger.set(trim(params[0]), property);
                        tmpDataLogger.setContext(trim(params[1]), afterIn + "." + property);
                    }
                    parser._buildTree(tree);
                }
            }

            // Восстанавливаем состоянение оригинального блока с учетом данных временного дерева.
            tree.empty = tree.empty && originEmpty;
            tree.right = originRight;
            tree.data = originLogger;
        }

        tree.left = endForPosition + 2;
    };

    Parser.prototype.builders[IF] =
    Parser.prototype.builders[ELSEIF] = function (tree, parser) {
        var nodes = tree.nodes,
            left = tree.left,
            expression = nodes[left + 1],
            result = evaluateExpression(expression, tree.data),
            isTrue = !!result,
            l,
            i = tree.left + 2,
            r = tree.right,
            depth = 1,
            elsePosition,
            elseIfPosition,
            endIfPosition,
            node;

        while (i < r) {
            node = nodes[i];
            if (node == IF) {
                depth++;
            } else if (node == ELSEIF) {
                if (depth == 1 && !elseIfPosition) {
                    elseIfPosition = i;
                }
            } else if (node == ELSE) {
                if (depth == 1) {
                    elsePosition = i;
                }
            } else if (node == ENDIF) {
                if (!--depth) {
                    endIfPosition = i;
                }
            }
            if (endIfPosition) {
                break;
            }
            i += 2;
        }

        if (isTrue) {
            l = tree.left + 2;
            r = elseIfPosition || elsePosition || endIfPosition;
        } else {
            if (elseIfPosition) {
                l = elseIfPosition;
                r = endIfPosition + 1;
            } else {
                l = elsePosition ? elsePosition + 2 : endIfPosition;
                r = endIfPosition;
            }
        }

        if (l != r) {
            var oldRight = tree.right,
                oldEmpty = tree.empty;

            tree.left = l;
            tree.right = r;

            parser._buildTree(tree);

            tree.empty = tree.empty && oldEmpty;
            tree.right = oldRight;
        }

        tree.left = endIfPosition + 2;
    };

    provide(Parser);
});
ym.modules.define('user.Base', ['util.defineClass', 'config'], function (provide, defineClass, config) {
    function BaseUser (name, location) {
        this._name = name;
        this._location = location || config.location.default;
    }

    defineClass(BaseUser, {
        getName: function () {
            return this._name;
        },

        getLocation: function () {
            return config.location[this._location];
        }
    });

    provide(BaseUser);
});
ym.modules.define('user.Player', ['util.defineClass', 'user.Base'], function (provide, defineClass, BaseUser) {
    function Player () {
        Player.superclass.constructor.apply(this, arguments);
    }

    defineClass(Player, BaseUser, {
        play: function () {
            console.log(this.getName() + ' from ' + this.getLocation() + ' started playing.');
        }
    });

    provide(Player);
});
ym.modules.define('util.defineClass', ['util.extend'], function (provide, extend) {
    function augment (childClass, parentClass, override) {
        childClass.prototype = (Object.create || function (obj) {
            function F () {}

            F.prototype = obj;
            return new F();
        })(parentClass.prototype);

        childClass.prototype.constructor = childClass;
        childClass.superclass = parentClass.prototype;
        childClass.superclass.constructor = parentClass;

        if (override) {
            extend(childClass.prototype, override);
        }

        return childClass.prototype;
    }

    function createClass (childClass, parentClass, override) {
        if (typeof parentClass == 'function') {
            augment(childClass, parentClass, override);
        } else {
            override = parentClass;
            extend(childClass.prototype, override);
        }

        return childClass;
    }

    provide(createClass);
});
ym.modules.define("util.extend", [
    "util.objectKeys"
], function (provide, objectKeys) {
    /**
     * Функция, копирующая свойства из одного или нескольких
     * JavaScript-объектов в другой JavaScript-объект.
     * @param {Object} target Целевой JavaScript-объект. Будет модифицирован
     * в результате работы функции.
     * @param {Object} source JavaScript-объект - источник. Все его свойства
     * будут скопированы. Источников может быть несколько (функция может иметь
     * произвольное число параметров), данные копируются справа налево (последний
     * аргумент имеет наивысший приоритет при копировании).
     * @name util.extend
     * @function
     * @static
     *
     * @example
     * var options = ymaps.util.extend({
     *      prop1: 'a',
     *      prop2: 'b'
     * }, {
     *      prop2: 'c',
     *      prop3: 'd'
     * }, {
     *      prop3: 'e'
     * });
     * // Получим в итоге: {
     * //     prop1: 'a',
     * //     prop2: 'c',
     * //     prop3: 'e'
     * // }
     */

    function extend (target) {
        if (ym.env.debug) {
            if (!target) {
                throw new Error("util.extend: не передан параметр target");
            }
        }
        for (var i = 1, l = arguments.length; i < l; i++) {
            var arg = arguments[i];
            if (arg) {
                for (var prop in arg) {
                    if (arg.hasOwnProperty(prop)) {
                        target[prop] = arg[prop];
                    }
                }
            }
        }
        return target;
    }

    // этот вариант функции использует Object.keys для обхода обьектов
    function nativeExtend (target) {
        if (ym.env.debug) {
            if (!target) {
                throw new Error("util.extend: не передан параметр target");
            }
        }
        for (var i = 1, l = arguments.length; i < l; i++) {
            var arg = arguments[i];
            if (arg) {
                var keys = objectKeys(arg);
                for (var j = 0, k = keys.length; j < k; j++) {
                    target[keys[j]] = arg[keys[j]];
                }
            }
        }
        return target;
    }

    provide((typeof Object.keys == "function") ? nativeExtend : extend);
});
ym.modules.define("util.id", [], function (provide) {
    /**
     * @ignore
     * @name util.id
     */

    var id = new function () {
        /* Префикс, имеет три применения:
         * как префикс при генерации уникальных id, он призван давать уникальность при каждом запуске страницы
         * как имя свойства в котором хранятся id выданный объекту
         * как id для window
         */
        // http://jsperf.com/new-date-vs-date-now-vs-performance-now/6
        var prefix = ('id_' + (+(new Date())) + Math.round(Math.random() * 10000)).toString(),
            counterId = Math.round(Math.random() * 10000);

        function gen () {
            return (++counterId).toString();
        }

        /**
         * @ignore
         * Возвращает префикс, который используется как имя поля.
         * @return {String}
         */
        this.prefix = function () {
            return prefix;
        };

        /**
         * @ignore
         * Генерирует случайный ID. Возвращает результат в виде строки символов.
         * @returns {String} ID
         * @example
         * util.id.gen(); // -> '45654654654654'
         */
        this.gen = gen;

        /**
         * @ignore
         * Генерирует id и присваивает его свойству id переданного объекта. Если свойство id объекта существует,
         * то значение этого свойства не изменяется. Возвращает значение id в виде строки.
         * @param {Object} object Объект
         * @returns {String} ID
         */
        this.get = function (object) {
            return object === window ? prefix : object[prefix] || (object[prefix] = gen());
        };
    };

    provide(id);
});
ym.modules.define("util.jsonp", [
    "util.id",
    "util.script"
], function (provide, utilId, utilScript) {
    var exceededError = { message: 'timeoutExceeded' },
        scriptError = { message: 'scriptError' },
        undefFunc = function () {};

    /**
     * @ignore
     * @function
     * @name util.jsonp Загружает скрипт по указанному url и подает ответ на вход функции-обработчика.
     * @param {Object} options Опции.
     * @param {String} options.url Адрес загрузки скрипта.
     * @param {String} [options.paramName = 'callback'] Название параметра для функции-обработчика.
     * @param {String} [options.padding] Имя функции-обработчика.
     * @param {Boolean} [options.noCache] Флаг, запрещающий кэширование скрипта. Добавляет случайное число
     * как параметр.
     * @param {Number} [options.timeout = 30000] Количество миллисекунд, в течение которых должен быть загружен скрипт.
     * Иначе удалять скрипт по истечении этого времени.
     * @param {Object} [options.requestParams] Параметры GET запроса.
     * @param {Boolean} [options.checkResponse = true] Флаг, определяющий нужно ли проверять ответ от сервера.
     * Если true, то при отсутствии поля error в ответе или равного null, promise будет зарезолвен
     * со значением res.response или res (если поле response отсутствует), где res - ответ сервера.
     * Иначе promise будет отклонен со значением res.error.
     * @param {String} [options.responseFieldName = 'response'] Имя поля ответа сервера, содержащее
     * данные.
     * @returns {vow.Promise} Объект-promise.
     */
    function jsonp (options) {
        var callbackName,
            tag,
            checkResponse = typeof options.checkResponse == 'undefined' ?
                true : options.checkResponse,
            responseFieldName = options.responseFieldName || 'response',
            requestParamsStr = getParamsStr(options.requestParams),
            deferred = ym.vow.defer(),
            promise = deferred.promise(),
            timeout = options.timeout || 30000,
            exceededTimeout = setTimeout(function () {
                deferred.reject(exceededError);
            }, timeout),
            clearRequest = function () {
                clear(tag, callbackName);
                clearTimeout(exceededTimeout);
                exceededTimeout = null;
            };

        if (!options.padding) {
            callbackName = utilId.prefix() + utilId.gen();
            window[callbackName] = function (res) {
                if (checkResponse) {
                    var error = !res || res.error ||
                        (res[responseFieldName] && res[responseFieldName].error);
                    if (error) {
                        deferred.reject(error);
                    } else {
                        deferred.resolve(res && res[responseFieldName] || res);
                    }
                } else {
                    deferred.resolve(res);
                }
            };
        }

        tag = utilScript.create(
            options.url +
                (/\?/.test(options.url) ? "&" : "?") + (options.paramName || 'callback') + '=' + (options.padding || callbackName) +
                (options.noCache ? '&_=' + Math.floor(Math.random() * 10000000) : '') + requestParamsStr
        );

        tag.onerror = function () {
            deferred.reject(scriptError);
        };

        promise.then(clearRequest, clearRequest);

        return promise;
    }

    /**
     * @ignore
     * Удаляет тэг script.
     */
    function clear (tag, callbackName) {
        if (callbackName) {
            removeCallback(callbackName);
        }
        // Удаляем тег по таймауту, чтобы не нарваться на синхронную обработку,
        // в странных разных браузерах (IE, Опера старая, Сафари, Хром, ФФ4 ),
        // когда содержимое запрошенного скрипта исполняется прямо на строчке head.appendChild(tag)
        // и соответственно, при попытке удалить тэг кидается исключение.
        setTimeout(function () {
            if (tag && tag.parentNode) {
                tag.parentNode.removeChild(tag);
            }
        }, 0);
    }

    /**
     * @ignore
     * удаляем функцию-обработчик
     */
    function removeCallback (callbackName) {
        // Удаляем jsonp-функцию
        window[callbackName] = undefFunc;
        // удаляем функцию через большой интервал, т.к. содержимое удаленного тэга script может попытаться обратится
        // к этой функции, для этого и делаем заглушку undefFunc
        setTimeout(function () {
            // IE не дает делать delete объектов window
            window[callbackName] = undefined;
            try {
                delete window[callbackName];
            } catch (e) {
            }
        }, 500);
    }

    /**
     * @ignore
     * Создает строку с параметрами запроса
     */
    function getParamsStr (params) {
        if (!params) {
            return '';
        }
        var str = '';
        for (var k in params) {
            if (params.hasOwnProperty(k)) {
                if (typeof params[k] != 'undefined') {
                    str += '&' + k + '=' + encodeURIComponent(params[k]);
                }
            }
        }
        return str;
    }

    provide(jsonp);
});

ym.modules.define("util.objectKeys", [], function (provide) {
    var objectKeys = (typeof Object.keys == 'function') ? Object.keys : function (object) {
        var keys = [];
        for (var name in object) {
            if (object.hasOwnProperty(name)) {
                keys.push(name);
            }
        }
        return keys;
    };
    provide(function (object) {
        var typeofObject = typeof object,
            result;
        if (typeofObject == 'object' || typeofObject == 'function') {
            result = objectKeys(object);
        } else {
            throw new TypeError('Object.keys called on non-object');
        }
        return result;
    });
});
ym.modules.define('util.providePackage', ['system.mergeImports'], function (provide, mergeImports) {
    provide(function (srcPackage, packageArgs) {
        var packageProvide = packageArgs[0],
            packageModules = Array.prototype.slice.call(packageArgs, 1),
            ns = mergeImports.joinImports(srcPackage.name, {}, srcPackage.deps, packageModules);

        packageProvide(ns);
    });
});
ym.modules.define("util.script", [], function (provide) {
    var head = document.getElementsByTagName("head")[0];
    provide({
        create: function (url, charset) {
            var tag = document.createElement('script');
            // кодировку выставляем прежде src, дабы если файл берется из кеша, он брался не в кодировке страницы
            // эта подобная проблема наблюдалась во всех IE до текущей (восьмой)
            tag.charset = charset || 'utf-8';
            tag.src = url;
            // т.к. head на данный момент может быть не закрыт, добавляем через insertBefore.
            // так как файл может быть взят из кеша и выполнение начнется в тот же момент - timeout
            setTimeout(function () {
                head.insertBefore(tag, head.firstChild);
            }, 0);
            return tag;
        }
    });
});

})(this);