var path = require('path'),
    addSrc = require('gulp-add-src');

module.exports = helpersPlugin;

function helpersPlugin () {
    return addSrc.prepend(path.resolve(__dirname, '../../../node_modules/ym-helpers/src/modules/**/*.js'));
}