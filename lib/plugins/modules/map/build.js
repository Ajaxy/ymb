var fs = require('fs'),
    path = require('path'),
    es = require('event-stream'),
    File = require('vinyl'),
    vinylFile = require('vinyl-file'),
    _ = require('lodash'),
    clc = require('cli-color'),
    eachInStream = require('../../util/eachInStream'),
    generateAlias = require('./util/generateAlias'),
    extractDeclarationData = require('./util/extractDeclarationData');

module.exports = mapBuildPlugin;

var currentConfig = null,
    modulesInfo = {},
    cacheMode = false;

/**
 * @ignore
 * Executes modules' content and retrieves declaration params (module name, dependencies list, etc.).
 * Assigns aliases to modules and builds strings of dependencies' aliases.
 * Creates file `map.json` with all that information.
 * @alias "modules.mapBuild"
 * @param {Object} cfg Config
 * @returns {stream.Transform} Stream
 */
function mapBuildPlugin (cfg) {
    cacheMode = !_.isEmpty(modulesInfo);
    currentConfig = cfg;

    return eachInStream(processFile, createInfoFiles);
}

function processFile (file, encoding, cb) {
    if (!isModule(file)) {
        cb(null, file);
        return;
    }

    var declarationData = extractDeclarationData(file, currentConfig.namespace),
        name = declarationData.name,
        alias = modulesInfo[name] ? modulesInfo[name].alias : generateAlias();

    if (!name) {
        console.error(clc.red('[warn] ') + 'Cannot resolve module name from file ' + clc.blue(file.relative));
        cb(null, file);
        return;
    }

    if (!cacheMode && modulesInfo[name]) {
        console.error(clc.red('[warn] ') + 'Duplicate module declaration: `' + clc.blue(name) + '` from file: ' + clc.blue(file.relative));
    }

    if (declarationData.images) {
        var lodashedName = name.replace(/\./g, '_');

        _.each(declarationData.images, function (params, name) {
            var imageFile = vinylFile.readSync(path.join(path.dirname(file.path), params.src));

            imageFile.path = 'images/' + lodashedName + '_' + name;
            imageFile.imageName = name;
            imageFile.skipDataUri = params.skipDataUri;

            this.push(imageFile);
        }, this);
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