var path = require('path'),
    gulp = require('gulp'),
    file = require('gulp-file'),
    footer = require('gulp-footer'),
    rename = require('gulp-rename'),
    join = require('../util/join'),
    extractFromContext = require('../js/extractFromContext');

module.exports = ymPlugin;

function ymPlugin (cfg) {
    return cfg.target == 'plugin' ?
        file('init#ym', 'ym.modules = global[\'' + cfg.namespace + '\'].modules;') :
        join(
            gulp.src(path.resolve(__dirname, '../../../node_modules/ym/modules.js'))
                .pipe(extractFromContext('modules'))
                .pipe(footer([
                    'var ymModules = ym.modules;',
                    'ym.modules.setOptions({',
                    '   trackCircularDependencies: true,',
                    '   allowMultipleDeclarations: false',
                    '});'
                ].join('\n')))
                .pipe(rename('init#ym'))
        );
}