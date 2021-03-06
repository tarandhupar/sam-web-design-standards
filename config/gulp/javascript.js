var gulp = require('gulp');
var gutil = require('gulp-util');
var dutil = require('./doc-util');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var merge = require('merge-stream');
var rename = require('gulp-rename');
var runSequence = require('run-sequence');
var assert = require('gulp-if');
var linter = require('gulp-eslint');
var task = /([\w\d-_]+)\.js$/.exec(__filename)[ 1 ];
var doc_task = 'docs_' + task;

gulp.task('copy-vendor-javascript', function (done) {

  dutil.logMessage('copy-vendor-javascript', 'Compiling vendor JavaScript');

  var stream = gulp.src([ // TODO: Should we copy the USWDS Sass, as it is a vendor?
      './node_modules/uswds/dist/js/uswds.min.js'
    ])
    .on('error', function (error) {
      dutil.logError('copy-vendor-javascript', error);
    })
    .pipe(gulp.dest('src/js/')).pipe(gulp.dest('_site-assets/js/'));

  return stream;
});

gulp.task('doc_eslint', function (done) {

  if (!cFlags.test) {
    dutil.logMessage('eslint', 'Skipping linting of docs JavaScript files.');
    return done();
  }

  return gulp.src([
      'docs/doc_assets/js/**/*.js', // TODO: This is not the correct location
      '!docs/doc_assets/js/vendor/**/*.js' // TODO: This is not the correct location
    ])
    .pipe(linter('.eslintrc'))
    .pipe(linter.format());

});

gulp.task('eslint', function (done) {

  if (!cFlags.test) {
    dutil.logMessage('eslint', 'Skipping linting of JavaScript files.');
    return done();
  }

  return gulp.src([ 
      'src/js/**/*.js', // TODO: This is not the correct location
      '!src/js/vendor/**/*.js' // TODO: This is not the correct location
    ])
    .pipe(linter('.eslintrc'))
    .pipe(linter.format());

});

gulp.task(task, function () {
  dutil.logMessage(task, 'Compiling JavaScript');
  
  runSequence('eslint', 'copy-vendor-javascript', 'actually-compile');



});

gulp.task('actually-compile', function(done){
  var defaultStream = browserify({
    entries: 'src/js/start.js',
    debug: true,
  });

  defaultStream = defaultStream.bundle()
    .pipe(source('components.js')) // TODO: This does not exist
    .pipe(buffer())
    .pipe(rename({ basename: dutil.pkg.name }))
    .pipe(gulp.dest('dist/js')); // TODO: This does not exist

  var minifiedStream = browserify({
    entries: 'src/js/start.js',
    debug: true,
  });

  minifiedStream = minifiedStream.bundle()
    .pipe(source('components.js')) // TODO: This does not exist
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(uglify())
      .on('error', gutil.log)
      .pipe(rename({
        basename: dutil.pkg.name,
        suffix: '.min',
      }))
    .pipe(sourcemaps.write('.', { addComment: false }))
    .pipe(gulp.dest('dist/js'));

  return merge(defaultStream, minifiedStream);
});

gulp.task(doc_task, [ 'doc_eslint' ], function (done) {

  dutil.logMessage(doc_task, 'Compiling JavaScript for website');

  var minifiedStream = browserify({
    entries: '_site-assets/js/start.js',
    debug: true,
  });

  return minifiedStream.bundle()
    .pipe(source('start.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(uglify())
      .on('error', gutil.log)
      .pipe(rename({
        basename: 'styleguide',
      }))
    .pipe(sourcemaps.write('.', { addComment: false }))
    .pipe(gulp.dest('assets/js'));

});
