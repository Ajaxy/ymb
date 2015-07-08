var path = require('path'),
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
 * @param {String} cfg Config
 * @returns {stream.Transform} Stream
 */
function mapInitialPlugin (cfg) {
    return gulpIf(isMap, eachInStream(function (file, _, cb) {
        var initialPart = !cfg.asyncMap ? file.contents : extractPart(file.contents, cfg.initialMap);

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

// TODO
function extractPart (map, modules) {
    if (!modules || !modules.length) {
        return '[]';
    }

    return map;
}