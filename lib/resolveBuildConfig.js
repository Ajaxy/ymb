var path = require('path'),
    fs = require('fs'),
    extend = require('extend'),
    minimist = require('minimist'),
    config = require('../defaults/build.default.json');

module.exports = resolveBuildConfig;

function resolveBuildConfig () {
    // TODO Remove try..catch
    try {
        var configFile = fs.readFileSync(path.resolve('build.json'), { encoding: 'utf8' }),
            userConfig = JSON.parse(configFile);

        extend(true, config, userConfig);
    } catch (e) { }

    var args = minimist(process.argv),
        mode = args && (args.mode || args.m),
        missingMode = !mode && ('modes' in config),
        wrongMode = mode && (!('modes' in config) || typeof config.modes[mode] != 'object');

    if (missingMode || wrongMode) {
        throw new Error('You should specify one of modes listed in your `config.json`.');
    }

    if (mode) {
        extend(true, config, config.modes[mode], { mode: mode });
    }

    return config;
}