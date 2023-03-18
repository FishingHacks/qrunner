/* eslint global-require: off, no-console: off, promise/always-return: off */

import path from 'path';
import log from 'electron-log';
import { resolveHtmlPath } from './util';

import { spawn, spawnSync } from 'child_process';
import {
  app,
  BrowserWindow,
  clipboard,
  globalShortcut,
  ipcMain,
  Menu,
  shell,
  Tray,
} from 'electron';
import { constants, existsSync, mkdirSync, watch, writeFileSync } from 'fs';
import { access, chmod, readdir, readFile, rm, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import { ArgOption, DropFile } from '../renderer/api';

// RESOUCES
import globalsDTS from './resources/globals.d.ts';
import globalsJS from './resources/globals.js';
import { colorsDefault } from '../renderer/constants';
import menu from './menu';
import tsconfig from './resources/tsconfig.json';
import {
  changeColorscheme,
  createColorscheme,
  createScript,
  deleteColorscheme,
  dropFile,
  getArgPreview,
  getColorschemes,
  getInstalledPackages,
  getProcs,
  getScript,
  kill,
  listScripts,
  removeScript,
  renameScript,
  runScript,
  setSelectedTab,
  uninstallPackage,
} from './ipc';
import installRequiredPackages from './installTypescript';
import { randomUUID } from 'crypto';

function ensureDir(path: string) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}
function ensureFile(path: string, contents: string) {
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
const PATCHED_TSX_PATH = ''; // note: put your own path here.

export const runner = (() => {
  // if (!spawnSync('tsx', ['-v']).error) return 'tsx'; // error: TSX doesn't work with IPC connections, see https://github.com/esbuild-kit/tsx/issues/201
  if (!spawnSync('ts-node', ['-v']).error) return 'ts-node';
  if (!spawnSync(PATCHED_TSX_PATH, ['-v']).error && PATCHED_TSX_PATH)
    return PATCHED_TSX_PATH;
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
export const ifcFile = join(QRunnerDirectory, '.ifc');
export const binDir = join(QRunnerDirectory, 'bin');
export const fontFile = join(QRunnerDirectory, 'font');

ensureFile(colorSchemeFile, JSON.stringify(colorsDefault));
ensureDir(SCRIPTDIR);
ensureDir(colorSchemeDir);
ensureFile(join(SCRIPTDIR, 'globals.d.ts'), globalsDTS);
ensureFile(join(SCRIPTDIR, 'globals.js'), globalsJS);
ensureFile(join(SCRIPTDIR, 'tsconfig.json'), tsconfig);
ensureFile(envFile, '{}');
ensureFile(fontFile, 'ubuntu');
ensureDir(logDir);
installRequiredPackages(SCRIPTDIR, [
  'typescript',
  'highlight.js',
  'marked',
  '@types/node',
]);
ensureFile(ifcFile, '');
ensureDir(binDir);

export function getMainWindow() {
  return mainWindow;
}

ipcMain.handle('create-script', async (ev, name: string) => createScript(name));
ipcMain.handle('run-script', (ev, name: string) => runScript(name));
ipcMain.on('get-preview', (ev, key: string) => getArgPreview(key));
ipcMain.handle('kill-script', (ev, pid: number) => kill(pid));
ipcMain.handle('get-script-dir', () => SCRIPTDIR);
ipcMain.handle('get-script', async (ev, name: string) => getScript(name));
ipcMain.handle('open-script-directory', () => shell.openPath(SCRIPTDIR));
export let uiChangeCb: (() => void)[] = [];
export async function arg(name: string, options?: (string | ArgOption)[]) {
  show();
  for (const cb of uiChangeCb)
    try {
      cb();
    } catch {}
  uiChangeCb = [];

  mainWindow?.webContents?.send('arg-open', name, options);

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
export function show() {
  if (!mainWindow) createWindow();

  try {
    mainWindow?.show();
  } catch {
    createWindow();
    mainWindow?.show();
  }
}
ipcMain.handle('arg', (ev, name: string, options?: (string | ArgOption)[]) => {
  return arg(name, options);
});
ipcMain.handle('get-processes', getProcs);
ipcMain.handle('kill-proc', (ev, pid: number) => kill(pid));
ipcMain.handle('hide-window', hide);
ipcMain.handle('show-window', show);
ipcMain.handle('change-colorscheme', (ev, config: any) =>
  changeColorscheme(config)
);
ipcMain.handle('get-packages', getInstalledPackages);
ipcMain.handle('remove-package', (ev, name: string) => uninstallPackage(name));
ipcMain.handle('get-colorschemes', getColorschemes);
ipcMain.handle('create-colorscheme', (ev, name: string, config: any) =>
  createColorscheme(name, config)
);
ipcMain.handle('delete-colorscheme', (ev, name: string) =>
  deleteColorscheme(name)
);

ipcMain.handle('list-scripts', () => listScripts(false));
ipcMain.handle('force-reload-scripts', () => listScripts(true));
ipcMain.handle('open-github', (ev, name: string) =>
  shell.openExternal('https://github.com/' + name)
);
ipcMain.handle('edit-script', async (ev, name: string) => {
  access(join(SCRIPTDIR, name), constants.R_OK);
  spawn('code', [join(SCRIPTDIR, name)]);
});
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

let onTimeout = false;
let call: [string, ...any[]][] = [];
function resolveQueue() {
  if (mainWindow?.isDestroyed) {
    call = [];
    return;
  }
  if (call.length < 1) onTimeout = false;
  else setTimeout(resolveQueue, 500);
  try {
    for (const c of call) mainWindow?.webContents?.send(...c);
    call = [];
  } catch {}
}

function queueMessage(name: string, ...args: any[]) {
  if (mainWindow?.isDestroyed) return;
  if (!onTimeout) {
    mainWindow?.webContents?.send(name, ...args);
    onTimeout = true;
    setTimeout(resolveQueue, 500);
  } else call.push([name, ...args]);
}

watch(colorSchemeFile, () => {
  queueMessage('color-change');
});

watch(SCRIPTDIR, () => {
  queueMessage('script-change');
  syncBinDir();
});

export function displayError(name: string, error: string) {
  show();
  try {
    mainWindow?.webContents?.send('display-error', name, error);
  } catch {}
}

(async function () {
  ensureFile(ifcFile, '');
  const prog = (await readFile(ifcFile)).toString().split('\n')[0].trim();
  if (!prog || prog.length < 1) return;
  runScript(prog);
});
watch(ifcFile, async () => {
  ensureFile(ifcFile, '');
  const prog = (await readFile(ifcFile)).toString().split('\n')[0].trim();
  if (!prog || prog.length < 1) return;
  runScript(prog);
});

async function syncBinDir() {
  ensureDir(SCRIPTDIR);
  ensureDir(binDir);
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
        '#!/bin/sh\n\necho "' + s + '.ts" > ~/.qrunner/.ifc\n'
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
syncBinDir();

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
    .catch(console.log);
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

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

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
    window.setSize(w, h);
    ipcMain.off('set-sized', resize);
  }
  ipcMain.on('set-sized', resize);

  const id = randomUUID();
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
  widgets[id].loadURL(
    'data:text/html;base64,' + Buffer.from(content).toString('base64')
  );
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

ipcMain.handle('devtools', (ev, obj) => createDevtools(obj));

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

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

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
  globalShortcut.register('Super+Alt+Q', restart);
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
