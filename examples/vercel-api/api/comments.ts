import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID!;
const PROJECT_ID = process.env.NOTION_PROJECT_ID;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    const { annotationId } = req.query;

    try {
      const filters: any[] = [];

      if (PROJECT_ID) {
        filters.push({
          property: "Project",
          relation: { contains: PROJECT_ID },
        });
      }

      if (annotationId) {
        filters.push({
          property: "Annotatie ID",
          rich_text: { equals: annotationId as string },
        });
      }

      const response = await notion.databases.query({
        database_id: DATABASE_ID,
        ...(filters.length > 0 ? { filter: { and: filters } } : {}),
        sorts: [{ property: "Aangemaakt", direction: "ascending" }],
      });

      const comments = response.results.map((page: any) => ({
        id: page.id,
        auteur: page.properties["Auteur"]?.rich_text?.[0]?.plain_text ?? "",
        comment: page.properties["Comment"]?.rich_text?.[0]?.plain_text ?? "",
        status: page.properties["Status"]?.status?.name ?? "Open",
        antwoord: page.properties["Antwoord"]?.rich_text?.[0]?.plain_text ?? null,
        aangemaakt: page.properties["Aangemaakt"]?.created_time ?? "",
        pagina: page.properties["Pagina"]?.rich_text?.[0]?.plain_text ?? undefined,
        label: page.properties["Label"]?.rich_text?.[0]?.plain_text ?? undefined,
        annotationId: page.properties["Annotatie ID"]?.rich_text?.[0]?.plain_text ?? undefined,
      }));

      return res.status(200).json(comments);
    } catch (err) {
      console.error("Notion query failed:", err);
      return res.status(500).json({ error: "Failed to fetch comments" });
    }
  }

  if (req.method === "POST") {
    const { annotationId, auteur, comment, pagina, label } = req.body ?? {};

    if (!annotationId || !auteur || !comment) {
      return res.status(400).json({ error: "annotationId, auteur, and comment are required" });
    }

    try {
      await notion.pages.create({
        parent: { database_id: DATABASE_ID },
        properties: {
          "Naam": {
            title: [{ text: { content: `${auteur} — ${annotationId}` } }],
          },
          ...(PROJECT_ID
            ? {
                "Project": {
                  relation: [{ id: PROJECT_ID }],
                },
              }
            : {}),
          "Annotatie ID": {
            rich_text: [{ text: { content: annotationId } }],
          },
          "Comment": {
            rich_text: [{ text: { content: comment } }],
          },
          "Auteur": {
            rich_text: [{ text: { content: auteur } }],
          },
          "Status": {
            status: { name: "Open" },
          },
          ...(pagina
            ? {
                "Pagina": {
                  rich_text: [{ text: { content: pagina } }],
                },
              }
            : {}),
          ...(label
            ? {
                "Label": {
                  rich_text: [{ text: { content: label } }],
                },
              }
            : {}),
        },
      });

      return res.status(201).json({ ok: true });
    } catch (err) {
      console.error("Notion create failed:", err);
      return res.status(500).json({ error: "Failed to create comment" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
