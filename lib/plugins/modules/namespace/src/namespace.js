(function (global) {
    if (!ym.project.namespace) {
        return;
    }

    if (ym.env.namespace === false) {
        return;
    }

    registerNamespace(global, ym.env.namespace || ym.project.namespace, ym.ns);

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