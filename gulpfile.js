var gulp = require('gulp'),
    react = require('gulp-react'),
    bower = require('main-bower-files'),
    bowerNormalize = require('gulp-bower-normalize');

gulp.task('default', function() {
  return gulp.src('web/js/app.jsx')
    .pipe(react())
    .pipe(gulp.dest('public/dist/js'));
});

gulp.task('bower-normalize', function() {
  return gulp.src(bower(), {base: 'bower_components'})
    .pipe(bowerNormalize({bowerJson: 'bower.json', flatten: true}))
    .pipe(gulp.dest('public/3rdparty'));
});
