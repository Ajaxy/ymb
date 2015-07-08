var path = require('path'),
    addSrc = require('gulp-add-src');

module.exports = helpersPlugin;

/**
 * Injects modules from `ym-helpers` package.
 * @alias "modules.helpers"
 * @see https://www.npmjs.com/package/ym-helpers
 * @returns {stream.Transform} Stream.
 */
function helpersPlugin () {
    return addSrc.prepend(path.resolve(__dirname, '../../../node_modules/ym-helpers/src/modules/**/*.js'));
}