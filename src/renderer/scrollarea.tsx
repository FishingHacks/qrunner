export default function ScrollArea({ children }: React.PropsWithChildren<{}>) {
    return (
        <div
            dir='ltr'
            className='ScrollAreaRoot'
            style={{ position: 'relative' }}
        >
            <style>
                {
                    '[data-radix-scroll-area-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-scroll-area-viewport]::-webkit-scrollbar{display:none}'
                }
            </style>
            <div
                data-radix-scroll-area-viewport=''
                style={{ overflow: 'hidden scroll' }}
            >
                <div style={{ minWidth: '100%' }}>{children}</div>
            </div>
        </div>
    );
}
