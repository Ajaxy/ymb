var storeAsync = require('./store/async'),
    storeSolid = require('./store/solid');

module.exports = storePlugin;

/**
 * Stores built modules and info files into a specified folder in a disk.
 * Check out child plugins for more info.
 * @alias "modules.store"
 * @param {Object} cfg Config
 * @returns {stream.Transform} Stream
 */
function storePlugin (cfg) {
    return cfg.store == 'async' ? storeAsync(cfg) : storeSolid(cfg);
}