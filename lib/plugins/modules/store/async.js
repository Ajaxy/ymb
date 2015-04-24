var path = require('path'),
    _ = require('lodash'),
    md5 = require('MD5'),
    gulpIf = require('gulp-if'),
    File = require('vinyl'),
    clc = require('cli-color'),
    eachInStream = require('../../util/eachInStream');

module.exports = storeAsyncPlugin;

var hashes = {},
    count = 0;

function storeAsyncPlugin () {
    return gulpIf(isModule, eachInStream(processModule, createHashesFile));
}

function processModule (file, _, cb) {
    var hash = hashes[file.moduleAlias] = md5(file.contents);

    rename(file, hash);

//    console.log(clc.green('Storing') + ' module `' + clc.blue(file.moduleName) + '` as `' + clc.cyan(hash) + '`.');
    count++;

    cb(null, file);
}

function isModule (file) {
    return file.isModule;
}

function rename (file, hash) {
    file.path = path.join(file.base, hash[0], hash[1], hash);
}

function createHashesFile (cb) {
    console.log(clc.green.bold('Stored ' + count + ' asynchronous modules.'));

    this.push(new File({
        path: path.join(process.cwd(), 'hashes.json'),
        contents: new Buffer(JSON.stringify(hashes, null, '\t'))
    }));

    cb();
}