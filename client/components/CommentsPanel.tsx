"use client";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { MessageSquare, Send, User } from "lucide-react";

interface Comment {
  id: number;
  author_name: string;
  author_role: string;
  message: string;
  context: string;
  created_at: string;
}

interface CommentsPanelProps {
  athleteId: number;
  role: "coach" | "nutritionist";
}

const CONTEXTS = [
  { value: "general",   label: "General Feedback" },
  { value: "training",  label: "Training Advice" },
  { value: "recovery",  label: "Recovery Tip" },
  { value: "nutrition", label: "Nutrition Guidance" },
  { value: "injury",    label: "Injury Warning" },
];

const roleColor = (role: string) =>
  role === "coach" ? "bg-brand-blue-light text-brand-blue" : "bg-brand-orange-light text-brand-orange";

const contextColor = (ctx: string) => {
  const map: Record<string, string> = {
    training:  "bg-blue-50 text-blue-600",
    recovery:  "bg-green-50 text-green-600",
    nutrition: "bg-orange-50 text-orange-600",
    injury:    "bg-red-50 text-red-600",
    general:   "bg-gray-100 text-gray-600",
  };
  return map[ctx] ?? map.general;
};

export default function CommentsPanel({ athleteId, role }: CommentsPanelProps) {
  const [comments, setComments]   = useState<Comment[]>([]);
  const [loading, setLoading]     = useState(true);
  const [message, setMessage]     = useState("");
  const [context, setContext]     = useState("general");
  const [sending, setSending]     = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError]         = useState("");

  const endpoint = role === "coach" ? "coach" : "nutritionist";

  const fetchComments = useCallback(() => {
    api.get(`/${endpoint}/athletes/${athleteId}/comments`)
      .then((res) => setComments(res.data.comments))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [endpoint, athleteId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError(""); setSuccessMsg("");
    try {
      await api.post(`/${endpoint}/athletes/${athleteId}/comment`, { message, context });
      setMessage("");
      setContext("general");
      setSuccessMsg("Feedback sent to athlete.");
      fetchComments();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || "Failed to send comment.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
        <MessageSquare size={15} className="text-brand-blue" />
        <p className="text-sm font-heading font-semibold text-brand-dark">
          Athlete Feedback
        </p>
        <span className="ml-auto text-xs text-brand-muted">{comments.length} message{comments.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Compose form */}
      <form onSubmit={handleSend} className="px-5 py-4 border-b border-gray-50 space-y-3">
        <div className="flex gap-2 flex-wrap">
          {CONTEXTS.map((c) => (
            <button
              key={c.value} type="button"
              onClick={() => setContext(c.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                context === c.value
                  ? "bg-brand-blue text-white"
                  : "bg-gray-100 text-brand-muted hover:bg-gray-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-end">
          <textarea
            rows={3}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
            }}
            placeholder={`Leave ${context} feedback for this athlete...`}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none overflow-y-auto"
            style={{ minHeight: "72px", maxHeight: "160px" }}
          />
          <button
            type="submit" disabled={sending || !message.trim()}
            className="px-4 py-2 bg-brand-blue text-white rounded-xl hover:bg-blue-900 transition-colors disabled:opacity-50 flex items-center gap-1.5 text-sm font-semibold shrink-0"
          >
            <Send size={13} />
            {sending ? "Sending..." : "Send"}
          </button>
        </div>

        {successMsg && <p className="text-brand-green text-xs font-medium">✅ {successMsg}</p>}
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </form>

      {/* Comments list */}
      <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
        {loading ? (
          <div className="px-5 py-6 text-center text-sm text-brand-muted animate-pulse">Loading feedback...</div>
        ) : comments.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <MessageSquare size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-brand-muted">No feedback sent yet. Use the form above to advise this athlete.</p>
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-brand-blue-light flex items-center justify-center shrink-0 mt-0.5">
                  <User size={12} className="text-brand-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-semibold text-brand-dark">{c.author_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor(c.author_role)}`}>
                      {c.author_role}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${contextColor(c.context)}`}>
                      {c.context}
                    </span>
                    <span className="text-xs text-brand-muted ml-auto">
                      {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm text-brand-dark leading-relaxed whitespace-pre-wrap">{c.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
