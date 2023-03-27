import moment from 'moment';
import { useEffect } from 'react';
import { API } from './api';
import { DefaultViewProps } from './App';
import { KbdList } from './kbd';
import { useAsyncState } from './utils';

let $reload = () => {};

export default function ScriptInfo(props: DefaultViewProps) {
  props.config.disableBar = true;
  props.config.disableSearch = true;

  const { state: scripts, reload } = useAsyncState(API.getScripts);
  $reload = reload;

  useEffect(() => {
    return API.addEventListener('script-change', () => $reload());
  }, [])

  return (
    <div>
      <h3 style={{ margin: '0px 1rem', marginTop: '1.25rem' }}>
        Script Shortcuts
      </h3>
      <div className="options" style={{ height: 'fit-content' }}>
        {typeof scripts === 'object' &&
          scripts
            .filter((el) => !!el.shortcut)
            .map((s) => (
              <div className="option">
                <div className="opt-name">
                  <KbdList
                    keys={
                      s.shortcut
                        ?.split('+')
                        .map((el) => el.toLowerCase())
                        .map((el) =>
                          ['CommandOrControl', 'CmdOrCtrl'].includes(el)
                            ? 'cmd/ctrl'
                            : el
                        )
                        .filter((el) => el.length > 0) || []
                    }
                  />
                </div>
                <div className="opt-description opt-highlight">
                  {s.name || s.path}
                  {s.name && ' (' + s.path + ')'}
                </div>
              </div>
            ))}
      </div>
      <h3 style={{ margin: '0px 1rem', marginTop: '1.25rem' }}>
        Scheduled Scripts
      </h3>
      <div className="options" style={{ height: 'fit-content' }}>
        {typeof scripts === 'object' &&
          scripts
            .filter((el) => !!el.schedule && el.nextRun !== undefined)
            .map((s) => (
              <div className="option">
                <div className="opt-name">
                  <span className="link">{s.schedule}</span> | Next Run:{' '}
                  {new Date(s.nextRun || 0).toLocaleString()} (
                  {moment(s.nextRun || 0).fromNow()})
                </div>
                <div className="opt-description opt-highlight">
                  {s.name || s.path}
                  {s.name && ' (' + s.path + ')'}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
