var path = require('path'),
    _ = require('lodash'),
    File = require('vinyl'),
    eachInStream = require('../util/eachInStream');

module.exports = initPlugin;

var ORDER = ['setup', 'ym', 'plus', 'map', 'async', 'fallback', 'namespace'];

var parts = null;

/**
 * Joins all 'init#' parts into a single `init.js` file with the right order.
 * @alias "modules.init"
 * @returns {stream.Transform} Stream
 */
function initPlugin () {
    parts = [];

    return eachInStream(processFile, createInitFile);
}

function processFile (file, _, cb) {
    if (file.relative.indexOf('init#') === 0) {
        var partName = file.relative.replace('init#', ''),
            index = ORDER.indexOf(partName);

        parts[index >= 0 ? index : parts.length] = Buffer.concat([new Buffer('\n'), file.contents, new Buffer('\n')]);

        cb();
    } else {
        cb(null, file);
    }
}

function createInitFile (cb) {
    this.push(new File({
        path: path.join(process.cwd(), 'init.js'),
        contents: Buffer.concat(_.compact(parts))
    }));

    cb();
}