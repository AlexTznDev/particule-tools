import Stats from 'stats-gl';
import { Fn, uniform, vec3, vec4 } from 'three/tsl';
import {
    ACESFilmicToneMapping,
    Clock,
    Color,
    PerspectiveCamera,
    Plane,
    Scene,
    Vector3,
    WebGPURenderer,
} from 'three/webgpu';
import { Pane } from 'tweakpane';
import { Pointer } from './utils/Pointer';
import ParticlesMesh from './ParticlesMesh';
import { loadSvgShapes, parseSingleSvg } from './utils/svgParser';
import { Panel, PALETTE_PRESETS, type ShapeEntry } from './ui/Panel';

const PARTICLE_COUNT = 12000;
const DEFAULT_PALETTE = 'Anagram';

class Demo {
    canvas: HTMLCanvasElement;
    renderer: WebGPURenderer;
    camera: PerspectiveCamera;
    scene: Scene;
    stats?: Stats;
    clock = new Clock();
    mesh?: ParticlesMesh;

    pointerHandler: Pointer;
    panel: Panel;
    tweakPane?: Pane;

    autoLoop = false;
    autoLoopDelay = 2000;
    autoLoopTimer?: ReturnType<typeof setTimeout>;

    shapes: ShapeEntry[] = [];
    activePaletteName = DEFAULT_PALETTE;
    bgColor = uniform(new Color('#ffffff'));

    constructor(canvas: HTMLCanvasElement) {
        this.render = this.render.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        this.morph = this.morph.bind(this);

        this.canvas = canvas;
        this.renderer = new WebGPURenderer({ canvas, powerPreference: 'high-performance' });
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

        this.scene = new Scene();
        this.scene.backgroundNode = Fn(() => vec4(this.bgColor, 1))();

        this.camera = new PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 500);
        this.camera.position.set(0, 0, 6);

        this.pointerHandler = new Pointer(this.renderer, this.camera, new Plane(new Vector3(0, 0, 1), 0));

        if (import.meta.env.DEV) {
            this.stats = new Stats();
            this.stats.init(this.renderer);
        }

        this.panel = new Panel({
            onFilesDropped: (files) => this.#handleFilesDropped(files),
            onShapeRemoved: (index) => this.#handleShapeRemoved(index),
            onShapeReordered: (from, to) => this.#handleShapeReordered(from, to),
            onShapeColorChanged: (index, c1, c2) => this.#handleColorChanged(index, c1, c2),
            onAutoLoopToggle: (active) => this.#handleAutoLoopToggle(active),
            onDelayChange: (delay) => this.#handleDelayChange(delay),
            onMorphNext: () => this.#doMorph(),
            onPaletteApply: (name, colors) => this.#handlePaletteApply(name, colors),
            onBackgroundChange: (color) => this.bgColor.value.set(color),
            onExportVideo: () => this.#exportVideo(),
        });

        this.onWindowResize();

        this.#initEvents();
        this.#init();
    }

    get dpr() {
        return Math.min(window.devicePixelRatio, 1.5);
    }

    async #init() {
        await this.#loadInitialShapes();
        this.panel.setShapes(this.shapes);
        this.panel.setAutoLoop(this.autoLoop, this.autoLoopDelay);
        this.panel.setActivePalette(this.activePaletteName);
        await this.#rebuildMesh();
        await this.#hideLoader();
        this.renderer.setAnimationLoop(this.render);
        this.#startAutoLoop();
    }

    #hideLoader(): Promise<void> {
        return new Promise((resolve) => {
            const loader = document.getElementById('loader');
            if (!loader) { resolve(); return; }
            const elapsed = performance.now();
            const remaining = Math.max(0, 2000 - elapsed);
            setTimeout(() => {
                loader.classList.add('hidden');
                setTimeout(() => {
                    loader.remove();
                    resolve();
                }, 500);
            }, remaining);
        });
    }

    async #loadInitialShapes() {
        const { positions, names, svgStrings } = await loadSvgShapes(PARTICLE_COUNT);
        const palette = PALETTE_PRESETS[DEFAULT_PALETTE];

        this.shapes = positions.map((pos, i) => ({
            name: names[i],
            svgString: svgStrings[i],
            positions: pos,
            color1: palette[i % palette.length][0],
            color2: palette[i % palette.length][1],
        }));
    }

    async #rebuildMesh() {
        const savedParams = this.mesh ? { ...this.mesh.params } : undefined;

        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.dispose();
            this.mesh = undefined;
        }

        if (this.shapes.length === 0) {
            this.#destroyTweakPane();
            return;
        }

        const positions = this.shapes.map(s => s.positions);
        const colors = this.shapes.map(s =>
            [new Color(s.color1), new Color(s.color2)] as [Color, Color],
        );

        this.mesh = new ParticlesMesh(
            this.renderer,
            PARTICLE_COUNT,
            positions,
            colors,
            this.pointerHandler,
        );

        if (savedParams) {
            Object.assign(this.mesh.params, savedParams);
            this.mesh.uniforms.scale.value = savedParams.baseParticleScale;
            this.mesh.uniforms.wigglePower.value = savedParams.wigglePower;
            this.mesh.uniforms.wiggleSpeed.value = savedParams.wiggleSpeed;
        }

        this.scene.add(this.mesh);
        this.#updateMeshScale();
        this.panel.setActiveIndex(this.mesh.uniforms.activeIndex.value);

        this.#destroyTweakPane();
        this.#initTweakPane();
    }

    /* ─── Panel callbacks ─── */

    async #handleFilesDropped(files: { name: string; content: string }[]) {
        const palette = PALETTE_PRESETS[this.activePaletteName] || PALETTE_PRESETS[DEFAULT_PALETTE];

        for (const file of files) {
            const positions = await parseSingleSvg(file.content, PARTICLE_COUNT);
            const idx = this.shapes.length;
            this.shapes.push({
                name: file.name,
                svgString: file.content,
                positions,
                color1: palette[idx % palette.length][0],
                color2: palette[idx % palette.length][1],
            });
        }

        this.panel.setShapes(this.shapes);
        await this.#rebuildMesh();
        this.#restartAutoLoop();
    }

    async #handleShapeRemoved(index: number) {
        this.shapes.splice(index, 1);
        this.panel.setShapes(this.shapes);
        await this.#rebuildMesh();
        this.#restartAutoLoop();
    }

    async #handleShapeReordered(fromIndex: number, toIndex: number) {
        const [shape] = this.shapes.splice(fromIndex, 1);
        this.shapes.splice(toIndex, 0, shape);
        this.panel.setShapes(this.shapes);
        await this.#rebuildMesh();
        this.#restartAutoLoop();
    }

    #handleColorChanged(index: number, color1: string, color2: string) {
        this.shapes[index].color1 = color1;
        this.shapes[index].color2 = color2;
        this.activePaletteName = '';

        if (this.mesh) {
            this.mesh.colors[index] = [new Color(color1), new Color(color2)];
            if (this.mesh.uniforms.activeIndex.value === index) {
                this.mesh.uniforms.color1.value.set(color1);
                this.mesh.uniforms.color2.value.set(color2);
            }
        }
    }

    #handleAutoLoopToggle(active: boolean) {
        this.autoLoop = active;
        if (active) {
            this.#startAutoLoop();
        } else {
            this.#stopAutoLoop();
        }
    }

    #handleDelayChange(delay: number) {
        this.autoLoopDelay = delay;
    }

    #handlePaletteApply(name: string, colors: [string, string][]) {
        this.activePaletteName = name;

        this.shapes.forEach((shape, i) => {
            shape.color1 = colors[i % colors.length][0];
            shape.color2 = colors[i % colors.length][1];
        });

        this.panel.setShapes(this.shapes);

        if (this.mesh) {
            this.shapes.forEach((shape, i) => {
                this.mesh!.colors[i] = [new Color(shape.color1), new Color(shape.color2)];
            });
            const active = this.mesh.uniforms.activeIndex.value;
            if (this.shapes[active]) {
                this.mesh.uniforms.color1.value.set(this.shapes[active].color1);
                this.mesh.uniforms.color2.value.set(this.shapes[active].color2);
            }
            this.panel.setActiveIndex(active);
        }
    }

    /* ─── Window events ─── */

    onWindowResize() {
        const width = this.canvas.parentElement?.offsetWidth || 1;
        const height = this.canvas.parentElement?.offsetHeight || 1;
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.#updateMeshScale();
    }

    #updateMeshScale() {
        if (!this.mesh) return;
        const height = this.canvas.parentElement?.offsetHeight || 1;
        const maxHeight = 550;
        const scale = Math.min(1, maxHeight / height);
        this.mesh.scale.setScalar(scale);
    }

    morph() {
        this.#doMorph();
        if (this.autoLoop) {
            this.#restartAutoLoop();
        }
    }

    /* ─── Auto loop ─── */

    #doMorph() {
        if (this.mesh && this.shapes.length > 1) {
            const current = this.mesh.uniforms.activeIndex.value;
            const next = (current + 1) % this.mesh.totalShapes;
            this.mesh.setActiveIndex(next);
            this.panel.setActiveIndex(next);
        }
    }

    #startAutoLoop() {
        this.#stopAutoLoop();
        if (!this.autoLoop || this.shapes.length <= 1) return;
        this.autoLoopTimer = setTimeout(() => {
            this.#doMorph();
            this.#startAutoLoop();
        }, this.autoLoopDelay);
    }

    #stopAutoLoop() {
        if (this.autoLoopTimer) {
            clearTimeout(this.autoLoopTimer);
            this.autoLoopTimer = undefined;
        }
    }

    #restartAutoLoop() {
        if (this.autoLoop) {
            this.#startAutoLoop();
        }
    }

    /* ─── Video export ─── */

    async #exportVideo() {
        if (!this.mesh || this.shapes.length === 0) return;

        this.panel.setExporting(true);
        const savedAutoLoop = this.autoLoop;
        this.#stopAutoLoop();

        await this.mesh.resetParticles();
        this.panel.setActiveIndex(0);

        const stream = this.canvas.captureStream(60);
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : 'video/webm';
        const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 25_000_000 });
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        const downloadPromise = new Promise<void>((resolve) => {
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'particle-morphing.webm';
                a.click();
                URL.revokeObjectURL(url);
                resolve();
            };
        });

        recorder.start();

        const initialFormationTime = 2000;
        await new Promise(r => setTimeout(r, initialFormationTime));

        await new Promise(r => setTimeout(r, 200));

        for (let i = 1; i < this.shapes.length; i++) {
            this.mesh!.setActiveIndex(i);
            this.panel.setActiveIndex(i);
            await new Promise(r => setTimeout(r, this.autoLoopDelay));
        }

        await new Promise(r => setTimeout(r, 1500));

        recorder.stop();
        await downloadPromise;

        this.autoLoop = savedAutoLoop;
        if (savedAutoLoop) this.#startAutoLoop();
        this.panel.setExporting(false);
    }

    /* ─── Events ─── */

    #initEvents() {
        window.addEventListener('resize', this.onWindowResize);
        this.canvas.addEventListener('click', this.morph);
    }

    #destroyEvents() {
        window.removeEventListener('resize', this.onWindowResize);
        this.canvas.removeEventListener('click', this.morph);
    }

    /* ─── Render loop ─── */

    async render() {
        const delta = this.clock.getDelta();

        this.stats?.update();
        this.pointerHandler.update(delta);
        this.mesh?.update();

        this.renderer.renderAsync(this.scene, this.camera);
    }

    /* ─── Cleanup ─── */

    destroy() {
        this.renderer.setAnimationLoop(null);

        this.#stopAutoLoop();
        this.#destroyEvents();
        this.#destroyTweakPane();
        this.panel.destroy();
        this.stats?.dom.remove();
        this.pointerHandler.destroy();
        this.mesh?.dispose();

        if (this.renderer.hasInitialized()) {
            this.renderer.dispose();
        }
    }

    /* ─── Tweakpane ─── */

    #initTweakPane() {
        if (!this.mesh) return;

        const container = this.panel.getTweakpaneContainer();
        this.tweakPane = new Pane({ container });

        const particlesFolder = (this.tweakPane as any).addFolder({ title: 'Particules' });

        particlesFolder.addBinding(this.mesh.params, 'wigglePower', {
            label: 'mouvement',
            min: 0, max: 0.7, step: 0.01,
        }).on('change', (event: any) => {
            if (this.mesh) this.mesh.uniforms.wigglePower.value = event.value;
        });

        particlesFolder.addBinding(this.mesh.params, 'wiggleSpeed', {
            label: 'vitesse bruit',
            min: 0, max: 3, step: 0.01,
        }).on('change', (event: any) => {
            if (this.mesh) this.mesh.uniforms.wiggleSpeed.value = event.value;
        });

        particlesFolder.addBinding(this.mesh.params, 'baseParticleScale', {
            label: 'taille',
            min: 0.1, max: 3, step: 0.01,
        }).on('change', (event: any) => {
            if (this.mesh) this.mesh.uniforms.scale.value = event.value;
        });

        const explosionFolder = (this.tweakPane as any).addFolder({ title: 'Explosion' });

        explosionFolder.addBinding(this.mesh.params, 'burstStrength', {
            label: 'force',
            min: 0.01, max: 0.5, step: 0.01,
        });

        explosionFolder.addBinding(this.mesh.params, 'explosionDuration', {
            label: 'duree explosion',
            min: 0.95, max: 0.999, step: 0.001,
        });

        explosionFolder.addBinding(this.mesh.params, 'reconstructionSpeed', {
            label: 'reconstruction',
            min: 0.01, max: 0.2, step: 0.005,
        });
    }

    #destroyTweakPane() {
        this.tweakPane?.dispose();
        this.tweakPane = undefined;
    }
}

export default Demo;
