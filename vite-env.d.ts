/// <reference types="vite/client" />

declare module 'three/examples/fonts/helvetiker_bold.typeface.json' {
    const data: Record<string, unknown>;
    export default data;
}

declare module 'stats-gl' {
    export default class Stats {
        dom: HTMLElement;
        init(renderer: unknown): void;
        update(): void;
    }
}
