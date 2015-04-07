var path = require('path'),
    fs = require('vow-fs'),
    gulp = require('gulp');

module.exports = runGulp;

var rootPath = path.resolve(__dirname, '../../');

function runGulp (dir, task) {
    dir = path.resolve(dir);

    fs.exists(dir + '/gulpfile.js').then(function (exists) {
        return exists ? dir + '/gulpfile.js' : rootPath + '/defaults/gulpfile.default.js';
    }).then(function (gulpfile) {
        var t = Date.now();

        process.chdir(dir);
        console.log('Working dir is ' + dir + '.');

        subscribe();
        require(gulpfile);

        gulp.start(task, function () {
            console.log('Whole process done within ' + (Math.round((Date.now() - t) / 100) / 10) + ' seconds.');
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
    console.log('Gulp: Task `' + e.task + '` started.');
}

function onStop(e) {
    console.log('Gulp: Task `' + e.task + '` done within ' + e.duration.toFixed(2) + ' sec.');
}

function onError(err) {
    console.error('Gulp error: ');
    throw err.err;
}