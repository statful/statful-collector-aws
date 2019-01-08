import del from 'del';
import gulp from 'gulp';
import babel from 'gulp-babel';
import eslint from 'gulp-eslint';
import istanbul from 'gulp-istanbul';
import jasmine from 'gulp-jasmine';
import plumber from 'gulp-plumber';
import { Instrumenter } from 'isparta';
import path from 'path';

const src = 'src',
    srcPath = path.resolve(src),
    srcExtension = 'js',
    srcGlob = srcPath + '/**/*.' + srcExtension,
    lib = 'lib',
    libPath = path.resolve(lib),
    libExtension = 'js',
    libGlob = libPath + '/**/*.' + libExtension,
    test = 'test',
    testPath = path.resolve(test),
    testExtension = 'spec.js',
    testGlob = testPath + '/**/*.' + testExtension,
    coverage = 'coverage',
    coveragePath = path.resolve(coverage),
    coverageGlob = coveragePath;

gulp.task('clean-lib', () => {
    return del(libGlob, () => {});
});

gulp.task('clean-coverage', () => {
    return del(coverageGlob, () => {});
});

gulp.task('compile', () => {
    return gulp
        .src([srcGlob])
        .pipe(plumber())
        .pipe(babel())
        .pipe(gulp.dest(libPath));
});

gulp.task('eslint', () => {
    return gulp
        .src([srcGlob])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('coverage', done => {
    gulp.src([srcGlob])
        .pipe(plumber())
        .pipe(
            istanbul({
                instrumenter: Instrumenter,
                includeUntested: true
            })
        )
        .pipe(istanbul.hookRequire())
        .on('finish', () => {
            return gulp
                .src([testGlob])
                .pipe(plumber())
                .pipe(jasmine())
                .pipe(istanbul.writeReports({}))
                .pipe(
                    istanbul.enforceThresholds({
                        thresholds: { global: 1 }
                    })
                )
                .once('end', () => {
                    done();
                    process.exit();
                });
        });
});

gulp.task('build-raw', gulp.series(['clean-lib', 'compile']));
gulp.task('dev', gulp.series(['build-raw']));
gulp.task('default', gulp.series(['dev']));
gulp.task('test', gulp.series(['clean-coverage', 'eslint', 'coverage']));
gulp.task('build', gulp.series(['build-raw', 'test']));
