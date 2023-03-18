import { useEffect, useRef, useState } from 'react';
import { API, ArgOption } from './api';
import { DefaultViewProps } from './App';
import ScrollArea from './scrollarea';

let $setDetails = (k: string | undefined) => {};
let $currentKey: string | undefined;

export default function Question(
  props: DefaultViewProps & { name: string; options?: (string | ArgOption)[] }
) {
  const options = props.options || [];
  props.config.disableBar = true;
  props.config.disableTabs = true;
  props.config.disableSearch = false;
  props.config.searchName = props.name;
  const filteredOptions = options.filter(
    (el) =>
      (typeof el === 'string' ? el : el.name)
        .toLowerCase()
        .includes(props.config.searchLowerCase) ||
      (typeof el === 'string'
        ? false
        : el.description?.toLowerCase().includes(props.config.searchLowerCase))
  );
  const [selected, setSelected] = useState(0);
  const selectedRef = useRef<HTMLDivElement>(null);
  const [details, setDetails] = useState<string | undefined>();
  $setDetails = setDetails;
  const opt = filteredOptions[selected];
  $currentKey = opt ? (typeof opt === 'string' ? opt : opt.key) : '';

  if (selected < 0) setSelected(0);
  if (selected >= filteredOptions.length && filteredOptions.length > 0)
    setSelected(filteredOptions.length - 1);

  useEffect(() => {
    function onClick(e: KeyboardEvent) {
      let newSelected = selected;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (selected === 0) newSelected = filteredOptions.length - 1;
        else newSelected = selected - 1;
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (selected < filteredOptions.length - 1) newSelected = selected + 1;
        else newSelected = 0;
      }
      if (newSelected !== selected && selectedRef.current) {
        selectedRef.current.parentElement?.children[newSelected]?.scrollIntoView(
          {
            behavior: 'smooth',
            block: 'center',
          }
        );
        setSelected(newSelected);
        setDetails(undefined);
      }
      if (e.key === 'Enter' && (options.length < 1 || opt)) {
        setTimeout(() => {
          e.preventDefault();
          API.respond(
            options.length < 1
              ? props.config.search
              : typeof opt === 'string'
              ? opt
              : opt.key
          );
          props.config.setSearch('');
          API.emitEvent('arg-end');
        }, 100);
      }
      if (e.key === 'Escape') {
        setTimeout(() => {
          e.preventDefault();
          props.config.setSearch('');
          API.respond(null);
          API.emitEvent('arg-end');
        }, 100);
      }
    }
    window.addEventListener('keydown', onClick);
    return () => window.removeEventListener('keydown', onClick);
  });

  useEffect(() => {
    if (!opt) return;
    API.getTabPreview(typeof opt === 'string' ? opt : opt.key).then((val) =>
      $currentKey === val.key ? $setDetails(val.data) : null
    );
  }, [opt && (typeof opt === 'string' ? opt : opt.key)]);

  return (
    <>
      <div className={'options ' + (details && 'withDetails')}>
        <ScrollArea>
          {filteredOptions.slice(0, 100).map((el, i) => {
            return (
              <div
                ref={selected === i ? selectedRef : undefined}
                key={typeof el === 'string' ? el : el.key}
                className={`option ${selected === i && 'selected'}`}
                onMouseOver={() => (selected === i ? null : setSelected(i))}
                style={{
                  display: 'flex',
                  flexWrap: 'nowrap',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: 20,
                }}
                onClick={() => {
                  API.respond(typeof el === 'string' ? el : el.key);
                  props.config.setSearch('');
                  API.emitEvent('arg-end');
                }}
              >
                {typeof el === 'object' && el.background && (
                  <div
                    style={{
                      width: '2.5rem',
                      height: '1.75rem',
                      borderRadius: 3,
                      backgroundColor: el.background,
                      border: '1px var(--color-text) solid',
                    }}
                  />
                )}
                {typeof el === 'object' && el.image && (
                  <div
                    style={{
                      width: '2.5rem',
                      height: '1.75rem',
                      borderRadius: 3,
                      backgroundImage: 'url(' + el.image + ')',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: 'contain',
                    }}
                  />
                )}
                <div>
                  <div
                    className={`opt-name ${
                      typeof el !== 'object' || !el.description
                        ? 'opt-highlight '
                        : ''
                    }`}
                  >
                    {typeof el === 'object' ? el.name : el}
                  </div>
                  {typeof el === 'object' && el.description && (
                    <div className="opt-description opt-highlight">
                      {el.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </ScrollArea>
      </div>
      {details && (
        <div className="details option-details">
          <ScrollArea>
            <div dangerouslySetInnerHTML={{ __html: details }}></div>
          </ScrollArea>
        </div>
      )}
    </>
  );
}
