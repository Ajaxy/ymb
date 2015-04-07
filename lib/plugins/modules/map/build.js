var path = require('path'),
    es = require('event-stream'),
    File = require('vinyl'),
    _ = require('lodash'),
    eachInStream = require('../../util/eachInStream'),
    generateAlias = require('./util/generateAlias'),
    extractDeclarationData = require('./util/extractDeclarationData');

module.exports = mapBuildPlugin;

var currentConfig = null,
    modulesInfo = {};

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
        return [
            name,
            info.alias,
            buildDependenciesString(info.declarationData.depends).join('')
        ];
    });
}

function buildDependenciesString (names) {
    return _.map(names, function (name) {
        if (!name) {
            return '';
        }

        return typeof modulesInfo[name] == 'object' ?
            modulesInfo[name].alias :
            '=' + name + '=';
    });
}