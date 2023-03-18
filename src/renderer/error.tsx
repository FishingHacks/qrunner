import { useEffect } from 'react';
import { API } from './api';
import { DefaultViewProps } from './App';

import './light.css';

export default function ErrorElement(
    props: DefaultViewProps & { name: string; error: string }
) {
    props.config.disableBar = true;
    props.config.disableSearch = true;
    props.config.disableTabs = true;

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') API.emitEvent('err-end');
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    });

    return (
        <div className='page' style={{ height: '100vh', marginBottom: 0 }}>
            <h3>{props.name} Errored!</h3>
            <pre>
                <code
                    className='hljs light'
                    style={{
                        borderRadius: 3,
                        border: '1px solid var(--color-gray)',
                        minHeight: '50vh',
                        whiteSpace: 'break-spaces',
                    }}
                >
                    {props.error}
                </code>
            </pre>
        </div>
    );
}
