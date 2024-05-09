const {
    readFileSync,
    writeFileSync,
    cpSync,
} = require('node:fs');

const { join } = require('node:path');

const { createHash } = require('node:crypto');
const { globSync } = require('glob');
const url = require('url');

const posthtml = require('posthtml');

function setFileHash(src, path) {
    const parsed = url.parse(src);

    if (parsed.protocol || src.indexOf('//') > -1) {
        return src;
    }

    const searchParams = new URLSearchParams(parsed.search);

    let hash = '';
    let uri = parsed.pathname.replace(/^\/+/);

    uri = parsed.pathname;

    if (global._hashed.has(uri)) {
        hash = global._hashed.get(uri);
    } else {
        const fileBuffer = readFileSync(`${path}/${uri}`);
        const hashSum = createHash('sha1');

        hashSum.update(fileBuffer);

        hash = hashSum.digest('hex').slice(0, 24);

        global._hashed.set(uri.replace(/^\/+/, ''), hash);
    }

    searchParams.set('v', hash);

    return `${uri}?${searchParams.toString()}`;
}

const hasher = () => (tree) => {
    if (!global._hashed) {
        global._hashed = new Map();
    }

    let tags = ['link', 'script'];
    let attributes = ['href', 'src'];

    if (!Array.isArray(tree)) {
        reject(new Error('tree is not Array'));
    }

    if (tree.length === 0) {
        resolve(tree);
    }

    tree.walk((node) => {

        if (node.tag && node.attrs) {
            node.attrs = Object.keys(node.attrs).reduce((attributeList, attr) => {
                if (tags.includes(node.tag) && attributes.includes(attr)) {
                    return Object.assign(attributeList, { [attr]: setFileHash(node.attrs[attr], './build') });
                }

                return attributeList;
            }, node.attrs);
        }

        return node;
    });

    return tree;
};

module.exports = () => {
    const pages = globSync('build/*.html');

    cpSync(
        join(process.cwd(), 'rohat', 'assets'),
        join(process.cwd(), 'build', 'assets'), { recursive: true, }
    );

    pages.forEach((page) => {
        const html = readFileSync(page, { encoding: 'utf8', flag: 'r' }).toString();
    
        const result = posthtml()
            .use(require('posthtml-attrs-sorter')({
                order: [
                    'id', 'class', 'name',
                    'data-.+', 'aria-.+', 'ng-.+', 'src',
                    'for', 'type', 'href',
                    'values', 'title', 'alt',
                    'role', 'aria-.+',
                    '$unknown$',
                ]
            })
            )
            .use(hasher())
            .process(html, { sync: true });
    
        writeFileSync(page, result.html, { encoding: 'utf8' });
    });
};