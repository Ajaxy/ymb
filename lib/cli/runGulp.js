var childProcess = require('child_process'),
    path = require('path'),
    fs = require('vow-fs'),
    clc = require('cli-color');

module.exports = runGulp;

var rootPath = path.resolve(__dirname, '../../');

function runGulp (dir, task) {
    dir = path.resolve(dir);

    fs.exists(dir + '/gulpfile.js').then(function (exists) {
        return exists ? dir + '/gulpfile.js' : rootPath + '/defaults/gulpfile.default.js';
    }).then(function (gulpfile) {
        var t = Date.now();

        process.chdir(dir);
        console.log('Builder ' + clc.cyan.bold('ymb') + ' started on ' + clc.magenta(dir));

        childProcess.spawn('../node_modules/.bin/gulp', [
            '--color',
            '--gulpfile=' + gulpfile,
            task
        ], {
            stdio: 'inherit'
        });
    }).done();
}
