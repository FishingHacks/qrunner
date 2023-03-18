import { forwardRef, useEffect, useRef } from 'react';

function mergeRefs(...refs: ({ current: any } | ((val: any) => any)|null)[]) {
  return (node: any) => {
    for (const r of refs)
      if (typeof r === 'object' && r) r.current = node;
      else if (typeof r === 'function') r(node);
  };
}

const Tabs = forwardRef<
  HTMLDivElement,
  {
    tabs: { name: string; id: string }[];
    focused: string;
    setFocus: (focus: string) => void;
  }
>(
  (
    props: {
      tabs: { name: string; id: string }[];
      focused: string;
      setFocus: (focus: string) => void;
    },
    ref
  ) => {
    const tabsRefs = useRef<HTMLDivElement>();

    useEffect(() => {
      function onKeyDown(e: KeyboardEvent) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        if (!tabsRefs.current || tabsRefs.current.style.display === 'none')
          return;
        if (
          ((e.target as HTMLElement).nodeName === 'INPUT' ||
            (e.target as HTMLElement).nodeName === 'TEXTAREA') &&
          !(e.target as HTMLElement).classList.contains('tabs-ignore')
        )
          return;
        let i = props.tabs.findIndex((el) => el.id === props.focused);
        if (i < 0) i = 0;
        if (e.key === 'ArrowLeft')
          if (i <= 0) i = props.tabs.length - 1;
          else i--;
        else if (i >= props.tabs.length - 1) i = 0;
        else i++;

        props.setFocus(props.tabs[i]?.id || props.tabs[0]?.id || '');
        e.preventDefault();
      }
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    });

    return (
      <div
        className="tabs"
        ref={mergeRefs(ref, tabsRefs) as any}
      >
        {props.tabs.map((el) => (
          <div
            className={`tab ${el.id === props.focused && 'selected'}`}
            onClick={() => props.setFocus(el.id)}
            key={el.id}
          >
            {el.name}
          </div>
        ))}
      </div>
    );
  }
);
export default Tabs;
