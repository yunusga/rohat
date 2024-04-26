const {
    basename,
    join,
} = require('path');

const { sync } = require('glob');

class Lagman {
    constructor(paths) {
        this.store = {
            src: join(paths.pages, '**', '*.njk'),
            blocks: [],
            pages: [],
        };

        sync(join(paths.blocks, '**', '*.njk')).forEach((block) => {
            this.create(block, 'blocks');
        });
    
        sync(this.store.src).forEach((page) => {
            this.create(page, 'pages');
        });
    }

    create(template, type) {
        const name = basename(template);

        this.store[type][name] = new Set();
    }

    delete(name, type) {
        delete this.store[type][name];
    }
}

module.exports = Lagman;