var concat = require('gulp-concat'),
    remember = require('gulp-remember'),
    order = require('gulp-order'),
    closure = require('../../js/closure'),
    pipeChain = require('../../util/pipeChain');

module.exports = storeSolidPlugin;

/**
 * @ignore
 * Creates a single file of all concatenated modules preceded by a `init.js` contents.
 * Used for synchronous single-file projects.
 * @alias "modules.storeSolid"
 * @returns {stream.Transform} Stream
 */
function storeSolidPlugin (cfg) {
    return pipeChain(
        remember(cfg.name || 'ymb#default'),
        order(['init.js', '*']),
        concat(cfg.concatTo),
        closure(cfg)
    );
}
