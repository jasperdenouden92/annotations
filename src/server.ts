/**
 * Server-side helpers for Notion comments API.
 * Import from "@jasperdenouden92/annotations/server"
 */

import type { Comment } from "./types";

interface CommentInput {
  annotationId: string;
  auteur?: string;
  comment: string;
  pagina?: string;
  label?: string;
}

/**
 * Builds Notion page properties for creating a comment.
 * Use this in your POST /api/comments handler to ensure all fields are included.
 */
export function buildNotionCommentProperties(
  input: CommentInput,
  projectId: string
): Record<string, unknown> {
  return {
    Naam: {
      title: [{ text: { content: input.comment } }],
    },
    Auteur: {
      rich_text: [{ text: { content: input.auteur || "Anoniem" } }],
    },
    Comment: {
      rich_text: [{ text: { content: input.comment } }],
    },
    Status: {
      select: { name: "Open" },
    },
    Project: {
      relation: [{ id: projectId }],
    },
    "Annotatie ID": {
      rich_text: [{ text: { content: input.annotationId } }],
    },
    Label: {
      rich_text: [{ text: { content: input.label || "" } }],
    },
    Pagina: {
      rich_text: [{ text: { content: input.pagina || "" } }],
    },
  };
}

/**
 * Parses a Notion page result into a Comment object.
 * Use this in your GET /api/comments handler.
 */
export function parseNotionComment(page: any): Comment {
  return {
    id: page.id,
    annotationId: getPlainText(page.properties["Annotatie ID"]),
    auteur: getPlainText(page.properties["Auteur"]),
    comment: getPlainText(page.properties["Comment"]),
    label: getPlainText(page.properties["Label"]),
    status: page.properties["Status"]?.select?.name ?? "Open",
    aangemaakt: page.properties["Aangemaakt"]?.created_time ?? page.created_time,
    antwoord: getPlainText(page.properties["Antwoord"]),
    pagina: getPlainText(page.properties["Pagina"]),
  };
}

function getPlainText(property: any): string {
  if (!property) return "";
  if (property.rich_text) {
    return property.rich_text.map((t: any) => t.plain_text).join("");
  }
  if (property.title) {
    return property.title.map((t: any) => t.plain_text).join("");
  }
  return "";
}
