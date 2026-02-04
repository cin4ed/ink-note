import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls, Html } from '@react-three/drei';
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

const NODE_RADIUS = 0.15;
const HIT_RADIUS = 0.55;

const GraphNode = ({
    simNode,
    color,
    onHover,
    onUnhover,
}: {
    simNode: SimNode;
    color: string;
    onHover: () => void;
    onUnhover: () => void;
}) => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.position.copy(simNode.position);
        }
    });

    return (
        <group ref={groupRef} onPointerOver={onHover} onPointerOut={onUnhover}>
            <mesh>
                <sphereGeometry args={[NODE_RADIUS, 32, 32]} />
                <meshStandardMaterial color={color} />
            </mesh>
            <mesh>
                <sphereGeometry args={[HIT_RADIUS, 16, 16]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
        </group>
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
    const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);
    const [isFrozen, setIsFrozen] = useState(false);
    const hoverResumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hoveredNoteIdRef = useRef<string | null>(null);
    const RESUME_DELAY_MS = 500;

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

    useEffect(() => {
        hoveredNoteIdRef.current = hoveredNoteId;
    }, [hoveredNoteId]);

    useEffect(() => {
        return () => {
            if (hoverResumeTimeout.current) {
                clearTimeout(hoverResumeTimeout.current);
            }
        };
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
        if (isFrozen) return;
        const nodes = Array.from(simNodes.current.values());
        const repulsion = 0.5;
        const springLength = 3;
        const springStrength = 0.1;
        const centerGravity = 0.08;
        const damping = 0.9;
        const maxSpeed = 0.6;
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
            node.velocity.clampLength(0, maxSpeed);
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
                return (
                    <GraphNode
                        key={note.id}
                        simNode={simNode}
                        color={fgColor}
                        onHover={() => {
                            setHoveredNoteId(note.id);
                            setIsFrozen(true);
                            if (hoverResumeTimeout.current) {
                                clearTimeout(hoverResumeTimeout.current);
                            }
                        }}
                        onUnhover={() => {
                            setHoveredNoteId((current) => (current === note.id ? null : current));
                            if (hoverResumeTimeout.current) {
                                clearTimeout(hoverResumeTimeout.current);
                            }
                            setIsFrozen(true);
                            hoverResumeTimeout.current = setTimeout(() => {
                                if (!hoveredNoteIdRef.current) {
                                    setIsFrozen(false);
                                }
                                hoverResumeTimeout.current = null;
                            }, RESUME_DELAY_MS);
                        }}
                    />
                );
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

            {hoveredNoteId && (() => {
                const hoveredNote = notes.find((n) => n.id === hoveredNoteId);
                const hoveredNode = simNodes.current.get(hoveredNoteId);
                if (!hoveredNote || !hoveredNode) return null;
                const title = hoveredNote.title?.trim() || 'Untitled';
                return (
                    <Html position={[hoveredNode.position.x, hoveredNode.position.y + 0.3, hoveredNode.position.z]} center>
                        <div className="pointer-events-none select-none bg-[var(--color-bg)] text-[var(--color-fg)] border border-[var(--color-fg)] shadow-[3px_3px_0px_var(--color-fg)] px-2 py-1 text-[10px] font-mono whitespace-nowrap">
                            {title}
                        </div>
                    </Html>
                );
            })()}

            <OrbitControls enableZoom={true} enablePan={false} autoRotate={!isFrozen} autoRotateSpeed={0.5} />
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
            </Canvas>
        </div>
    );
};
