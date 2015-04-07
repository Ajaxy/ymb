ym.modules.define('user.Player', ['util.defineClass', 'user.Base'], function (provide, defineClass, BaseUser) {
    function Player () {
        Player.superclass.constructor.apply(this, arguments);
    }

    defineClass(Player, BaseUser, {
        play: function () {
            console.log(this.getName() + ' from ' + this.getLocation() + ' started playing.');
        }
    });

    provide(Player);
});