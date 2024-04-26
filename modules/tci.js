const { ensureFileSync, readFileSync } = require('fs-extra');
const chokidar = require('chokidar');
const { exec } = require('child_process');

function run(options, logger) {
    const opts = {
        usePolling: true,
        ...options,
    };

    const tciFilePath = '.tci';

    ensureFileSync(tciFilePath);

    const TCIWatcher = chokidar.watch(tciFilePath, opts);

    TCIWatcher.on('change', (file) => {
        const text = readFileSync(file, { encoding: 'utf8' }).replace(/\n+$/m, '');
        const commands = text.split('\n').map((item) => `rohat ${item}`);

        exec(commands.join(' && '), (error, stdout) => {
            logger(stdout);
        });
    });
}

module.exports = {
    run,
};