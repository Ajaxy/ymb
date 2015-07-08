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

/**
 * Creates directory structure and stores modules and info files in a build path.
 * Modules are renamed regarding to MD5 hash sum of their contents.
 * Generates and stores `hashes.json` info file that matches short aliases of modules with hash-based names.
 * Used for asynchronous modules loading.
 * @returns {stream.Transform} Stream.
 */
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