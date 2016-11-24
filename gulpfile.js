"use strict";
const gulp = require('gulp');
const del = require('del');
const ts = require('gulp-typescript');
const merge = require('merge2');
const connect = require('gulp-connect');

const tsproj = ts.createProject('./tsconfig.json');
const exmapProj = ts.createProject('./tsconfig.json', { declaration: false });

gulp.task('compile', () => {
    let tsResult = gulp.src(['components/**/*.ts', 'typings/**/*.ts'])
                .pipe(ts(tsproj))

    return merge([
        tsResult.dts.pipe(gulp.dest('./components/')),
        tsResult.js.pipe(gulp.dest('./components/'))
    ]);
});

gulp.task('compile:examples', (done) => {
    let promises = [];
    promises.push(new Promise((resolve) => {
        gulp.src(['examples/**/*.ts', 'typings/**/*.ts'])
            .pipe(ts(exmapProj))
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

gulp.task('serve', () => {
    connect.server();
});

gulp.task('clean', () => {
    return del(['components/**/*.js', 'components/**/*.d.ts', 'dist'])
});

gulp.task('build', gulp.series('clean', 'compile'));
