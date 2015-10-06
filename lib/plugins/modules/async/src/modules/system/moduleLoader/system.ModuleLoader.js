ym.modules.define('system.ModuleLoader', [
    'system.moduleLoader.createLoadFunction', 'system.moduleLoader.executeInSandbox', 'system.nextTick'
], function (provide, createLoadFunction, executeInSandbox, nextTick) {
    var STATES = {
            NOT_RESOLVED : 'NOT_RESOLVED',
            IN_RESOLVING : 'IN_RESOLVING',
            RESOLVED     : 'RESOLVED'
        };

    function ModuleLoader (map, serverParams) {
        this._map = map;
        this._modulesInfo = this._parseMap(map);
        this._waitForNextTick = false;

        this._load = createLoadFunction(serverParams, this._modulesInfo.byName);
    }

    ModuleLoader.prototype.defineAll = function () {
        for (var i = 0, l = this._map.length; i < l; i++) {
            var name = this._map[i][0];

            if (!ym.modules.isDefined(name)) {
                ym.modules.define(this.buildDefinition(name));
            }
        }
    };

    ModuleLoader.prototype.buildDefinition = function (name) {
        var moduleLoader = this,
            info = this._modulesInfo.byName[name],
            deps = this._fetchDeps(info.name, info.deps),
            definition = {
                name: info.name,
                depends: deps,
                declaration: function (provide) {
                    moduleLoader._queueLoad(this.name, {
                        context: this,
                        arguments: Array.prototype.slice.call(arguments, 0)
                    });
                }
            };


        if (ym.env.debug) {
            ym.modules.watchDeps(info.name, info.deps);
        }

        if (info.key) {
            definition.key = info.key;
            definition.storage = info.storage;
        }

        if (info.dynamicDepends) {
            definition.dynamicDepends = {};

            for (var key in info.dynamicDepends) {
                if (info.dynamicDepends.hasOwnProperty(key)) {
                    // There is bug in IE 8, '0, ' is the workaround.
                    // http://stackoverflow.com/questions/7201502/javascript-eval-behavior-in-ie8
                    definition.dynamicDepends[key] = eval('0, ' + info.dynamicDepends[key]);
                }
            }
        }

        return definition;
    };

    ModuleLoader.prototype._parseMap = function (map) {
        var modulesInfo = { byName: {}, byAlias: {} };

        for (var i = 0, l = map.length; i < l; i++) {
            var row = map[i],
                info = {
                    name: row[0],
                    alias: row[1],
                    deps: row[2],
                    key: row[3],
                    storage: row[4],
                    dynamicDepends: row[5],
                    state: STATES['NOT_RESOLVED']
                };

            modulesInfo.byName[info.name] = info;
            modulesInfo.byAlias[info.alias] = info;
        }

        return modulesInfo;
    };

    ModuleLoader.prototype._fetchDeps = function (name, deps) {
        if (deps.indexOf('function') === 0) {
            return eval('(' + deps + ').call({ name: name });');
        }

        var result = [];

        while (deps.length) {
            var dep = '';

            if (deps.charAt(0) == '=') {
                dep = deps.match(/=(.+?)=/)[1];
                result.push(dep);
                deps = deps.substring(dep.length + 2);
            } else {
                dep = deps.substring(0, 2);
                result.push(this._modulesInfo.byAlias[dep].name);
                deps = deps.substring(2);
            }
        }

        return result;
    };

    ModuleLoader.prototype._splitAliases = function (string) {
        var aliases = [];

        for (var i = 0, l = string.length; i < l; i += 2) {
            aliases.push(string.substr(i, 2));
        }

        return aliases;
    };

    ModuleLoader.prototype._queueLoad = function (name, scope) {
        var _this = this;

        if (!this._waitForNextTick) {
            this._waitForNextTick = true;

            nextTick(function () { _this._loadAll(); });
        }

        this._load(name, function (realDecl) {
            executeInSandbox(name, realDecl, scope);
        });
    };

    ModuleLoader.prototype._loadAll = function () {
        for (var i = 0, l = this._map.length; i < l; ++i) {
            var name = this._map[i][0],
                info = this._modulesInfo.byName[name];

            if (info.state == STATES['NOT_RESOLVED'] && ym.modules.getState(name) == STATES['IN_RESOLVING']) {
                info.state = STATES['IN_RESOLVING'];
                this._load(name);
            }
        }

        this._waitForNextTick = false;
    };

    provide(ModuleLoader);
});