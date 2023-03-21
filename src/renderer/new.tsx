import { useEffect, useState } from 'react';
import { API } from './api';
import { DefaultViewProps } from './App';
import { KeySymbols } from './constants';
import { Kbd } from './kbd';

let $move = (down: boolean) => {};
let $click = () => {};

export default function New(props: DefaultViewProps) {
  props.config.disableSearch = true;
  const [selected, setSelected] = useState(0);

  $move = (down: boolean) => {
    setSelected((s) => (3 + s + (down ? 1 : -1)) % 3);
  };
  $click = async () => {
    if (selected === 0) {
      try {
        const name = await API.arg('Name:');
        if (!name) return;
        await API.createScript(name);
      } catch {}
    } else if (selected === 1) {
      try {
        const url = await API.arg('Gist url or id:');
        if (!url) return;
        const id = url.split('/').pop() || '';
        if (!id) return;
        const file = await fetch('https://api.github.com/gists/' + id)
          .then((res) => res.json())
          .then((json) => Object.values(json?.files || {})[0] as any);
        if (!file) return;
        API.hideWindow();
        await API.createFromFile(
          file.filename.toString(),
          file.content.toString()
        );
      } catch {}
    } else if (selected === 2) API.importFileFromComputer();
  };

  useEffect(() => {
    function keydown(ev: KeyboardEvent) {
      if (ev.key === 'Enter') {
        $click();
        ev.preventDefault();
      }
      if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
        $move(ev.key === 'ArrowDown');
        ev.preventDefault();
      }
    }

    props.config.setFooter([
      <p>
        <Kbd children={KeySymbols.arrowUp} />: Move down
      </p>,
      <p>
        <Kbd>{KeySymbols.arrowDown}</Kbd>: Move Up
      </p>,
      <p>
        <Kbd>enter</Kbd>: Execute action
      </p>,
    ]);
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, []);

  return (
    <div className="options">
      <div
        className={'option ' + (selected === 0 && 'selected')}
        onMouseOver={() => setSelected(0)}
        onClick={async () => {
          try {
            const name = await API.arg('Name:');
            if (!name) return;
            await API.createScript(name);
          } catch {}
        }}
      >
        <div className="opt-name">By Name</div>
        <div className="opt-description opt-highlight">
          Create a new Script from a name
        </div>
      </div>
      <div
        className={'option ' + (selected === 1 && 'selected')}
        onMouseOver={() => setSelected(1)}
        onClick={async () => {
          try {
            const url = await API.arg('Gist url or id:');
            if (!url) return;
            const id = url.split('/').pop() || '';
            if (!id) return;
            const file = await fetch('https://api.github.com/gists/' + id)
              .then((res) => res.json())
              .then((json) => Object.values(json?.files || {})[0] as any);
            if (!file) return;
            API.hideWindow();
            await API.createFromFile(
              file.filename.toString(),
              file.content.toString()
            );
          } catch {}
        }}
      >
        <div className="opt-name">By Github Gist</div>
        <div className="opt-description opt-highlight">
          Create a new Script from a github gist
        </div>
      </div>
      <div
        className={'option ' + (selected === 2 && 'selected')}
        onMouseOver={() => setSelected(2)}
        onClick={API.importFileFromComputer}
      >
        <div className="opt-name">Import script</div>
        <div className="opt-description opt-highlight">
          Import a script that is somewhere on your Computer
        </div>
      </div>
    </div>
  );
}
