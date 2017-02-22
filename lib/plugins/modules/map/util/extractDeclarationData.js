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

    try {
        var contents = file.contents.toString(),
            declStart = contents.search(/,\s*function\s*\(\s*provide(,|\))/m),
            // Shorter files are processed 2x faster.
            short = declStart != -1 ? contents.substr(0, declStart) + ', null)' : null;

        // We should support both user namespace and `ym` scope variables. I.e. for default helpers.
        (new Function(namespace, 'ym', short || contents))(api, api);
    } catch (err) {
        console.error(clc.red('[error] ') + 'Declaration data extraction failed in file ' + clc.blue(file.path));
    }

    return info;
}