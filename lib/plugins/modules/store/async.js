var path = require('path'),
    md5 = require('md5-jkmyers'),
    gulpIf = require('gulp-if'),
    eachInStream = require('../../util/eachInStream'),
    clc = require('cli-color'),
    moment = require('moment');

module.exports = storeAsyncPlugin;

var count;

/**
 * @ignore
 * Renames modules regarding to MD5 hash sum of their short alias.
 * Used to store for asynchronous modules loading.
 * @alias "modules.storeAsync"
 * @returns {stream.Transform} Stream
 */
function storeAsyncPlugin () {
    count = 0;
    return gulpIf(isModule, eachInStream(processModule, printResults));
}

function processModule (file, enc, cb) {
    count++;
    file.path = createPath(file.base, md5(file.moduleAlias));
    cb(null, file);
}

function isModule (file) {
    return file.isModule;
}

function createPath (base, hash) {
    return path.join(base, hash[0], hash[1], hash);
}

function printResults (cb) {
    console.log(
        '[' + clc.blackBright(moment().format('HH:mm:ss')) +
        '] Stored ' + clc.green.bold(count) + ' asynchronous module(s)'
    );
    cb();
}