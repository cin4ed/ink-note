import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { previewEdges, previewNodes } from "./previewGraphData";

interface SimNode {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
}

const NODE_RADIUS = 0.13;

const GRAPH_CAMERA_DISTANCE = 20;
const GRAPH_CAMERA_FOV = 58;

const getCssVar = (name: string) => {
  if (typeof window === "undefined") return "#16151D";
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    "#16151D"
  );
};

const GraphNode = ({ simNode, color }: { simNode: SimNode; color: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.copy(simNode.position);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[NODE_RADIUS, 24, 24]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

const GraphEdge = ({
  startNode,
  endNode,
  color,
}: {
  startNode: SimNode;
  endNode: SimNode;
  color: string;
}) => {
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  useFrame(() => {
    if (!geometryRef.current) return;
    const attr = geometryRef.current.attributes
      .position as THREE.BufferAttribute;
    attr.array[0] = startNode.position.x;
    attr.array[1] = startNode.position.y;
    attr.array[2] = startNode.position.z;
    attr.array[3] = endNode.position.x;
    attr.array[4] = endNode.position.y;
    attr.array[5] = endNode.position.z;
    attr.needsUpdate = true;
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

const AmbientGraphScene = () => {
  const [fgColor, setFgColor] = useState("");

  const [simNodes] = useState<SimNode[]>(() =>
    previewNodes.map((node) => ({
      id: node.id,
      position: new THREE.Vector3(
        (node.seed.x - 0.5) * 12,
        (0.5 - node.seed.y) * 9,
        (Math.random() - 0.5) * 5,
      ),
      velocity: new THREE.Vector3(0, 0, 0),
    })),
  );

  const nodeById = useMemo(
    () => new Map(simNodes.map((n) => [n.id, n])),
    [simNodes],
  );

  const edgeNodes = useMemo(
    () =>
      previewEdges
        .map((edge) => {
          const start = nodeById.get(edge.source);
          const end = nodeById.get(edge.target);
          if (!start || !end) return null;
          return { key: `${edge.source}-${edge.target}`, start, end };
        })
        .filter(
          (e): e is { key: string; start: SimNode; end: SimNode } => e !== null,
        ),
    [nodeById],
  );

  useEffect(() => {
    const update = () => setFgColor(getCssVar("--color-foreground"));
    update();
    window.addEventListener("ink-theme-change", update);
    return () => window.removeEventListener("ink-theme-change", update);
  }, []);

  useFrame(() => {
    const repulsion = 0.5;
    const springLength = 3.2;
    const springStrength = 0.09;
    const centerGravity = 0.07;
    const damping = 0.88;
    const maxSpeed = 0.5;
    const dt = 0.1;

    for (let i = 0; i < simNodes.length; i += 1) {
      const node = simNodes[i];
      const force = new THREE.Vector3();

      force.add(node.position.clone().multiplyScalar(-centerGravity));

      for (let j = 0; j < simNodes.length; j += 1) {
        if (i === j) continue;
        const diff = node.position.clone().sub(simNodes[j].position);
        const distSq = diff.lengthSq();
        if (distSq > 0) {
          force.add(
            diff.normalize().multiplyScalar(repulsion / Math.sqrt(distSq)),
          );
        }
      }

      for (const edge of edgeNodes) {
        let target: SimNode | null = null;
        if (edge.start.id === node.id) target = edge.end;
        else if (edge.end.id === node.id) target = edge.start;

        if (target) {
          const diff = target.position.clone().sub(node.position);
          const dist = diff.length();
          force.add(
            diff
              .normalize()
              .multiplyScalar((dist - springLength) * springStrength),
          );
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
          startNode={edge.start}
          endNode={edge.end}
          color={fgColor}
        />
      ))}

      {simNodes.map((node) => (
        <GraphNode key={node.id} simNode={node} color={fgColor} />
      ))}

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
        autoRotate
        autoRotateSpeed={0.4}
      />
    </group>
  );
};

export const InkNotePreviewGraph = () => {
  return (
    <div className="preview-graph-container">
      <div className="preview-graph-surface">
        <Canvas
          camera={{
            position: [0, 0, GRAPH_CAMERA_DISTANCE],
            fov: GRAPH_CAMERA_FOV,
          }}
          gl={{ alpha: true, antialias: true }}
          style={{ pointerEvents: "none" }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
        >
          <ambientLight intensity={0.55} />
          <pointLight position={[10, 10, 10]} intensity={1.2} />
          <AmbientGraphScene />
        </Canvas>
      </div>
    </div>
  );
};
