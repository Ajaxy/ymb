(function (global) {
    if (!ym.project.namespace) {
        return;
    }

    if (typeof setupAsync == 'function') {
        ym.envCallbacks.push(function (env) {
            if (env.namespace !== false) {
                registerNamespace(global, env.namespace || ym.project.namespace, ym.ns);
            }
        });
    } else {
        registerNamespace(global, ym.project.namespace, ym.ns);
    }

    function registerNamespace (parentNs, path, data) {
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
})(this);