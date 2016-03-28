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

        if (index == -1) {
            index = parseInt(partName);
        }

        parts.push({
            content: Buffer.concat([new Buffer('\n'), file.contents, new Buffer('\n')]),
            order: !isNaN(index) ? index : Infinity
        });

        cb();
    } else {
        cb(null, file);
    }
}

function createInitFile (cb) {
    var buffers = _(parts).sortBy('order').map('content').value();

    this.push(new File({
        path: path.join(process.cwd(), 'init.js'),
        contents: Buffer.concat(buffers)
    }));

    cb();
}