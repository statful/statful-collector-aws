import del from 'del';
import gulp from 'gulp';
import babel from 'gulp-babel';
import path from 'path';

const src = 'src',
    srcPath = path.resolve(src),
    srcExtension = 'js',
    srcGlob = srcPath + '/**/*.' + srcExtension,
    lib = 'lib',
    libPath = path.resolve(lib),
    libExtension = 'js',
    libGlob = libPath + '/**/*.' + libExtension;

gulp.task('clean-lib', () => {
    return del(libGlob, () => {});
});

gulp.task('compile', () => {
    return gulp
        .src([srcGlob])
        .pipe(babel())
        .pipe(gulp.dest(libPath));
});

gulp.task('build-raw', gulp.series(['clean-lib', 'compile']));
gulp.task('build', gulp.series(['build-raw']));
gulp.task('default', gulp.series(['build']));
