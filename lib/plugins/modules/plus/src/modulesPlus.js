/**
 * Специальная прослойка, которая добавляет промисы, фоллбеки, динамические зависимости и алиасы в модульную систему.
 */
(function (global, modulesSystem, undef) {
    var WATCH_RESOLVING_TIMEOUT = 10; // sec.

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
        noFallbackError = function (moduleName) {
            return new Error('Undefined module `' + moduleName + '` with no matching fallback.');
        },

        api;

    api = {
        fallbacks: new FallbackManager(),

        define: function (moduleName, depends, callback, context) {
            var _this = this,
                storage, key, dynamicDepends;

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
                entries[moduleName] = { name: moduleName };
            }

            if (typeof depends == 'function') {
                depends = depends.call({ name: moduleName }, ym);
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

            var onModuleLoad = api._createPatchedCallback(moduleName);

            if (depends != null) {
                var deps = [];
                for (var i = 0, l = depends.length; i < l; i++) {
                    deps[i] = this._processModuleName(depends[i]);
                }

                deps = this.fallbacks.addRetrievers(deps);
                // Often dependecy module is simply defined after its dependant so we don't need fallbacks anymore.
                this.nextTick(function () {
                    _this.fallbacks.removeRetrievers(modulesSystem.getDependencies(moduleName));
                });

                modulesSystem.define(moduleName, deps, onModuleLoad);
            } else {
                modulesSystem.define(moduleName, onModuleLoad);
            }

            return this;
        },

        require: function (moduleNames, successCallback, errorCallback, context, afterRetrieve) {
            var deferred = vow.defer(),
                promise = deferred.promise(),
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

            if (ym.env.debug && !afterRetrieve) {
                this.watchResolving(moduleNames);
            }

            if (!result.error) {
                modulesSystem.require(moduleNames, function () {
                    // TODO потенцально опасный код.
                    // Для сокращения ожидания и кол-ва кода основной запрос и все динамические зависимости обрабатываются одним require.
                    // Чтобы модули из динамических зависимостей отрабатывали раньше, чем явно запрощенные модули, они добалявляются в начало массива.
                    // Если вдруг в модульной системе измениться порядок выполнения модулей, то что-то может сломаться.
                    var array = slice.call(arguments, arguments.length - moduleNamesLength);
                    deferred.resolve(array);
                    successCallback && successCallback.apply(context || global, array);
                }, function (err) {
                    if (!afterRetrieve) {
                        api.fallbacks.retrieve(moduleNames).then(function () {
                            deferred.resolve(api.require(moduleNames, successCallback, errorCallback, context, true));
                        }).fail(function (err) {
                            deferred.reject(err);
                        });
                    } else {
                        deferred.reject(err);
                    }
                });
            } else {
                deferred.reject(result.error);
            }

            if (errorCallback && !afterRetrieve) {
                promise.fail(function (err) {
                    errorCallback.call(context || global, err);
                });
            }

            return promise;
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

        watchResolving: function (moduleNames) {
            if (!(typeof console == 'object' && typeof console.warn == 'function')) {
                return;
            }

            var _this = this;

            if (typeof this._failCounter == 'undefined') {
                this._failCounter = 0;
            }

            setTimeout(function () {
                if (_this._failCounter == 0) {
                    setTimeout(function () {
                        _this._failCounter = 0;
                    }, 150);
                }

                for (var i = 0, l = moduleNames.length; i < l; i++) {
                    if (_this.getState(moduleNames[i]) != 'RESOLVED') {
                        _this._failCounter++;

                        if (_this._failCounter == 5) {
                            setTimeout(function () {
                                console.warn('Timeout: Totally ' + _this._failCounter +
                                    ' modules were required but not resolved within ' + WATCH_RESOLVING_TIMEOUT + ' sec.');
                            }, 100);
                        } else if (_this._failCounter > 5) {
                            continue;
                        }

                        console.warn('Timeout: Module `' + moduleNames[i] + '` was required ' +
                            'but is still ' + _this.getState(moduleNames[i]) + ' within ' + WATCH_RESOLVING_TIMEOUT + ' sec.');
                    }
                }
            }, WATCH_RESOLVING_TIMEOUT * 1000);
        },

        _createPatchedCallback: function (moduleName) {
            var _modulesPlus = this;

            return function () {
                var entry = entries[moduleName],
                    array = slice.call(arguments, 0),
                    callback = entry.callback,
                    context = entry.context;

                if (ym.env.debug) {
                    _modulesPlus.watchResolving([moduleName]);
                }

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

                    if (this.fallbacks.isRetriever(moduleName)) {
                        this.fallbacks.addRetrieverData(moduleName, data);
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
    
    var RETRIEVER_PREFIX = '_retriever@';

    function FallbackManager () {
        this._fallbacks = [];
        this._retrieversData = {};
    }

    FallbackManager.prototype.register = function (filter, fallback) {
        if (!filter || filter == '*') {
            this._fallbacks.push({
                filter: filter || '*',
                func: fallback
            });
        } else {
            this._fallbacks.unshift({
                filter: filter,
                func: fallback
            });
        }
    };

    FallbackManager.prototype.retrieve = function (moduleNames) {
        if (typeof moduleNames == 'string') {
            moduleNames = [moduleNames];
        }

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
                deferred.reject(noFallbackError(moduleName));

                break;
            }

            deferred.resolve(fallback.func(moduleName, fallback.filter));
        }

        return vow.all(definePromises);
    };

    FallbackManager.prototype.find = function (moduleName) {
        for (var i = 0, l = this._fallbacks.length; i < l; i++) {
            var filter = this._fallbacks[i].filter;

            if (filter === '*') {
                return this._fallbacks[i];
            }

            if (typeof filter == 'function' && filter(moduleName)) {
                return this._fallbacks[i];
            }

            if (moduleName.match(filter)) {
                return this._fallbacks[i];
            }
        }

        return null;
    };

    FallbackManager.prototype.addRetrievers = function (moduleNames) {
        var res = [];

        for (var i = 0, l = moduleNames.length, moduleName, retrieverName; i < l; i++) {
            moduleName = moduleNames[i];

            if (api.isDefined(moduleName)) {
                res.push(moduleName);
                continue;
            }

            retrieverName = RETRIEVER_PREFIX + moduleName;
            res.push(retrieverName);

            if (!api.isDefined(retrieverName)) {
                this._defineRetriever(retrieverName);
            }
        }

        return res;
    };

    FallbackManager.prototype.removeRetrievers = function (deps) {
        for (var i = 0, l = deps.length, moduleName; i < l; i++) {
            if (this.isRetriever(deps[i]) && !this._retrieversData[deps[i]]) {
                moduleName = deps[i].replace(RETRIEVER_PREFIX, '');

                if (api.isDefined(moduleName)) {
                    deps[i] = moduleName;
                }
            }
        }
    };
    
    FallbackManager.prototype.isRetriever = function (moduleName) {
        return moduleName.indexOf(RETRIEVER_PREFIX) === 0;
    };
    
    FallbackManager.prototype.addRetrieverData = function (retrieverName, data) {
        if (!this._retrieversData[retrieverName]) {
            this._retrieversData[retrieverName] = [];
        }

        this._retrieversData[retrieverName].push(data);
    };

    FallbackManager.prototype._defineRetriever = function (retrieverName) {
        var _this = this;
        
        api.define(retrieverName, [], function (provide) {
            var moduleName = this.name.replace(RETRIEVER_PREFIX, '');

            _this.retrieve(moduleName)
                .then(function () { return _this._requireAfterRetrieve(moduleName); })
                .spread(provide)
                .fail(provide);
        });
    };
    
    FallbackManager.prototype._requireAfterRetrieve = function (moduleName) {
        var data = this._retrieversData[RETRIEVER_PREFIX + moduleName];

        if (!data) {
            return api.require(moduleName);
        }

        // Same module with different data could be required in parallel so we must handle all available data each time.
        var multipleRequires = [];

        for (var i = 0, l = data.length; i < l; i++) {
            multipleRequires.push(api.require({
                modules: [moduleName],
                data: data[i]
            }));
        }

        return vow.all(multipleRequires)
            .then(function (multiple) { return multiple[0]; });
    };

    global.modules = api;
})(this, ym.modules);
