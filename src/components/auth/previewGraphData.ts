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
    snippet:
      "Use Cmd/Ctrl + P to find any note title instantly.",
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
    snippet:
      "Switch light/dark styling with Cmd/Ctrl + Shift + L.",
    seed: { x: 0.22, y: 0.72 },
  },
  {
    id: "recent",
    title: "Resume where you left",
    snippet:
      "Recent notes stay one click away, so context is never lost.",
    seed: { x: 0.74, y: 0.28 },
  },
];

export const previewEdges: PreviewEdge[] = [
  { source: "capture", target: "mention" },
  { source: "mention", target: "graph" },
  { source: "capture", target: "search" },
  { source: "search", target: "focus" },
  { source: "capture", target: "theme" },
  { source: "graph", target: "recent" },
  { source: "recent", target: "focus" },
  { source: "mention", target: "focus" },
];
