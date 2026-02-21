import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useState, useRef } from "react";
import * as THREE from "three";
import { OrbitControls, Html } from "@react-three/drei";
import { useNotesModel } from "@/features/notes/useNotesModel";
import { buildGraphIndex } from "@/store/graphIndex";

// Helper to get CSS variable value
const getCssVar = (name: string) => {
  if (typeof window === "undefined") return "#000000";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
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
  onClick,
}: {
  simNode: SimNode;
  color: string;
  onHover: () => void;
  onUnhover: () => void;
  onClick: () => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(simNode.position);
    }
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={onHover}
      onPointerOut={onUnhover}
      onClick={onClick}
    >
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

const GraphConnection = ({
  startNode,
  endNode,
  color,
}: {
  startNode: SimNode;
  endNode: SimNode;
  color: string;
}) => {
  const lineRef = useRef<any>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  useFrame(() => {
    if (lineRef.current && geometryRef.current) {
      const positions = geometryRef.current.attributes.position
        .array as Float32Array;

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
  const { notes, openNote } = useNotesModel();
  const graphIndex = useMemo(() => buildGraphIndex(notes), [notes]);
  const noteIds = useMemo(
    () => Array.from(graphIndex.notesById.keys()),
    [graphIndex],
  );
  const [fgColor, setFgColor] = useState("");
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isNodeHovered, setIsNodeHovered] = useState(false);
  const [isPopupHovered, setIsPopupHovered] = useState(false);
  const hoverResumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverExitTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveredNoteIdRef = useRef<string | null>(null);
  const isNodeHoveredRef = useRef(false);
  const isPopupHoveredRef = useRef(false);
  const RESUME_DELAY_MS = 500;
  const HOVER_EXIT_GRACE_MS = 60;

  // Simulation state
  const simNodes = useRef<Map<string, SimNode>>(new Map());

  useEffect(() => {
    const updateColor = () => {
      setFgColor(getCssVar("--color-foreground") || "black");
    };
    updateColor();
    window.addEventListener("ink-theme-change", updateColor);
    return () => window.removeEventListener("ink-theme-change", updateColor);
  }, []);

  useEffect(() => {
    hoveredNoteIdRef.current = hoveredNoteId;
  }, [hoveredNoteId]);

  useEffect(() => {
    isNodeHoveredRef.current = isNodeHovered;
  }, [isNodeHovered]);

  useEffect(() => {
    isPopupHoveredRef.current = isPopupHovered;
  }, [isPopupHovered]);

  useEffect(() => {
    return () => {
      if (hoverResumeTimeout.current) {
        clearTimeout(hoverResumeTimeout.current);
      }
      if (hoverExitTimeout.current) {
        clearTimeout(hoverExitTimeout.current);
      }
    };
  }, []);

  // Initialize or cleanup nodes based on store updates
  useEffect(() => {
    const currentIds = new Set(noteIds);

    // Remove old nodes
    for (const [id] of simNodes.current) {
      if (!currentIds.has(id)) {
        simNodes.current.delete(id);
      }
    }

    // Add new nodes with random positions near center
    noteIds.forEach((noteId) => {
      if (!simNodes.current.has(noteId)) {
        simNodes.current.set(noteId, {
          id: noteId,
          position: new THREE.Vector3(
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 2,
          ),
          velocity: new THREE.Vector3(0, 0, 0),
        });
      }
    });
  }, [noteIds]);

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
    nodes.forEach((node) => {
      const force = new THREE.Vector3(0, 0, 0);

      // Center Gravity (pull towards 0,0,0)
      force.add(node.position.clone().multiplyScalar(-centerGravity));

      // Repulsion (between all pairs)
      nodes.forEach((other) => {
        if (node.id === other.id) return;
        const diff = node.position.clone().sub(other.position);
        const distSq = diff.lengthSq();
        if (distSq > 0) {
          // F = k/d^2 simplified
          force.add(
            diff.normalize().multiplyScalar(repulsion / Math.sqrt(distSq)),
          );
        }
      });

      // Spring (Connections)
      const neighbors = graphIndex.undirectedNeighbors.get(node.id);
      neighbors?.forEach((targetId) => {
        const targetNode = simNodes.current.get(targetId);
        if (targetNode) {
          const diff = targetNode.position.clone().sub(node.position);
          const dist = diff.length();
          const springForce = (dist - springLength) * springStrength;
          force.add(diff.normalize().multiplyScalar(springForce));
        }
      });

      // Apply to velocity
      node.velocity.add(force.multiplyScalar(dt));
      node.velocity.multiplyScalar(damping);
      node.velocity.clampLength(0, maxSpeed);
    });

    // 2. Update Positions
    nodes.forEach((node) => {
      node.position.add(node.velocity.clone().multiplyScalar(dt));
    });
  });

  return (
    <group>
      {/* Render Nodes */}
      {noteIds.map((noteId) => {
        const simNode = simNodes.current.get(noteId);
        if (!simNode) return null;
        return (
          <GraphNode
            key={noteId}
            simNode={simNode}
            color={fgColor}
            onHover={() => {
              setIsNodeHovered(true);
              setHoveredNoteId(noteId);
              setIsFrozen(true);
              if (hoverExitTimeout.current) {
                clearTimeout(hoverExitTimeout.current);
                hoverExitTimeout.current = null;
              }
              if (hoverResumeTimeout.current) {
                clearTimeout(hoverResumeTimeout.current);
              }
            }}
            onUnhover={() => {
              setIsNodeHovered(false);
              if (hoverExitTimeout.current) {
                clearTimeout(hoverExitTimeout.current);
              }
              hoverExitTimeout.current = setTimeout(() => {
                if (isPopupHoveredRef.current || isNodeHoveredRef.current) {
                  hoverExitTimeout.current = null;
                  return;
                }
                setHoveredNoteId((current) =>
                  current === noteId ? null : current,
                );
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
                hoverExitTimeout.current = null;
              }, HOVER_EXIT_GRACE_MS);
            }}
            onClick={() => void openNote(noteId)}
          />
        );
      })}

      {/* Render Connections */}
      {graphIndex.undirectedEdges.map(([startId, endId]) => {
        const startNode = simNodes.current.get(startId);
        const endNode = simNodes.current.get(endId);

        if (!startNode || !endNode) return null;

        return (
          <GraphConnection
            key={`${startId}-${endId}`}
            startNode={startNode}
            endNode={endNode}
            color={fgColor}
          />
        );
      })}

      {hoveredNoteId &&
        (() => {
          const hoveredNote = graphIndex.notesById.get(hoveredNoteId);
          const hoveredNode = simNodes.current.get(hoveredNoteId);
          if (!hoveredNote || !hoveredNode) return null;
          const title = hoveredNote.title?.trim() || "Untitled";
          return (
            <Html
              position={[
                hoveredNode.position.x,
                hoveredNode.position.y + 0.3,
                hoveredNode.position.z,
              ]}
              center
            >
              <div
                className="pointer-events-auto select-none bg-[var(--color-background)] text-[var(--color-foreground)] border border-[var(--color-foreground)] shadow-[3px_3px_0px_var(--color-foreground)] px-2 py-1 text-[10px] font-mono whitespace-nowrap"
                onClick={() => void openNote(hoveredNote.id)}
                onPointerEnter={() => {
                  setIsPopupHovered(true);
                  setIsFrozen(true);
                  if (hoverExitTimeout.current) {
                    clearTimeout(hoverExitTimeout.current);
                    hoverExitTimeout.current = null;
                  }
                  if (hoverResumeTimeout.current) {
                    clearTimeout(hoverResumeTimeout.current);
                  }
                }}
                onPointerLeave={() => {
                  setIsPopupHovered(false);
                  if (isNodeHoveredRef.current) {
                    return;
                  }
                  setHoveredNoteId(null);
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
              >
                {title}
              </div>
            </Html>
          );
        })()}

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        autoRotate={!isFrozen}
        autoRotateSpeed={0.5}
      />
    </group>
  );
};

export const BackgroundGraph = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-auto">
      <Canvas camera={{ position: [0, 0, 30], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <GraphScene />
      </Canvas>
    </div>
  );
};
