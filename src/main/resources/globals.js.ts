export default `#!/bin/env node
function lazyRequire(name) {
    let obj;

    return {
        get() {
            if (obj === undefined) obj = require(name);
            return obj;
        },
    };
}
/**
 * @type {{get(): typeof import('fs')}}
 */
const syncFs = lazyRequire('fs');
/**
 * @type {{get(): typeof import('fs/promises')}}
 */
const promiseFs = lazyRequire('fs/promises');
const { rejects } = require('assert');
const { spawn: $spawn, spawnSync } = require('child_process');
/**
 * @type {{get(): typeof import('os')}}
 */
const os = lazyRequire('os');
const { join, sep } = require('path');
/**
 * @type {{get(): typeof import('util')}}
 */
const util = lazyRequire('util');
/**
 * @type {{get(): typeof import('marked')}}
 */
const marked = lazyRequire('marked');
/**
 * @type {{get(): typeof import('highlight.js')}}
 */
const highlightjs = lazyRequire('highlight.js');
/**
 * @type {{get(): typeof import('crypto')}}
 */
const crypto = lazyRequire('crypto');
const { platform } = require('os');

const channels = {
    OPEN: 0,
    COPY: 1,
    PASTE: 2,
    GET_ENV: 3,
    WRITE: 4,
    ARG: 5,
    HIDE: 6,
    SHOW: 7,
    ERROR: 8,
    SHOW_WIDGET: 9,
    OPEN_DEVTOOLS: 10,
    UPDATE_WIDGET: 11,
    UPDATE_ERROR_LOADER: 12,
    SET_TAB_DATA: 13,
    ON_TAB: 14,
    SET_DIV_DATA: 15,
    SWITCH_TAB: 16,
    GET_PREVIEW: 17,
    SET_PREVIEW: 18,
    DROP: 19,
    ON_EVENT: 20,
    CLOSE_WIDGET: 21,
    START_DRAG: 22,
    RUN_IN_EDITOR: 23,
    TEXTAREA: 24,
    SEND_NOTIFICATION: 25,
};

function createPathFunction(path) {
    let cache = '';
    return (...paths) => {
        if (typeof path === 'string') cache = path;
        else if (typeof path === 'function' && !cache) cache = path();
        return join(cache, ...paths);
    };
}

function spawnPromise(command, args) {
    return new Promise((res, rej) => {
        const data = [];

        const spawned = $spawn(command, args, {
            shell: platform() === 'win32',
            cwd: process.cwd(),
        });
        function done(code) {
            return res({
                out: Buffer.from(data),
                exitCode: typeof code === 'number' ? code : 0,
            });
        }

        spawned.on('error', rej);
        spawned.on('close', done);
        spawned.on('disconnect', () => rej('Process disconnected'));
        spawned.on('exit', done);
    });
}

async function $getPackageManager() {
    if (!(await spawnPromise('pnpm', ['-v'])).error) return 'pnpm';
    else if (!(await spawnPromise('yarn', ['.v'])).error) return 'yarn';
    else if (!(await spawnPromise('npm', ['-v'])).error) return 'npm';
    throw new Error(
        'No package manager installed! (Supporting: npm, yarn and pnpm)'
    );
}

const promises = [];

const scriptDir = process.cwd();
const scriptName = ((str) => str.substring(0, str.length - 4))(
    process.argv[2].split(sep).pop()
);

const envFile = join(scriptDir, '../' + scriptName + '.env.json');
const dbFile = join(scriptDir, '../' + scriptName + '.db.json');
const logDir = join(scriptDir, '../log');
const tmpDir = join(scriptDir, '../tmp');

const noop = () => {};

promises.push(
    $getPackageManager().then(
        (result) => (packageManager = result),
        (err) => {
            console.error('No package manager is installed!', err);
            process.exit(1);
        }
    )
);

const today = new Date();
const logFile = join(logDir, \`log-\${process.argv[2].split(sep).pop()}.txt\`);
let packageManager = '';

function send(channel, data) {
    return new Promise((res, rej) => {
        process.send(
            { ...data, channel, pid: process.pid },
            undefined,
            undefined,
            (err) => (err ? rej(err) : res(undefined))
        );
    });
}

async function sendWithResponse(channel, data) {
    await send(channel, data);
    return await new Promise((res) => {
        function listener(data) {
            if (typeof data === 'object' && data && data.channel === channel) {
                process.off('message', listener);
                res(data);
            }
        }
        process.on('message', listener);
    });
}

function open(path) {
    return send(channels.OPEN, { path });
}

function notify(title, description) {
    if (!title) throw new Error('No title specified');
    send(channels.SEND_NOTIFICATION, { title, description });
}

const clipboard = {
    copy(string) {
        return send(channels.COPY, { string });
    },
    paste() {
        return send(channels.PASTE);
    },
};

async function tree(path) {
    const { readdir, lstat } = promiseFs.get();
    if (!(await lstat(path)).isDirectory()) return [];
    const dirs = [path];
    const files = [];

    while (dirs.length > 0) {
        const dir = dirs.pop();
        for (const f of await readdir(dir, { withFileTypes: true })) {
            if (f.isFile()) files.push(join(dir, f.name));
            else if (f.isDirectory()) dirs.push(join(dir, f.name));
        }
    }

    return files;
}

function treeSync(path) {
    const { readdirSync, lstatSync } = syncFs.get();
    if (!lstatSync(path).isDirectory()) return [];
    const dirs = [path];
    const files = [];

    while (dirs.length > 0) {
        const dir = dirs.pop();
        for (const f of readdirSync(dir, { withFileTypes: true })) {
            if (f.isFile()) files.push(join(dir, f.name));
            else if (f.isDirectory()) dirs.push(join(dir, f.name));
        }
    }

    return files;
}

const fs = {
    copy(from, to) {
        return promiseFs.get().copyFile(from, to);
    },
    move(from, to) {
        return promiseFs
            .get()
            .copyFile(from, to)
            .then(() => promiseFs.get().rm(from));
    },
    link(from, to) {
        return promiseFs.get().link(from, to);
    },
    listDir(dir) {
        return promiseFs.get().readdir(dir);
    },
    removeFile(path) {
        return promiseFs.get().rm(path);
    },
    removeDir(path) {
        return promiseFs.get().rm(path, { recursive: true });
    },
    delete(path) {
        return promiseFs.get().rm(path, { recursive: true });
    },
    createDir(path) {
        return promiseFs
            .get()
            .mkdir(path, { recursive: true })
            .then(() => {});
    },
    isFile(path) {
        return promiseFs
            .get()
            .lstat(path)
            .then((stat) => stat.isFile());
    },
    isDir(path) {
        return promiseFs
            .get()
            .lstat(path)
            .then((stat) => stat.isDirectory());
    },
    async ensureDir(path) {
        try {
            await promiseFs.get().access(path, promiseFs.get().constants.R_OK);
        } catch {
            await promiseFs.get().mkdir(path, { recursive: true });
        }
    },
    async ensureFile(path, contents) {
        try {
            await promiseFs
                .get()
                .access(
                    path,
                    promiseFs.get().constants.R_OK |
                        promiseFs.get().constants.W_OK
                );
        } catch {
            await promiseFs.get().writeFile(path, contents);
        }
    },
    tree,
    async findFiles(dir, options) {
        if (Object.keys(options).length < 1) return;
        const files = await tree(dir);
        return files.filter((el) => {
            const f = el.split(sep).pop() || '';
            const ext = f.split('.').pop() || '';
            const name = f.split('.').slice(0, -1).join('.');
            if (options.extensions && !options.extensions.includes(ext))
                return false;
            if (options.extension && !options.extension !== ext) return false;
            if (options.filenames && !options.filenames.includes(name))
                return false;
            if (options.filename && !options.filename !== name) return false;
            if (options.validate) return options.validate(name, ext, f, el);

            return false;
        });
    },

    getCwd() {
        return process.cwd();
    },

    copySync(from, to) {
        return syncFs.get().copyFileSync(from, to);
    },
    moveSync(from, to) {
        syncFs.get().copyFileSync(from, to);
        syncFs.get().rm(from);
    },
    linkSync(from, to) {
        return syncFs.get().linkSync(from, to);
    },
    listDirSync(dir) {
        return syncFs.get().readdirSync(dir);
    },
    removeFileSync(path) {
        return syncFs.get().rmSync(path);
    },
    removeDirSync(path) {
        return syncFs.get().rmSync(path, { recursive: true });
    },
    deleteSync(path) {
        return syncFs.get().rmSync(path, { recursive: true });
    },
    createDirSync(path) {
        return syncFs.get().mkdirSync(path, { recursive: true });
    },
    isFileSync(path) {
        return syncFs.get().lstatSync(path).isFile();
    },
    isDirSync(path) {
        return syncFs.get().lstatSync(path).isDirectory();
    },

    ensureDirSync(path) {
        if (!syncFs.get().existsSync(path))
            syncFs.get().mkdirSync(path, { recursive: true });
    },
    ensureFileSync(path, contents) {
        if (!syncFs.get().existsSync(path))
            syncFs.get().writeFileSync(path, contents);
    },
    treeSync,
    async findFilesSync(dir, options) {
        if (Object.keys(options).length < 1) return;
        const files = treeSync(dir);
        return files.filter((el) => {
            const f = el.split(sep).pop() || '';
            const ext = f.split('.').pop() || '';
            const name = f.split('.').slice(0, -1).join('.');
            if (options.extensions && !options.extensions.includes(ext))
                return false;
            if (options.extension && !options.extension !== ext) return false;
            if (options.filenames && !options.filenames.includes(name))
                return false;
            if (options.filename && !options.filename !== name) return false;
            if (options.validate) return options.validate(name, ext, f);

            return false;
        });
    },
};

function $(command) {
    const spawned = $spawn(command, {
        shell: true,
        cwd: fs.getCwd(),
        detached: true,
    });
    return new Promise((res, rej) => {
        let stdout = [];
        let stderr = [];

        function done(code) {
            code ||= 0;
            res({
                statusCode: code,
                errored: code !== 0,
                stdout: Buffer.from(stdout),
                stderr: Buffer.from(stderr),
            });
        }
        spawned.on('close', done);
        spawned.on('disconnect', done);
        spawned.on('error', rej);
        spawned.on('exit', done);
        spawned.stdout.on('data', stdout.push);
        spawned.stderr.on('data', stderr.push);
    });
}

function cd(path) {
    return process.chdir(path);
}

async function npm(path) {
    const oldcwd = fs.getCwd();

    cd(scriptDir);
    try {
        await promiseFs
            .get()
            .access(
                join(fs.getCwd(), 'node_modules', path),
                syncFs.get().constants.R_OK
            );
        const mod = require(path);
        cd(oldcwd);
        return mod;
    } catch {
        if (
            (await arg('Install ' + path, [
                {
                    key: 'yes',
                    name: 'Install ' + path,
                    description:
                        'This will install ' +
                        path +
                        ' in the node_modules in your scripts folder',
                },
                {
                    key: 'no',
                    name: "Don't install " + path,
                    description: 'This will cancel this operation',
                },
            ])) === 'no'
        )
            process.exit(1);
        const { stop } = loader('Installing ' + path);
        if (!packageManager) await Promise.allSettled(promises);
        const installArg = packageManager === 'yarn' ? 'add' : 'install';
        const spawned = spawnSync(packageManager, [installArg, path], {
            shell: platform() === 'win32',
        });
        stop(
            spawned.error || spawned.status !== 0
                ? 'Failed to install ' + path
                : 'Successfully installed ' + path
        );
        if (spawned.error) throw error;
        if (spawned.status !== 0)
            throw (
                'Installing exited with non-zero exit code.\\n' +
                spawned.output
                    .filter((el) => !!el)
                    .map((el) => el.toString())
                    .join('')
            );
        spawned.output.forEach((el) => (!el ? null : process.stdout.write(el)));
    }

    const mod = require(path);
    cd(oldcwd);
    return mod;
}

function getPackageManager() {
    return packageManager;
}

async function env(key) {
    const { value } = await sendWithResponse(channels.GET_ENV, { key });
    if (!value) throw new Error('User did not specify a value');
    return value.toString();
}

function timeToMs(config) {
    let ms = config.milliseconds || 0;

    if (config.seconds) ms += config.seconds * 1000;
    if (config.minutes) ms += config.minutes * 1000 * 60;
    if (config.hours) ms += config.hours * 1000 * 60 * 60;
    if (config.days) ms += config.days * 1000 * 60 * 60 * 24;

    return ms;
}

function sleep(config) {
    return new Promise((r) => setTimeout(r, timeToMs(config)));
}

function sleepSync(config) {
    const endTime = Date.now() + timeToMs(config);
    while (Date.now() < endTime);
}

function getEnvFile() {
    return envFile;
}

const home = createPathFunction(() => os.get().homedir());

function logToFile(level, ...args) {
    const message = util.get().format(...args);
    const now = new Date();
    return syncFs
        .get()
        .appendFile(
            logFile,
            \`[{now.getHours()}:\${now.getMinutes()}:\${now.getSeconds()}] [\${level.toUpperCase()}]: \${message}\\n\`
        );
}

function logToFileSync(level, ...args) {
    const message = util.get().format(...args);
    const now = new Date();
    return syncFs
        .get()
        .appendFileSync(
            logFile,
            \`[\${now.getHours()}:\${now.getMinutes()}:\${now.getSeconds()}] [\${level.toUpperCase()}]: \${message}\\n\`
        );
}

let intervals = new Set();
let timeouts = new Set();

const oldTimeout = globalThis.setTimeout;
const oldInterval = globalThis.setInterval;

globalThis.setInterval = function setInterval(...args) {
    const id = oldInterval(...args);
    intervals.add(id);
    return id;
};

globalThis.setTimeout = function setTimeout(...args) {
    const id = oldTimeout(...args);
    timeouts.add(id);
    return id;
};

function clearAllIntervals() {
    for (const e of intervals) clearInterval(e);
    intervals = new Set();
}
function clearAllTimeouts() {
    for (const e of timeouts) clearTimeout(e);
    timeouts = new Set();
}

function isWin() {
    return os.get().platform() === 'win32';
}

function isMac() {
    return os.get().platform() === 'darwin';
}

function isLinux() {
    return os.get().platform() === 'linux';
}

const _logDir = createPathFunction(logDir)

function getLogFile() {
    return logFile;
}

const _scriptDir = createPathFunction(scriptDir);

function writeToSelection(string) {
    return send(channels.WRITE, { string });
}

let callWhenUiChange = [];
function uiChange() {
    const err = new Error('UI Changed!');
    for (const cb of callWhenUiChange) cb(err);
    callWhenUiChange = [];
}

let i = 3;
async function arg(name, options, autocomplete, hint) {
    if (process.argv[i]) return process.argv[i++];
    return new Promise((res, rej) => {
        uiChange();
        callWhenUiChange.push(rej);
        callWhenUiChange.push(() => process.off('message', onAutoComplete));
        async function onAutoComplete(data) {
            if (
                !data ||
                typeof data !== 'object' ||
                typeof data.key !== 'string' ||
                typeof data.channel !== 'number' ||
                data.channel !== channels.GET_PREVIEW
            )
                return;
            const result = await (autocomplete || (() => {}))(data.key);

            if (typeof result !== 'string' && result !== undefined)
                throw new TypeError(
                    'Expected result of autocomplete(...) to be string or undefined, but found ' +
                        typeof result
                );
            return send(channels.SET_PREVIEW, {
                data: result,
                key: data.key,
                hint,
            });
        }
        process.on('message', onAutoComplete);
        sendWithResponse(channels.ARG, { name, options }).then((obj) => {
            process.off('message', onAutoComplete);
            const value = obj.value;
            if (value === undefined || value === null) process.exit(1);
            res(value.toString());
        });
    });
}

function hide() {
    return send(channels.HIDE);
}

function show() {
    return send(channels.SHOW);
}

function _spawn(name, args, options = {}) {
    return $spawn(name, args, {
        ...(options || {}),
        detached: true,
        cwd: fs.getCwd(),
        shell: platform() === 'win32',
    });
}

function md(markdown) {
    marked.get().marked.setOptions({
        highlight(code, language) {
            if (!language) return highlightjs.get().highlightAuto(code).value;
            return highlightjs.get().highlight(code, { language }).value;
        },
        renderer: new (marked.get().Renderer)(),
        langPrefix: 'hljs light language-', // highlight.js css expects a top-level 'hljs' class.
        pedantic: false,
        gfm: true,
        breaks: false,
        sanitize: false,
        smartypants: false,
        xhtml: false,
    });

    return marked.get().parse(markdown);
}

function highlight(code, language) {
    language ||= 'typescript';
    if (!highlightjs.get().getLanguage(language)) language = 'plaintext';
    return (
        '<pre class="hljs light"><code class="hljs">' +
        highlightjs.get().highlight(code, { language }).value +
        '</code></pre>'
    );
}

function getHljsStyle(style) {
    return syncFs
        .get()
        .readFileSync(
            join(packageDir, 'node_modules', 'highlight.js', 'styles', style)
        );
}

async function widget(code) {
    const { value } = await sendWithResponse(channels.SHOW_WIDGET, { code });
    if (!value) throw new Error('Could not create Widget');
    return value;
}

function dev(value) {
    return send(channels.OPEN_DEVTOOLS, { value });
}

function updateWidget(id, content) {
    return send(channels.UPDATE_WIDGET, { id, content });
}

async function get(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Request failed!');
    const txt = await res.text();
    if (!txt) return {};
    return JSON.parse(txt);
}

async function db(name, defaultValue) {
    if (typeof defaultValue !== 'object' || !defaultValue)
        throw new Error('The specified default value is not of type object');

    let value = defaultValue;

    async function write() {
        let obj = {};
        try {
            obj = JSON.parse(
                (await promiseFs.get().readFile(dbFile)).toString()
            );
        } catch {}
        obj[name] = value;
        await promiseFs.get().writeFile(dbFile, JSON.stringify(obj));
    }

    try {
        const obj = JSON.parse(
            (await promiseFs.get().readFile(dbFile)).toString()
        );
        obj[name] ||= defaultValue;
        value = obj[name];
        await promiseFs.get().writeFile(dbFile, JSON.stringify(obj));
        return { write, value };
    } catch {
        await promiseFs
            .get()
            .writeFile(dbFile, JSON.stringify({ [name]: defaultValue }));
        return { write, value };
    }
}

function formatProps(data) {
    return { data };
}

function loader(name) {
    send(
        channels.UPDATE_ERROR_LOADER,
        formatProps({ open: true, loading: true, name })
    );
    return {
        updateName(name) {
            send(channels.UPDATE_ERROR_LOADER, formatProps({ name }));
        },
        stop(name) {
            if (typeof name !== 'string')
                send(
                    channels.UPDATE_ERROR_LOADER,
                    formatProps({ loading: false })
                );
            else
                send(
                    channels.UPDATE_ERROR_LOADER,
                    formatProps({ loading: false, name })
                );
            setTimeout(
                () =>
                    send(
                        channels.UPDATE_ERROR_LOADER,
                        formatProps({ open: false })
                    ),
                1000
            );
        },
    };
}

function removeTabs() {
    setTabs([]);
}

function setTabs(tabs) {
    send(channels.SET_TAB_DATA, { tabs });
}

function onTab(name, cb) {
    async function handler(data) {
        if (data.channel !== channels.ON_TAB) return;
        if (data.name !== name) return;
        try {
            await cb();
        } catch {}
    }
    process.on('message', handler);
    return () => process.off('message', handler);
}

function div(code) {
    const err = new Error('UI Changed!');
    for (const cb of callWhenUiChange) cb !== resetDiv ? cb(err) : null;
    callWhenUiChange = [];

    if (!callWhenUiChange.includes(resetDiv)) callWhenUiChange.push(resetDiv);
    send(channels.SET_DIV_DATA, { data: code });
}

function resetDiv() {
    send(channels.SET_DIV_DATA, { data: '' });
}

function setTab(name) {
    send(channels.SWITCH_TAB, { tab: name });
}

function drop() {
    uiChange();
    return new Promise((res, rej) => {
        callWhenUiChange.push(() => rej(new Error('UI Changed')));
        sendWithResponse(channels.DROP).then((value) =>
            value && typeof value === 'object' && value.file
                ? res(value.file)
                : rej(new Error('User exited'))
        );
    });
}

function onEvent(name, cb) {
    function listen(data) {
        if (typeof data !== 'object' || !data) return;
        if (!data.channel || data.channel !== channels.ON_EVENT) return;
        if (
            typeof data.event !== 'string' ||
            typeof data.args !== 'object' ||
            !data.args ||
            !(data.args instanceof Array) ||
            data.event !== name
        )
            return;
        if (typeof data.widgetId !== 'string' && data.widgetId !== undefined)
            return;
        cb(data.widgetId, data.args);
    }
    process.on('message', listen);
    return () => process.off('message', listen);
}

function closeWidget(widgetId) {
    send(channels.CLOSE_WIDGET, { widgetId });
}

function startDrag(file) {
    send(channels.START_DRAG, { file });
}

function edit(path) {
    send(channels.RUN_IN_EDITOR, { file: path });
}

function textarea(name) {
    uiChange();
    return new Promise((res, rej) => {
        callWhenUiChange.push(() => rej(new Error('UI Changed')));
        sendWithResponse(channels.TEXTAREA, { name }).then((value) =>
            value && typeof value === 'object' && value.value
                ? res(value.value)
                : rej(new Error('User exited'))
        );
    });
}

function tmp(content, name, extension) {
    if (!name || typeof name !== 'string') {
        const now = new Date();
        name = \`\${now.getDay()}-\${
            now.getMonth() + 1
        }-\${now.getFullYear()}-\${now.getHours()}-\${now.getMinutes()}\`;
    }
    const file = join(
        tmpDir,
        name.toString() +
            crypto.get().randomUUID() +
            '.' +
            (extension?.toString() || 'txt')
    );
    syncFs.get().writeFileSync(file, content?.toString() || '');
    return file;
}

globalThis.API = {};

function expose(name, obj) {
    globalThis[name] = obj;
    globalThis.API[name] = obj;
    module.exports[name] = obj;
}

expose('open', open);
expose('notify', notify);
expose('clipboard', clipboard);
expose('fs', fs);
expose('$', $);
expose('npm', npm);
expose('getPackageManager', getPackageManager);
expose('env', env);
expose('sleep', sleep);
expose('sleepSync', sleepSync);
expose('timeToMs', timeToMs);
expose('home', home);
expose('logToFile', logToFile);
expose('logToFileSync', logToFileSync);
expose('clearAllIntervals', clearAllIntervals);
expose('clearAllTimeouts', clearAllTimeouts);
expose('isWin', isWin);
expose('isMac', isMac);
expose('isLinux', isLinux);
expose('md', md);
expose('send', send);
expose('sendWithResponse', sendWithResponse);
expose('cd', cd);
expose('getEnvFile', getEnvFile);
expose('logDir', _logDir);
expose('getLogFile', getLogFile);
expose('scriptDir', _scriptDir);
expose('writeToSelection', writeToSelection);
expose('arg', arg);
expose('hide', hide);
expose('show', show);
expose('spawn', _spawn);
expose('highlight', highlight);
expose('getHljsStyle', getHljsStyle);
expose('widget', widget);
expose('dev', dev);
expose('updateWidget', updateWidget);
expose('get', get);
expose('db', db);
expose('loader', loader);
expose('setTabs', setTabs);
expose('removeTabs', removeTabs);
expose('onTab', onTab);
expose('div', div);
expose('resetDiv', resetDiv);
expose('setTab', setTab);
expose('drop', drop);
expose('edit', edit);
expose('onEvent', onEvent);
expose('closeWidget', closeWidget);
expose('startDrag', startDrag);
expose('textarea', textarea);
expose('tmp', tmp);
expose('createPathFunction', createPathFunction);
expose('qrunnerDir', createPathFunction(join(scriptDir, '..')));

const oldConsole = {
    log: console.log,
    error: console.error,
    info: console.info,
    warn: console.warn,
    debug: console.debug,
};

console.log = function log(...args) {
    oldConsole.log(...args);
    logToFileSync('info', ...args);
};

console.error = function error(...args) {
    oldConsole.log(...args);
    logToFileSync('error', ...args);
};

console.info = function info(...args) {
    oldConsole.log(...args);
    logToFileSync('info', ...args);
};

console.warn = function warn(...args) {
    oldConsole.log(...args);
    logToFileSync('warn', ...args);
};

console.debug = function debug(...args) {
    oldConsole.log(...args);
    logToFileSync('info', ...args);
};

process.on('uncaughtException', (err) => {
    console.error('Unhandled Exeption!');
    console.error(err);
    send(channels.ERROR, {
        error: err?.stack ? err.stack : err.toString(),
    })
        .then(() => process.exit(1))
        .catch(() => {});
});
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection!');
    console.error(err);
    send(channels.ERROR, {
        error: err?.stack ? err.stack : err.toString(),
    })
        .then(() => process.exit(1))
        .catch(() => {});
});

require(process.argv[2]);`;
