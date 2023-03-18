import { useEffect } from 'react';
import { API, DropFile } from './api';
import { DefaultViewProps } from './App';
import { Kbd } from './kbd';

export default function Drop(props: DefaultViewProps) {
    props.config.disableBar = true;
    props.config.disableSearch = true;
    props.config.disableTabs = true;

    function returnFile(file: DropFile) {
        API.dropFile(file);
        API.emitEvent('drop-end');
    }

    useEffect(() => {
        function keyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                API.emitEvent('drop-end');
                API.dropFile(null);
                e.preventDefault();
            }
        }
        window.addEventListener('keydown', keyDown);
        return () => window.removeEventListener('keydown', keyDown);
    }, []);

    return (
        <>
            <input
                type='file'
                className='drop-file'
                onChange={(e) => {
                    if (!e.target.files || e.target.files.length < 1) return;
                    const f = e.target.files[0];
                    returnFile({
                        path: f.path,
                        type: f.type,
                    });
                }}
            />
            <div className='drop-file-text-container'>
                <h2>
                    Drop a file here or press <Kbd>escape</Kbd> to exit!
                </h2>
            </div>
        </>
    );
}
