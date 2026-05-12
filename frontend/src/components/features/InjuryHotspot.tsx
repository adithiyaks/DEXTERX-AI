"use client";
import { Html } from '@react-three/drei';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InjuryData {
    description: string;
    anatomical_key: string;
    severity: string;
}

interface InjuryHotspotProps {
    position: [number, number, number];
    data: InjuryData;
}

export default function InjuryHotspot({ position, data }: InjuryHotspotProps) {
    const [hovered, setHovered] = useState(false);

    return (
        <group position={position}>
            {/* The physical glowing red dot on the 3D model */}
            <mesh
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <sphereGeometry args={[0.04, 16, 16]} />
                <meshBasicMaterial color="#ef4444" /> {/* Tailwind red-500 */}
            </mesh>

            {/* The HTML Popup Card that appears on hover */}
            <Html center className="pointer-events-none">
                <AnimatePresence>
                    {hovered && (
                        <motion.div
                            initial={{ opacity: 0, x: -20, scale: 0.8 }}
                            animate={{ opacity: 1, x: 20, scale: 1 }}
                            exit={{ opacity: 0, x: -10, scale: 0.9 }}
                            className="w-64 bg-zinc-950/90 border border-red-500/50 backdrop-blur-md rounded-lg p-4 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                        >
                            <div className="text-red-500 text-xs font-bold font-mono tracking-widest mb-1 uppercase">
                                {data.anatomical_key.replace('_', ' ')}
                            </div>
                            <p className="text-zinc-200 text-sm mb-3">
                                {data.description}
                            </p>

                            <div className="flex justify-between items-center border-t border-zinc-800 pt-2">
                                <div>
                                    <div className="text-zinc-500 text-[10px] uppercase">Severity</div>
                                    <div className="text-red-400 text-xs font-mono">{data.severity}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-zinc-500 text-[10px] uppercase">AI Confidence</div>
                                    <div className="text-cyan-400 text-xs font-mono">96.1%</div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Html>
        </group>
    );
}