import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "./db";

export const LeadSchema = z.object({
  leadName: z.string().min(1, "Name is required").optional(),
  leadEmail: z.string().email("Valid email required").optional(),
  leadPhone: z.string().min(7, "Valid phone required").optional(),
  leadAddress: z.string().min(4, "Address too short").optional(),
});

export const ProjectSchema = z.object({
  id: z.string().optional(),
  projectType: z.enum(["Kitchen", "Bathroom", "Basement", "Exterior", "Other"]),
  style: z.string(),
  quality: z.enum(["Good", "Better", "Best"]),
  roomSizeSqft: z.number().min(1).max(100000),
  description: z.string().default(""),
  selectedProducts: z.any().default([]),
  images: z.array(z.string()).default([]),     // data URLs
  renders: z.any().default([]),
  estimate: z.any().default(null),
  lead: LeadSchema.default({}),
});

export type Project = z.infer<typeof ProjectSchema>;

export function createOrUpdateProject(input: Project) {
  const db = getDb();
  const now = new Date().toISOString();
  const id = input.id ?? uuidv4();

  const row = {
    id,
    created_at: input.id ? undefined : now,
    updated_at: now,

    lead_name: input.lead?.leadName ?? null,
    lead_email: input.lead?.leadEmail ?? null,
    lead_phone: input.lead?.leadPhone ?? null,
    lead_address: input.lead?.leadAddress ?? null,

    project_type: input.projectType,
    style: input.style,
    quality: input.quality,
    room_size_sqft: Math.round(input.roomSizeSqft),
    description: input.description ?? "",

    selected_products_json: JSON.stringify(input.selectedProducts ?? []),
    images_json: JSON.stringify(input.images ?? []),
    renders_json: JSON.stringify(input.renders ?? []),
    estimate_json: JSON.stringify(input.estimate ?? null),
  };

  if (input.id) {
    const stmt = db.prepare(`
      UPDATE projects SET
        updated_at=@updated_at,
        lead_name=@lead_name,
        lead_email=@lead_email,
        lead_phone=@lead_phone,
        lead_address=@lead_address,
        project_type=@project_type,
        style=@style,
        quality=@quality,
        room_size_sqft=@room_size_sqft,
        description=@description,
        selected_products_json=@selected_products_json,
        images_json=@images_json,
        renders_json=@renders_json,
        estimate_json=@estimate_json
      WHERE id=@id
    `);
    stmt.run(row);
  } else {
    const stmt = db.prepare(`
      INSERT INTO projects (
        id, created_at, updated_at,
        lead_name, lead_email, lead_phone, lead_address,
        project_type, style, quality, room_size_sqft, description,
        selected_products_json, images_json, renders_json, estimate_json
      ) VALUES (
        @id, @created_at, @updated_at,
        @lead_name, @lead_email, @lead_phone, @lead_address,
        @project_type, @style, @quality, @room_size_sqft, @description,
        @selected_products_json, @images_json, @renders_json, @estimate_json
      )
    `);
    stmt.run({ ...row, created_at: now });
  }

  return id;
}

export function listProjects(limit = 25) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT id, created_at, updated_at,
      lead_name, lead_email, lead_phone, lead_address,
      project_type, style, quality, room_size_sqft, description
    FROM projects
    ORDER BY updated_at DESC
    LIMIT ?
  `);
  const rows = stmt.all(limit) as any[];
  return rows.map(r => ({
    id: r.id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    leadName: r.lead_name,
    leadEmail: r.lead_email,
    leadPhone: r.lead_phone,
    leadAddress: r.lead_address,
    projectType: r.project_type,
    style: r.style,
    quality: r.quality,
    roomSizeSqft: r.room_size_sqft,
    description: r.description,
  }));
}

export function getProject(id: string) {
  const db = getDb();
  const stmt = db.prepare(`SELECT * FROM projects WHERE id = ?`);
  const r = stmt.get(id) as any;
  if (!r) return null;

  return {
    id: r.id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    lead: {
      leadName: r.lead_name ?? undefined,
      leadEmail: r.lead_email ?? undefined,
      leadPhone: r.lead_phone ?? undefined,
      leadAddress: r.lead_address ?? undefined,
    },
    projectType: r.project_type,
    style: r.style,
    quality: r.quality,
    roomSizeSqft: r.room_size_sqft,
    description: r.description,
    selectedProducts: JSON.parse(r.selected_products_json || "[]"),
    images: JSON.parse(r.images_json || "[]"),
    renders: JSON.parse(r.renders_json || "[]"),
    estimate: JSON.parse(r.estimate_json || "null"),
  };
}
