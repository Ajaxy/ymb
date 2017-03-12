var childProcess = require('child_process'),
    path = require('path'),
    fs = require('vow-fs'),
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
            var t = Date.now();

            process.chdir(dir);
            console.log('Builder ' + clc.cyan.bold('ymb') + ' started from ' + clc.magenta(dir));

            childProcess.spawn(gulpBin, [
                '--color',
                '--gulpfile=' + gulpfile,
                task
            ], {
                stdio: 'inherit'
            });
        })
        .catch(console.error);
}
