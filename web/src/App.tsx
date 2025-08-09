import React, { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import { askBackend, type Mode } from "./api";

type Msg = { role: "user" | "assistant"; content: string };

const modes: { label: string; value: Mode }[] = [
  { label: "Auto", value: "auto" },
  { label: "Explain", value: "explain" },
  { label: "Debug", value: "debug" },
  { label: "Refactor", value: "refactor" },
  { label: "Optimize", value: "optimize" }
];

export default function App() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("auto");
  const [lang, setLang] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasChat = messages.length > 0;

  const placeholder = useMemo(
    () =>
      "Paste code or ask anything... (e.g., 'Explain this function', 'Find bugs in this snippet', 'Refactor for best practices')",
    []
  );

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextMsgs = [...messages, { role: "user", content: trimmed } as Msg];
    setMessages(nextMsgs);
    setInput("");
    setLoading(true);

    try {
      const { output } = await askBackend(trimmed, mode, lang || undefined);
      setMessages([...nextMsgs, { role: "assistant", content: output } as Msg]);
    } catch (err: any) {
      setMessages([
        ...nextMsgs,
        {
          role: "assistant",
          content: `Sorry, something went wrong.\n\n\`\`\`\n${String(err?.message ?? err)}\n\`\`\``
        }
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">SyntaxAI</div>
          <button className="newchat" onClick={() => setMessages([])}>
            <span className="plus">＋</span> New chat
          </button>
        </div>

        <nav className="nav">
          <div className="nav-group">
            <button className="nav-item">Search chats</button>
            <button className="nav-item">Library</button>
          </div>
          <div className="nav-group">
            <div className="nav-label">Modes</div>
            {modes.map(m => (
              <button
                key={m.value}
                className={`nav-item ${mode === m.value ? "active" : ""}`}
                onClick={() => setMode(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-pill">B</div>
          <div className="user-meta">
            <div className="user-name">BlueshiftLabs2</div>
            <div className="user-plan">Free</div>
          </div>
        </div>
      </aside>

      <main className="main">
        {!hasChat && (
          <section className="hero">
            <div className="hero-title">Introducing SyntaxAI</div>
            <p className="hero-subtitle">
              An AI-powered coding companion that helps you debug, optimize, and understand code in real time.
              Paste code and get instant explanations, fixes, refactors, and clear breakdowns.
            </p>
          </section>
        )}

        <section className="chat" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              <div className="avatar">{m.role === "user" ? "🧑‍💻" : "🤖"}</div>
              <div className="content markdown">
                <ReactMarkdown remarkPlugins={[gfm]}>{m.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && (
            <div className="bubble assistant">
              <div className="avatar">🤖</div>
              <div className="content typing">
                <span className="dot"></span><span className="dot"></span><span className="dot"></span>
              </div>
            </div>
          )}
        </section>

        <form className="composer" onSubmit={onSubmit}>
          <div className="composer-bar">
            <button className="circle-btn" type="button" title="Attach">
              +
            </button>
            <textarea
              className="input"
              placeholder={placeholder}
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={1}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) onSubmit(e);
              }}
            />
            <button className="circle-btn" type="submit" disabled={loading} title="Send">
              ➤
            </button>
          </div>
          <div className="composer-options">
            <label className="opt">
              Language hint:
              <input
                className="lang"
                placeholder="optional (e.g., python, js)"
                value={lang}
                onChange={e => setLang(e.target.value)}
              />
            </label>
            <div className="disclaimer">AI may produce inaccurate info. Review code before using in production.</div>
          </div>
        </form>
      </main>
    </div>
  );
}