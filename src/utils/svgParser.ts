const CANVAS_SIZE = 512;
const EDGE_SAMPLE_RATIO = 0.12;

let _sharedCanvas: HTMLCanvasElement | null = null;
let _sharedCtx: CanvasRenderingContext2D | null = null;

function getSharedCtx(): CanvasRenderingContext2D {
    if (!_sharedCanvas) {
        _sharedCanvas = document.createElement('canvas');
        _sharedCanvas.width = CANVAS_SIZE;
        _sharedCanvas.height = CANVAS_SIZE;
        _sharedCtx = _sharedCanvas.getContext('2d')!;
    }
    return _sharedCtx!;
}

function svgToImage(svg: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
}

function samplePoints(
    ctx: CanvasRenderingContext2D,
    size: number,
    count: number,
    worldSize: number,
): number[] {
    const { data } = ctx.getImageData(0, 0, size, size);

    const edge: number[] = [];
    const fill: number[] = [];

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (data[(y * size + x) * 4 + 3] <= 128) continue;

            let onEdge = false;
            for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx < 0 || nx >= size || ny < 0 || ny >= size || data[(ny * size + nx) * 4 + 3] <= 128) {
                    onEdge = true;
                    break;
                }
            }

            (onEdge ? edge : fill).push(x, y);
        }
    }

    if (edge.length === 0 && fill.length === 0) {
        return new Array(count * 3).fill(0);
    }

    const scale = worldSize / size;
    const half = worldSize / 2;
    const positions: number[] = [];

    const edgeN = edge.length > 0 ? Math.floor(count * EDGE_SAMPLE_RATIO) : 0;

    const pick = (pool: number[], n: number) => {
        const len = pool.length / 2;
        for (let i = 0; i < n; i++) {
            const idx = Math.floor(Math.random() * len) * 2;
            positions.push(
                (pool[idx] + (Math.random() - 0.5) * 0.6) * scale - half,
                -((pool[idx + 1] + (Math.random() - 0.5) * 0.6) * scale - half),
                0,
            );
        }
    };

    if (edge.length > 0) pick(edge, edgeN);
    pick(fill.length > 0 ? fill : edge, count - edgeN);

    return positions;
}

export interface SvgShapeData {
    positions: number[][];
    names: string[];
    svgStrings: string[];
}

export async function parseSingleSvg(
    svgString: string,
    particleCount: number,
    worldSize = 3.5,
): Promise<number[]> {
    const ctx = getSharedCtx();
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const img = await svgToImage(svgString);
    ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

    return samplePoints(ctx, CANVAS_SIZE, particleCount, worldSize);
}

export async function loadSvgShapes(
    particleCount: number,
    worldSize = 3.5,
): Promise<SvgShapeData> {
    const modules = import.meta.glob('/asset/*.svg', {
        query: '?raw',
        import: 'default',
        eager: true,
    }) as Record<string, string>;

    const entries = Object.entries(modules).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));

    if (entries.length === 0) {
        return { positions: [], names: [], svgStrings: [] };
    }

    const positions: number[][] = [];
    const names: string[] = [];
    const svgStrings: string[] = [];

    for (const [path, svgString] of entries) {
        names.push(path.split('/').pop()!.replace('.svg', ''));
        svgStrings.push(svgString);
        positions.push(await parseSingleSvg(svgString, particleCount, worldSize));
    }

    return { positions, names, svgStrings };
}
