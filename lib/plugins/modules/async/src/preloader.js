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

    if (ym.project.namespace) {
        global[ym.project.namespace].ready = ready;
    }

    function ready (modulesNames, cb) {
        if (!cb && typeof modulesNames == 'function') {
            cb = modulesNames;
            modulesNames = null;
        }
        
        var readyParamsPromise = modulesNames ? ym.modules.require(modulesNames) : vow.resolve();

        return vow.all([
            getMergeImports(),
            readyParamsPromise,
            getParamsPromise,
            configPromise,
            domPromise
        ]).spread(function (mergeImports, readyParamsModulesValues) {
            var ns = ym.project.namespace ? global[ym.project.namespace] : {};

            if (isNotEmpty(readyParamsModulesValues)) {
                mergeImports.joinImports('package.ymaps', ns, modulesNames, readyParamsModulesValues);
            }

            cb && cb(ns);

            return readyParamsModulesValues;
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
            var ns = ym.project.namespace ? global[ym.project.namespace] : {};

            if (isNotEmpty(modulesValues)) {
                mergeImports.joinImports('package.ymaps', ns, modulesNames, modulesValues);
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
            var ns = ym.project.namespace ? global[ym.project.namespace] : {};

            if (isNotEmpty(modulesValues)) {
                mergeImports.joinImports('package.ymaps', ns, modulesNames, modulesValues);
            }

            if (preload.onLoad) {
                callUserMethod(0, preload.onLoad, ns);
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