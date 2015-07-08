var path = require('path'),
    fs = require('fs'),
    _ = require('lodash'),
    extend = require('extend'),
    minimist = require('minimist'),
    config = require('../defaults/build.default.json');

module.exports = resolveBuildConfig;

function resolveBuildConfig () {
    var localConfig;
    
    try {
        localConfig = fs.readFileSync(path.resolve('build.json'));
    } catch (e) {}
    
    if (localConfig) {
        extend(true, config, JSON.parse(localConfig));
    }

    var args = minimist(process.argv),
        mode = args && (args.mode || args.m) ||
            ('modes' in config) && _.find(config.modes, 'default'),
        missingMode = !mode && ('modes' in config),
        wrongMode = mode && (!('modes' in config) || typeof config.modes[mode] != 'object');

    if (missingMode || wrongMode) {
        throw new Error('You should specify one of modes listed in your `build.json`.');
    }

    if (mode) {
        extend(true, config, config.modes[mode], { mode: mode });
    }

    return config;
}