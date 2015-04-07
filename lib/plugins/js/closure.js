var wrapper = require('gulp-wrapper');

module.exports = closurePlugin;

function closurePlugin () {
    return wrapper({
        header: '(function (global){\n\n',
        footer: '\n\n})(this);'
    });
}