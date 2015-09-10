ym.modules.define('system.moduleLoader.executeInSandbox', ['system.mergeImports', 'util.extend'], function (provide, mergeImports, extend) {
    function executeInSandbox (name, realDecl, scope) {
        var sandbox = new Sandbox(name, scope.context, scope.arguments),
            namespace = extend({}, ym, { modules: sandbox });

        realDecl.call(scope.context, namespace, namespace);

        sandbox.execute();
    }

    function Sandbox (name, context, args) {
        this._name = name;
        this._context = context;
        this._arguments = args;
        this._provides = [];
    }
    
    Sandbox.prototype.requireSync = function (moduleName) {
        return ym.modules.requireSync(moduleName);
    };
    
    Sandbox.prototype.defineSync = function (moduleName, module) {
        return ym.modules.defineSync(moduleName, module);
    };

    Sandbox.prototype.define = function (moduleName, deps, fn) {
        if (typeof moduleName == 'object') {
            fn = moduleName.declaration;
        }
        // Некрасиво, но иначе не достучаться до модульной системы
        if (this._executed) {
            ym.modules.define.apply(ym.modules, arguments);
        } else {
            this._holdingFn = fn;
        }
    };
    
    Sandbox.prototype.getDefinition = function (moduleName) {
        return ym.modules.getDefinition(moduleName);
    };
  
    Sandbox.prototype.isDefined = function (moduleName) {
        return ym.modules.isDefined(moduleName);
    };

    Sandbox.prototype.require = function (moduleList, callback, errorCallback, context) {
        if (arguments.length == 3 && typeof errorCallback != 'function') {
            return ym.modules.require(moduleList, callback, errorCallback);
        } else {
            return ym.modules.require(moduleList, callback, errorCallback, context);
        }
    };

    Sandbox.prototype.importImages = function () {
        var prefix = [ym.env.server.url, ym.env.server.path, 'images', this._name.replace(/\./g, '_') + '_'].join('/');

        return {
            get: function (imageName) {
                return prefix + imageName;
            }
        };
    };

    Sandbox.prototype.execute = function () {
        this._executed = true;
        if (this._holdingFn) {
            this._holdingFn.apply(this._context, this._arguments);
        }
    };

    Sandbox.prototype.providePackage = ym.modules.providePackage;

    provide(executeInSandbox);
});