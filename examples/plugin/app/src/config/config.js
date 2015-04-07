ym.modules.define('config', function (provide) {
    provide({
        location: {
            default: 'ru',
            ru: 'Russia',
            us: 'USA',
            uk: 'United Kingdom'
        }
    });
});