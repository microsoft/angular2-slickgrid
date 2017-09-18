"use strict";
const gulp = require('gulp');
const del = require('del');
const ts = require('gulp-typescript');
const merge = require('merge2');
const connect = require('gulp-connect');
const tslint = require('gulp-tslint');
const sm = require('gulp-sourcemaps');

const tsproj = ts.createProject('./tsconfig.json');
const exmapProj = ts.createProject('./tsconfig.json', { declaration: false });

gulp.task('compile:src', () => {
    let tsResult = gulp.src(['components/**/*.ts', 'typings/**/*.ts'])
                .pipe(sm.init())
                .pipe(tsproj());

    return merge([
        tsResult.dts.pipe(gulp.dest('./components/')),
        tsResult.js
            .pipe(sm.write('.'))
            .pipe(gulp.dest('./components/'))
    ]);
});

gulp.task('compile:examples', (done) => {
    let promises = [];
    promises.push(new Promise((resolve) => {
        gulp.src(['examples/**/*.ts', 'typings/**/*.ts'])
            .pipe(exmapProj())
            .pipe(gulp.dest('dist'))
            .on('end', () => {
                resolve();
            });
    }))
    
    promises.push(new Promise((resolve) => {
        gulp.src(['examples/**/*.html'])
        .pipe(gulp.dest('dist'))
        .on('end', () => {
            resolve();
        });
        
    }))

    promises.push(new Promise((resolve)=> {
        gulp.src(['examples/**/*.js'])
            .pipe(gulp.dest('dist'))
            .on('end', () => {
                resolve();
            });
    }));

    promises.push(new Promise((resolve)=> {
        gulp.src(['examples/**/*.css'])
            .pipe(gulp.dest('dist'))
            .on('end', () => {
                resolve();
            });
    }));

    Promise.all(promises).then(() => {
        done();
    });
});

gulp.task('compile:index', () => {
    let tsResult = gulp.src(['./index.ts', 'typings/**/*.ts'])
            .pipe(tsproj());

    return merge([
        tsResult.dts.pipe(gulp.dest('./')),
        tsResult.js.pipe(gulp.dest('./'))
    ]);
});

gulp.task('compile', gulp.series('compile:src', 'compile:index', 'compile:examples'));

gulp.task('lint:src', () => {
    return gulp.src(['components/**/*.ts'])
            .pipe((tslint({
                formatter: "verbose"
            })))
            .pipe(tslint.report());
});

gulp.task('lint:examples', () => {
    return gulp.src(['examples/**/*.ts'])
            .pipe((tslint({
                formatter: "verbose"
            })))
            .pipe(tslint.report());
});

gulp.task('lint', gulp.series('lint:src', 'lint:examples'));

gulp.task('serve', () => {
    connect.server();
});

gulp.task('clean', () => {
    return del(['components/**/*.js', 'components/**/*.d.ts', 'dist', 'index.js', 'index.d.ts'])
});

gulp.task('build', gulp.series('clean', 'lint', 'compile'));

gulp.task('publish', gulp.series('clean', 'lint', 'compile:src', 'compile:index'));
