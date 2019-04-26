import del from 'del';
import fs from 'fs';
import gulp from 'gulp';
import gulpIf from 'gulp-if'
import livereload from 'gulp-livereload'
import mergeJson from 'gulp-merge-json'
import plumber from 'gulp-plumber'
import sass from 'gulp-sass'
import zip from 'gulp-zip'
import { merge } from 'event-stream'
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import preprocessify from 'preprocessify';

const production = process.env.NODE_ENV === 'production';
const target = process.env.TARGET || 'chrome';
const environment = process.env.NODE_ENV || 'development';

const generic = JSON.parse(fs.readFileSync(`./config/${environment}.json`));
const specific = JSON.parse(fs.readFileSync(`./config/${target}.json`));
const context = Object.assign({}, generic, specific);

const manifest = {
  dev: {
    background: {
      scripts: [
        'scripts/livereload.js',
        'scripts/background.js'
      ]
    }
  },

  firefox: {
    applications: {
      gecko: {
        id: 'github-mermaid-extension@amercier.com'
      }
    }
  }
}

gulp.task('clean:build', () => del(`./build/${target}`))
gulp.task('clean:dist', () => del(`./dist/${target}.zip`))

gulp.task('styles', () =>
  gulp.src('src/styles/**/*.scss')
    .pipe(plumber())
    .pipe(sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', sass.logError))
    .pipe(gulp.dest(`build/${target}/styles`))
);

gulp.task('manifest', () =>
  gulp.src('./manifest.json')
    .pipe(gulpIf(!production, mergeJson({
      fileName: 'manifest.json',
      jsonSpace: ' '.repeat(4),
      endObj: manifest.dev
    })))
    .pipe(gulpIf(target === 'firefox', mergeJson({
      fileName: 'manifest.json',
      jsonSpace: ' '.repeat(4),
      endObj: manifest.firefox
    })))
    .pipe(gulp.dest(`./build/${target}`))
);

const scripts = [
  'background.js',
  'contentscript.js',
  'options.js',
  'popup.js',
  'livereload.js'
]

scripts.forEach(script => {
  gulp.task(`scripts:${script}`, () =>
    browserify({
      entries: 'src/scripts/' + script,
      debug: !production,
    })
    .transform('babelify', {
      presets: [
        [
          '@babel/env', {
            targets: {
              browsers: ['last 2 versions', 'safari >= 7']
            },
            useBuiltIns: false
          }
        ]
      ]
    })
    .transform(preprocessify, {
      includeExtensions: ['.js'],
      context: context
    })
    .bundle()
    .pipe(source(script))
    .pipe(buffer())
    .pipe(gulp.dest(`build/${target}/scripts`))
  )
})

gulp.task('scripts', gulp.parallel(
  ...scripts.map(script => `scripts:${script}`)
))

const resources = [
  ['icons', './src/icons/**/*', `./build/${target}/icons`],
  ['locales', './src/_locales/**/*', `./build/${target}/_locales`],
  ['images', `./src/images/${target}/**/*`, `./build/${target}/images`],
  ['shared-images', './src/images/shared/**/*', `./build/${target}/images`],
  ['html', './src/**/*.html', `./build/${target}`],
]

resources.forEach(([name, src, dest]) => {
  gulp.task(
    `resources:${name}`,
    () => gulp.src(src).pipe(gulp.dest(dest))
  )
})

gulp.task('resources', gulp.parallel(
  ...resources.map(([name]) => `resources:${name}`))
)

gulp.task('extension', gulp.parallel(
  'manifest',
  'scripts',
  'styles',
  'resources'
))

gulp.task('build', gulp.series('clean:build', 'extension'))

gulp.task('livereload', () => {
  livereload.listen();
  gulp.watch('./src/**/*', gulp.series('build'))
})

gulp.task('watch', gulp.series(
  'build',
  'livereload',
));

gulp.task('zip', () =>
  gulp
  .src(`./build/${target}/**/*`)
  .pipe(zip(`${target}.zip`))
  .pipe(gulp.dest('dist'))
)

gulp.task('dist', gulp.series(
  'build',
  'clean:dist',
  'zip'
));

gulp.task('default', gulp.series('build'))
