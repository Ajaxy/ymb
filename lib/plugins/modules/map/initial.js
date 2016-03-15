var _ = require('lodash'),
    path = require('path'),
    File = require('vinyl'),
    gulpIf = require('gulp-if'),
    eachInStream = require('../../util/eachInStream');

module.exports = mapInitialPlugin;

/**
 * @ignore
 * Extracts information about initial modules from file `map.json`
 * (that is previously created by `modules/map/build` plugin)
 * and injects it into stream as part of `init.js` contents.
 * @alias "modules.mapInitial"
 * @param {Object} cfg Config
 * @returns {stream.Transform} Stream
 */
function mapInitialPlugin (cfg) {
    return gulpIf(isMap, eachInStream(function (file, _, cb) {
        var initialPart = preparePart(file.contents, cfg.asyncMap, cfg.initialMap);

        this.push(new File({
            path: path.join(process.cwd(), 'init#map'),
            contents: new Buffer('ym.project.initialMap = ' + initialPart + ';')
        }));

        if (!cfg.asyncMap) {
            cb();
        } else {
            cb(null, file);
        }
    }));
}

function isMap (file) {
    return file.relative == 'map.json';
}

function preparePart (contents, asyncMap, initialModules) {
    var map = JSON.parse(contents);

    if (asyncMap) {
        map = extractPart(map, initialModules);
    }

    return stringifyMap(map);
}

function extractPart (map, initialModules) {
    if (!initialModules || !initialModules.length) {
        return [];
    }

    var moduleNames = _(map)
        .map(function (moduleInfo) {
            if (_.contains(initialModules, moduleInfo[0])) {
                return buildDepsTree(map, moduleInfo[0], moduleInfo[2]);
            }

            return null;
        })
        .compact()
        .flatten()
        .value();

    return _.filter(map, function (moduleInfo) {
        return _.contains(moduleNames, moduleInfo[0]);
    });
}

function buildDepsTree (map, moduleName, depsAliases, tree) {
    tree || (tree = []);
    tree.push(moduleName);

    for (var i = 0, depAlias, depInfo; i < depsAliases.length; i += 2) {
        depAlias = depsAliases.substr(i, 2);
        depInfo = _.find(map, function (moduleInfo) { return moduleInfo[1] == depAlias; });
        buildDepsTree(map, depInfo[0], depInfo[2], tree);
    }

    return tree;
}

// TODO shared with yms
function stringifyMap (map) {
    var stack = [];

    _.each(map, function (moduleInfo) {
        stack.push('[' + _.map(moduleInfo, function (value, index) {
            if (index == 2 && value.slice(0, 8) == 'function') {
                return value;
            } else if (index == 5 && typeof value == 'object') {
                return '{ ' + _.map(value, function (v, k) { return k + ': ' + v; }).join(', ') + ' }';
            } else {
                return '\'' + value + '\'';
            }
        }).join(', ') + ']');
    });

    return '[\n    ' + stack.join(',\n    ') + '\n]';
}
