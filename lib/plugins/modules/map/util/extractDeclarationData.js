var clc = require('cli-color');

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

                        info.name = decl.name;
                        info.key = decl.key;
                        info.storage = decl.storage;
                        info.dynamicDepends = decl.dynamicDepends;
                        info.depends = decl.depends;
                    } else {
                        info.name = name;
                        info.depends = depends;
                    }
                }
            }
        };

    // TODO Try `eval`, may be faster.
    try {
        // We should support both user namespace and `ym` scope variables. I.e. for default helpers.
        (new Function(namespace, 'ym', file.contents))(api, api, api.modules);
    } catch (err) {
        console.error(clc.red('[error] ') + 'Declaration data extraction failed in file ' + clc.blue(file.path));
        throw err;
    }

    return info;
}