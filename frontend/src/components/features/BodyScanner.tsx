"use client";
import { Mesh, MeshStandardMaterial } from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense } from 'react';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import InjuryHotspot from '@/components/features/InjuryHotspot';

// The pre-defined coordinates from your Blender session
const ANATOMY_COORDS: Record<string, [number, number, number]> = {
    "SKULL_FRONT": [-0.010301, 1.7662, 0.099223],
    "NECK_RIGHT": [0.070227, 1.5751, 0.059444],
    "CHEST_LEFT": [0.075492, 1.3699, 0.15878],
    "FOREARM_LEFT": [-0.49641, 1.4452, 0.018437],
    "LEG_RIGHT": [0.15, 0.6, 0.05],
    "BACK_CENTER": [0.0, 1.35, -0.15]
};

function HologramModel() {
    // Load your model from the public folder
    const { scene } = useGLTF('/human_base.glb');

    // Traverse the mesh to apply that futuristic, translucent cyan aesthetic
    scene.traverse((child) => {
        if (child instanceof Mesh) {
            // Apply intense emissive wireframe to trigger the bloom
            child.material = new MeshStandardMaterial({
                color: '#0284c7', // Darker blue base
                emissive: '#0ea5e9', // Bright cyan emissive
                emissiveIntensity: 1.7, // Push past 1.0 to trigger intense bloom
                wireframe: true,
                transparent: true,
                opacity: 0.4
            });
        }
    });

    return <primitive object={scene} />;
}

interface Injury {
    description: string;
    anatomical_key: string;
    severity: string;
}

interface BodyScannerProps {
    injuries: Injury[];
}

export default function BodyScanner({ injuries }: BodyScannerProps) {
    return (
        <div className="w-full h-full relative overflow-visible">
            <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} color="#0ea5e9" intensity={1.5} />
                <OrbitControls enableZoom={true} autoRotate autoRotateSpeed={0.5} />

                {/* The magic glow post-processing */}
                <EffectComposer>
                    <Bloom
                        luminanceThreshold={1.0}
                        mipmapBlur
                        intensity={0.5}
                    />
                </EffectComposer>

                <Suspense fallback={null}>
                    {/* Group the model and hotspots together so they share the same coordinate space */}
                    <group scale={1.5} position={[0, 0.5, 0]}>
                        <HologramModel />

                        {/* Map through the AI-extracted injuries and render the interactive nodes */}
                        {injuries.map((injury, idx) => (
                            <InjuryHotspot
                                key={idx}
                                position={ANATOMY_COORDS[injury.anatomical_key] || [0, 0, 0]}
                                data={injury}
                            />
                        ))}
                    </group>
                </Suspense>
            </Canvas>

            {/* Cinematic UI Overlay */}
            <div className="absolute top-4 left-4 text-cyan-500 font-mono text-sm tracking-widest">
                SYSTEM STATUS: <span className="text-emerald-400">OPTIMAL</span>
                <br />AI ANALYSIS ENGINE: <span className="animate-pulse">ACTIVE</span>
            </div>
        </div>
    );
}