var promise = null;

function fallback (module, filter) {
    return promise || (promise = request(filter));
}

function request (filter) {
    filter = encodeURIComponent(filter);

    return ym.modules.require(['util.jsonp', 'system.ModuleLoader']).spread(function (jsonp, ModuleLoader) {
        return jsonp({
            url: ym.env.server.url + '/map.js',
            paddingKey: 'ym_map_fallback_' + filter,
            requestParams: {
                filter: filter,
                mode: ym.env.server.params.mode
            }
        }).then(function (map) {
            (new ModuleLoader(map, ym.env.server)).defineAll();
        });
    });
}