ym.modules.define('game.Layout', [
    'templateLayoutFactory',
    'game.layout.ymtpl',
    'game.layout.css'
], function (provide, templateLayoutFactory, template) {
    var GameLayout = templateLayoutFactory.createClass(template);

    provide(GameLayout);
});