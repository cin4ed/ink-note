import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { useStore } from '../store/useStore';

// Helper to get CSS variable value
const getCssVar = (name: string) => {
    if (typeof window === 'undefined') return '#000000';
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
};

interface SimNode {
    id: string;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
}

const GraphNode = ({ simNode, color }: { simNode: SimNode; color: string }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.position.copy(simNode.position);
        }
    });

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[0.15, 32, 32]} />
            <meshStandardMaterial color={color} />
        </mesh>
    );
};

const GraphConnection = ({ startNode, endNode, color }: { startNode: SimNode; endNode: SimNode; color: string }) => {
    const lineRef = useRef<any>(null);
    const geometryRef = useRef<THREE.BufferGeometry>(null);

    useFrame(() => {
        if (lineRef.current && geometryRef.current) {
            const positions = geometryRef.current.attributes.position.array as Float32Array;

            positions[0] = startNode.position.x;
            positions[1] = startNode.position.y;
            positions[2] = startNode.position.z;

            positions[3] = endNode.position.x;
            positions[4] = endNode.position.y;
            positions[5] = endNode.position.z;

            geometryRef.current.attributes.position.needsUpdate = true;
        }
    });

    return (
        <line ref={lineRef}>
            <bufferGeometry ref={geometryRef}>
                <bufferAttribute
                    attach="attributes-position"
                    count={2}
                    array={new Float32Array(6)}
                    itemSize={3}
                    args={[new Float32Array(6), 3]}
                />
            </bufferGeometry>
            <lineBasicMaterial color={color} linewidth={1} />
        </line>
    );
};

const GraphScene = () => {
    const notes = useStore((state) => state.notes);
    const [fgColor, setFgColor] = useState("");

    // Simulation state
    const simNodes = useRef<Map<string, SimNode>>(new Map());

    useEffect(() => {
        const updateColor = () => {
            setFgColor(getCssVar('--color-fg') || 'black');
        };
        updateColor();
        window.addEventListener('ink-theme-change', updateColor);
        return () => window.removeEventListener('ink-theme-change', updateColor);
    }, []);

    // Initialize or cleanup nodes based on store updates
    useEffect(() => {
        const currentIds = new Set(notes.map(n => n.id));

        // Remove old nodes
        for (const [id] of simNodes.current) {
            if (!currentIds.has(id)) {
                simNodes.current.delete(id);
            }
        }

        // Add new nodes with random positions near center
        notes.forEach(note => {
            if (!simNodes.current.has(note.id)) {
                simNodes.current.set(note.id, {
                    id: note.id,
                    position: new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 2),
                    velocity: new THREE.Vector3(0, 0, 0)
                });
            }
        });
    }, [notes]);

    // Force-directed simulation step
    useFrame(() => {
        const nodes = Array.from(simNodes.current.values());
        const repulsion = 0.5;
        const springLength = 3;
        const springStrength = 0.1;
        const centerGravity = 0.01;
        const damping = 0.9;
        const dt = 0.1; // Fixed time step for stability

        // 1. Apply Forces
        nodes.forEach(node => {
            const force = new THREE.Vector3(0, 0, 0);

            // Center Gravity (pull towards 0,0,0)
            force.add(node.position.clone().multiplyScalar(-centerGravity));

            // Repulsion (between all pairs)
            nodes.forEach(other => {
                if (node.id === other.id) return;
                const diff = node.position.clone().sub(other.position);
                const distSq = diff.lengthSq();
                if (distSq > 0) {
                    // F = k/d^2 simplified
                    force.add(diff.normalize().multiplyScalar(repulsion / Math.sqrt(distSq)));
                }
            });

            // Spring (Connections)
            const noteData = notes.find(n => n.id === node.id);
            if (noteData) {
                noteData.connections.forEach(targetId => {
                    const targetNode = simNodes.current.get(targetId);
                    if (targetNode) {
                        const diff = targetNode.position.clone().sub(node.position);
                        const dist = diff.length();
                        const springForce = (dist - springLength) * springStrength;
                        force.add(diff.normalize().multiplyScalar(springForce));
                    }
                });
            }

            // Apply to velocity
            node.velocity.add(force.multiplyScalar(dt));
            node.velocity.multiplyScalar(damping);
        });

        // 2. Update Positions
        nodes.forEach(node => {
            node.position.add(node.velocity.clone().multiplyScalar(dt));
        });
    });

    return (
        <group>
            {/* Render Nodes */}
            {notes.map((note) => {
                const simNode = simNodes.current.get(note.id);
                if (!simNode) return null;
                return <GraphNode key={note.id} simNode={simNode} color={fgColor} />;
            })}

            {/* Render Connections */}
            {notes.map(note =>
                note.connections.map(targetId => {
                    const startNode = simNodes.current.get(note.id);
                    const endNode = simNodes.current.get(targetId);

                    if (!startNode || !endNode) return null;
                    if (note.id > targetId) return null; // Avoid duplicates

                    return (
                        <GraphConnection
                            key={`${note.id}-${targetId}`}
                            startNode={startNode}
                            endNode={endNode}
                            color={fgColor}
                        />
                    );
                })
            )}
        </group>
    );
};

export const BackgroundGraph = () => {
    return (
        <div className="fixed inset-0 z-0 pointer-events-auto">
            <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <GraphScene />
                <OrbitControls enableZoom={true} enablePan={false} autoRotate={true} autoRotateSpeed={0.5} />
            </Canvas>
        </div>
    );
};
