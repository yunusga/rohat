const { join, basename, parse } = require('node:path');
const { readdirSync } = require('node:fs');

class Database {
    constructor(settings, logger) {
        this.store = {
            settings,
            logger,
            locales: {},
        };

        const locales = readdirSync(settings.paths.locales).map((blockPath) => join(process.cwd(), settings.paths.locales, blockPath));

        locales.forEach((locale) => {
            let { name } = parse(locale);

            this.store.locales[name] = require(locale);

            this.store.locales[name].dir = this.store.settings.locales[name].dir;
            this.store.locales[name].lang = this.store.settings.locales[name].lang;
        });
    }

    getStore(locale) {
        if (!this.store.locales[locale]) {
            locale = Object.keys(this.store.settings.locales)[0];
        }

        return this.store.locales[locale];
    }

    setCurrentPage(currentPage) {
        this.store.currentPage = currentPage;
    }

    getCurrentPage() {
        return this.store.currentPage.replace('.njk', '.html');
    }
}

module.exports = Database;