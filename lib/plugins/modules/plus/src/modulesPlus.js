/**
 * Специальная прослойка, которая добавляет промисы, фоллбеки, динамические зависимости и алиасы в модульную систему.
 */
(function (global, modulesSystem, undef) {
    var WATCH_DEPS_TIMEOUT = 10; // sec.

    var vow = ym.vow,

        slice = Array.prototype.slice,
    
        moduleByAliases = {},
        entries = {},
        
        keyNotFoundError = function (storage, key) { 
            return new Error("The key \"" + key + "\" isn't declared in \"" + storage + "\" storage."); 
        },
        dynamicDependNotFoundError = function (dynamicDepend) {
            return new Error("The dynamic depend \"" + dynamicDepend + "\" not found.");
        },

        api;

    api = {
        fallbacks: new FallbackManager(),

        define: function (moduleName, depends, callback, context) {
            var storage, key, dynamicDepends;

            if (typeof depends == 'function' && typeof callback != 'function') {
                callback = depends;
                context = callback;
                depends = [];
            } else if (typeof moduleName == 'object') {
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

            if (typeof depends == 'function') {
                depends = depends.call(this, ym);;
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

                if (ym.env.debug) {
                    this.watchDeps(moduleName, deps);
                }
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
//                    api.fallbacks.retrieve(moduleNames).then(function () {
                    vow.reject(err).then(function () {
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

        // This method is being called with context of a module.
        providePackage: function (provide) {
            var module = this,
                depsValues = Array.prototype.slice.call(arguments, 1);

            api.require(['system.mergeImports']).spread(function (mergeImports) {
                provide(mergeImports.joinImports(module.name, {}, module.deps, depsValues));
            });
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

        watchDeps: function (moduleName, deps) {
            if (!(typeof console == 'object' && typeof console.warn == 'function')) {
                return;
            }

            var _this = this;

            if (typeof this._failCounter == 'undefined') {
                this._failCounter = 0;
            }

            setTimeout(function () {
                for (var i = 0, l = deps.length; i < l; i++) {
                    if (_this.getState(deps[i]) != 'RESOLVED') {
                        _this._failCounter++;

                        if (false && _this._failCounter > 5) {
                            continue;
                        }

                        console.warn('Timeout: Dependency `' + deps[i] +
                            '` from module `' + moduleName+ '` is ' + _this.getState(deps[i]) + ' within ' + WATCH_DEPS_TIMEOUT + ' sec.');
                    }

                    if (false && _this._failCounter == 5) {
                        setTimeout(function () {
                            console.warn('Timeout: Totally ' + _this._failCounter +
                                ' dependencies were not resolved within ' + WATCH_DEPS_TIMEOUT + ' sec.');

                            _this._failCounter = 0;
                        }, 100);
                    }
                }
            }, WATCH_DEPS_TIMEOUT * 1000);
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
                    var depends = modulesSystem.getDependencies(moduleName),
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
})(this, ym.modules);
