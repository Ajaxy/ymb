var pending = null,
    deferred = null,
    fallback = {
        retrieve: function (module) {
            if (!deferred) {
                pending = [module];

                deferred = ym.vow.defer();
                ym.modules.nextTick((function (requestDeferred) {
                    return function () {
                        onNextTick(requestDeferred);
                    }
                })(deferred));
            } else {
                pending.push(module);
            }

            return deferred.promise();
        }
    },
    onNextTick = function (requestDeferred) {
        ym.modules.require(['util.jsonp', 'system.ModuleLoader']).spread(function (jsonp, ModuleLoader) {
            return jsonp({
                url: ym.env.server.url + '/map.js',
                requestParams: {
                    modules: module,
                    mode: ym.env.server.params.mode
                },
                noCache: true
            }).then(function (map) {
                (new ModuleLoader(map, ym.env.server)).defineAll();
            });
        }).always(function (promise) {
            if (promise.isFulfilled()) {
                requestDeferred.resolve(promise.valueOf());
            } else {
                requestDeferred.reject(promise.valueOf());
            }

            requestDeferred = null;
        });
    };