var file = require('gulp-file');

module.exports = setupPlugin;

function setupPlugin (cfg) {
    var ym = {};

    ym.project = {
        namespace: cfg.namespace,
        jsonpPrefix: cfg.jsonpPrefix || '',
        loadLimit: 500
    };

    ym.env = {};

    return file('init#setup', 'var ym = ' + JSON.stringify(ym, '\t') + ';');
}