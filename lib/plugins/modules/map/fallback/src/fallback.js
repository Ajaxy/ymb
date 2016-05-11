var promise = null;

function fallback (module, filter) {
    return promise || (promise = request(filter));
}

function request (filter) {
    filter = encodeURIComponent(filter);

    return ym.modules.require(['util.jsonp', 'system.ModuleLoader']).spread(function (jsonp, ModuleLoader) {
        var server = ym.env.server;
        
        return jsonp({
            url: server.url + '/map.js',
            paddingKey: 'ym_map_fallback_' + filter,
            requestParams: {
                filter: filter,
                mode: server.params.mode,
                version: server.version
            }
        }).then(function (map) {
            (new ModuleLoader(map, server)).defineAll();
        });
    });
}