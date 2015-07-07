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

    Sandbox.prototype.joinImports = function (deps, args) {
        return mergeImports.joinImports(this._name, {}, deps, args);
    };

    Sandbox.prototype.generateProvide = function () {
        var _this = this;
        return function (name, value) {
            _this._provides.push([name, value]);
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

    Sandbox.prototype.hashTail = function () {
        var result = {},
            iAmPackage = mergeImports.isPackage(this._name),
            prefix = iAmPackage ? '' : this._name;
        this._provides.sort(provideSort);
        for (var i = 0, l = this._provides.length; i < l; ++i) {
            var element = this._provides[i],
                name = prefix ? element[0].split(prefix).join('') : element[0];
            if (element[0].indexOf(prefix) !== 0) {
                console.error(this._name, 'provide', element[0], ' Wrong prefix name');
            }
            if (name) {
                mergeImports.createNS(result, name, element[1]);
            } else {
                result = element[1];
                if (l > 1) {
                    // debugger;
                }
            }
        }
        return result;
    };

    Sandbox.prototype.importImages = function (images) {
        var _this = this;
        this._images = {
            data: images,
            original: images,
            get: function (key) {
                var image = this.data[key];
                if (!image) {
                    console.error('undefined image', key, 'in module', _this._name);
                    throw new Error('undefined image used')
                }
                if (image.optimization && image.optimization.dataUrl) {
                    return image.src;
                }
                return ym.env.server.url + 'images/' + image.src;
            }
        };
        return this._images;
    };

    Sandbox.prototype.assignImageData = function (images) {
        this._images.data = images;
    };

    Sandbox.prototype.execute = function () {
        this._executed = true;
        if (this._holdingFn) {
            this._holdingFn.apply(this._context, this._arguments);
        }
    };

    Sandbox.prototype.providePackage = ym.modules.providePackage;

    function provideSort (a, b) {
        return a[0].length - b[0].length;
    }

    provide(executeInSandbox);
});