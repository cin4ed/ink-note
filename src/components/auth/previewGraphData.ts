export interface PreviewNode {
  id: string;
  title: string;
  snippet: string;
  seed: {
    x: number;
    y: number;
  };
}

export interface PreviewEdge {
  source: string;
  target: string;
}

export const previewNodes: PreviewNode[] = [
  // ── Core cluster ──
  {
    id: "capture",
    title: "Capture ideas quickly",
    snippet:
      "Create notes with Cmd/Ctrl + N and place them freely on the canvas.",
    seed: { x: 0.26, y: 0.38 },
  },
  {
    id: "mention",
    title: "Connect with mentions",
    snippet:
      "Type @ in any note to link concepts together and build your knowledge graph.",
    seed: { x: 0.44, y: 0.24 },
  },
  {
    id: "graph",
    title: "Visualize relationships",
    snippet:
      "The background graph helps you spot clusters and related notes at a glance.",
    seed: { x: 0.58, y: 0.42 },
  },
  {
    id: "search",
    title: "Jump with command search",
    snippet: "Use Cmd/Ctrl + P to find any note title instantly.",
    seed: { x: 0.4, y: 0.6 },
  },
  {
    id: "focus",
    title: "Focused writing",
    snippet:
      "Open multiple note windows and keep your active thought in front.",
    seed: { x: 0.66, y: 0.66 },
  },
  {
    id: "theme",
    title: "Theme when needed",
    snippet: "Switch light/dark styling with Cmd/Ctrl + Shift + L.",
    seed: { x: 0.22, y: 0.72 },
  },
  {
    id: "recent",
    title: "Resume where you left",
    snippet: "Recent notes stay one click away, so context is never lost.",
    seed: { x: 0.74, y: 0.28 },
  },

  // ── Outer ring / secondary clusters ──
  {
    id: "spatial",
    title: "Spatial thinking",
    snippet: "Position notes in space to mirror how you naturally organize ideas.",
    seed: { x: 0.12, y: 0.2 },
  },
  {
    id: "freeform",
    title: "Freeform canvas",
    snippet: "No rigid hierarchy — drag, resize, and arrange notes your way.",
    seed: { x: 0.15, y: 0.52 },
  },
  {
    id: "web",
    title: "Web of thought",
    snippet: "Every mention creates a two-way link, weaving your notes together.",
    seed: { x: 0.35, y: 0.12 },
  },
  {
    id: "clusters",
    title: "Idea clusters",
    snippet: "Related thoughts naturally gravitate into visible groups.",
    seed: { x: 0.82, y: 0.48 },
  },
  {
    id: "richtext",
    title: "Rich text editor",
    snippet: "Write with headings, lists, code blocks, and inline formatting.",
    seed: { x: 0.72, y: 0.78 },
  },
  {
    id: "minimal",
    title: "Minimal by design",
    snippet: "A clean interface that stays out of your way while you think.",
    seed: { x: 0.88, y: 0.18 },
  },
  {
    id: "keyboard",
    title: "Keyboard-first",
    snippet: "Navigate, create, and search without ever leaving the keyboard.",
    seed: { x: 0.52, y: 0.82 },
  },
  {
    id: "context",
    title: "Never lose context",
    snippet: "Recent notes and linked mentions keep your train of thought intact.",
    seed: { x: 0.08, y: 0.88 },
  },
  {
    id: "discovery",
    title: "Rediscover ideas",
    snippet: "The graph surface reveals forgotten connections between old notes.",
    seed: { x: 0.92, y: 0.68 },
  },
  {
    id: "drift",
    title: "Let ideas drift",
    snippet: "Place a rough thought now, refine and connect it later.",
    seed: { x: 0.3, y: 0.88 },
  },
  {
    id: "flow",
    title: "Flow state",
    snippet: "Distraction-free windows keep you in the zone.",
    seed: { x: 0.62, y: 0.14 },
  },
  {
    id: "refine",
    title: "Iterative refinement",
    snippet: "Return to notes over time, layering detail as ideas mature.",
    seed: { x: 0.86, y: 0.36 },
  },
  {
    id: "spark",
    title: "Spark connections",
    snippet: "Stumble upon surprising links between seemingly unrelated notes.",
    seed: { x: 0.48, y: 0.48 },
  },
  {
    id: "anchor",
    title: "Anchor thoughts",
    snippet: "Pin key ideas in prominent positions on your canvas.",
    seed: { x: 0.18, y: 0.35 },
  },
  {
    id: "branch",
    title: "Branch out",
    snippet: "One idea leads to another — follow the thread wherever it goes.",
    seed: { x: 0.76, y: 0.56 },
  },
];

export const previewEdges: PreviewEdge[] = [
  // Original connections
  { source: "capture", target: "mention" },
  { source: "mention", target: "graph" },
  { source: "capture", target: "search" },
  { source: "search", target: "focus" },
  { source: "capture", target: "theme" },
  { source: "graph", target: "recent" },
  { source: "recent", target: "focus" },
  { source: "mention", target: "focus" },

  // New connections weaving in the additional nodes
  { source: "spatial", target: "capture" },
  { source: "spatial", target: "web" },
  { source: "spatial", target: "freeform" },
  { source: "freeform", target: "capture" },
  { source: "freeform", target: "theme" },
  { source: "web", target: "mention" },
  { source: "web", target: "flow" },
  { source: "clusters", target: "graph" },
  { source: "clusters", target: "branch" },
  { source: "clusters", target: "discovery" },
  { source: "richtext", target: "focus" },
  { source: "richtext", target: "keyboard" },
  { source: "minimal", target: "recent" },
  { source: "minimal", target: "flow" },
  { source: "minimal", target: "refine" },
  { source: "keyboard", target: "search" },
  { source: "keyboard", target: "drift" },
  { source: "context", target: "theme" },
  { source: "context", target: "drift" },
  { source: "discovery", target: "refine" },
  { source: "discovery", target: "branch" },
  { source: "drift", target: "search" },
  { source: "flow", target: "focus" },
  { source: "refine", target: "clusters" },
  { source: "spark", target: "graph" },
  { source: "spark", target: "mention" },
  { source: "spark", target: "capture" },
  { source: "anchor", target: "spatial" },
  { source: "anchor", target: "capture" },
  { source: "branch", target: "richtext" },
  { source: "branch", target: "focus" },
];
