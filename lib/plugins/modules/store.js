var storeAsync = require('./store/async'),
    storeSolid = require('./store/solid');

module.exports = storePlugin;

function storePlugin (cfg) {
    return cfg.store == 'async' ? storeAsync(cfg) : storeSolid(cfg);
}