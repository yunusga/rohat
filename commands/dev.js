console.log('rohat is warming up...');

const { join } = require('node:path');
const { existsSync, rmSync, mkdirSync } = require('node:fs');

const {
	src,
	dest,
	task,
	watch,
	series,
	parallel,
} = require('gulp');

const log = require('fancy-log');
const plumber = require('gulp-plumber');
const server = require('browser-sync').create('rohat server');
const settings = require(join(process.cwd(), 'rohat.config'));

module.exports = (options) => {
	const { paths } = settings;

	process.env.BROWSERSLIST_CONFIG = join(process.cwd(), '.browserslistrc');

	/**
	 * Clean
	 */
	task('clean', (done) => {
		log('clean');

		if (existsSync(paths.build)) {
			rmSync(paths.build, { recursive: true });
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
			watch: false,
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

		src(join(paths.styles, '**', '*.styl'))
			.pipe(plumber({
				errorHandler: (error) => {
					log.error(`Ошибка: проверьте стили ${error.plugin}`);
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
				log('styles');
			})
			.pipe(server.stream());

		done();
	});

	/**
	 * HTML
	 */
	const nunjucks = require('../modules/nunjucks')(paths.blocks);
	const gulpNunjucks = require('../modules/nunjucks/gulp');

	task('html', (done) => {
		src(join(paths.pages, '**', '*.njk'))
			.pipe(gulpNunjucks(nunjucks, {}))
			.pipe(dest(paths.build))
			.on('end', () => {
				log('html');
				server.reload();
			});

		done();
	});

	task('watch', (done) => {
		watch([
			join(paths.styles, '**', '*.styl'),
			join(paths.blocks, '**', '*.styl'),
		], {}, parallel('styles'));

		watch([
			join(paths.pages, '**', '*.njk'),
			join(paths.blocks, '**', '*.njk'),
		], {}, parallel('html'));

		done();
	});

	/**
	 * Dev
	 */
	task(
		'dev',
		parallel(
			'clean',
			'html',
			'styles'
		)
	)

	if (options.build) {
		series('dev')();
	} else {
		series('dev', 'watch', 'server')();
	}
};