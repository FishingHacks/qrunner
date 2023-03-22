const { ipcRenderer, contextBridge } = require('electron');

const api = {
    createScript(name) {
        return ipcRenderer.invoke('create-script', name);
    },
    runScript(name) {
        return ipcRenderer.invoke('run-script', name);
    },
    getScriptDir() {
        return ipcRenderer.invoke('get-script-dir');
    },
    getScript(name) {
        return ipcRenderer.invoke('get-script', name);
    },
    getScripts() {
        return ipcRenderer.invoke('list-scripts');
    },
    forceReloadFiles() {
        return ipcRenderer.invoke('force-reload-scripts');
    },
    openGithub(name) {
        return ipcRenderer.invoke('open-github', name);
    },
    editScript(name) {
        return ipcRenderer.invoke('edit-script', name);
    },
    getColors() {
        return ipcRenderer.invoke('get-colors');
    },
    respond(string) {
        ipcRenderer.send('respond', string);
    },
    arg(name, options, hint) {
        return ipcRenderer.invoke('arg', name, options, hint);
    },
    getProcs() {
        return ipcRenderer.invoke('get-processes');
    },
    killProcess(pid) {
        return ipcRenderer.invoke('kill-proc', pid);
    },
    hideWindow() {
        return ipcRenderer.invoke('hide-window');
    },
    showWindow() {
        return ipcRenderer.invoke('show-window');
    },
    setColors(colors) {
        return ipcRenderer.invoke('change-colorscheme', JSON.stringify(colors));
    },
    getColorSchemes() {
        return ipcRenderer.invoke('get-colorschemes');
    },
    createColorScheme(name, config) {
        return ipcRenderer.invoke('create-colorscheme', name, config);
    },
    deleteColorScheme(name) {
        return ipcRenderer.invoke('delete-colorscheme', name);
    },
    createWidget(name, content) {
        return ipcRenderer.invoke('open-widget', name, content);
    },
    copy(str) {
        return ipcRenderer.invoke('copy', str);
    },
    removeScript(path) {
        return ipcRenderer.invoke('remove-script', path);
    },
    rename(path, newname) {
        return ipcRenderer.invoke('rename-script', path, newname);
    },
    openClearDevtools(val) {
        if (!val) return ipcRenderer.invoke('devtools');
        else return ipcRenderer.invoke('devtools', val);
    },
    getAPIDocs() {
        return ipcRenderer.invoke('get-api-docs');
    },
    getFont() {
        return ipcRenderer.invoke('get-font');
    },
    setFont(font) {
        return ipcRenderer.invoke('set-font', font);
    },
    getPackages() {
        return ipcRenderer.invoke('get-packages');
    },
    removePackage(name) {
        return ipcRenderer.invoke('remove-package', name);
    },
    setSelectedTab(name) {
        return ipcRenderer.invoke('set-selected-tab', name);
    },
    getTabPreview(key) {
        ipcRenderer.send('get-preview', key);
        return new Promise((res, rej) => {
            function onData(ev, data, key) {
                res({ data, key });
                ipcRenderer.off('set-preview', onData);
            }
            ipcRenderer.on('set-preview', onData);
            setTimeout(() => {
                ipcRenderer.off('set-preview', onData);
                res({ key, data: undefined });
            }, 7000);
        });
    },
    open(link) {
        return ipcRenderer.invoke('open', link);
    },
    dropFile(file) {
        return ipcRenderer.invoke('drop-file', file);
    },
    event(...args) {
        return ipcRenderer.invoke('event', ...args);
    },
    getConfig(name) {
        return ipcRenderer.invoke('get-config', name);
    },
    setConfig(name, value) {
        return ipcRenderer.invoke('set-config', name, value);
    },
    createFromFile(name, value) {
        return ipcRenderer.invoke('from-file', name, value);
    },
    installPackage(name) {
        return ipcRenderer.invoke('install-pkg', name);
    },
    startDrag(file) {
        return ipcRenderer.invoke('start-drag', file);
    },
    importFileFromComputer() {
        return ipcRenderer.invoke('import-file-from-fs');
    },
    submitTextarea(value) {
        return ipcRenderer.invoke('textarea-submit', value);
    },
    addEventListener(name, cb) {
        ipcRenderer.on(name, cb);
        return () => ipcRenderer.removeListener(name, cb);
    },
    removeEventListener(name, cb) {
        ipcRenderer.removeListener(name, cb);
    },
    emitEvent(name, ...args) {
        ipcRenderer.emit(name, ...args);
    },
};

contextBridge.exposeInMainWorld('__api', api);
contextBridge.exposeInMainWorld('ipc', ipcRenderer);
