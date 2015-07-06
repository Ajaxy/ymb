var path = require('path'),
    fs = require('vow-fs'),
    // Gulp should be required the same way as in `gulpfile.js`.
    ymb = require('ymb'),
    gulp = ymb.gulp,
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
        console.log('Working dir is ' + clc.blue(dir) + '.');

        subscribe();
        require(gulpfile);

        gulp.start(task, function () {
            console.log('Whole process done within ' + clc.green.bold((Math.round((Date.now() - t) / 100) / 10) + ' seconds') + '.');
        });
    }).done();
}

function subscribe () {
    gulp.on('err', onError);
    gulp.on('task_err', onError);
    gulp.on('task_start', onStart);
    gulp.on('task_stop', onStop);
}

function onStart(e) {
    console.log('Gulp: Task `' + clc.blue(e.task) + '` started.');
}

function onStop(e) {
    console.log('Gulp: Task `' + clc.blue(e.task) + '` done within ' + clc.green(e.duration.toFixed(2) + ' sec') + '.');
}

function onError(err) {
    console.error('Gulp error: ');
    throw err.err;
}