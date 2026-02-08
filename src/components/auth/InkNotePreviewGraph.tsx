import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { previewEdges, previewNodes } from "./previewGraphData";

interface SimNode {
  id: string;
  title: string;
  snippet: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
}

interface GraphNodeProps {
  simNode: SimNode;
  color: string;
  isActive: boolean;
  onHover: () => void;
  onUnhover: () => void;
  onClick: () => void;
}

interface GraphEdgeProps {
  startNode: SimNode;
  endNode: SimNode;
  color: string;
}

const NODE_RADIUS = 0.16;
const HIT_RADIUS = 0.54;

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
  onClick,
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
      onClick={(event) => {
        event.stopPropagation();
        onClick();
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
  selectedId,
  onHover,
  onUnhover,
  onSelect,
}: {
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string) => void;
  onUnhover: (id: string) => void;
  onSelect: (id: string) => void;
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
      setFgColor(getCssVar("--color-fg"));
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
          isActive={node.id === hoveredId || node.id === selectedId}
          onHover={() => onHover(node.id)}
          onUnhover={() => onUnhover(node.id)}
          onClick={() => onSelect(node.id)}
        />
      ))}

      <OrbitControls
        enableZoom
        enablePan={false}
        autoRotate={!hoveredId}
        autoRotateSpeed={0.52}
      />
    </group>
  );
};

export const InkNotePreviewGraph = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const nodeById = useMemo(
    () => new Map(previewNodes.map((node) => [node.id, node])),
    [],
  );

  const activeId = hoveredId ?? selectedId;
  const activeNode = activeId ? (nodeById.get(activeId) ?? null) : null;

  return (
    <div className="preview-graph-container">
      <div className="preview-graph-surface">
        <Canvas
          camera={{ position: [0, 0, 15], fov: 58 }}
          gl={{ alpha: true, antialias: true }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
        >
          <ambientLight intensity={0.55} />
          <pointLight position={[10, 10, 10]} intensity={1.2} />
          <PreviewGraphScene
            hoveredId={hoveredId}
            selectedId={selectedId}
            onHover={(id) => setHoveredId(id)}
            onUnhover={(id) =>
              setHoveredId((current) => (current === id ? null : current))
            }
            onSelect={(id) => setSelectedId(id)}
          />
        </Canvas>

        {activeNode && (
          <div className="preview-graph-note-card">
            <div className="preview-graph-note-title">{activeNode.title}</div>
            <p>{activeNode.snippet}</p>
          </div>
        )}
      </div>
    </div>
  );
};
