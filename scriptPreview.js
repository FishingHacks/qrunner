function createUsername(name, gh, tw, yt) {
    const el = document.createElement('div');
    if (gh) {
        const a = document.createElement('a');
        a.classList.add('link');
        a.href = `https://github.com/${encodeURIComponent(gh)}`;
        a.target = '_blank';
        a.append(document.createTextNode(name));
        el.append(document.createTextNode('By '), a);
    } else if (tw) {
        const a = document.createElement('a');
        a.classList.add('link');
        a.href = `https://twitter.com/${encodeURIComponent(tw)}`;
        a.target = '_blank';
        a.append(document.createTextNode(name));
        el.append(document.createTextNode('By '), a);
    } else if (yt) {
        const a = document.createElement('a');
        a.classList.add('link');
        a.href = `https://youtube.com/${encodeURIComponent(yt)}`;
        a.target = '_blank';
        a.append(document.createTextNode(name));
        el.append(document.createTextNode('By '), a);
    } else {
        el.append(document.createTextNode('By ' + name));
    }

    return el;
}

class ScriptPreview extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        if (!this.isConnected) return;

        const style = document.createElement('style');
        style.textContent =
            '.link { color: var(--color-primary); text-decoration: none; cursor: pointer; } .link:hover { text-decoration: underline; }';

        const showcaseDiv = document.createElement('div');
        showcaseDiv.style.height = 'fit-content';
        showcaseDiv.style.width = '15vw';
        showcaseDiv.style.padding = '1.2rem';
        showcaseDiv.style.border = '1px solid #404040';
        showcaseDiv.style.borderRadius = '5px';
        showcaseDiv.style.margin = '.5rem';
        showcaseDiv.style.position = 'relative';
        showcaseDiv.style.paddingRight = '5rem';

        const showcaseTitle = document.createElement('div');
        showcaseTitle.style.fontWeight = 'bold';
        showcaseTitle.style.fontSize = '1.5rem';
        showcaseTitle.textContent =
            this.getAttribute('title') || 'no title specified';
        showcaseDiv.append(showcaseTitle);

        const showcaseSubtitle = createUsername(
            this.getAttribute('name') || 'no name specified',
            this.getAttribute('gh'),
            this.getAttribute('tw'),
            this.getAttribute('yt')
        );
        showcaseSubtitle.style.color = '#a3a3a3';
        showcaseSubtitle.style.fontStyle = 'italic';
        showcaseSubtitle.style.fontSize = '14px';
        showcaseSubtitle.style.marginBottom = '1.2rem';
        showcaseDiv.append(showcaseSubtitle);

        const showcaseDescription = document.createElement('div');
        showcaseDescription.style.fontSize = '1.15rem';
        showcaseDescription.textContent =
            this.getAttribute('description') || 'No description specified';
        showcaseDiv.append(showcaseDescription);

        const showcaseButton = document.createElement('a');
        showcaseButton.textContent = 'details >';
        showcaseButton.style.width = 'max-content';
        showcaseButton.style.textDecoration = 'none';
        showcaseButton.style.userSelect = 'none';
        showcaseButton.style.height = 'max-content';
        showcaseButton.style.backgroundColor = '#000';
        showcaseButton.style.padding = '5px';
        showcaseButton.style.position = 'absolute';
        showcaseButton.style.top = '1.2rem';
        showcaseButton.style.right = '1.5rem';
        showcaseButton.style.border = '1px solid #fff';
        showcaseButton.style.color = '#fff';
        showcaseButton.style.cursor = 'pointer';
        showcaseButton.href = this.getAttribute('link') || ''
        showcaseDiv.append(showcaseButton);
        this.shadowRoot.append(style, showcaseDiv);
    }

    static observedAttributes = [
        'name',
        'title',
        'gh',
        'tw',
        'yt',
        'description',
    ];
}

customElements.define('script-preview', ScriptPreview);
