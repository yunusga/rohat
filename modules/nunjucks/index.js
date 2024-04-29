const { join } = require('node:path');
const { readdirSync } = require('node:fs');

module.exports = (blocksPath) => {
    const nunjucks = require('nunjucks');
    const blocksPaths = readdirSync(blocksPath).map((blockPath) => join(blocksPath, blockPath));

    const templateLoader = new nunjucks.FileSystemLoader(blocksPaths, {
        watch: true,
        noCache: false,
    });

    const env = new nunjucks.Environment(templateLoader, {
        autoescape: false,
    });

    env.addGlobal('inlineSvgSprite', require('../nunjucks/inlineSvgSprite'));

    return env;
};