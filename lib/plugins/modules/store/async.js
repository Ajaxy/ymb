var path = require('path'),
    _ = require('lodash'),
    md5 = require('MD5'),
    gulpIf = require('gulp-if'),
    File = require('vinyl'),
    eachInStream = require('../../util/eachInStream');

module.exports = storeAsyncPlugin;

var hashes = {};

function storeAsyncPlugin () {
    return gulpIf(isModule, eachInStream(processModule, createHashesFile));
}

function processModule (file, _, cb) {
    hashes[file.moduleAlias] = md5(file.contents);

    rename(file, hashes[file.moduleAlias]);

    cb(null, file);
}

function isModule (file) {
    return file.isModule;
}

function rename (file, hash) {
    file.path = path.join(file.base, hash[0], hash[1], hash);
}

function createHashesFile (cb) {
    this.push(new File({
        path: path.join(process.cwd(), 'hashes.json'),
        contents: new Buffer(JSON.stringify(hashes, null, '\t'))
    }));

    cb();
}