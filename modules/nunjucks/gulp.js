const PluginError = require('plugin-error');
const transform = require('through2').obj;

const rext = require('replace-ext');

const frontmatter = require('../frontmatter');

const PLUGIN_NAME = 'gulp-nunjucks';

function gulpNunjucks(nunjucks, db) {
    return transform((file, enc, cb) => {
        if (file.isNull()) {
            return cb(null, file);
        }

        if (file.isStream()) {
            return cb(new PluginError(PLUGIN_NAME, 'Streams are not supported'));
        }

        let data = file.data ? file.data : {};
        
        let fm = {};

        let content = file.contents.toString('utf8');

        try {
            fm = frontmatter(content);
            
            content = fm.body;
        } catch (err) {
            err.message = err.stack.replace(/\n +at[\s\S]*/u, '');
      
            return cb(new PluginError('Front matter (YAML) parse error', err));
        }

        const localeData = db.getStore(fm.attributes.locale);
        
        localeData.currentPage = db.getCurrentPage();

        const context = { ...localeData, ...data, ...fm.attributes };

        nunjucks.renderString(content, context, (err, res) => {
            if (err) {
                return cb(new PluginError(PLUGIN_NAME, err));
            }
            
            file.path = rext(file.path, '.html');
            file.contents = Buffer.from(res);

            cb(null, file);
        });
    });
}

module.exports = gulpNunjucks;