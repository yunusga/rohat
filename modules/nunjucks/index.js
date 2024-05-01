const {
    join,
} = require('node:path');

const {
    readdirSync,
    readFileSync,
} = require('node:fs');

module.exports = (paths) => {
    const nunjucks = require('nunjucks');
    const blocksPaths = readdirSync(paths.blocks).map((blockPath) => join(paths.blocks, blockPath));

    const templateLoader = new nunjucks.FileSystemLoader(blocksPaths, {
        watch: true,
        noCache: true,
    });

    const env = new nunjucks.Environment(templateLoader, {
        autoescape: false,
    });

    env.addGlobal('inlineSvgSprite', require('../nunjucks/inlineSvgSprite'));
    env.addGlobal('inline', (filePath) => readFileSync(`rohat/assets/${filePath}`));

    return env;
};