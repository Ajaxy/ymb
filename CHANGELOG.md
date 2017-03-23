2.0 (2017/02)
===
- Get rid of `hashes.json` in favor of generating hashes from short aliases
- Performance optimizations: **~2 times faster** build and watch/rebuild
- Cleaner and shorter gulpfile with `gulp-if` instead of confusing `util.pipeChain`
- Migrate to **Gulp 4.0**
  - Better watch/rebuild with `{ since: gulp.lastRun() }` instead of `plg.cached` and `plg.remember`
- Preferred local installation instead of global
  - Disable usage of default gulpfile without explicit copying
  - Requiring flat ymb dependencies in the local gulpfile with **npm 3.x**
- `ymb watch` renamed to `ymb dev`
- Prettify command line output
