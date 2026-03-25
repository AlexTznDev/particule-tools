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
    onBackgroundChange: (color: string) => void;
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
    private tweakpaneContainer!: HTMLElement;

    private callbacks: PanelCallbacks;
    private dragCounter = 0;
    private autoLoop = true;
    private reorderDragIndex = -1;

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
        this.playPauseBtn.textContent = active ? 'Pause' : 'Lecture';
        this.playPauseBtn.classList.toggle('playing', active);
        this.delaySlider.value = String(delay);
        this.delayValueEl.textContent = `${delay} ms`;
    }

    setActivePalette(name: string) {
        this.paletteSelect.value = name;
    }

    getTweakpaneContainer(): HTMLElement {
        return this.tweakpaneContainer;
    }

    destroy() {
        window.removeEventListener('dragenter', this.boundDragEnter);
        window.removeEventListener('dragleave', this.boundDragLeave);
        window.removeEventListener('dragover', this.boundDragOver);
        window.removeEventListener('drop', this.boundDrop);
        this.el.remove();
        this.dragOverlay.remove();
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

        this.tweakpaneContainer = document.createElement('div');
        this.tweakpaneContainer.className = 'tweakpane-container';
        scroll.appendChild(this.tweakpaneContainer);

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

        header.append(h1, sub);
        return header;
    }

    #buildShapesSection(): HTMLElement {
        const section = document.createElement('section');
        section.className = 'panel-section';

        const title = document.createElement('h2');
        title.className = 'section-title';
        title.textContent = 'Formes';
        section.appendChild(title);

        this.shapeListEl = document.createElement('div');
        this.shapeListEl.className = 'shape-list';
        section.appendChild(this.shapeListEl);

        this.emptyMsg = document.createElement('p');
        this.emptyMsg.className = 'empty-message';
        this.emptyMsg.textContent = 'Aucune forme chargee. Glissez un SVG ci-dessous.';
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

        const text = document.createElement('span');
        text.className = 'drop-zone-text';
        text.textContent = 'Glisser un SVG ici';

        const hint = document.createElement('span');
        hint.className = 'drop-zone-hint';
        hint.textContent = 'ou cliquer pour parcourir';

        content.append(icon, text, hint);
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

        const label = document.createElement('label');
        label.className = 'control-label';
        label.textContent = 'Palette';

        this.paletteSelect = document.createElement('select');
        this.paletteSelect.className = 'palette-select';

        const customOpt = document.createElement('option');
        customOpt.value = '';
        customOpt.textContent = 'Personnalise';
        this.paletteSelect.appendChild(customOpt);

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

        row.append(label, this.paletteSelect);
        return row;
    }

    #buildAnimationSection(): HTMLElement {
        const section = document.createElement('section');
        section.className = 'panel-section';

        const title = document.createElement('h2');
        title.className = 'section-title';
        title.textContent = 'Animation';
        section.appendChild(title);

        const btnRow = document.createElement('div');
        btnRow.className = 'btn-row';

        this.playPauseBtn = document.createElement('button');
        this.playPauseBtn.className = 'btn btn-primary playing';
        this.playPauseBtn.textContent = 'Pause';
        this.playPauseBtn.addEventListener('click', () => {
            this.autoLoop = !this.autoLoop;
            this.playPauseBtn.textContent = this.autoLoop ? 'Pause' : 'Lecture';
            this.playPauseBtn.classList.toggle('playing', this.autoLoop);
            this.callbacks.onAutoLoopToggle(this.autoLoop);
        });

        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-secondary';
        nextBtn.textContent = 'Suivant';
        nextBtn.addEventListener('click', () => this.callbacks.onMorphNext());

        btnRow.append(this.playPauseBtn, nextBtn);
        section.appendChild(btnRow);

        const delayRow = document.createElement('div');
        delayRow.className = 'control-row';

        const delayLabel = document.createElement('span');
        delayLabel.className = 'control-label';
        delayLabel.textContent = 'Delai';

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

        delayRow.append(delayLabel, this.delaySlider, this.delayValueEl);
        section.appendChild(delayRow);

        const bgRow = document.createElement('div');
        bgRow.className = 'control-row';
        bgRow.style.marginTop = '10px';

        const bgLabel = document.createElement('span');
        bgLabel.className = 'control-label';
        bgLabel.textContent = 'Fond';

        const bgInput = document.createElement('input');
        bgInput.type = 'color';
        bgInput.className = 'shape-color-input';
        bgInput.value = '#ffffff';
        bgInput.addEventListener('input', () => {
            this.callbacks.onBackgroundChange(bgInput.value);
        });

        bgRow.append(bgLabel, bgInput);
        section.appendChild(bgRow);

        return section;
    }

    #buildDragOverlay(): HTMLElement {
        const overlay = document.createElement('div');
        overlay.className = 'drag-overlay hidden';

        const content = document.createElement('div');
        content.className = 'drag-overlay-content';

        const icon = document.createElement('div');
        icon.innerHTML = UPLOAD_ICON.replace('28', '48').replace('28', '48');

        const text = document.createElement('p');
        text.textContent = 'Deposer les fichiers SVG ici';

        content.append(icon, text);
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
