var concat = require('gulp-concat'),
    order = require('gulp-order'),
    closure = require('../../js/closure'),
    pipeChain = require('../../util/pipeChain');

module.exports = storeSolidPlugin;

function storeSolidPlugin (cfg) {
    return pipeChain(
        order(['init.js', '*']),
        concat(cfg.concatTo),
        closure(cfg)
    );
}