import type { Plugin } from "vite";

interface MockComment {
  id: string;
  annotationId: string;
  auteur: string;
  comment: string;
  status: "Open" | "In behandeling" | "Opgelost";
  antwoord: string | null;
  aangemaakt: string;
  pagina: string;
  label: string;
}

const comments: MockComment[] = [
  {
    id: "1",
    annotationId: "card-omzet",
    auteur: "Klant A",
    comment: "Deze KPI moet nog gekoppeld worden aan de echte data bron.",
    status: "Open",
    antwoord: null,
    aangemaakt: new Date(Date.now() - 86400000).toISOString(),
    pagina: "/",
    label: "Omzet card",
  },
  {
    id: "2",
    annotationId: "card-orders",
    auteur: "Klant B",
    comment: "Kleur past niet bij het design systeem, graag aanpassen.",
    status: "In behandeling",
    antwoord: "Wordt meegenomen in de volgende sprint.",
    aangemaakt: new Date(Date.now() - 172800000).toISOString(),
    pagina: "/",
    label: "Orders card",
  },
  {
    id: "3",
    annotationId: "profiel-sectie",
    auteur: "Klant C",
    comment: "De alerts moeten duidelijker zijn qua prioriteit.",
    status: "Opgelost",
    antwoord: "Is opgelost in v1.2.",
    aangemaakt: new Date(Date.now() - 259200000).toISOString(),
    pagina: "/instellingen",
    label: "Profiel sectie",
  },
];

let nextId = 4;

export function mockCommentsApi(): Plugin {
  return {
    name: "mock-comments-api",
    configureServer(server) {
      server.middlewares.use("/api/comments", (req, res) => {
        res.setHeader("Content-Type", "application/json");

        if (req.method === "GET") {
          const url = new URL(req.url ?? "/", "http://localhost");
          const annotationId = url.searchParams.get("annotationId");
          const filtered = annotationId
            ? comments.filter((c) => c.annotationId === annotationId)
            : [...comments];
          res.end(JSON.stringify(filtered));
          return;
        }

        if (req.method === "POST") {
          let body = "";
          req.on("data", (chunk: Buffer) => (body += chunk.toString()));
          req.on("end", () => {
            const data = JSON.parse(body);
            const newComment: MockComment = {
              id: String(nextId++),
              annotationId: data.annotationId,
              auteur: data.auteur,
              comment: data.comment,
              status: "Open",
              antwoord: null,
              aangemaakt: new Date().toISOString(),
              pagina: data.pagina ?? "/",
              label: data.label ?? "",
            };
            comments.push(newComment);
            res.statusCode = 201;
            res.end(JSON.stringify({ ok: true }));
          });
          return;
        }

        res.statusCode = 405;
        res.end(JSON.stringify({ error: "Method not allowed" }));
      });
    },
  };
}
