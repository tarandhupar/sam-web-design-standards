var gulp = require('gulp');
var dutil = require('./doc-util');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var linter = require('gulp-scss-lint');
var merge = require('merge-stream');
var filter = require('gulp-filter');
var replace = require('gulp-replace');
var runSequence = require('run-sequence');
var del = require('del');
var task = /([\w\d-_]+)\.js$/.exec(__filename)[ 1 ];

var entryFileFilter = filter('all.scss', { restore: true });
var fontAwesomeCssFilter = filter('font-awesome.css', { restore: true });
var supportedBrowsers = [
  '> 1%',
  'Last 2 versions',
  'IE 11',
  'IE 10',
  'IE 9',
];

gulp.task('scss-lint', function (done) {

  if (!cFlags.test) {
    dutil.logMessage('scss-lint', 'Skipping linting of Sass files.');
    return done();
  }

  return gulp.src(['src/stylesheets/**/*.scss', '!src/stylesheets/lib/**/*.scss'])
    .pipe(linter({
      config: '.scss-lint.yml',
    }));

});

gulp.task('create-tmp-docs', function (done) {
  return gulp.src('_site-assets/stylesheets/**/*.scss')
    .pipe(replace(/---/g, ''))
    .pipe(gulp.dest('tmpdocs'));
});

gulp.task('lint-tmp-docs-scss', function (done) {
  return gulp.src('tmpdocs/**/*.scss')
    .pipe(linter({
      config: '.scss-lint.yml',
    }));
});

gulp.task('delete-tmp-docs', function (done) {
  return del('tmpdocs');
});

gulp.task('scss-lint-docs', function (done) {

  if (!cFlags.test) {
    dutil.logMessage('scss-lint-docs', 'Skipping linting of Sass files.');
    return done();
  }

  dutil.logMessage('scss-lint-docs', 'Linting files found by `_site-assets/**/*.scss`');

  runSequence(
    // README: The SCSS files have Jekyll dashes at the top. You'd think the best way
    // to lint them would be to pipe straight from gulp.replace to the linter.
    // So did we. It doesn't work. We can't figure out why. So instead we're
    // piping to a tmp folder and linting that.
    'create-tmp-docs',
    'lint-tmp-docs-scss',
    'delete-tmp-docs',
    done
  );
});


gulp.task('copy-vendor-sass', function (done) {

  dutil.logMessage('copy-vendor-sass', 'Compiling vendor CSS');

  del('src/stylesheets/lib');
  
  var fontawesome = gulp.src('./node_modules/font-awesome/scss/**/*.scss')
    .pipe(gulp.dest('src/stylesheets/lib/font-awesome'));
  
  // TODO: Should we copy the USWDS Sass, as it is a vendor?
  var uswds = gulp.src('./node_modules/uswds/src/stylesheets/**/*.scss')
    .pipe(gulp.dest('src/stylesheets/lib/uswds'));

  var streams = merge(fontawesome, uswds);    

  return streams;
});

gulp.task(task, [ 'scss-lint' ], function (done) {

  dutil.logMessage(task, 'Compiling Sass');

  var entryFile = 'src/stylesheets/all.scss';

  var defaultStream = gulp.src(entryFile)
    .pipe(
      sass({ outputStyle: 'expanded' })
        .on('error', sass.logError)
    )
    .pipe(
      autoprefixer({
        browsers: supportedBrowsers,
        cascade: false,
      })
    )
    .pipe(rename({ basename: dutil.pkg.name }))
    .pipe(gulp.dest('dist/css'));

  var minifiedStream = gulp.src(entryFile)
    .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(
        sass({ outputStyle: 'compressed' })
          .on('error', sass.logError)
      )
      .pipe(
        autoprefixer({
          browsers: supportedBrowsers,
          cascade: false,
        })
      )
      .pipe(rename({
        basename: dutil.pkg.name,
        suffix: '.min',
      }))
    .pipe(sourcemaps.write('.', { addComment: false }))
    .pipe(gulp.dest('dist/css'));

  var streams = merge(defaultStream, minifiedStream);

  return streams;

});
