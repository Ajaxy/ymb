ymb
======

Builder for projects based on [ym modules](https://www.npmjs.org/package/ym). Built on top of [gulp@^4](https://www.npmjs.org/package/gulp) task runner.

Requirements
------------
ymb works with Node.js 0.10+.

Getting Started
---------------
**CLI usage**

You can install `ymb` globally using Node Package Manager (npm):

    npm install --save-dev ymb

Then you can use `node_modules/.bin/ymb` console command to build your project, create configuration files or setup auto-build task (watch) for any file changes.
Builder will then try to find your `build.json` and `gulpfile.js` configuration files or use default ones.

```bash
node_modules/.bin/ymb configure [DIR=.] [build.json] [gulpfile.js] [-f] # Makes a copy of default `build.json` and/or `gulpfile.js` in specified directory.
node_modules/.bin/ymb dev [DIR=.] [-m <mode>]		# Runs gulp task `dev` that will rebuild project on any change of source files specified in `build.json`.
node_modules/.bin/ymb [build] [DIR=.] [-m <mode>]		# Runs gulp task `build` described by local or default `gulpfile.js`.
```

**Explaining build.json**

`build.json` contains build settings. You can copy the default one into your project dir with `ymb configure .` and then override it.

```javascript
{
    // Globs for files to be processed. Related to project dir.
    "src": {
        "js": "src/**/*.js",
        "css": "src/**/*.css",
        "templates": "src/**/*.ymtpl"
    },
    
    // Path that build results will be placed into. Related to project dir.
    "dest": "build/",
    
    // Name of the output JavaScript file when `store` set to `solid`.
    "concatTo": "all.js",
    
    // Output files optimization.
    "minify": true,

    // And you can use object to set minify options. See more https://www.npmjs.com/package/gulp-uglify#options
    // "minify": {
    //     "extension": "js" // Extension of target files
    // }

    // Set to `false` to prevent inline data URI for images in CSS. Add `#no-datauri` to image path to prevent for particular file.
    // You will need to route static handler for `build/{publicDir}/images` on server side.
    "dataUriImages": true,
    "publicDir": "public",

    // If you want to make a plugin for existing project providing `ym` modular system (i.e. `Yandex Maps API`),
    // set `target` option to `plugin`. Option `namespace` should contain name of the main project global namespace.
    //
    // Otherwise you can run your project as standalone.
    // Then builder will inject `ym` modular system and helper modules into build output.
    // In this case option `namespace` specifies the variable name to be exported into the `global` scope,
    // that will contain `modules` property referencing the modular system.
    "target": "plugin",
    "namespace": "ym",

    // Defines how to store your build data: `solid` for single file and `async` for running with `yms`.
    // More information about `yms` and examples of async projects is here: https://www.npmjs.org/package/yms
    "store": "solid",

    // You can specify array of modules to be preloaded along with ones specified in GET params and `ready` method.
    "preload": [],

    // You can insert another async layer, when information about certain modules ("modules map") is not included into `init.js`,
    // but can be loaded with another HTTP request to `yms` server. These features are experimental and may cause issues.
    "asyncMap": false,
    "initialMap": null,

    // You can use different modes overriding global options, but don't forget to specify one of them when running builder.
    // "modes": {
    //     "debug": {
    //         "default": true,
    //         "minify": false
    //     }
    // }
}
```

**Explaining gulpfile.js**

If you want more flexibility you can also override default `gulpfile.js` by cloning it locally with `ymb configure . gulpfile.js`. Read more about gulpfiles on [gulp project page](https://github.com/gulpjs/gulp/).

**Plugins usage**

If you're already using `gulp` and have your own `gulpfile.js` you can require our plugins directly and use them in your tasks.

Check out [**ymb plugins documentation**](docs/plugins.md).

```javascript
var gulp = require('gulp'),
    ymbPlugins = require('ymb').plugins;

gulp.task('templates', function () {
    gulp.src(/* .. */)
        .pipe(/* .. */)
        .pipe(ymbPlugins.templates.compile())
        .pipe(/* .. */);
});
```
