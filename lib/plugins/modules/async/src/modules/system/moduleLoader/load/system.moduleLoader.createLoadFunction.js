ym.modules.define('system.moduleLoader.createLoadFunction', ['system.nextTick'], function (provide, nextTick) {
    var ERROR_TIMEOUT = 30000;

    function createLoadFunction (serverData, modulesInfoByName) {
        var waitForNextTick = false,
            pending = [],
            pendingHash = {},
            pendingRequests = 0,
            loaderMarker = {},
            inrequire = {};

        function load (moduleName, callback, context) {
            if (loaderMarker[moduleName]) {
                //callback!
                callback.call(context, loaderMarker[moduleName], moduleName);
                return;
            }
            if (!waitForNextTick) {
                waitForNextTick = true;
                nextTick(onNextTick);
            }
    
            var hash = pendingHash[moduleName];
            if (hash) {
                hash.callback.push([callback, context]);
            } else {
                pendingHash[moduleName] = hash = {
                    moduleName: moduleName,
                    callback: [
                        [callback, context]
                    ]
                };
    
                pending.push(hash);
            }
        }
    
        function cleanUp (tag, jsonp) {
            window[jsonp] = undefined;
            // IE не дает делать delete объектов window
            try {
                window[jsonp] = null;
                delete window[jsonp];
            } catch (e) {
                //nop
            }
            window.setTimeout(function () {
                try {
                    tag && tag.parentNode && tag.parentNode.removeChild(tag);
                } catch (e) {
                    //nop
                }
            }, 0);
        }
    
        function createCombineJsonpCallback (aliases, jsonp, prefix, callback) {
            var errorTimeout = 0,
                completed = false,
                combineJsonpCallback = window[jsonp] = function (data) {
                    for (var i = 0, l = listeners.length; i < l; ++i) {
                        listeners[i][0](data);
                    }
                    listeners = null;
                },
                listeners = combineJsonpCallback.listeners = [
                    [function () {
                        completed = true;
                        clearTimeout(errorTimeout);
                        cleanUp(tag, jsonp);
                    }],
                    callback
                ];
    
            function check () {
                setTimeout(function () {
                    if (!completed) {
                        //trigger error
                        window.console && console.error('ymaps: script not loaded');
                        for (var i = 0, l = listeners.length; i < l; ++i) {
                            listeners[i][1] && listeners[i][1]();
                        }
                    }
                }, 60);
                /* нулевые таймауты могут врать */
            }
    
            var tag = document.createElement('script'),
                src = serverData.url + '/combine.js?load=' + aliases + '&callback_prefix=' + prefix;

            if (serverData.mode) {
                src += '&mode=' + encodeURIComponent(serverData.mode);
            }

            if (serverData.namespace) {
                src += '&namespace=' + encodeURIComponent(serverData.namespace);
            }

            // кодировку выставляем прежде src, дабы если файл берется из кеша, он брался не в кодировке страницы
            // подобная проблема наблюдалась во всех IE до восьмой
            tag.charset = 'utf-8';
            tag.async = true;

            tag.src = src;

            tag.onreadystatechange = function () {
                if (this.readyState == 'complete' || this.readyState == 'loaded') {
                    check();// дать скрипту время на выполнение
                }
            };
    
            tag.onload = tag.onerror = check;
    
            document.getElementsByTagName("head")[0].appendChild(tag);
            errorTimeout = setTimeout(callback[1], ERROR_TIMEOUT);
        }
    
        function request (aliases, prefix, callback, errorCallback) {
            var jsonp = prefix + '_' + aliases;
            if (!window[jsonp]) {
                createCombineJsonpCallback(
                    aliases,
                    jsonp,
                    prefix,
                    [callback, errorCallback]
                );
            } else {
                window[jsonp].listeners.push([callback, errorCallback]);
            }
        }
    
    
        function require (moduleList) {
            var modules = moduleList.join('');
            pendingRequests++;
    
            function executeSandbox (modules) {
                pendingRequests--;
                var moduleNamesList = [];
                for (var i = 0, l = modules.length - 1; i < l; ++i) {
                    var rq = inrequire[modules[i][0]],
                        fn = modules[i][1];
                    if (rq) {
                        for (var j = 0, l2 = rq.callback.length; j < l2; ++j) {
                            rq.callback[j][0] && rq.callback[j][0].call(rq.callback[j][1], fn, rq.moduleName);
                        }
                        loaderMarker[rq.moduleName] = fn;
                        moduleNamesList.push(rq.moduleName);
                        delete pendingHash[rq.moduleName];
                        delete inrequire[modules[i][0]];
                    }
                }
            }
    
            function executeSandboxSafe (modules) {
                try {
                    executeSandbox(modules);
                } catch (e) {
                    onError();
                    setTimeout(function () {
                        throw e;
                    }, 1);
                }
            }
    
            function onError () {
                pendingRequests--;
                for (var i = 0, l = moduleList.length; i < l; ++i) {
                    var rq = inrequire[moduleList[i]];
                    if (rq) {
//                        loadWatcher.trigger(rq.moduleName, 'script or network error');
                        delete pendingHash[rq.moduleName];
                    }
                    delete inrequire[modules[i]];
                }
            }
    
            var prefix = ym.project.namespace + ym.project.jsonpPrefix + '_loader';

            if (moduleList.length == 1) {
                prefix += inrequire[moduleList[0]].moduleName;
            }

            request(modules, prefix, ym.env.debug ? executeSandbox : executeSandboxSafe, onError);
        }
    
        function onNextTick () {
            var LIMIT = ym.project.loadLimit,
                limit = Math.min(LIMIT, pending.length),
                i = 0,
                requestString = [];
    
            if (limit) {
    
                pending = pending.sort(function (a, b) {
                    return a.moduleName.localeCompare(b.moduleName);
                });
    
                for (i = 0; i < limit; i++) {
                    var alias = modulesInfoByName[pending[i].moduleName].alias;
                    inrequire[alias] = pending[i];
                    requestString.push(alias);
                }
    
                require(requestString);
            }
    
            if (pending.length && limit < pending.length) {
                pending = pending.slice(limit);
                nextTick(onNextTick);
            }
            else {
                pending = [];
                waitForNextTick = false;
            }
        }
        
        return load;
    }

    provide(createLoadFunction);
});