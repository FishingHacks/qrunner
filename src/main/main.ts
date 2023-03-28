/* eslint global-require: off, no-console: off, promise/always-return: off */

import cron from 'node-cron';
import path, { sep } from 'path';
import { resolveHtmlPath } from './util';
import chalk from 'chalk';
import { spawn, spawnSync } from 'child_process';
import {
  app,
  BrowserWindow,
  clipboard,
  globalShortcut,
  ipcMain,
  Menu,
  nativeImage,
  screen,
  shell,
  Tray,
} from 'electron';
import {
  constants,
  existsSync,
  mkdirSync,
  readFileSync,
  watch,
  writeFileSync,
} from 'fs';
import {
  appendFile,
  chmod,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'fs/promises';
import { homedir, platform } from 'os';
import { join } from 'path';
import { ArgOption, DropFile } from '../renderer/api';

// RESOUCES
import globalsDTS from './resources/globals.d.ts';
import globalsJS from './resources/globals.js';
import runFile from './resources/run';
import { colorsDefault } from '../renderer/constants';
import menu from './menu';
import tsconfig from './resources/tsconfig.json';
import {
  changeColorscheme,
  createColorscheme,
  createFromFile,
  createScript,
  deleteColorscheme,
  dropFile,
  editScript,
  event,
  getArgPreview,
  getColorschemes,
  getConfig,
  getInstalledPackages,
  getProcs,
  getScript,
  installPackage,
  kill,
  listScripts,
  importScriptFromFs,
  removeScript,
  renameScript,
  runScript,
  setConfig,
  setSelectedTab,
  uninstallPackage,
  textareaSubmit,
} from './ipc';
import installRequiredPackages from './installTypescript';
import { randomUUID } from 'crypto';
import { createServer } from 'http';
import { format } from 'util';
import { getInfo, ScriptInfo } from './extractScriptInfos';

if (process.defaultApp) {
  if (process.argv.length >= 2)
    app.setAsDefaultProtocolClient('qrunner', process.execPath, [
      path.resolve(process.argv[1]),
    ]);
} else app.setAsDefaultProtocolClient('qrunner');

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) app.quit();
else {
  app.on('second-instance', (ev, cmdLine, cwd) => {
    console.log('qrunner', cmdLine);
  });

  app.on('open-url', (ev, url) => {
    console.log('qrunner', url);
  });
}

function ensureDir(path: string) {
  log('info', 'startup', 'Ensuring that dir:' + path + ' exists!');
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}
function ensureFile(path: string, contents: string) {
  log('info', 'startup', 'Ensuring that file:' + path + ' exists!');
  if (!existsSync(path)) writeFileSync(path, contents);
}

/**
 * Instructions on how to patch:
 * 1. Check that this issue is still unresolved, otherwise the newest tsx version should work: https://github.com/esbuild-kit/tsx/issues/201
 * 2. Copy https://github.com/esbuild-kit/tsx
 * 3. run pnpm i
 * 4. use the instructions from the above mentioned issue to patch your copy of tsx
 * 5. run pnpm build
 * 6. copy the path of cli.js in the now created dist folder
 * 7. Pase it here
 */
const PATCHED_TSX_PATH = homedir() + '/js/tsx/dist/cli.js'; // note: put your own path here.

let messages: string[] = [];

export function log(
  level: 'warn' | 'debug' | 'info' | 'error',
  module: string,
  message: string,
  ...args: any[]
) {
  const toPrint = chalk.cyan(module) + ' | ' + format(message, ...args);
  console[level](toPrint);
  messages.push(
    `[${new Date().toLocaleString()}] [${level}]: ${module} | ${format(
      message,
      ...args
    )}`.substring(0, 200) // to prevent huge, 40mb log files after a few hours
  );
}

export const runner = (() => {
  // if (!spawnSync('tsx', ['-v']).error) return 'tsx'; // error: TSX doesn't work with IPC connections, see https://github.com/esbuild-kit/tsx/issues/201
  if (
    !spawnSync(PATCHED_TSX_PATH, ['-v'], { shell: platform() === 'win32' })
      .error &&
    PATCHED_TSX_PATH
  )
    return PATCHED_TSX_PATH;
  if (!spawnSync('ts-node', ['-v'], { shell: platform() === 'win32' }).error)
    return 'ts-node';
  // todo: node & tsc

  console.error(
    '\x1b[31mError: You have to have either tsx or ts-node installed!\x1b[39m'
  );
  process.exit(1);
})();

export const QRunnerDirectory = join(homedir(), '.qrunner');
ensureDir(QRunnerDirectory);

export const SCRIPTDIR = join(QRunnerDirectory, 'scripts'); // change to the homedir when in prod
export const colorSchemeFile = join(QRunnerDirectory, '.colorScheme.json');
export const colorSchemeDir = join(QRunnerDirectory, 'colorSchemes');
export const envFile = join(QRunnerDirectory, 'env.json');
export const logDir = join(QRunnerDirectory, 'log');
export const binDir = join(QRunnerDirectory, 'bin');
export const fontFile = join(QRunnerDirectory, 'font');
export const configFile = join(QRunnerDirectory, '.config.json');
export const logFile = join(logDir, 'console.log');
export const tmpDir = join(QRunnerDirectory, 'tmp');
export const shortcutFile = join(QRunnerDirectory, 'shortcut');

ensureDir(tmpDir);
ensureDir(SCRIPTDIR);
ensureFile(
  join(SCRIPTDIR, 'package.json'),
  '{ "name": "qrunner scripts", "dependencies": {} }'
);
ensureFile(colorSchemeFile, JSON.stringify(colorsDefault));
ensureDir(colorSchemeDir);
ensureFile(join(SCRIPTDIR, 'globals.d.ts'), globalsDTS);
ensureFile(join(SCRIPTDIR, 'globals.js'), globalsJS);
ensureFile(join(SCRIPTDIR, 'tsconfig.json'), tsconfig);
ensureFile(envFile, '{}');
ensureFile(fontFile, 'ubuntu');
ensureFile(configFile, '{}');
ensureDir(logDir);
ensureFile(logFile, '');
ensureFile(shortcutFile, 'Super+Q');
const runnerFile = join(QRunnerDirectory, 'run');
ensureFile(runnerFile, runFile);
chmod(
  runnerFile,
  constants.S_IXUSR |
    constants.S_IWUSR |
    constants.S_IRUSR |
    constants.S_IRGRP |
    constants.S_IWGRP |
    constants.S_IROTH
);

export let shortcut = 'Super+Q';
try {
  shortcut = readFileSync(shortcutFile).toString();
} catch {}

installRequiredPackages(SCRIPTDIR, [
  'typescript',
  'highlight.js',
  'marked',
  '@types/node',
]);
ensureDir(binDir);

function dumpLog() {
  const _messages = messages;
  messages = [];
  log('info', 'logger', 'Dumping log to file...');
  messages = [];
  if (_messages.length < 1) return;
  appendFile(logFile, _messages.join('\n') + '\n');
}

setInterval(dumpLog, 20 * 1000);
process.on('beforeExit', dumpLog);

export function getMainWindow() {
  return mainWindow;
}

readdir(tmpDir).then((dir) => dir.forEach((f) => rm(f)));

ipcMain.handle('create-script', async (ev, name: string) => createScript(name));
ipcMain.handle('run-script', (ev, name: string) => runScript(name));
ipcMain.on('get-preview', (ev, key: string) => getArgPreview(key));
ipcMain.handle('kill-script', (ev, pid: number) => kill(pid));
ipcMain.handle('get-script-dir', () => SCRIPTDIR);
ipcMain.handle('get-script', async (ev, name: string) => getScript(name));
ipcMain.handle('get-shortcut', async (ev) => shortcut);
ipcMain.handle('set-shortcut', async (ev, s: string) =>
  writeFile(shortcutFile, s)
);
export let uiChangeCb: (() => void)[] = [];
export async function arg(
  name: string,
  options?: (string | ArgOption)[],
  hint?: string
) {
  await show();
  for (const cb of uiChangeCb)
    try {
      cb();
    } catch {}
  uiChangeCb = [];

  mainWindow?.webContents?.send('arg-open', name, options, hint);

  return new Promise((res, rej) => {
    let returned = false;
    uiChangeCb.push(() => {
      returned = true;
    });
    ipcMain.once('respond', (ev, string?: string) => {
      if (returned) return;
      if (!string) rej('User exited');
      else if (
        options &&
        options.length > 0 &&
        !options.find(
          (el) => el === string || (typeof el === 'object' && el.key === string)
        )
      )
        rej('User exited');
      else res(string);
    });
  });
}
export function hide() {
  if (!mainWindow) return;
  try {
    mainWindow?.hide();
  } catch {}
}
export async function show() {
  if (!mainWindow) createWindow();

  try {
    mainWindow?.show();
  } catch {
    createWindow();
    mainWindow?.show();
  }

  if (mainWindow?.webContents.isLoadingMainFrame())
    await new Promise((r) =>
      mainWindow?.webContents.once('did-finish-load', r)
    );
}
ipcMain.handle(
  'arg',
  (ev, name: string, options?: (string | ArgOption)[], hint?: string) => {
    return arg(name, options, hint);
  }
);
ipcMain.handle('get-processes', getProcs);
ipcMain.handle('kill-proc', (ev, pid: number) => kill(pid));
ipcMain.handle('hide-window', hide);
ipcMain.handle('show-window', show);
ipcMain.handle('change-colorscheme', (ev, config: any) =>
  changeColorscheme(config)
);
ipcMain.handle('get-config', (ev, name: string) => getConfig(name));
ipcMain.handle('set-config', (ev, name: string, value: string) =>
  setConfig(name, value)
);
ipcMain.handle('from-file', (ev, path: string, contents: string) =>
  createFromFile(path, contents)
);
ipcMain.handle('import-file-from-fs', importScriptFromFs);
ipcMain.handle('install-pkg', (ev, name: string) => installPackage(name));
ipcMain.handle('get-packages', getInstalledPackages);
ipcMain.handle('remove-package', (ev, name: string) => uninstallPackage(name));
ipcMain.handle('get-colorschemes', getColorschemes);
ipcMain.handle('create-colorscheme', (ev, name: string, config: any) =>
  createColorscheme(name, config)
);
ipcMain.handle('delete-colorscheme', (ev, name: string) =>
  deleteColorscheme(name)
);

ipcMain.handle('list-scripts', () => listScripts());
ipcMain.handle('open-github', (ev, name: string) =>
  shell.openExternal('https://github.com/' + name)
);
ipcMain.handle('edit-script', async (ev, name: string) => editScript(name));
ipcMain.handle('get-colors', async () => {
  return JSON.parse((await readFile(colorSchemeFile)).toString());
});
ipcMain.handle('open-widget', (ev, name: string, contents: string) =>
  createWidget(name, contents)
);
ipcMain.handle('update-widget', (ev, id: string, content: string) =>
  updateWidget(id, content)
);
ipcMain.handle('copy', (ev, str: string) => clipboard.writeText(str));
ipcMain.handle('remove-script', (ev, path: string) => removeScript(path));
ipcMain.handle('rename-script', (ev, path: string, newname: string) =>
  renameScript(path, newname)
);
ipcMain.handle('get-api-docs', () =>
  readFile(
    app.isPackaged
      ? path.join(process.resourcesPath, 'assets', 'api.md')
      : path.join(__dirname, '../../assets', 'api.md')
  ).then((v) => v.toString())
);
ipcMain.handle('get-font', () =>
  readFile(fontFile).then((el) => el.toString())
);
ipcMain.handle('set-font', (ev, font: string) => {
  writeFile(fontFile, font);
  queueMessage('font-change', font);
});
ipcMain.handle('set-selected-tab', (ev, name: string) => setSelectedTab(name));
ipcMain.handle('open', (ev, link: string) => shell.openExternal(link));
ipcMain.handle('drop-file', (ev, file: DropFile) => dropFile(file));
ipcMain.handle(
  'event',
  (e, name: string, widgetId: string | undefined, ...args: any[]) =>
    event(name, widgetId, args)
);

let onTimeout = false;
let call: [string, ...any[]][] = [];
function resolveQueue() {
  if (call.length < 1) onTimeout = false;
  else setTimeout(resolveQueue, 500);
  try {
    for (const c of call) mainWindow?.webContents?.send(...c);
    call = [];
  } catch {}
}

export let scriptData: Record<string, ScriptInfo> = {};
let isSyncing = false;
async function syncFiles() {
  if (isSyncing) return;
  isSyncing = true;

  const files = (await readdir(SCRIPTDIR)).filter(
    (el) =>
      el.endsWith('.ts') && !el.endsWith('.d.ts') && !el.endsWith('.module.ts')
  );
  for (const k of Object.keys(scriptData)) delete scriptData[k];

  await Promise.allSettled(
    files.map((f) =>
      readFile(join(SCRIPTDIR, f))
        .then((f) => f.toString())
        .then(getInfo)
        .then((i) => (scriptData[f] = i))
        .catch(() => {})
    )
  );

  isSyncing = false;
}

let registeredShortcuts: string[] = [];
let isRegisteringShortcuts = false;
function reloadShortcuts(filename?: string) {
  if (isRegisteringShortcuts) return;
  isRegisteringShortcuts = true;

  registeredShortcuts.forEach((acc) => globalShortcut.unregister(acc));
  registeredShortcuts = [];

  for (const [f, s] of Object.entries(scriptData)) {
    if (!s.shortcut) continue;
    if (globalShortcut.isRegistered(s.shortcut))
      log(
        'error',
        'script-helper',
        '%s tries to register shortcut "%s", but it is already registered!',
        f,
        s.shortcut
      );
    else {
      globalShortcut.register(s.shortcut, () => runScript(f));
      registeredShortcuts.push(s.shortcut);
      if (!filename || f === filename)
        log(
          'info',
          'script-helper',
          'registered shortcut "%s" for %s',
          s.shortcut,
          f
        );
    }
  }

  isRegisteringShortcuts = false;
}

let registeredSchedules: (() => void)[] = [];
let isRegisteringSchedules = false;
function reloadSchedules(filename?: string) {
  if (isRegisteringSchedules) return;
  isRegisteringSchedules = true;

  registeredSchedules.forEach((stop) => stop());
  registeredSchedules = [];

  for (const [f, s] of Object.entries(scriptData)) {
    if (!s.schedule) continue;
    if (!cron.validate(s.schedule))
      log(
        'error',
        'script-scheduler',
        'Failed to register schedule %s for script %s: Schedule is invalid',
        s.schedule,
        f
      );
    else {
      const task = cron.schedule(s.schedule, () => runScript(f));
      registeredSchedules.push(() => task.stop());
      if (!filename || f === filename)
        log(
          'info',
          'script-helper',
          'registered schedule %s for %s',
          s.schedule,
          f
        );
    }
  }

  isRegisteringSchedules = false;
}

function queueMessage(name: string, ...args: any[]) {
  if (!onTimeout) {
    mainWindow?.webContents?.send(name, ...args);
    onTimeout = true;
    setTimeout(resolveQueue, 500);
  } else call.push([name, ...args]);
}

watch(colorSchemeFile, () => {
  queueMessage('color-change');
});

watch(shortcutFile, async () => {
  globalShortcut.unregister(shortcut);
  try {
    shortcut = (await readFile(shortcutFile)).toString();
    queueMessage('shortcut-change', shortcut);
    globalShortcut.register(shortcut, show);
  } catch {
    shortcut = 'Super+Q';
    globalShortcut.register(shortcut, show);
  }
  log('info', 'shortcut', 'Opening shortcut got changed to ' + shortcut);
});

watch(SCRIPTDIR, (type, filename) => {
  queueMessage('script-change');
  syncBinDir();
  syncFiles().then(() => {
    reloadShortcuts(filename);
    reloadSchedules(filename);
  });
});

// setup files
syncBinDir();
syncFiles().then(() => {
  reloadShortcuts();
  reloadSchedules();
});

export function displayError(name: string, error: string) {
  show();
  try {
    mainWindow?.webContents?.send('display-error', name, error);
  } catch {}
}
async function syncBinDir() {
  const $scripts = await readdir(SCRIPTDIR);
  const scripts = $scripts
    .filter(
      (el) =>
        el.endsWith('.ts') &&
        !el.endsWith('.d.ts') &&
        !el.endsWith('.module.ts')
    )
    .map((el) => el.substring(0, el.length - 3));
  const binaries = await readdir(binDir);

  for (const s of $scripts.filter((el) => el.endsWith('.cts'))) {
    if (!$scripts.includes(s.substring(0, s.length - 3) + 'ts'))
      rm(join(SCRIPTDIR, s));
  }

  for (const b of binaries) if (!scripts.includes(b)) rm(join(binDir, b));
  for (const s of scripts)
    if (!binaries.includes(s)) {
      writeFile(
        join(binDir, s),
        `#!/bin/bash\n\n"${join(QRunnerDirectory, 'run')}" "${s}.ts" "$@"`
      ).then(() =>
        chmod(
          join(binDir, s),
          constants.S_IXUSR |
            constants.S_IWUSR |
            constants.S_IRUSR |
            constants.S_IRGRP |
            constants.S_IWGRP |
            constants.S_IROTH
        )
      );
    }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  throw new Error('Electron does not support manifest v3');
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch((err: any) => log('error', 'exension-installer', '', err));
};

const createWindow = async () => {
  if (isDebug) {
    // await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: getAssetPath('renderer.js'),
    },
    frame: false,
    center: true,
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.setMenuBarVisibility(false);
  mainWindow.setMenu(menu);
  mainWindow.setTitle('QRunner');

  mainWindow.on('unresponsive', restart);

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  mainWindow.webContents.closeDevTools();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};

export const widgets: Record<string, BrowserWindow> = {};

export function createWidget(name: string, content: string) {
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  const window = new BrowserWindow({
    height: 1,
    width: 1,
    center: true,
    frame: false,
    titleBarStyle: 'hidden',
    roundedCorners: true,
    webPreferences: {
      preload: getAssetPath('__preload.js'),
    },
  });

  function resize(ev: any, w: number, h: number) {
    // if (window.isDestroyed) return;
    if (w < 0) w = 100;
    if (h < 0) h = 100;
    const { height, width } = screen.getPrimaryDisplay().workAreaSize;
    if (w > width) w = width;
    if (h > height) h = height;
    window.setSize(w, h);
    ipcMain.off('set-sized', resize);
  }
  ipcMain.on('set-sized', resize);

  const id = randomUUID();
  window.on('closed', () => event('close', id, []));
  window.webContents.send('set-widget-id', id);
  window.setMenu(
    Menu.buildFromTemplate([
      {
        label: 'Window',
        submenu: [
          {
            label: 'Close',
            accelerator: 'Escape',
            role: 'close',
            click(menuItem, browserWindow) {
              browserWindow?.close();
              delete widgets[id];
            },
          },
          {
            label: 'Toggle Devtools',
            accelerator: (function () {
              if (process.platform === 'darwin') return 'Alt+Command+I';
              else return 'Ctrl+Shift+I';
            })(),
            click: function (item, focusedWindow) {
              if (focusedWindow) focusedWindow.webContents.toggleDevTools();
            },
          },
        ],
      },
    ])
  );
  window.setMenuBarVisibility(false);
  window.loadURL(
    'data:text/html;base64,' + Buffer.from(content).toString('base64')
  );
  window.webContents.closeDevTools();
  window.setTitle(name);
  window.webContents.setWindowOpenHandler((data) => {
    shell.openExternal(data.url);
    return { action: 'deny' };
  });

  widgets[id] = window;
  return id;
}
export function updateWidget(id: string, content: string) {
  if (!widgets[id]) return;
  if (widgets[id].isDestroyed()) return delete widgets[id];
  widgets[id].webContents.send('set-contents', content);
  widgets[id].webContents.send('set-widget-id', id);
}
export async function createDevtools(obj?: any) {
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  const window = new BrowserWindow({
    width: 0,
    height: 0,
    webPreferences: {
      devTools: true,
      preload: getAssetPath('dev_preload.js'),
    },
  });

  window.webContents.setWindowOpenHandler((data) => {
    shell.openExternal(data.url);
    return { action: 'deny' };
  });

  window.hide();
  if (obj) window.webContents.send('print', obj);
  window.loadURL(
    'data:text/html;base64,PHNjcmlwdD5jb25zb2xlLmNsZWFyKCk7PC9zY3JpcHQ+'
  );
  window.webContents.openDevTools({ mode: 'detach' });
  window.webContents.on('devtools-closed', () => window.close());
}

export let getAssetPath = (...f: string[]) => '';

ipcMain.handle('devtools', (ev, obj) => createDevtools(obj));
ipcMain.handle('start-drag', async (ev, file: string) => {
  file = file.startsWith('~') ? join(homedir(), file.substring(1)) : file;
  console.log(file);
  mainWindow?.webContents?.startDrag({
    file,
    icon:
      process.platform !== 'linux'
        ? await nativeImage.createThumbnailFromPath(file, {
            width: 32,
            height: 32,
          })
        : nativeImage.createFromPath(getAssetPath('icon.png')).resize({
            height: 32,
            width: 32,
          }),
  });
});
ipcMain.handle('textarea-submit', (ev, value: undefined | null | string) =>
  textareaSubmit(value)
);

function restart() {
  try {
    mainWindow?.close();
  } catch {}
  try {
    mainWindow?.destroy();
  } catch {}
  try {
    createWindow();
  } catch {}
}

let tray: Tray;

/**
 * Add event listeners...
 */

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  tray = new Tray(getAssetPath('icon.png'));
  tray.setToolTip('QRunner');
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Hide Window', type: 'normal', click: hide },
    { label: 'Show Window (Super + Q)', type: 'normal', click: show },
    {
      label: 'Restart (Super + Alt + Q)',
      type: 'normal',
      click: restart,
    },
    { label: 'Exit', type: 'normal', click: () => app.quit() },
  ]);
  tray.setContextMenu(contextMenu);
  tray.on('click', show);
  app.setName('QRunner');

  globalShortcut.register('Super+Q', show);
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', (e: any) => {
  e.preventDefault();
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

const server = createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/') {
    if (req.headers['content-type'] !== 'application/json') return res.end();
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const json = JSON.parse(body);
        if (
          !json.script ||
          !json.args ||
          typeof json.script !== 'string' ||
          !(json.args instanceof Array) ||
          json.args.map((el: any) => typeof el === 'string').includes(false)
        )
          throw new Error();

        runScript(json.script, ...json.args);
        res.write('Launched script!');
        res.end();
      } catch {
        res.write('Malformed json');
        res.end();
      }
    });
  } else if (
    req.method === 'GET' &&
    req.url?.startsWith('/add-script?script=')
  ) {
    const script = new URL('http://localhost' + req.url).searchParams.get(
      'script'
    );
    if (!script) return res.end();
    if (!script.startsWith('https://gist.github.com/') && script.includes('/'))
      return res.end();
    const id = script.split(sep).pop();
    if (!id) return res.end();
    const file = await fetch(
      'https://api.github.com/gists/' + encodeURIComponent(id)
    )
      .then((res) => res.json())
      .then((json) => Object.values(json?.files || {})[0] as any);
    if (!file || !file.filename || !file.content) return res.end();
    try {
      const val = await arg(
        'Are you sure you want to import the script ' +
          file.filename.toString() +
          '?',
        [
          {
            key: 'yes',
            name: 'Yes',
            description: 'This will create a new script with the file contents',
          },
          {
            key: 'no',
            name: 'No',
            description: "This won't create the script",
          },
        ]
      );
      if (val === 'no') return res.end();
      createFromFile(file.filename, file.content);
    } catch {}

    res.end();
  } else res.end();
});

server.listen(1205);
log('info', 'server', 'Listening on http://localhost:1205');
