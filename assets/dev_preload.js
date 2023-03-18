const { ipcRenderer, contextBridge } = require('electron');

ipcRenderer.on('print', async (ev, obj) => {
    if (document.body) {
        console.log(obj);
        contextBridge.exposeInMainWorld('obj', obj);
        contextBridge.exposeInMainWorld('value', obj);
    } else {
        await new Promise((r) =>
            window.addEventListener('DOMContentLoaded', r)
        );
        console.log(obj);
        contextBridge.exposeInMainWorld('obj', obj);
        contextBridge.exposeInMainWorld('value', obj);
    }
});
