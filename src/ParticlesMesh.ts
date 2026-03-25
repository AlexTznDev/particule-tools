import { Color, InstancedMesh, NormalBlending, PlaneGeometry } from 'three';
import {
    Fn,
    ShaderNodeObject,
    float,
    hash,
    instanceIndex,
    length,
    mix,
    storage,
    time,
    uniform,
    uv,
    vec3,
    vec4,
} from 'three/tsl';
import {
    ComputeNode,
    SpriteNodeMaterial,
    StorageBufferNode,
    StorageInstancedBufferAttribute,
    WebGPURenderer,
} from 'three/webgpu';
import { Pointer } from './utils/Pointer';
import { curlNoise4d } from './utils/nodes/noise/curlNoise4d';

class ParticlesMesh extends InstancedMesh<PlaneGeometry, SpriteNodeMaterial> {
    renderer: WebGPURenderer;
    amount: number;
    totalShapes: number;
    positions: number[][];
    colors: Color[][];

    pointerHandler: Pointer;

    buffers: {
        basePositions?: ShaderNodeObject<StorageBufferNode>;
        positions?: ShaderNodeObject<StorageBufferNode>;
        velocities?: ShaderNodeObject<StorageBufferNode>;
    } = {};

    updateCompute: ComputeNode;

    params = {
        baseParticleScale: 1,
        wigglePower: 0.6,
        wiggleSpeed: 1,
        burstStrength: 0.08,
        explosionDuration: 0.995,
        reconstructionSpeed: 0.06,
    };

    uniforms = {
        activeIndex: uniform(0),
        burstForce: uniform(0),
        color1: uniform(new Color('#ffffff')),
        color2: uniform(new Color('#ffffff')),
        scale: uniform(this.params.baseParticleScale),
        wigglePower: uniform(this.params.wigglePower),
        wiggleSpeed: uniform(this.params.wiggleSpeed),
    };

    constructor(
        renderer: WebGPURenderer,
        amount: number,
        positions: number[][],
        colors: Color[][],
        pointerHandler: Pointer,
    ) {
        const geometry = new PlaneGeometry();
        const material = new SpriteNodeMaterial({
            transparent: true,
            depthWrite: false,
            sizeAttenuation: true,
            blending: NormalBlending,
        });

        super(geometry, material, amount);

        this.frustumCulled = false;
        this.renderer = renderer;
        this.amount = amount;
        this.totalShapes = positions.length;
        this.positions = positions;
        this.colors = colors;
        this.pointerHandler = pointerHandler;

        if (colors.length > 0) {
            this.uniforms.color1.value.copy(colors[0][0]);
            this.uniforms.color2.value.copy(colors[0][1]);
        }

        this.buffers.basePositions = storage(
            new StorageInstancedBufferAttribute(new Float32Array(positions.flat()), 3),
            'vec3',
            this.amount * this.totalShapes,
        ).setPBO(true);
        this.buffers.positions = storage(new StorageInstancedBufferAttribute(this.amount, 3), 'vec3', this.amount);
        this.buffers.velocities = storage(new StorageInstancedBufferAttribute(this.amount, 3), 'vec3', this.amount);

        material.positionNode = this.buffers.positions.element(instanceIndex);

        material.scaleNode = float(hash(instanceIndex).mul(0.5).add(0.5).mul(0.1)).mul(this.uniforms.scale);

        material.colorNode = Fn(() => {
            const position = this.buffers.positions!.element(instanceIndex);
            const velocity = this.buffers.velocities!.element(instanceIndex);

            const mainColor = mix(
                this.uniforms.color1,
                this.uniforms.color2,
                position.y.add(1).mul(0.5).clamp(0, 1),
            ).toVar();
            const velFactor = velocity.length().mul(15).clamp(0, 1);
            const color = mix(mainColor, this.uniforms.color2, velFactor);
            const distanceToCenter = length(uv().sub(0.5));
            const alpha = float(0.03).div(distanceToCenter).sub(0.06).clamp(0, 1);

            return vec4(color, alpha);
        })();

        const initCompute = Fn(() => {
            this.buffers.positions
                ?.element(instanceIndex)
                .assign(
                    vec3(
                        hash(instanceIndex).sub(0.5).mul(2),
                        hash(instanceIndex.add(1).mul(10)).mul(3).sub(8),
                        hash(instanceIndex.add(2)).sub(0.5),
                    ),
                );

            this.buffers.velocities?.element(instanceIndex).assign(vec3(0));
        })().compute(this.amount);

        this.renderer.computeAsync(initCompute);

        this.updateCompute = Fn(() => {
            const position = this.buffers.positions!.element(instanceIndex);
            const buffer = this.buffers.basePositions!;

            const baseIndex = instanceIndex.add(this.uniforms.activeIndex.mul(this.amount));
            const basePosition = buffer.element(baseIndex).toVar();

            const velocity = this.buffers.velocities!.element(instanceIndex);

            const toTargetPosition = basePosition.sub(position).toVar('toTargetPosition');
            const toTargetPositionLength = toTargetPosition.length().toVar('toTargetPositionLength');
            const toTargetPositionDirection = toTargetPosition.normalize().toVar('toTargetPositionDirection');

            const settled = toTargetPositionLength.remapClamp(0, 0.15, 0.0, 1.0);

            const flowField = curlNoise4d(vec4(position, 0)).toVar('flowField');

            const wiggle = curlNoise4d(vec4(position, time.mul(this.uniforms.wiggleSpeed)))
                .mul(this.uniforms.wigglePower)
                .mul(settled)
                .toVar();

            const overshoot = velocity.mul(hash(instanceIndex).mul(0.05).add(0.6)).mul(flowField.mul(1.2)).mul(settled).toVar();

            const scale = toTargetPositionLength.remapClamp(0, 1, 0.02, 0.12).mul(0.5);
            const speed = toTargetPositionDirection.mul(scale).mul(hash(instanceIndex).mul(0.35).add(0.6)).toVar();

            const burst = position.normalize().mul(this.uniforms.burstForce).mul(hash(instanceIndex).mul(0.5).add(0.5));

            const overshootedSpeed = overshoot.add(speed).add(burst).toVar();
            const overshootLen = overshootedSpeed.length();
            const safeDir = overshootedSpeed.div(overshootLen.max(0.0001));
            velocity.assign(safeDir.add(wiggle).normalize().mul(overshootLen));

            velocity.mulAssign(settled);

            position.addAssign(velocity);
        })().compute(this.amount);
    }

    setActiveIndex(index: number) {
        this.uniforms.activeIndex.value = index;
        this.uniforms.burstForce.value = this.params.burstStrength;
        const pair = this.colors[index % this.colors.length];
        if (pair) {
            this.uniforms.color1.value.copy(pair[0]);
            this.uniforms.color2.value.copy(pair[1]);
        }
    }

    update() {
        const force = this.uniforms.burstForce.value;
        if (force > 0.001) {
            const ratio = force / this.params.burstStrength;
            const decay = this.params.explosionDuration - (1 - ratio) * this.params.reconstructionSpeed;
            this.uniforms.burstForce.value *= decay;
        } else {
            this.uniforms.burstForce.value = 0;
        }
        this.renderer.computeAsync(this.updateCompute);
    }

    dispose() {
        Object.values(this.buffers).forEach((buffer) => {
            if (Array.isArray(buffer)) {
                buffer.forEach((b) => b.dispose());
            } else {
                buffer.dispose();
            }
        });

        Object.values(this.uniforms).forEach((u) => {
            u.dispose();
        });

        this.updateCompute.dispose();
        this.geometry.dispose();
        this.material.dispose();
        super.dispose();

        return this;
    }

}

export default ParticlesMesh;
