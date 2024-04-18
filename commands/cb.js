const { mkdirSync, existsSync, writeFileSync } = require('fs');

module.exports = (name, techs) => {
	const blockPath = `rohat/blocks/${name}`;
	const extensions = techs || 'njk,styl,js';

	if (existsSync(blockPath)) {
		process.stdout.write(`❌ block "${name}" is already exists`);
	} else {
		mkdirSync(blockPath);

		extensions.split(',').forEach((ext) => {
			if (ext === 'njk') {
				writeFileSync(`${blockPath}/${name}.${ext}`, `<div block="${name}"></div><!-- ${name} -->`, { encoding: 'utf8' });
			} else if (['styl'].includes(ext)) {
				writeFileSync(`${blockPath}/${name}.${ext}`, `.${name} {}`, { encoding: 'utf8' });
			} else {
				writeFileSync(`${blockPath}/${name}.${ext}`, '', { encoding: 'utf8' });
			}
		});

		process.stdout.write(`✅ block "${name}" created`);
	}

	process.exit();
};