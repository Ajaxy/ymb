var path = require('path'),
    gulp = require('gulp'),
    file = require('gulp-file'),
    footer = require('gulp-footer'),
    rename = require('gulp-rename'),
    join = require('../util/join'),
    extractFromContext = require('../js/extractFromContext');

module.exports = ymPlugin;

/**
 * In case of standalone project injects `ym` modular system source code as part of `init.js` contents.
 * In case of plugin project only refers a property from a main project namespace.
 * @alias "modules.ym"
 * @see https://www.npmjs.com/package/ym
 * @returns {stream.Transform} Stream
 */
function ymPlugin (cfg) {
    return cfg.target == 'plugin' ?
        file('init#ym', 'ym.modules = global[\'' + cfg.namespace + '\'].modules;') :
        join(
            gulp.src(path.resolve(__dirname, '../../../node_modules/ym/modules.js'))
                .pipe(extractFromContext('modules'))
                .pipe(footer([
                    'ym.modules.setOptions({',
                    '   trackCircularDependencies: true,',
                    '   allowMultipleDeclarations: false',
                    '});',
                    'ym.ns.modules = ym.modules;'
                ].join('\n')))
                .pipe(rename('init#ym'))
        );
}