const events = [
  'search',
  'appinstalled',
  'beforeinstallprompt',
  'beforexrselect',
  'abort',
  'blur',
  'cancel',
  'canplay',
  'canplaythrough',
  'change',
  'click',
  'close',
  'contextlost',
  'contextmenu',
  'contextrestored',
  'cuechange',
  'dblclick',
  'drag',
  'dragend',
  'dragenter',
  'dragleave',
  'dragover',
  'dragstart',
  'drop',
  'durationchange',
  'emptied',
  'ended',
  'error',
  'focus',
  'formdata',
  'input',
  'invalid',
  'keydown',
  'keypress',
  'keyup',
  'load',
  'loadeddata',
  'loadedmetadata',
  'loadstart',
  'mousedown',
  'mouseenter',
  'mouseleave',
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseup',
  'mousewheel',
  'pause',
  'play',
  'playing',
  'progress',
  'ratechange',
  'reset',
  'resize',
  'scroll',
  'securitypolicyviolation',
  'seeked',
  'seeking',
  'select',
  'slotchange',
  'stalled',
  'submit',
  'suspend',
  'timeupdate',
  'toggle',
  'volumechange',
  'waiting',
  'webkitanimationend',
  'webkitanimationiteration',
  'webkitanimationstart',
  'webkittransitionend',
  'wheel',
  'auxclick',
  'gotpointercapture',
  'lostpointercapture',
  'pointerdown',
  'pointermove',
  'pointerup',
  'pointercancel',
  'pointerover',
  'pointerout',
  'pointerenter',
  'pointerleave',
  'selectstart',
  'selectionchange',
  'animationend',
  'animationiteration',
  'animationstart',
  'transitionrun',
  'transitionstart',
  'transitionend',
  'transitioncancel',
  'afterprint',
  'beforeprint',
  'beforeunload',
  'hashchange',
  'languagechange',
  'message',
  'messageerror',
  'offline',
  'online',
  'pagehide',
  'pageshow',
  'popstate',
  'rejectionhandled',
  'storage',
  'unhandledrejection',
  'unload',
  'devicemotion',
  'deviceorientation',
  'deviceorientationabsolute',
  'beforematch',
  'pointerrawupdate',
];
function noop() {}
const { ipcRenderer, contextBridge } = require('electron');
window.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.send(
    'set-sized',
    document.children[0].scrollWidth,
    document.children[0].scrollHeight
  );

  for (const ev of events)
    window.addEventListener(
      ev,
      (...args) => {
        if (
          ev instanceof ErrorEvent &&
          (ev.message.includes('An object could not be cloned.') ||
            (ev.error?.stack && ev.error.stack.toString().includes('invoke')))
        )
          return;
        ipcRenderer
          .invoke(
            'event',
            ev,
            $widgetId,
            ...args.map((el) =>
              typeof el === 'object' && el ? transformEvent(el) : el
            )
          )
          .then(noop, console.error);
      },
      { passive: true }
    );
});
ipcRenderer.on('set-contents', (ev, contents) => {
  document.children[0].innerHTML = contents;
});

let $widgetId = '';
ipcRenderer.on('set-widget-id', (ev, widgetId) => ($widgetId = widgetId));

function transformEvent(event) {
  const value = { ...event };
  if (event.target && event.target.id) value.id = event.target.id;
  if (event.target && event.target.classList) {
    value.classes = [];
    for (let i = 0; i < event.target.classList.length; i++)
      value.classes[i] = event.target.classList[i];
  }
  if (event.target && event.target.tagName)
    value.tag = event.target.tagName.toLowerCase();
  if (event.target && event.target.attributes) {
    const attributesArr = [...event.target.attributes];
    value.attributes = {};
    for (const attr of attributesArr)
      value.attributes[attr.nodeName] = attr.nodeValue;
  }
  return value;
}

function emitEvent(name, details) {
  const ev = typeof details === 'object' ? transformEvent(details) : details;
  ipcRenderer.invoke('event', name, $widgetId, details);
}
contextBridge.exposeInMainWorld('emitEvent', emitEvent);
