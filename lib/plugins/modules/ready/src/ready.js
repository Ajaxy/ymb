(function (global) {
    ym.ready = ready;

    var vow = ym.vow,
        domReady = document.readyState == 'complete',
        deferred = vow.defer(),
        promise = deferred.promise(),
        modulesReady = false;

    if (!domReady) {
        function onDomReady () {
            if (!domReady) {
                domReady = true;
                check();
            }
        }

        if (document.addEventListener) {
            document.addEventListener('DOMContentLoaded', onDomReady, false);
            window.addEventListener('load', onDomReady, false);
        } else if (document.attachEvent) {
            window.attachEvent('onload', onDomReady);
        }
    }

    function ready (modules) {
        check();

        if (!modules) {
            return promise;
        }

        return promise.then(function () {
            return ym.modules.require(modules);
        });
    }
    
    function check () {
        // TODO We don't fill namespace, so we don't need to wait while modules are being required.
        if (/*modulesReady && */domReady) {
            deferred.resolve();
        }
    }
})(this);