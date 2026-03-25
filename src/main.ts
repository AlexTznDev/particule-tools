import Demo from './demo';
import './style.css';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

if (!canvas) {
    throw new Error('Canvas element not found');
}

const demo = new Demo(canvas);

window.addEventListener('beforeunload', () => {
    demo.destroy();
});
