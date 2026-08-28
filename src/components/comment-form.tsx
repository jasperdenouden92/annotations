import React, { useState, useEffect } from "react";
import { useAnnotationStyles } from "../styles/inject";
import { useStableId } from "../utils/use-stable-id";
import { AlertCircleIcon } from "../icons";

const STORAGE_KEY_NAME = "@jasperdenouden92/annotations:commentAuteur";

interface CommentFormProps {
  onSubmit: (data: { auteur: string; comment: string }) => Promise<void>;
}

export function CommentForm({ onSubmit }: CommentFormProps) {
  useAnnotationStyles();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const nameId = useStableId("szan-name");
  const commentId = useStableId("szan-comment");
  const errorId = useStableId("szan-error");

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

  if (!mounted) return null;

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

  return React.createElement(
    "form",
    { className: "szan-root szan-form", onSubmit: handleSubmit },

    React.createElement("label", { className: "szan-sr-only", htmlFor: nameId }, "Naam"),
    React.createElement("input", {
      id: nameId,
      className: "szan-input",
      type: "text",
      autoComplete: "name",
      placeholder: "Naam",
      value: auteur,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setAuteur(e.target.value),
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? errorId : undefined,
    }),

    React.createElement(
      "label",
      { className: "szan-sr-only", htmlFor: commentId },
      "Comment"
    ),
    React.createElement("textarea", {
      id: commentId,
      className: "szan-input szan-textarea",
      placeholder: "Schrijf een comment...",
      value: comment,
      rows: 3,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value),
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? errorId : undefined,
    }),

    // role="alert" so the failure is announced, not only shown in red.
    error &&
      React.createElement(
        "div",
        { id: errorId, className: "szan-error", role: "alert" },
        React.createElement(AlertCircleIcon, { size: 14 }),
        error
      ),

    React.createElement(
      "button",
      {
        type: "submit",
        className: "szan-button",
        disabled: isSubmitting || !auteur.trim() || !comment.trim(),
      },
      isSubmitting ? "Versturen..." : "Verstuur"
    )
  );
}
