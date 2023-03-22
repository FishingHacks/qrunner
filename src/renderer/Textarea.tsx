import { useEffect, useState } from 'react';
import { API } from './api';
import { DefaultViewProps } from './App';
import { KbdList } from './kbd';

let $value: string = '';

export default function Textarea(props: DefaultViewProps & { name: string }) {
  props.config.disableSearch = true;
  props.config.disableBar = false;
  props.config.disableTabs = true;
  const [value, setValue] = useState('');
  $value = value;

  useEffect(() => {
    props.config.setFooter([
      <p>
        <KbdList keys={['ctrl/cmd', 's']} />: Submit
      </p>,
      <p>
        <KbdList keys={['escape']} />: Cancel
      </p>,
    ]);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        API.submitTextarea(null);
        API.emitEvent('textarea-end');
      } else if (e.key === 's' && e.ctrlKey) {
        e.preventDefault();
        API.submitTextarea($value);
        API.emitEvent('textarea-end');
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <textarea
      style={{
        width: 'calc(100vw - 12px)',
        height: 'calc(var(--page-height) - 10px)',
        padding: 5,
        border: '0px solid var(--color-primary)',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-text)',
        resize: 'none',
        outline: 'none',
      }}
      placeholder={props.name}
      onChange={(e) => setValue(e.target.value)}
      autoFocus
    ></textarea>
  );
}
