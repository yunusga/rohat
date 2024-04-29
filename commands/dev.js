const log = require('fancy-log');

log('rohat is warming up...');

const {
	join,
	basename,
} = require('node:path');

const { performance } = require('node:perf_hooks');

const {
	existsSync,
	rmSync,
	mkdirSync,
} = require('node:fs');

const {
	src,
	dest,
	task,
	watch,
	series,
	parallel,
} = require('gulp');

const {
    bold,
	green,
	yellow,
	bgRed,
} = require('picocolors');

const tap = require('../modules/gulp-tap');
const plumber = require('gulp-plumber');
const chokidar = require('chokidar');
const server = require('browser-sync').create('rohat server');
const settings = require(join(process.cwd(), 'rohat.config'));

const Lagman = require('../modules/lagman');
const Database = require('../modules/database');
const TCI = require('../modules/tci');

module.exports = (options) => {
	const { paths } = settings;

	const LAGMAN = new Lagman(paths);
	const DB = new Database(settings, log);

	TCI.run({}, log);

	process.env.BROWSERSLIST_CONFIG = join(process.cwd(), '.browserslistrc');

	/**
	 * Clean
	 */
	task('clean', (done) => {
		log('clean');

		if (existsSync(paths.build)) {
			rmSync(paths.build, { recursive: true, });
			mkdirSync(paths.build);
		}

		done();
	});

	/**
	 * Server
	 */
	task('server', (done) => {
		server.use(require('../modules/browser-sync/client-messages'));

		server.init({
			server: {
				baseDir: paths.build,
				routes: {
					'/assets': join(paths.src, paths.assets),
				},
				directory: true,
			},
			open: false,
			watch: true, // need for update serve files on change
			watchOptions: {
				ignoreInitial: false,
			},
			logFileChanges: false,
			ui: false,
			ghostMode: false,
    		notify: true,
			logLevel: 'info',
			logPrefix: 'rohat dev server',
		});

		done();
	});

	/**
	 * Styles
	 */
	task('styles', (done) => {
		const autoprefixer = require('autoprefixer');
		const postcss = require('gulp-postcss');
		const stylus = require('../modules/gulp-stylus');
		const sourcemaps = require('gulp-sourcemaps');
		
		const combineAndSortMQ = require('postcss-sort-media-queries');
		const flexBugsFixes = require('postcss-flexbugs-fixes');
		const momentumScrolling = require('postcss-momentum-scrolling');
		const inlineSvg = require('postcss-inline-svg');
		const easingGradients = require('postcss-easing-gradients');

		src(join(paths.styles, '*.styl'))
			.pipe(tap((file) => {
				log(`styles:${yellow(basename(file.path))}`);
			}))
			.pipe(plumber({
				errorHandler: (error) => {
					log.error(`Error: check styles ${error.plugin}`);
					log.error(error.toString());

					server.sockets.emit('error:message', error);
				},
			}))
			.pipe(sourcemaps.init())
			.pipe(stylus({
				'include css': true,
			}))
			.pipe(postcss([
				combineAndSortMQ(),
				momentumScrolling(),
				flexBugsFixes(),
				inlineSvg(),
				easingGradients(),
				autoprefixer(),
			]))
			.pipe(sourcemaps.write())
			.pipe(dest(join(paths.build, paths.assets, 'css')))
			.on('end', () => {
				log('styles:done');
			})
			.pipe(server.stream());

		done();
	});

	/**
	 * HTML
	 */
	const nunjucks = require('../modules/nunjucks')(paths);
	const gulpNunjucks = require('../modules/nunjucks/gulp');
	const gulpPostHTML = require('../modules/posthtml/gulp');
  	const posthtmlBem = require('../modules/posthtml/bem');

	let htmlTiming = '';

	task('html', (done) => {
		
		src(LAGMAN.store.src)
			.pipe(tap((file) => {
				htmlTiming = performance.now();

				log(`html:${yellow(basename(file.path))}`);
			}))
			.pipe(gulpNunjucks(nunjucks, DB))
			.pipe(gulpPostHTML([
				posthtmlBem(),
			]))
			.pipe(dest(paths.build))
			.on('end', () => {
				log(`html:${green(`${(performance.now() - htmlTiming).toFixed(0)}ms`)}`);
				server.reload();
			});

		done();
	});

	task('iconizer', (done) => {
		const svgSprite = require('gulp-svg-sprite');
    	const replace = require('gulp-replace');

		src(join(paths.iconizer, '*.svg'))
			.pipe(svgSprite({
				sprite: 'sprite.icons.svg',
				mode: {
					symbol: { // symbol mode to build the SVG
						example: true, // Build sample page
					},
				},
				svg: {
					xmlDeclaration: false, // strip out the XML attribute
					doctypeDeclaration: false, // don't include the !DOCTYPE declaration
				}
			}))
			.pipe(replace(/\n/g, ''))
			.pipe(replace(/<defs[\s\S]*?\/defs><path[\s\S]*?\s+?d=/g, '<path d='))
			.pipe(replace(/<style[\s\S]*?\/style><path[\s\S]*?\s+?d=/g, '<path d='))
			.pipe(replace(/\sfill[\s\S]*?(['"])[\s\S]*?\1/g, ''))
			.pipe(replace(/<title>[\s\S]*?<\/title>/g, ''))
			.pipe(replace(/<svg /, (match) => `${match} class="svg-prite" `))
			.pipe(dest(join(paths.build, paths.assets)))
			.on('end', () => {
				log('iconizer:done');
			});
		
		done();
	});

	task('watch', (done) => {
		const watchOpts = {
			ignoreInitial: true,
			usePolling: false,
			cwd: process.cwd(),
		};

		watch([
			join(join(paths.iconizer, '*.svg')),
		], watchOpts, parallel('iconizer'));

		watch([
			join(paths.styles, '**', '*.styl'),
			join(paths.blocks, '**', '*.styl'),
		], watchOpts, parallel('styles'));

		/* Pages */
		const watchPages = chokidar.watch(join(paths.pages, '**', '*.njk'), watchOpts);

		watchPages
			.on('add', (pagePath) => {
				watchPages.add(pagePath);
				LAGMAN.create(pagePath, 'pages');
			})
			.on('change', (pagePath) => {
				LAGMAN.store.src = join(process.cwd(), pagePath);
				parallel('html')();
			})
			.on('unlink', (pagePath) => {
				// LAGMAN.delete(LAGMAN.getName(pagePath), 'pages');
				watchPages.unwatch(pagePath);
			});
		
		const watchBLocks = chokidar.watch(join(paths.blocks, '**', '*.njk'), watchOpts);

		watchBLocks
			.on('add', (blockPath) => {
				watchBLocks.add(blockPath);
				LAGMAN.create(blockPath, 'pages');
			})
			.on('change', (blockPath) => {
				parallel('html')();
			})
			.on('unlink', (blockPath) => {
				// LAGMAN.delete(LAGMAN.getName(blockPath), 'pages');
				watchPages.unwatch(blockPath);
			});

		done();
	});

	/**
	 * Dev
	 */
	task(
		'dev',
		series(
			'clean',
			'iconizer',
			parallel(
				'html',
				'styles'
			)
		)
	);

	if (options.build) {
		series('dev')();
	} else {
		series('dev', 'watch', 'server')();
	}
};