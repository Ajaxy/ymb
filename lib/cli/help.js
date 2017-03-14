var packageInfo = require('../../package.json');

module.exports = help;

function help () {
    console.log([
        packageInfo.name + ' ' + packageInfo.version,
        packageInfo.description,
        'Tries to find `build.json` and `gulpfile.js` in specified project DIR or uses default ones.',
        '',
        'Usage:',
        '\tymb [build] [DIR=.] [-m <mode>]\t\t# Runs gulp task `build` described by local or default `gulpfile.js`.',
        '\tymb dev [DIR=.] [-m <mode>]\t\t# Runs gulp task `dev` that will rebuild project on any change of source files specified in `build.json`.',
        '\tymb configure [DIR=.] [build.json] [gulpfile.js] [-f] # Makes a copy of default `build.json` and/or `gulpfile.js` in specified directory.',
        '\tymb help\t\t\t\t# Displays this message.'
    ].join('\n'));
}