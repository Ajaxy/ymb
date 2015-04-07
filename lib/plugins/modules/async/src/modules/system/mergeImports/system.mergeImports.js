ym.modules.define('system.mergeImports', [], function (provide) {
    function createNs (parentNs, path, data) {
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

    var joinPackage = function (imports, deps, args) {
        var modules = [],
            checkList = {};
        for (var i = 0, l = deps.length; i < l; ++i) {
            var packageInfo = args[i].__package;
            if (!packageInfo) {
                createNs(imports, deps[i], args[i]);
                if (!checkList[deps[i]]) {
                    modules.push([deps[i], args[i]]);
                    checkList[deps[i]] = 1;
                }
            } else {
                for (var j = 0; j < packageInfo.length; ++j) {
                    if (!checkList[packageInfo[j][0]]) {
                        createNs(imports, packageInfo[j][0], packageInfo[j][1]);
                        modules.push([packageInfo[j][0], packageInfo[j][1]]);
                        checkList[packageInfo[j][0]] = 1;
                    }
                }
            }
        }
        imports.__package = modules;
        return imports;
    }

    var joinImports = function (thisName, imports, deps, args) {
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
                        createNs(imports, packageInfo[j][0], packageInfo[j][1]);
                    }
                    //console.error(thisName, 'loads', depName, '(its not good idea to load package from module)');
                    //depName = '';
                    //packageExtend(imports, args[order]);
                } else {
                    createNs(imports, depName, args[order]);
                }
            }
        }
        return imports;
    };

    provide({
        isPackage: _isPackage,
        joinImports: joinImports,
        createNs: createNs
    });


});