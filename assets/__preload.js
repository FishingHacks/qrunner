const { ipcRenderer } = require('electron');
window.addEventListener('DOMContentLoaded', () =>
    ipcRenderer.send(
        'set-sized',
        document.children[0].scrollWidth,
        document.children[0].scrollHeight
    )
);