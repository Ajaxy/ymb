(function (global) {
    var vow = ym.vow,
        configPromise = requireModulesFromConfig(),
        getParamsPromise = requireModulesFromParams(),
        domReady = document.readyState == 'complete',
        domDeferred = vow.defer(),
        domPromise = domReady ? vow.resolve() : domDeferred.promise(),
        mergeImportsPromise = null,
        onDomReady = function () {
            if (!domReady) {
                domReady = true;
                domDeferred.resolve();
            }
        };

    if (!domReady) {
        if (document.addEventListener) {
            document.addEventListener('DOMContentLoaded', onDomReady, false);
            window.addEventListener('load', onDomReady, false);
        } else if (document.attachEvent) {
            window.attachEvent('onload', onDomReady);
        }
    }

    ym.ns.ready = ready;

    function ready () {
        var params = {};

        if (arguments.length) {
            if (arguments.length == 1 && typeof arguments[0] == 'object' && !arguments[0].length) {
                // Call with hash of params.
                params = arguments[0];
            } else if (typeof arguments[0] != 'function') {
                // Call with modules list as first parameter.
                params.require = typeof arguments[0] == 'string' ? [arguments[0]] : arguments[0];
                params.successCallback = arguments[1];
                params.errorCallback = arguments[2] && typeof arguments[2] == 'function' ? arguments[2] : null;
                params.context = arguments[2] && typeof arguments[2] == 'object' ? arguments[2] : arguments[3];
            } else {
                // Call with regular signature: `successCallback[, errorCallback], context`.
                params.successCallback = arguments[0];
                params.errorCallback = arguments[1] && typeof arguments[1] == 'function' ? arguments[1] : null;
                params.context = arguments[1] && typeof arguments[1] == 'object' ? arguments[1] : arguments[2];
            }
        }

        var readyParamsPromise = params.require ? ym.modules.require(params.require) : vow.resolve();

        return vow.all([
            getMergeImports(),
            readyParamsPromise,
            getParamsPromise,
            configPromise,
            domPromise
        ]).spread(function (mergeImports, readyParamsModulesValues) {
            if (isNotEmpty(readyParamsModulesValues)) {
                mergeImports.joinImports('package.ymaps', ym.ns, params.require, readyParamsModulesValues);
            }

            if (params.successCallback) {
                // Workaround for swallowing exceptions in user code by promises.
                ym.modules.nextTick(function () {
                    params.successCallback.call(params.context, ym.ns);
                });
            }

            return ym.ns;
        }).fail(function (err) {
            if (params.errorCallback) {
                ym.modules.nextTick(function () {
                    params.errorCallback.call(params.context, err);
                });
            }

            return vow.reject(err);
        });
    }

    function getMergeImports () {
        if (!mergeImportsPromise) {
            mergeImportsPromise = ym.modules.require(['system.mergeImports']).spread(function (mergeImports) {
                return mergeImports;
            });
        }

        return mergeImportsPromise;
    }
    
    function requireModulesFromConfig () {
        var modulesNames = ym.project.preload;

        if (!isNotEmpty(modulesNames)) {
            return vow.resolve();
        }

        var promise = ym.modules.require(modulesNames);

        return vow.all([getMergeImports(), promise]).spread(function (mergeImports, modulesValues) {
            if (isNotEmpty(modulesValues)) {
                mergeImports.joinImports('package.ymaps', ym.ns, modulesNames, modulesValues);
            }
        });
    }

    function requireModulesFromParams () {
        var preload = ym.env.preload,
            modulesNames = preload.load && preload.load.length > 0 && preload.load.split(','),
            promise = modulesNames ? ym.modules.require(modulesNames) : vow.resolve();

        if (preload.onError) {
            promise.fail(function (err) {
                ym.modules.nextTick(function () {
                    callUserMethod(0, preload.onError, err);
                });
            });
        }

        return vow.all([getMergeImports(), promise, configPromise]).spread(function (mergeImports, modulesValues) {
            if (isNotEmpty(modulesValues)) {
                mergeImports.joinImports('package.ymaps', ym.ns, modulesNames, modulesValues);
            }

            if (preload.onLoad) {
                ym.modules.nextTick(function () {
                    callUserMethod(0, preload.onLoad, ym.ns);
                });
            }
        });
    }

    function callUserMethod (i, callback, value) {
        // Если функция обработчик описана ниже подключения АПИ, то в ситуации поднятия АПИ из кеша и синхронного
        // в результате этого выполнения кода, получаем ошибку при вызове несуществующей функции. Стабильно
        // повторяется в браузере Opera.
        var callbackData = getMethodByPath(global, callback);

        if (callbackData) {
            callbackData.method.call(callbackData.context, value);
        } else {
            window.setTimeout(function () {
                callUserMethod(++i, callback, value);
            }, Math.pow(2, i));
        }
    }

    function getMethodByPath (parentNs, path) {
        var subObj = parentNs;
        path = path.split('.');
        var i = 0, l = path.length - 1;
        for (; i < l; i++) {
            subObj = subObj[path[i]];
            if(!subObj){
                return undefined;
            }
        }
        return {
            method: subObj[path[l]],
            context: subObj
        };
    }

    function isNotEmpty (obj) {
        return obj && obj.length;
    }
})(this);