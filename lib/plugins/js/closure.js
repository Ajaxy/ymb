var wrapper = require('gulp-wrapper');

module.exports = closurePlugin;

/**
 * Wraps code in a simple JS closure.
 * @returns {stream.Transform} Stream.
 */
function closurePlugin () {
    return wrapper({
        header: '(function (global){\n\n',
        footer: '\n\n})(this);'
    });
}