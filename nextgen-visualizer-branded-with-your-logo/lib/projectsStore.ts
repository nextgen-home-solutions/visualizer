import fs from "fs";
import path from "path";

export type SavedProject = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  timeline?: string;
  projectType: string;
  style: string;
  quality: string;
  roomSizeSqft: number;
  description: string;
  selectedProducts: Array<{ sku: string; name: string; qty: number; price: number; unit: string }>;
  images: string[]; // data URLs (MVP)
  variants: Array<{ id: string; label: string; imageDataUrl: string }>;
  estimate?: any;
};

const STORE_PATH = path.join(process.cwd(), "data", "projects.json");

function ensureStore() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) fs.writeFileSync(STORE_PATH, JSON.stringify({ projects: [] }, null, 2));
}

export function readProjects(): SavedProject[] {
  ensureStore();
  const raw = fs.readFileSync(STORE_PATH, "utf-8");
  const parsed = JSON.parse(raw || "{}");
  return parsed.projects ?? [];
}

export function writeProjects(projects: SavedProject[]) {
  ensureStore();
  fs.writeFileSync(STORE_PATH, JSON.stringify({ projects }, null, 2));
}

export function addProject(p: SavedProject) {
  const projects = readProjects();
  projects.unshift(p);
  writeProjects(projects.slice(0, 50)); // keep last 50 (MVP)
  return p;
}

export function getProject(id: string) {
  return readProjects().find(p => p.id === id) ?? null;
}

export function deleteProject(id: string) {
  const projects = readProjects().filter(p => p.id !== id);
  writeProjects(projects);
}
