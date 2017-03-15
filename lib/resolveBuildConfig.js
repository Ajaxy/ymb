var path = require('path'),
    fs = require('fs'),
    _ = require('lodash'),
    extend = require('extend'),
    minimist = require('minimist'),
    clc = require('cli-color'),
    moment = require('moment'),
    config = require('../defaults/build.default.json');

module.exports = resolveBuildConfig;

function resolveBuildConfig () {
    var localConfig;
    
    try {
        localConfig = fs.readFileSync(path.resolve('build.json'));
    } catch (err) {
        if (err.code != 'ENOENT') {
            throw err;
        }
    }
    
    if (localConfig) {
        extend(true, config, JSON.parse(localConfig));
    }

    var args = minimist(process.argv),
        hasModes = 'modes' in config,
        argsMode = args.mode || args.m || 'default',
        mode = argsMode != 'default' ? argsMode : (hasModes && _.findKey(config.modes, 'default')),
        missingMode = hasModes && !mode,
        wrongMode = mode && (!hasModes || typeof config.modes[mode] != 'object');

    if (missingMode || wrongMode) {
        throw new Error('You should specify one of modes listed in your `build.json`.');
    }

    if (mode) {
        extend(true, config, config.modes[mode], { mode: mode });
    }

    console.log(
        '[' + clc.blackBright(moment().format('HH:mm:ss')) + '] ' +
        'Using ' +
        clc.magenta(localConfig ? 'build.json' : 'build.default.json') +
        ' with mode ' +
        clc.cyan(mode || 'default')
    );

    return config;
}
