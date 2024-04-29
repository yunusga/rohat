const {
    readFileSync,
    existsSync,
} = require('node:fs');

const {
    join,
} = require('node:path');

function inlineSvgSprite(paths) {
    const pathIcons = join('build', 'assets', 'symbol', 'svg', 'sprite.symbol.svg');
    const hasIcons = existsSync(pathIcons);

    if (!hasIcons) {
        return '';
    }

    const spriteIcons = hasIcons ? readFileSync(pathIcons).toString() : '';

    return `${spriteIcons}\n`;
}

module.exports = inlineSvgSprite;