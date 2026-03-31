import React from "react";
import {
  AnnotationProvider,
  AnnotationButton,
  AnnotationPanel,
  AnnotationMarker,
} from "@jasperdenouden92/annotations";
import { annotations } from "./annotations";

function DashboardCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb",
        flex: 1,
        minWidth: 200,
      }}
    >
      <p style={{ fontSize: 13, color: "#667085", marginBottom: 8 }}>{title}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color, marginBottom: 4 }}>
        {value}
      </p>
      <p style={{ fontSize: 12, color: "#98a2b3" }}>{subtitle}</p>
    </div>
  );
}

export function App() {
  return (
    <AnnotationProvider annotations={annotations} currentRoute="/">
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          Dashboard
        </h1>
        <p style={{ color: "#667085", marginBottom: 32 }}>
          Demo van het @jasperdenouden92/annotations package
        </p>

        <div
          style={{
            display: "flex",
            gap: 20,
            flexWrap: "wrap",
            marginBottom: 40,
          }}
        >
          <AnnotationMarker annotationId="2" position="top-right">
            <DashboardCard
              title="Omzet"
              value="€ 24.500"
              subtitle="+12% vs vorige maand"
              color="#067647"
            />
          </AnnotationMarker>

          <AnnotationMarker annotationId="3" position="top-right">
            <DashboardCard
              title="Orders"
              value="142"
              subtitle="Target: 150"
              color="#175CD3"
            />
          </AnnotationMarker>

          <AnnotationMarker annotationId="4" position="top-right">
            <DashboardCard
              title="Openstaande acties"
              value="7"
              subtitle="3 urgent"
              color="#B54708"
            />
          </AnnotationMarker>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Recente activiteit
          </h2>
          {["Order #1042 afgerond", "Nieuw bericht van klant", "Factuur verstuurd"].map(
            (item, i) => (
              <div
                key={i}
                style={{
                  padding: "12px 0",
                  borderBottom:
                    i < 2 ? "1px solid #f2f4f7" : "none",
                  fontSize: 14,
                  color: "#344054",
                }}
              >
                {item}
              </div>
            )
          )}
        </div>
      </div>

      <AnnotationButton />
      <AnnotationPanel />
    </AnnotationProvider>
  );
}
