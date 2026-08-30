const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

// Re-export so screens can import display constants alongside the API helpers.
export { INR_TO_USD } from "@/src/theme";

export const API = `${BASE}/api`;

// AI-generated editorial imagery, served (and reused) from the backend.
export const media = (name: string) => `${API}/media/${name}`;

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body: unknown) =>
    request(path, { method: "POST", body: JSON.stringify(body) }),
};

// Types --------------------------------------------------------------------
export type Jacket = {
  id: string;
  name: string;
  hero?: boolean;
  tagline?: string;
  category: string;
  silhouette: string;
  quilt: string;
  colour: string;
  craft_intensity: string;
  price_inr: number;
  production_days: number;
  image: string;
  reverse_image: string;
  front_image: string;
  detail_image: string;
  tags: string[];
  material: string;
  craft: string;
  description: string;
};

export type Selection = {
  silhouette: string;
  quilt: string;
  colour: string;
  craft: string;
  personal: string;
  personal_value?: string | null;
};

export type ComputeResult = {
  price: { lines: { label: string; amount: number }[]; total_inr: number; total_usd: number };
  madeability: {
    score: number;
    makeable: boolean;
    conflicts: { message: string; fix: Partial<Selection>; fix_label: string }[];
  };
  editorial: string;
  selection: Selection;
};
