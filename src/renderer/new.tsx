import { useEffect, useState } from 'react';
import { API } from './api';
import { DefaultViewProps } from './App';
import { Kbd } from './kbd';

let $move = () => {};
let $click = () => {};

export default function New(props: DefaultViewProps) {
  props.config.disableSearch = true;
  const [selected, setSelected] = useState(0);

  $move = () => {
    setSelected((s) => 1 - s);
  };
  $click = async () => {
    if (selected === 0) {
      try {
        const name = await API.arg('Name:');
        if (!name) return;
        await API.createScript(name);
      } catch {}
    } else {
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
    }
  };

  useEffect(() => {
    function keydown(ev: KeyboardEvent) {
      if (ev.key === 'Enter') {
        $click();
        ev.preventDefault();
      }
      if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
        $move();
        ev.preventDefault();
      }
    }

    props.config.setFooter([
      <p>
        <Kbd>arrowDown</Kbd>: Move down
      </p>,
      <p>
        <Kbd>arrowUp</Kbd>: Move Up
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
        className={"option " + (selected === 0 && 'selected')}
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
        className={"option " + (selected === 1 && 'selected')}
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
    </div>
  );
}
