var gulp = require('gulp'),
    react = require('gulp-react'),
    bower = require('main-bower-files'),
    bowerNormalize = require('gulp-bower-normalize'),
    less = require('gulp-less');

gulp.task('scripts', function() {
  return gulp.src('web/js/app.jsx')
    .pipe(react())
    .pipe(gulp.dest('public/dist/js'));
});

gulp.task('bower-normalize', function() {
  return gulp.src(bower(), {base: 'bower_components'})
    .pipe(bowerNormalize({bowerJson: 'bower.json', flatten: true}))
    .pipe(gulp.dest('public/3rdparty'));
});

gulp.task('less', function() {
  gulp.src('web/styles/*.less')
    .pipe(less())
    .pipe(gulp.dest('public/dist/css'));
});

gulp.task('default', ['scripts', 'less']);

gulp.task('watch', ['scripts', 'less'], function() {
  gulp.watch('web/js/**', ['scripts']);
  gulp.watch('web/styles/**', ['less']);
});

