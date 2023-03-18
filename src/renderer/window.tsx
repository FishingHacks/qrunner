import { useEffect } from 'react';
import { API } from './api';
import { DefaultViewProps } from './App';

export default function Window(props: DefaultViewProps & { code: string }) {
    props.config.disableBar = true;
    props.config.disableSearch = true;
    props.config.disableTabs = true;

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                e.preventDefault();
                API.emitEvent('set-user-window-code', '');
                API.getProcs().then((p) =>
                    Object.keys(p).map((pid) => API.killProcess(Number(pid)))
                );
            }
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    return (
        <div
            className='page'
            dangerouslySetInnerHTML={{ __html: props.code }}
        />
    );
}
