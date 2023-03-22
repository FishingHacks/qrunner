import { useEffect } from 'react';
import { API } from './api';
import { DefaultViewProps } from './App';

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

export default function Window(props: DefaultViewProps & { code: string }) {
  props.config.disableBar = true;
  props.config.disableSearch = true;
  props.config.disableTabs = true;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        API.emitEvent('set-user-window-code', '');
        API.event('close', undefined);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const cbs = events.map((e) => {
      const fn = (...args: any[]) => API.event(e, undefined, ...args);
      window.addEventListener(e, fn, { passive: true });
      return () => window.removeEventListener(e, fn);
    });
    return () => cbs.forEach((el) => el());
  }, []);

  return (
    <div className="page" dangerouslySetInnerHTML={{ __html: props.code }} />
  );
}
