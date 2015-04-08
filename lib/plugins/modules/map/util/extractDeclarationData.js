module.exports = extractDeclarationData;

function extractDeclarationData (file, namespace) {
    var info = {},
        api = {
            modules: {
                importImages: function (hash) {
                    info.images = hash;
                },

                define: function (name, depends, fn) {
                    if (typeof name == 'object') {
                        var decl = name;

                        info.name = decl.decl;
                        info.key = decl.key;
                        info.storage = decl.storage;
                        info.dynamicDepends = decl.dynamicDepends;
                        info.depends = decl.depends;
                        info.innerFn = decl.declaration;
                    } else {
                        info.name = name;
                        info.depends = depends;
                        info.innerFn = fn;
                    }
                }
            }
        };

    // TODO Try `eval`, may be faster.
    try {
        // We should support both user namespace and `ym` scope variables. I.e. for default helpers.
        (new Function(namespace, 'ym', file.contents))(api, api, api.modules);
    } catch (err) {
        console.error('Error in file ' + file.path);
        throw err;
    }

    return info;
}