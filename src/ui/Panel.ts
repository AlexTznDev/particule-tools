const TRANSLATIONS = {
    fr: {
        shapes: 'Formes',
        emptyMsg: 'Aucune forme chargée. Glissez un SVG ci-dessous.',
        dropText: 'Glisser un SVG ici',
        dropHint: 'ou cliquer pour parcourir',
        palette: 'Palette',
        paletteCustom: 'Personnalisé',
        animation: 'Animation',
        pause: 'Pause',
        play: 'Lecture',
        next: 'Suivant',
        delay: 'Délai',
        background: 'Fond',
        recording: 'Enregistrement en cours...',
        exportVideo: 'Exporter en vidéo',
        exporting: 'Export en cours...',
        dragOverlay: 'Déposer les fichiers SVG ici',
        deleteShape: 'Supprimer cette forme',
        color1: 'Couleur 1',
        color2: 'Couleur 2',
        particlesSection: 'Particules',
        explosionSection: 'Explosion',
        movement: 'Mouvement',
        noiseSpeed: 'Vitesse bruit',
        size: 'Taille',
        force: 'Force',
        duration: 'Durée',
        reconstruction: 'Reconstruction',
        mode: 'Mode',
    },
    en: {
        shapes: 'Shapes',
        emptyMsg: 'No shapes loaded. Drop an SVG below.',
        dropText: 'Drop an SVG here',
        dropHint: 'or click to browse',
        palette: 'Palette',
        paletteCustom: 'Custom',
        animation: 'Animation',
        pause: 'Pause',
        play: 'Play',
        next: 'Next',
        delay: 'Delay',
        background: 'Background',
        recording: 'Recording...',
        exportVideo: 'Export video',
        exporting: 'Exporting...',
        dragOverlay: 'Drop SVG files here',
        deleteShape: 'Delete shape',
        color1: 'Color 1',
        color2: 'Color 2',
        particlesSection: 'Particles',
        explosionSection: 'Explosion',
        movement: 'Movement',
        noiseSpeed: 'Noise speed',
        size: 'Size',
        force: 'Force',
        duration: 'Duration',
        reconstruction: 'Reconstruction',
        mode: 'Mode',
    },
} as const;

type TranslationKey = keyof typeof TRANSLATIONS['fr'];

export interface ShapeEntry {
    name: string;
    svgString: string;
    positions: number[];
    color1: string;
    color2: string;
}

export interface PanelCallbacks {
    onFilesDropped: (files: { name: string; content: string }[]) => void;
    onShapeRemoved: (index: number) => void;
    onShapeReordered: (fromIndex: number, toIndex: number) => void;
    onShapeColorChanged: (index: number, color1: string, color2: string) => void;
    onAutoLoopToggle: (active: boolean) => void;
    onDelayChange: (delay: number) => void;
    onMorphNext: () => void;
    onPaletteApply: (paletteName: string, colors: [string, string][]) => void;
    onBackgroundChange: (color1: string, color2: string) => void;
    onExportVideo: () => void;
    on3DModeToggle: (is3D: boolean) => void;
}

export const PALETTE_PRESETS: Record<string, [string, string][]> = {
    'Anagram': [
        ['#000000', '#444444'],
        ['#222222', '#555555'],
        ['#444444', '#777777'],
        ['#666666', '#999999'],
        ['#888888', '#bbbbbb'],
        ['#aaaaaa', '#d5d5d5'],
        ['#000000', '#777777'],
        ['#444444', '#d5d5d5'],
    ],
    'Coucher de soleil': [
        ['#F3C38F', '#F1A554'],
        ['#F1A554', '#C07026'],
        ['#C07026', '#8C5C44'],
        ['#8C5C44', '#411C25'],
        ['#F3C38F', '#C07026'],
        ['#F1A554', '#8C5C44'],
        ['#C07026', '#411C25'],
        ['#F3C38F', '#411C25'],
    ],
    'Ocean': [
        ['#90E0EF', '#48CAE4'],
        ['#48CAE4', '#0096C7'],
        ['#0096C7', '#0077B6'],
        ['#0077B6', '#023E8A'],
        ['#90E0EF', '#0096C7'],
        ['#48CAE4', '#0077B6'],
        ['#0096C7', '#023E8A'],
        ['#90E0EF', '#023E8A'],
    ],
    'Foret': [
        ['#B7E4C7', '#95D5B2'],
        ['#95D5B2', '#52B788'],
        ['#52B788', '#40916C'],
        ['#40916C', '#2D6A4F'],
        ['#B7E4C7', '#52B788'],
        ['#95D5B2', '#40916C'],
        ['#52B788', '#2D6A4F'],
        ['#B7E4C7', '#2D6A4F'],
    ],
    'Baies': [
        ['#F0DBFF', '#E0AAFF'],
        ['#E0AAFF', '#C77DFF'],
        ['#C77DFF', '#9D4EDD'],
        ['#9D4EDD', '#7B2CBF'],
        ['#F0DBFF', '#C77DFF'],
        ['#E0AAFF', '#9D4EDD'],
        ['#C77DFF', '#7B2CBF'],
        ['#F0DBFF', '#7B2CBF'],
    ],
    'Feu': [
        ['#FFE66D', '#FF6B6B'],
        ['#FF6B6B', '#EE4B2B'],
        ['#EE4B2B', '#C21E56'],
        ['#C21E56', '#6B0504'],
        ['#FFE66D', '#EE4B2B'],
        ['#FF6B6B', '#C21E56'],
        ['#EE4B2B', '#6B0504'],
        ['#FFE66D', '#6B0504'],
    ],
    'Monochrome': [
        ['#DEE2E6', '#ADB5BD'],
        ['#ADB5BD', '#6C757D'],
        ['#6C757D', '#495057'],
        ['#495057', '#343A40'],
        ['#DEE2E6', '#6C757D'],
        ['#ADB5BD', '#495057'],
        ['#6C757D', '#343A40'],
        ['#DEE2E6', '#343A40'],
    ],
};

const UPLOAD_ICON = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
</svg>`;

export class Panel {
    private el: HTMLElement;
    private shapeListEl!: HTMLElement;
    private emptyMsg!: HTMLElement;
    private dropZoneEl!: HTMLElement;
    private fileInput!: HTMLInputElement;
    private dragOverlay!: HTMLElement;
    private playPauseBtn!: HTMLButtonElement;
    private delaySlider!: HTMLInputElement;
    private delayValueEl!: HTMLSpanElement;
    private paletteSelect!: HTMLSelectElement;
    private physicsContainer!: HTMLElement;
    private is3D = false;

    private callbacks: PanelCallbacks;
    private dragCounter = 0;
    private autoLoop = true;
    private reorderDragIndex = -1;
    private exportBtn!: HTMLButtonElement;
    private exportIndicator!: HTMLElement;
    private isExporting = false;

    private lang: keyof typeof TRANSLATIONS = 'fr';
    private langFrBtn!: HTMLButtonElement;
    private langEnBtn!: HTMLButtonElement;
    private shapesTitle!: HTMLElement;
    private dropTextEl!: HTMLElement;
    private dropHintEl!: HTMLElement;
    private paletteLabel!: HTMLElement;
    private paletteCustomOpt!: HTMLOptionElement;
    private animationTitle!: HTMLElement;
    private nextBtn!: HTMLButtonElement;
    private delayLabelEl!: HTMLElement;
    private bgLabelEl!: HTMLElement;
    private dragOverlayTextEl!: HTMLElement;
    private lastPhysicsArgs?: {
        params: Parameters<Panel['buildPhysicsControls']>[0];
        onChange: Parameters<Panel['buildPhysicsControls']>[1];
    };

    private boundDragEnter: (e: DragEvent) => void;
    private boundDragLeave: (e: DragEvent) => void;
    private boundDragOver: (e: DragEvent) => void;
    private boundDrop: (e: DragEvent) => void;

    constructor(callbacks: PanelCallbacks) {
        this.callbacks = callbacks;

        this.boundDragEnter = this.#onWindowDragEnter.bind(this);
        this.boundDragLeave = this.#onWindowDragLeave.bind(this);
        this.boundDragOver = this.#onWindowDragOver.bind(this);
        this.boundDrop = this.#onWindowDrop.bind(this);

        this.el = this.#build();
        this.dragOverlay = this.#buildDragOverlay();

        document.body.prepend(this.el);
        document.body.appendChild(this.dragOverlay);

        this.#setupWindowDrag();
    }

    /* ─── Public API ─── */

    setShapes(shapes: ShapeEntry[]) {
        this.shapeListEl.innerHTML = '';

        if (shapes.length === 0) {
            this.emptyMsg.style.display = 'block';
        } else {
            this.emptyMsg.style.display = 'none';
            shapes.forEach((shape, i) => {
                this.shapeListEl.appendChild(this.#createShapeCard(shape, i));
            });
        }
    }

    setActiveIndex(index: number) {
        const cards = this.shapeListEl.querySelectorAll('.shape-card');
        cards.forEach((card, i) => {
            card.classList.toggle('active', i === index);
        });
    }

    setAutoLoop(active: boolean, delay: number) {
        this.autoLoop = active;
        this.playPauseBtn.textContent = this.#t(active ? 'pause' : 'play');
        this.playPauseBtn.classList.toggle('playing', active);
        this.delaySlider.value = String(delay);
        this.delayValueEl.textContent = `${delay} ms`;
    }

    setActivePalette(name: string) {
        this.paletteSelect.value = name;
    }

    buildPhysicsControls(
        params: {
            wigglePower: number; wiggleSpeed: number; baseParticleScale: number;
            burstStrength: number; explosionDuration: number; reconstructionSpeed: number;
        },
        onChange: (key: string, value: number) => void,
    ) {
        this.lastPhysicsArgs = { params, onChange };
        this.physicsContainer.innerHTML = '';

        const groups = [
            {
                title: this.#t('particlesSection'),
                items: [
                    { key: 'wigglePower',       label: this.#t('movement'),      min: 0,    max: 0.7,  step: 0.01  },
                    { key: 'wiggleSpeed',        label: this.#t('noiseSpeed'),    min: 0,    max: 3,    step: 0.01  },
                    { key: 'baseParticleScale',  label: this.#t('size'),          min: 0.1,  max: 3,    step: 0.01  },
                ],
            },
            {
                title: this.#t('explosionSection'),
                items: [
                    { key: 'burstStrength',       label: this.#t('force'),          min: 0.01, max: 0.5,   step: 0.01  },
                    { key: 'explosionDuration',   label: this.#t('duration'),       min: 0.95, max: 0.999, step: 0.001 },
                    { key: 'reconstructionSpeed', label: this.#t('reconstruction'), min: 0.01, max: 0.2,   step: 0.005 },
                ],
            },
        ];

        for (const group of groups) {
            const section = document.createElement('section');
            section.className = 'panel-section';

            const title = document.createElement('h2');
            title.className = 'section-title';
            title.textContent = group.title;
            section.appendChild(title);

            for (const item of group.items) {
                section.appendChild(
                    this.#buildParamSlider(
                        item.label,
                        (params as any)[item.key],
                        item.min, item.max, item.step,
                        (v) => onChange(item.key, v),
                    ),
                );
            }

            this.physicsContainer.appendChild(section);
        }
    }

    clearPhysicsControls() {
        this.physicsContainer.innerHTML = '';
    }

    destroy() {
        window.removeEventListener('dragenter', this.boundDragEnter);
        window.removeEventListener('dragleave', this.boundDragLeave);
        window.removeEventListener('dragover', this.boundDragOver);
        window.removeEventListener('drop', this.boundDrop);
        this.el.remove();
        this.dragOverlay.remove();
    }

    /* ─── i18n ─── */

    #t(key: TranslationKey): string {
        return TRANSLATIONS[this.lang][key];
    }

    #applyLang() {
        this.langFrBtn.classList.toggle('active', this.lang === 'fr');
        this.langEnBtn.classList.toggle('active', this.lang === 'en');

        this.shapesTitle.textContent = this.#t('shapes');
        this.emptyMsg.textContent = this.#t('emptyMsg');
        this.dropTextEl.textContent = this.#t('dropText');
        this.dropHintEl.textContent = this.#t('dropHint');
        this.paletteLabel.textContent = this.#t('palette');
        this.paletteCustomOpt.textContent = this.#t('paletteCustom');
        this.animationTitle.textContent = this.#t('animation');
        this.playPauseBtn.textContent = this.#t(this.autoLoop ? 'pause' : 'play');
        this.nextBtn.textContent = this.#t('next');
        this.delayLabelEl.textContent = this.#t('delay');
        this.bgLabelEl.textContent = this.#t('background');
        this.exportIndicator.textContent = this.#t('recording');
        this.exportBtn.textContent = this.isExporting ? this.#t('exporting') : this.#t('exportVideo');
        this.dragOverlayTextEl.textContent = this.#t('dragOverlay');

        if (this.lastPhysicsArgs) {
            this.buildPhysicsControls(this.lastPhysicsArgs.params, this.lastPhysicsArgs.onChange);
        }
    }

    /* ─── Build DOM ─── */

    #build(): HTMLElement {
        const panel = document.createElement('aside');
        panel.className = 'panel';

        panel.appendChild(this.#buildHeader());

        const scroll = document.createElement('div');
        scroll.className = 'panel-scroll';
        scroll.appendChild(this.#buildShapesSection());
        scroll.appendChild(this.#buildAnimationSection());

        this.physicsContainer = document.createElement('div');
        scroll.appendChild(this.physicsContainer);

        panel.appendChild(scroll);
        return panel;
    }

    #buildHeader(): HTMLElement {
        const header = document.createElement('div');
        header.className = 'panel-header';

        const h1 = document.createElement('h1');
        h1.textContent = 'Particle Morphing';

        const sub = document.createElement('p');
        sub.className = 'panel-subtitle';
        sub.textContent = 'WebGPU SVG Tool';

        const langSwitcher = document.createElement('div');
        langSwitcher.className = 'lang-switcher';

        this.langFrBtn = document.createElement('button');
        this.langFrBtn.textContent = 'FR';
        this.langFrBtn.className = 'lang-btn active';
        this.langFrBtn.addEventListener('click', () => {
            this.lang = 'fr';
            this.#applyLang();
        });

        const sep = document.createElement('span');
        sep.className = 'lang-sep';
        sep.textContent = '|';

        this.langEnBtn = document.createElement('button');
        this.langEnBtn.textContent = 'EN';
        this.langEnBtn.className = 'lang-btn';
        this.langEnBtn.addEventListener('click', () => {
            this.lang = 'en';
            this.#applyLang();
        });

        langSwitcher.append(this.langFrBtn, sep, this.langEnBtn);
        header.append(h1, sub, langSwitcher);
        return header;
    }

    #buildShapesSection(): HTMLElement {
        const section = document.createElement('section');
        section.className = 'panel-section';

        this.shapesTitle = document.createElement('h2');
        this.shapesTitle.className = 'section-title';
        this.shapesTitle.textContent = this.#t('shapes');
        section.appendChild(this.shapesTitle);
        // section.appendChild(this.#buildModeToggle()); // TODO: 3D mode hidden until optimized

        this.shapeListEl = document.createElement('div');
        this.shapeListEl.className = 'shape-list';
        section.appendChild(this.shapeListEl);

        this.emptyMsg = document.createElement('p');
        this.emptyMsg.className = 'empty-message';
        this.emptyMsg.textContent = this.#t('emptyMsg');
        this.emptyMsg.style.display = 'none';
        section.appendChild(this.emptyMsg);

        section.appendChild(this.#buildDropZone());
        section.appendChild(this.#buildPaletteRow());

        return section;
    }

    #buildDropZone(): HTMLElement {
        this.dropZoneEl = document.createElement('div');
        this.dropZoneEl.className = 'drop-zone';

        const content = document.createElement('div');
        content.className = 'drop-zone-content';

        const icon = document.createElement('div');
        icon.className = 'drop-zone-icon';
        icon.innerHTML = UPLOAD_ICON;

        this.dropTextEl = document.createElement('span');
        this.dropTextEl.className = 'drop-zone-text';
        this.dropTextEl.textContent = this.#t('dropText');

        const hint = document.createElement('span');
        hint.className = 'drop-zone-hint';
        hint.textContent = this.#t('dropHint');
        this.dropHintEl = hint;

        content.append(icon, this.dropTextEl, hint);
        this.dropZoneEl.appendChild(content);

        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = '.svg,image/svg+xml';
        this.fileInput.multiple = true;
        this.fileInput.hidden = true;
        this.dropZoneEl.appendChild(this.fileInput);

        this.dropZoneEl.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', () => {
            if (this.fileInput.files?.length) {
                this.#handleFiles(this.fileInput.files);
                this.fileInput.value = '';
            }
        });

        this.dropZoneEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZoneEl.classList.add('drag-active');
        });
        this.dropZoneEl.addEventListener('dragleave', () => {
            this.dropZoneEl.classList.remove('drag-active');
        });
        this.dropZoneEl.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.dropZoneEl.classList.remove('drag-active');
            if (e.dataTransfer?.files.length) {
                this.#handleFiles(e.dataTransfer.files);
            }
        });

        return this.dropZoneEl;
    }

    #buildPaletteRow(): HTMLElement {
        const row = document.createElement('div');
        row.className = 'palette-row';

        this.paletteLabel = document.createElement('label');
        this.paletteLabel.className = 'control-label';
        this.paletteLabel.textContent = this.#t('palette');

        this.paletteSelect = document.createElement('select');
        this.paletteSelect.className = 'palette-select';

        this.paletteCustomOpt = document.createElement('option');
        this.paletteCustomOpt.value = '';
        this.paletteCustomOpt.textContent = this.#t('paletteCustom');
        this.paletteSelect.appendChild(this.paletteCustomOpt);

        for (const name of Object.keys(PALETTE_PRESETS)) {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            this.paletteSelect.appendChild(opt);
        }

        this.paletteSelect.addEventListener('change', () => {
            const name = this.paletteSelect.value;
            const palette = PALETTE_PRESETS[name];
            if (palette) {
                this.callbacks.onPaletteApply(name, palette);
            }
        });

        row.append(this.paletteLabel, this.paletteSelect);
        return row;
    }

    #buildParamSlider(
        label: string,
        initialValue: number,
        min: number,
        max: number,
        step: number,
        onChange: (value: number) => void,
    ): HTMLElement {
        const row = document.createElement('div');
        row.className = 'control-row param-row';

        const labelEl = document.createElement('span');
        labelEl.className = 'control-label';
        labelEl.textContent = label;

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'control-range';
        slider.min = String(min);
        slider.max = String(max);
        slider.step = String(step);
        slider.value = String(initialValue);

        const decimals = step < 0.01 ? 3 : 2;
        const valueEl = document.createElement('span');
        valueEl.className = 'control-value';
        valueEl.textContent = initialValue.toFixed(decimals);

        slider.addEventListener('input', () => {
            const val = Number(slider.value);
            valueEl.textContent = val.toFixed(decimals);
            onChange(val);
        });

        row.append(labelEl, slider, valueEl);
        return row;
    }

    #buildModeToggle(): HTMLElement {
        const row = document.createElement('div');
        row.className = 'mode-toggle-row';

        const label = document.createElement('span');
        label.className = 'control-label';
        label.textContent = 'Mode';

        const toggleWrap = document.createElement('div');
        toggleWrap.className = 'mode-toggle';

        const label2D = document.createElement('span');
        label2D.className = 'mode-toggle-label active';
        label2D.textContent = '2D';

        const track = document.createElement('button');
        track.className = 'mode-toggle-track';
        track.setAttribute('role', 'switch');
        track.setAttribute('aria-checked', 'false');

        const thumb = document.createElement('span');
        thumb.className = 'mode-toggle-thumb';
        track.appendChild(thumb);

        const label3D = document.createElement('span');
        label3D.className = 'mode-toggle-label';
        label3D.textContent = '3D';

        track.addEventListener('click', () => {
            this.is3D = !this.is3D;
            track.setAttribute('aria-checked', String(this.is3D));
            track.classList.toggle('on', this.is3D);
            label2D.classList.toggle('active', !this.is3D);
            label3D.classList.toggle('active', this.is3D);
            this.callbacks.on3DModeToggle(this.is3D);
        });

        toggleWrap.append(label2D, track, label3D);
        row.append(label, toggleWrap);
        return row;
    }

    #buildAnimationSection(): HTMLElement {
        const section = document.createElement('section');
        section.className = 'panel-section';

        this.animationTitle = document.createElement('h2');
        this.animationTitle.className = 'section-title';
        this.animationTitle.textContent = this.#t('animation');
        section.appendChild(this.animationTitle);

        const btnRow = document.createElement('div');
        btnRow.className = 'btn-row';

        this.playPauseBtn = document.createElement('button');
        this.playPauseBtn.className = 'btn btn-primary playing';
        this.playPauseBtn.textContent = this.#t('pause');
        this.playPauseBtn.addEventListener('click', () => {
            this.autoLoop = !this.autoLoop;
            this.playPauseBtn.textContent = this.#t(this.autoLoop ? 'pause' : 'play');
            this.playPauseBtn.classList.toggle('playing', this.autoLoop);
            this.callbacks.onAutoLoopToggle(this.autoLoop);
        });

        this.nextBtn = document.createElement('button');
        this.nextBtn.className = 'btn btn-secondary';
        this.nextBtn.textContent = this.#t('next');
        this.nextBtn.addEventListener('click', () => this.callbacks.onMorphNext());

        btnRow.append(this.playPauseBtn, this.nextBtn);
        section.appendChild(btnRow);

        const delayRow = document.createElement('div');
        delayRow.className = 'control-row';

        this.delayLabelEl = document.createElement('span');
        this.delayLabelEl.className = 'control-label';
        this.delayLabelEl.textContent = this.#t('delay');

        this.delaySlider = document.createElement('input');
        this.delaySlider.type = 'range';
        this.delaySlider.className = 'control-range';
        this.delaySlider.min = '500';
        this.delaySlider.max = '8000';
        this.delaySlider.step = '100';
        this.delaySlider.value = '2000';

        this.delayValueEl = document.createElement('span');
        this.delayValueEl.className = 'control-value';
        this.delayValueEl.textContent = '2000 ms';

        this.delaySlider.addEventListener('input', () => {
            const val = Number(this.delaySlider.value);
            this.delayValueEl.textContent = `${val} ms`;
            this.callbacks.onDelayChange(val);
        });

        delayRow.append(this.delayLabelEl, this.delaySlider, this.delayValueEl);
        section.appendChild(delayRow);

        const bgRow = document.createElement('div');
        bgRow.className = 'control-row';
        bgRow.style.marginTop = '10px';

        this.bgLabelEl = document.createElement('span');
        this.bgLabelEl.className = 'control-label';
        this.bgLabelEl.textContent = this.#t('background');

        const bgInput1 = document.createElement('input');
        bgInput1.type = 'color';
        bgInput1.className = 'shape-color-input';
        bgInput1.value = '#ffffff';

        const bgInput2 = document.createElement('input');
        bgInput2.type = 'color';
        bgInput2.className = 'shape-color-input';
        bgInput2.value = '#ffffff';

        const onBgChange = () => {
            this.callbacks.onBackgroundChange(bgInput1.value, bgInput2.value);
        };
        bgInput1.addEventListener('input', onBgChange);
        bgInput2.addEventListener('input', onBgChange);

        bgRow.append(this.bgLabelEl, bgInput1, bgInput2);
        section.appendChild(bgRow);

        this.exportIndicator = document.createElement('div');
        this.exportIndicator.className = 'export-indicator hidden';
        this.exportIndicator.textContent = this.#t('recording');
        section.appendChild(this.exportIndicator);

        this.exportBtn = document.createElement('button');
        this.exportBtn.className = 'btn btn-secondary export-btn';
        this.exportBtn.textContent = this.#t('exportVideo');
        this.exportBtn.addEventListener('click', () => this.callbacks.onExportVideo());
        section.appendChild(this.exportBtn);

        return section;
    }

    setExporting(active: boolean) {
        this.isExporting = active;
        this.exportBtn.disabled = active;
        this.exportBtn.textContent = active ? this.#t('exporting') : this.#t('exportVideo');
        this.exportIndicator.classList.toggle('hidden', !active);
    }

    #buildDragOverlay(): HTMLElement {
        const overlay = document.createElement('div');
        overlay.className = 'drag-overlay hidden';

        const content = document.createElement('div');
        content.className = 'drag-overlay-content';

        const icon = document.createElement('div');
        icon.innerHTML = UPLOAD_ICON.replace('28', '48').replace('28', '48');

        this.dragOverlayTextEl = document.createElement('p');
        this.dragOverlayTextEl.textContent = this.#t('dragOverlay');

        content.append(icon, this.dragOverlayTextEl);
        overlay.appendChild(content);
        return overlay;
    }

    /* ─── Shape cards ─── */

    #createShapeCard(shape: ShapeEntry, index: number): HTMLElement {
        const card = document.createElement('div');
        card.className = 'shape-card';
        card.draggable = true;
        card.dataset.index = String(index);

        card.addEventListener('dragstart', (e) => {
            this.reorderDragIndex = index;
            card.classList.add('dragging');
            e.dataTransfer!.effectAllowed = 'move';
            e.dataTransfer!.setData('text/plain', String(index));
        });

        card.addEventListener('dragend', () => {
            this.reorderDragIndex = -1;
            card.classList.remove('dragging');
            this.shapeListEl.querySelectorAll('.shape-card').forEach(c => {
                c.classList.remove('drag-over-top', 'drag-over-bottom');
            });
        });

        card.addEventListener('dragover', (e) => {
            if (this.reorderDragIndex < 0) return;
            e.preventDefault();
            e.dataTransfer!.dropEffect = 'move';
            const rect = card.getBoundingClientRect();
            const mid = rect.top + rect.height / 2;
            const isAbove = e.clientY < mid;
            card.classList.toggle('drag-over-top', isAbove);
            card.classList.toggle('drag-over-bottom', !isAbove);
        });

        card.addEventListener('dragleave', () => {
            card.classList.remove('drag-over-top', 'drag-over-bottom');
        });

        card.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            card.classList.remove('drag-over-top', 'drag-over-bottom');
            if (this.reorderDragIndex < 0) return;
            const fromIndex = this.reorderDragIndex;
            const rect = card.getBoundingClientRect();
            const mid = rect.top + rect.height / 2;
            let toIndex = index;
            if (e.clientY >= mid && toIndex < fromIndex) toIndex++;
            if (e.clientY < mid && toIndex > fromIndex) toIndex--;
            if (fromIndex !== toIndex) {
                this.callbacks.onShapeReordered(fromIndex, toIndex);
            }
            this.reorderDragIndex = -1;
        });

        const thumb = document.createElement('img');
        thumb.className = 'shape-thumb';
        thumb.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(shape.svgString);
        thumb.alt = shape.name;
        thumb.draggable = false;

        const info = document.createElement('div');
        info.className = 'shape-info';

        const name = document.createElement('div');
        name.className = 'shape-name';
        name.textContent = shape.name;

        const colors = document.createElement('div');
        colors.className = 'shape-colors';

        const c1 = document.createElement('input');
        c1.type = 'color';
        c1.className = 'shape-color-input';
        c1.value = shape.color1;
        c1.title = 'Couleur 1';

        const c2 = document.createElement('input');
        c2.type = 'color';
        c2.className = 'shape-color-input';
        c2.value = shape.color2;
        c2.title = 'Couleur 2';

        const onColorChange = () => {
            this.paletteSelect.value = '';
            this.callbacks.onShapeColorChanged(index, c1.value, c2.value);
        };

        c1.addEventListener('input', onColorChange);
        c2.addEventListener('input', onColorChange);

        colors.append(c1, c2);
        info.append(name, colors);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'shape-delete';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.title = 'Supprimer cette forme';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.callbacks.onShapeRemoved(index);
        });

        card.append(thumb, info, deleteBtn);
        return card;
    }

    /* ─── Drag & drop ─── */

    #setupWindowDrag() {
        window.addEventListener('dragenter', this.boundDragEnter);
        window.addEventListener('dragleave', this.boundDragLeave);
        window.addEventListener('dragover', this.boundDragOver);
        window.addEventListener('drop', this.boundDrop);
    }

    #onWindowDragEnter(e: DragEvent) {
        e.preventDefault();
        if (this.reorderDragIndex >= 0) return;
        this.dragCounter++;
        if (this.dragCounter === 1) {
            this.dragOverlay.classList.remove('hidden');
        }
    }

    #onWindowDragLeave(e: DragEvent) {
        e.preventDefault();
        this.dragCounter--;
        if (this.dragCounter <= 0) {
            this.dragCounter = 0;
            this.dragOverlay.classList.add('hidden');
        }
    }

    #onWindowDragOver(e: DragEvent) {
        e.preventDefault();
    }

    #onWindowDrop(e: DragEvent) {
        e.preventDefault();
        this.dragCounter = 0;
        this.dragOverlay.classList.add('hidden');
        if (e.dataTransfer?.files.length) {
            this.#handleFiles(e.dataTransfer.files);
        }
    }

    #handleFiles(files: FileList) {
        const svgFiles: File[] = [];
        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            if (f.name.endsWith('.svg') || f.type === 'image/svg+xml') {
                svgFiles.push(f);
            }
        }

        if (svgFiles.length === 0) return;

        const results: { name: string; content: string }[] = [];
        let loaded = 0;

        for (const file of svgFiles) {
            const reader = new FileReader();
            reader.onload = () => {
                results.push({
                    name: file.name.replace(/\.svg$/i, ''),
                    content: reader.result as string,
                });
                loaded++;
                if (loaded === svgFiles.length) {
                    this.callbacks.onFilesDropped(results);
                }
            };
            reader.readAsText(file);
        }
    }
}
