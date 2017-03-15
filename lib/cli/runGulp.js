var childProcess = require('child_process'),
    path = require('path'),
    fs = require('vow-fs'),
    minimist = require('minimist'),
    clc = require('cli-color');

module.exports = runGulp;

var ymbRoot = path.resolve(__dirname, '../../');
var gulpBin = path.resolve(process.cwd(), 'node_modules/.bin/gulp');

function runGulp(dir, task) {
    dir = path.resolve(dir);

    fs.exists(gulpBin)
        .then(function (exists) {
            if (!exists) {
                return Promise.reject(
                    clc.red('[error] ') +
                    clc.magenta(gulpBin) +
                    ' not found. You need to have ' +
                    clc.cyan('gulp@^4 (gulpjs/gulp#4.0)') +
                    ' installed locally.'
                );
            }

            return fs.exists(dir + '/gulpfile.js');
        })
        .then(function (exists) {
            return exists ? dir + '/gulpfile.js' : ymbRoot + '/defaults/gulpfile.default.js';
        })
        .then(function (gulpfile) {
            var t = Date.now(),
                args = minimist(process.argv),
                mode = args.mode || args.m || 'default';

            process.chdir(dir);
            console.log('Builder ' + clc.cyan.bold('ymb') + ' started from ' + clc.magenta(dir));

            childProcess.spawn(gulpBin, [
                '--color',
                '--gulpfile=' + gulpfile,
                '--mode=' + mode,
                task
            ], {
                stdio: 'inherit'
            });
        })
        .catch(console.error);
}
