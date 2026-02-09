import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Draggable, {
  type DraggableData,
  type DraggableEvent,
} from "react-draggable";
import * as THREE from "three";
import { previewEdges, previewNodes } from "./previewGraphData";

interface SimNode {
  id: string;
  title: string;
  snippet: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
}

interface OpenPreviewNote {
  id: string;
  x: number;
  y: number;
  z: number;
}

interface GraphNodeProps {
  simNode: SimNode;
  color: string;
  isActive: boolean;
  onHover: () => void;
  onUnhover: () => void;
  onOpen: () => void;
}

interface GraphEdgeProps {
  startNode: SimNode;
  endNode: SimNode;
  color: string;
}

const NODE_RADIUS = 0.15;
const HIT_RADIUS = 0.55;

/** Default camera distance (z). Larger = more zoomed out, smaller = more zoomed in. */
const GRAPH_CAMERA_DISTANCE = 12;
/** Camera field of view in degrees. */
const GRAPH_CAMERA_FOV = 58;

const NOTE_WINDOW_WIDTH = 500;
const NOTE_WINDOW_HEIGHT = 400;
const NOTE_WINDOW_MARGIN = 12;
const NOTE_WINDOW_OFFSET_STEP = 26;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getCssVar = (name: string) => {
  if (typeof window === "undefined") return "#16151D";
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    "#16151D"
  );
};

const GraphNode = ({
  simNode,
  color,
  isActive,
  onHover,
  onUnhover,
  onOpen,
}: GraphNodeProps) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.copy(simNode.position);
    const targetScale = isActive ? 1.35 : 1;
    const nextScale = THREE.MathUtils.lerp(
      groupRef.current.scale.x,
      targetScale,
      0.24,
    );
    groupRef.current.scale.setScalar(nextScale);
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover();
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        onUnhover();
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onOpen();
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
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

const GraphEdge = ({ startNode, endNode, color }: GraphEdgeProps) => {
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  useFrame(() => {
    if (!geometryRef.current) return;
    const attribute = geometryRef.current.attributes
      .position as THREE.BufferAttribute;
    attribute.array[0] = startNode.position.x;
    attribute.array[1] = startNode.position.y;
    attribute.array[2] = startNode.position.z;
    attribute.array[3] = endNode.position.x;
    attribute.array[4] = endNode.position.y;
    attribute.array[5] = endNode.position.z;
    attribute.needsUpdate = true;
  });

  return (
    <line>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={new Float32Array(6)}
          itemSize={3}
          args={[new Float32Array(6), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} />
    </line>
  );
};

const PreviewGraphScene = ({
  hoveredId,
  selectedIds,
  onHover,
  onUnhover,
  onOpenNote,
}: {
  hoveredId: string | null;
  selectedIds: Set<string>;
  onHover: (id: string) => void;
  onUnhover: (id: string) => void;
  onOpenNote: (id: string) => void;
}) => {
  const [fgColor, setFgColor] = useState("");

  const [simNodes] = useState<SimNode[]>(() =>
    previewNodes.map((node) => ({
      id: node.id,
      title: node.title,
      snippet: node.snippet,
      position: new THREE.Vector3(
        (node.seed.x - 0.5) * 10,
        (0.5 - node.seed.y) * 7,
        (Math.random() - 0.5) * 4,
      ),
      velocity: new THREE.Vector3(0, 0, 0),
    })),
  );

  const nodeById = useMemo(
    () => new Map(simNodes.map((node) => [node.id, node])),
    [simNodes],
  );

  const edgeNodes = useMemo(
    () =>
      previewEdges
        .map((edge) => {
          const startNode = nodeById.get(edge.source);
          const endNode = nodeById.get(edge.target);
          if (!startNode || !endNode) return null;
          return {
            key: `${edge.source}-${edge.target}`,
            startNode,
            endNode,
          };
        })
        .filter(
          (
            edge,
          ): edge is { key: string; startNode: SimNode; endNode: SimNode } =>
            edge !== null,
        ),
    [nodeById],
  );

  useEffect(() => {
    const updateColor = () => {
      setFgColor(getCssVar("--color-foreground"));
    };

    updateColor();
    window.addEventListener("ink-theme-change", updateColor);
    return () => window.removeEventListener("ink-theme-change", updateColor);
  }, []);

  useFrame(() => {
    if (hoveredId) return;

    const repulsion = 0.6;
    const springLength = 3;
    const springStrength = 0.11;
    const centerGravity = 0.09;
    const damping = 0.9;
    const maxSpeed = 0.65;
    const dt = 0.1;

    for (let i = 0; i < simNodes.length; i += 1) {
      const node = simNodes[i];
      const force = new THREE.Vector3();

      force.add(node.position.clone().multiplyScalar(-centerGravity));

      for (let j = 0; j < simNodes.length; j += 1) {
        if (i === j) continue;
        const other = simNodes[j];
        const diff = node.position.clone().sub(other.position);
        const distSq = diff.lengthSq();
        if (distSq > 0) {
          force.add(
            diff.normalize().multiplyScalar(repulsion / Math.sqrt(distSq)),
          );
        }
      }

      for (const edge of edgeNodes) {
        let targetNode: SimNode | null = null;
        if (edge.startNode.id === node.id) {
          targetNode = edge.endNode;
        } else if (edge.endNode.id === node.id) {
          targetNode = edge.startNode;
        }

        if (targetNode) {
          const diff = targetNode.position.clone().sub(node.position);
          const distance = diff.length();
          const springForce = (distance - springLength) * springStrength;
          force.add(diff.normalize().multiplyScalar(springForce));
        }
      }

      node.velocity.add(force.multiplyScalar(dt));
      node.velocity.multiplyScalar(damping);
      node.velocity.clampLength(0, maxSpeed);
    }

    for (const node of simNodes) {
      node.position.add(node.velocity.clone().multiplyScalar(dt));
    }
  });

  const hoveredNode = hoveredId ? (nodeById.get(hoveredId) ?? null) : null;

  return (
    <group>
      {edgeNodes.map((edge) => (
        <GraphEdge
          key={edge.key}
          startNode={edge.startNode}
          endNode={edge.endNode}
          color={fgColor}
        />
      ))}

      {simNodes.map((node) => (
        <GraphNode
          key={node.id}
          simNode={node}
          color={fgColor}
          isActive={node.id === hoveredId || selectedIds.has(node.id)}
          onHover={() => onHover(node.id)}
          onUnhover={() => onUnhover(node.id)}
          onOpen={() => onOpenNote(node.id)}
        />
      ))}

      {hoveredNode && (
        <Html
          position={[
            hoveredNode.position.x,
            hoveredNode.position.y + 0.35,
            hoveredNode.position.z,
          ]}
          center
        >
          <div className="pointer-events-none select-none bg-[var(--color-background)] text-[var(--color-foreground)] border border-[var(--color-foreground)] shadow-[3px_3px_0px_var(--color-foreground)] px-2 py-1 text-[10px] font-mono whitespace-nowrap">
            {hoveredNode.title}
          </div>
        </Html>
      )}

      <OrbitControls
        enableZoom
        enablePan={false}
        autoRotate={!hoveredId}
        autoRotateSpeed={0.52}
      />
    </group>
  );
};

const PreviewNoteWindow = ({
  note,
  data,
  onDrag,
  onBringToFront,
  onClose,
}: {
  note: { id: string; title: string; snippet: string };
  data: OpenPreviewNote;
  onDrag: (id: string, x: number, y: number) => void;
  onBringToFront: (id: string) => void;
  onClose: (id: string) => void;
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      nodeRef={nodeRef}
      position={{ x: data.x, y: data.y }}
      handle=".preview-note-window-header"
      cancel=".preview-note-window-close"
      onStart={() => {
        onBringToFront(data.id);
      }}
      onDrag={(_event: DraggableEvent, dragData: DraggableData) => {
        onDrag(data.id, dragData.x, dragData.y);
      }}
    >
      <article
        ref={nodeRef}
        className="absolute pointer-events-auto flex h-[178px] w-[280px] flex-col overflow-hidden border border-[var(--color-foreground)] bg-[var(--color-background)] shadow-[3px_3px_0px_var(--color-foreground)]"
        style={{ top: 0, left: 0, zIndex: data.z }}
        onMouseDown={() => onBringToFront(data.id)}
        aria-label={`Preview note ${note.title}`}
      >
        <header className="preview-note-window-header flex cursor-move items-center justify-between border-b border-[var(--color-foreground)] px-2 py-1">
          <h3 className="m-0 truncate text-xs font-bold tracking-tight">
            {note.title}
          </h3>
          <button
            type="button"
            className="preview-note-window-close ml-2 h-6 w-6 cursor-pointer border-0 bg-transparent text-xl leading-none text-[var(--color-foreground)] opacity-70 transition-opacity duration-150 hover:opacity-100"
            onClick={() => onClose(data.id)}
            aria-label="Close note"
          >
            ×
          </button>
        </header>
        <p className="m-0 flex-1 overflow-y-auto p-2 text-[11px] leading-[1.4] opacity-80">
          {note.snippet}
        </p>
      </article>
    </Draggable>
  );
};

export const InkNotePreviewGraph = () => {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const zCounterRef = useRef(5);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [openNotes, setOpenNotes] = useState<OpenPreviewNote[]>([]);
  const [surfaceSize, setSurfaceSize] = useState({ width: 0, height: 0 });

  const nodeById = useMemo(
    () => new Map(previewNodes.map((node) => [node.id, node])),
    [],
  );

  const selectedIds = useMemo(
    () => new Set(openNotes.map((note) => note.id)),
    [openNotes],
  );

  useEffect(() => {
    const element = surfaceRef.current;
    if (!element) return;

    const syncSize = () => {
      const rect = element.getBoundingClientRect();
      setSurfaceSize({
        width: Math.max(0, rect.width),
        height: Math.max(0, rect.height),
      });
    };

    syncSize();
    const observer = new ResizeObserver(syncSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const nextZIndex = useCallback(() => {
    zCounterRef.current += 1;
    return zCounterRef.current;
  }, []);

  const clampWindowPosition = useCallback(
    (x: number, y: number) => {
      const maxX = Math.max(
        NOTE_WINDOW_MARGIN,
        surfaceSize.width - NOTE_WINDOW_WIDTH - NOTE_WINDOW_MARGIN,
      );
      const maxY = Math.max(
        NOTE_WINDOW_MARGIN,
        surfaceSize.height - NOTE_WINDOW_HEIGHT - NOTE_WINDOW_MARGIN,
      );

      return {
        x: clamp(x, NOTE_WINDOW_MARGIN, maxX),
        y: clamp(y, NOTE_WINDOW_MARGIN, maxY),
      };
    },
    [surfaceSize.height, surfaceSize.width],
  );

  const bringToFront = useCallback(
    (id: string) => {
      const nextZ = nextZIndex();
      setOpenNotes((current) =>
        current.map((item) => (item.id === id ? { ...item, z: nextZ } : item)),
      );
    },
    [nextZIndex],
  );

  const openNote = useCallback(
    (id: string) => {
      setOpenNotes((current) => {
        const existing = current.find((item) => item.id === id);
        const nextZ = nextZIndex();

        if (existing) {
          return current.map((item) =>
            item.id === id ? { ...item, z: nextZ } : item,
          );
        }

        const offset = current.length * NOTE_WINDOW_OFFSET_STEP;
        const baseX =
          surfaceSize.width - NOTE_WINDOW_WIDTH - NOTE_WINDOW_MARGIN - offset;
        const baseY = NOTE_WINDOW_MARGIN + offset;
        const position = clampWindowPosition(baseX, baseY);

        return [...current, { id, x: position.x, y: position.y, z: nextZ }];
      });
    },
    [clampWindowPosition, nextZIndex, surfaceSize.width],
  );

  const moveNote = useCallback((id: string, x: number, y: number) => {
    setOpenNotes((current) =>
      current.map((item) => (item.id === id ? { ...item, x, y } : item)),
    );
  }, []);

  const closeNote = useCallback((id: string) => {
    setOpenNotes((current) => current.filter((item) => item.id !== id));
  }, []);

  return (
    <div className="preview-graph-container">
      <div ref={surfaceRef} className="preview-graph-surface">
        <Canvas
          camera={{ position: [0, 0, GRAPH_CAMERA_DISTANCE], fov: GRAPH_CAMERA_FOV }}
          gl={{ alpha: true, antialias: true }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
        >
          <ambientLight intensity={0.55} />
          <pointLight position={[10, 10, 10]} intensity={1.2} />
          <PreviewGraphScene
            hoveredId={hoveredId}
            selectedIds={selectedIds}
            onHover={(id) => setHoveredId(id)}
            onUnhover={(id) =>
              setHoveredId((current) => (current === id ? null : current))
            }
            onOpenNote={openNote}
          />
        </Canvas>

        {openNotes.map((openNoteData) => {
          const note = nodeById.get(openNoteData.id);
          if (!note) return null;

          return (
            <PreviewNoteWindow
              key={openNoteData.id}
              note={note}
              data={openNoteData}
              onDrag={moveNote}
              onBringToFront={bringToFront}
              onClose={closeNote}
            />
          );
        })}
      </div>
    </div>
  );
};
