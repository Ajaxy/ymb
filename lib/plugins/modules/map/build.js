var path = require('path'),
    es = require('event-stream'),
    File = require('vinyl'),
    _ = require('lodash'),
    clc = require('cli-color'),
    eachInStream = require('../../util/eachInStream'),
    generateAlias = require('./util/generateAlias'),
    extractDeclarationData = require('./util/extractDeclarationData');

module.exports = mapBuildPlugin;

var currentConfig = null,
    modulesInfo = {};

/**
 * Executes modules' content and retrieves declaration params (module name, dependencies list, etc.).
 * Assigns aliases to modules and builds strings of dependencies' aliases.
 * Creates file `map.json` with all that information.
 * @param {String} cfg Config.
 * @returns {stream.Transform} Stream.
 */
function mapBuildPlugin (cfg) {
    currentConfig = cfg;

    return eachInStream(processFile, createInfoFiles);
}

function processFile (file, _, cb) {
    if (!isModule(file)) {
        cb(null, file);
        return;
    }

    // TODO Probably should be separate module extracting declaration data.
    var declarationData = extractDeclarationData(file, currentConfig.namespace),
        name = declarationData.name,
        alias = generateAlias();

    if (!name) {
        console.error(clc.red('[warn] ') + 'Cannot resolve module name from file ' + clc.blue(file.relative));
        cb(null, file);
        return;
    }

    if (modulesInfo[name]) {
        console.error(clc.red('[warn] ') + 'Duplicate module declaration: `' + clc.blue(name) + '` from file: ' + clc.blue(file.relative));
    }

    modulesInfo[name] = {
        alias: alias,
        declarationData: declarationData
    };

    file.isModule = true;
    file.moduleName = name;
    file.moduleAlias = alias;

    cb(null, file);
}

function isModule (file) {
    return file.relative.indexOf('init#') == -1;
}

function createInfoFiles (cb) {
    this.push(new File({
        path: path.join(process.cwd(), 'map.json'),
        contents: new Buffer(JSON.stringify(buildMap(), null, '\t'))
    }));

    cb();
}

function buildMap () {
    return _.map(modulesInfo, function (info, name) {
        var decl = info.declarationData,
            row = [
                name,
                info.alias,
                buildDependenciesString(decl.depends)
            ];

        if (decl.key) {
            row[3] = decl.key;
            row[4] = decl.storage;
        }

        if (decl.dynamicDepends) {
            row[5] = _.mapValues(decl.dynamicDepends, function (func) { return func.toString(); });
        }

        return row;
    });
}

function buildDependenciesString (deps) {
    if (typeof deps == 'function') {
        return deps.toString();
    }

    return _.map(deps, function (name) {
        if (!name) {
            return '';
        }

        return typeof modulesInfo[name] == 'object' ?
            modulesInfo[name].alias :
            '=' + name + '=';
    }).join('');
}