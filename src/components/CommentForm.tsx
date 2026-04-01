import React, { useState, useEffect } from "react";
import { PANEL_COLORS } from "../constants";

const STORAGE_KEY_NAME = "@jasperdenouden92/annotations:commentAuteur";

interface CommentFormProps {
  onSubmit: (data: { auteur: string; comment: string }) => Promise<void>;
}

export function CommentForm({ onSubmit }: CommentFormProps) {
  const [auteur, setAuteur] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem(STORAGE_KEY_NAME) ?? "";
    } catch {
      return "";
    }
  });
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auteur) return;
    try {
      localStorage.setItem(STORAGE_KEY_NAME, auteur);
    } catch {}
  }, [auteur]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auteur.trim() || !comment.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ auteur: auteur.trim(), comment: comment.trim() });
      setComment("");
    } catch {
      setError("Versturen mislukt. Probeer het opnieuw.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "6px 8px",
    fontSize: 13,
    fontFamily: "inherit",
    border: `1px solid ${PANEL_COLORS.border}`,
    borderRadius: 4,
    outline: "none",
    color: PANEL_COLORS.textPrimary,
    background: "#FFFFFF",
    boxSizing: "border-box",
  };

  return React.createElement(
    "form",
    {
      onSubmit: handleSubmit,
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
        marginTop: 8,
      } as React.CSSProperties,
    },
    React.createElement("input", {
      type: "text",
      placeholder: "Naam",
      value: auteur,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setAuteur(e.target.value),
      style: inputStyle,
    }),
    React.createElement("textarea", {
      placeholder: "Schrijf een comment...",
      value: comment,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value),
      rows: 3,
      style: {
        ...inputStyle,
        resize: "vertical",
      } as React.CSSProperties,
    }),
    error &&
      React.createElement(
        "div",
        {
          style: {
            fontSize: 12,
            color: "#B42318",
          },
        },
        error
      ),
    React.createElement(
      "button",
      {
        type: "submit",
        disabled: isSubmitting || !auteur.trim() || !comment.trim(),
        style: {
          alignSelf: "flex-end",
          padding: "5px 12px",
          fontSize: 13,
          fontFamily: "inherit",
          fontWeight: 500,
          color: "#FFFFFF",
          background: isSubmitting ? "#98A2B3" : "#344054",
          border: "none",
          borderRadius: 4,
          cursor: isSubmitting ? "not-allowed" : "pointer",
          opacity: !auteur.trim() || !comment.trim() ? 0.5 : 1,
        } as React.CSSProperties,
      },
      isSubmitting ? "Versturen..." : "Verstuur"
    )
  );
}
