(function (global) {
    var vow = ym.vow,
        configPromise = requireModulesFromConfig(),
        getParamsPromise = requireModulesFromParams(),
        domReady = document.readyState == 'complete',
        domDeferred = vow.defer(),
        domPromise = domReady ? vow.resolve() : domDeferred.promise(),
        mergeImportsPromise = null;

    if (!domReady) {
        function onDomReady () {
            if (!domReady) {
                domReady = true;
                domDeferred.resolve();
            }
        }

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

        if (arguments.length == 1) {
            params = arguments[0];
        } else if (typeof arguments[0] == 'object') {
            params = {
                modulesNames: arguments[0],
                successCallback: arguments[1],
                errorCallback: arguments[2],
                context: arguments[3]
            }
        } else if (typeof arguments[0] == 'function') {
            params = {
                successCallback: arguments[0],
                errorCallback: arguments[1],
                context: arguments[2]
            }
        }
        
        var readyParamsPromise = params.modulesNames ? ym.modules.require(params.modulesNames) : vow.resolve();

        return vow.all([
            getMergeImports(),
            readyParamsPromise,
            getParamsPromise,
            configPromise,
            domPromise
        ]).spread(function (mergeImports, readyParamsModulesValues) {
            if (isNotEmpty(readyParamsModulesValues)) {
                mergeImports.joinImports('package.ymaps', ym.ns, modulesNames, readyParamsModulesValues);
            }

            if (params.successCallback) {
                params.context ? params.successCallback.call(context, ym.ns) : params.successCallback(ym.ns);
            }

            return ym.ns
        }).fail(function (err) {
            if (params.errorCallback) {
                params.context ? params.errorCallback.call(context, err) : params.errorCallback(err);
            }
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
        var preload = ym.env.preload;

        if (!preload || !isNotEmpty(preload.load)) {
            return vow.resolve();
        }

        var modulesNames = preload.load.split(','),
            promise = ym.modules.require(modulesNames);

        if (preload.onError) {
            promise.fail(function (err) {
                callUserMethod(0, preload.onError, err);
            });
        }

        return vow.all([getMergeImports(), promise]).spread(function (mergeImports, modulesValues) {
            if (isNotEmpty(modulesValues)) {
                mergeImports.joinImports('package.ymaps', ym.ns, modulesNames, modulesValues);
            }

            if (preload.onLoad) {
                callUserMethod(0, preload.onLoad, ym.ns);
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
                callUserMethod(++i, callback, value)
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