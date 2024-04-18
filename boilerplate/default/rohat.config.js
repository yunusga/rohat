const { join } = require('path');

const paths = {
	src: 'rohat',
	pages: join('rohat', 'pages'),
	locales: join('rohat', 'locales'),
	blocks: join('rohat', 'blocks'),
	root: join('rohat', 'root'),
	styles: join('rohat', 'styles'),
	build: 'build',
	assets: 'assets',
};

const locales = {
	ru: {
		dir: 'ltr',
		lang: 'ru',
	},
};

module.exports = {
	paths,
	locales,
};
