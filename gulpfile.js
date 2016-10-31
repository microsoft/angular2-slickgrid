"use strict";
const gulp = require('gulp');
const del = require('del');
const ts = require('gulp-typescript');
const merge = require('merge2');

const tsproj = ts.createProject('./tsconfig.json');

gulp.task('compile', () => {
    let tsResult = gulp.src(['**/*.ts', '!node_modules/**/*'])
                .pipe(ts(tsproj))

    return merge([
        tsResult.dts.pipe(gulp.dest('./')),
        tsResult.js.pipe(gulp.dest('./'))
    ]);
});

gulp.task('clean', () => {
    return del(['**/*.js', '**/*.d.ts', '!node_modules/**/*', '!gulpfile.js', '!typings/**/*'])
});