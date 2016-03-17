var path = require('path'),
    _ = require('lodash'),
    md5 = require('md5'),
    gulpIf = require('gulp-if'),
    File = require('vinyl'),
    del = require('del'),
    clc = require('cli-color'),
    eachInStream = require('../../util/eachInStream');

module.exports = storeAsyncPlugin;

var hashes = {},
    currentConfig = null,
    count = null,
    deleted = null;

/**
 * @ignore
 * Creates directory structure and stores modules and info files in a build path.
 * Modules are renamed regarding to MD5 hash sum of their contents.
 * Generates and stores `hashes.json` info file that matches short aliases of modules with hash-based names.
 * Used for asynchronous modules loading.
 * @alias "modules.storeAsync"
 * @returns {stream.Transform} Stream
 */
function storeAsyncPlugin (cfg) {
    currentConfig = cfg;
    count = 0;
    deleted = [];

    return gulpIf(isModule, eachInStream(processModule, createHashesFile));
}

function processModule (file, _, cb) {
    var hash = md5(file.contents),
        oldHash = hashes[file.moduleAlias];

    if (oldHash && oldHash != hash) {
        deleted.push(createPath(currentConfig.dest, oldHash));
    }

    hashes[file.moduleAlias] = hash;
    file.path = createPath(file.base, hash);
    count++;

    cb(null, file);
}

function isModule (file) {
    return file.isModule;
}

function createPath (base, hash) {
    return path.join(base, hash[0], hash[1], hash);
}

function createHashesFile (cb) {
    console.log(clc.green.bold('Stored ' + count + ' asynchronous modules.'));

    this.push(new File({
        path: path.join(process.cwd(), 'hashes.json'),
        contents: new Buffer(JSON.stringify(hashes, null, '\t'))
    }));

    del(deleted, { force: true }, cb);
}