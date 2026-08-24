import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import { AppShell } from '@/components/v1/app-shell';
import { sendChatMessage, V1ApiError } from '@/lib/v1/client';
import type { AssistantMode, ChatMessage } from '@/lib/v1/types';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'V1 Agent — Your personal AI assistant' },
      {
        name: 'description',
        content:
          'V1 Agent is a private personal AI assistant with a secure core: an orchestrator, a model engine abstraction, memory and permission-bounded skills.',
      },
      { property: 'og:title', content: 'V1 Agent — Your personal AI assistant' },
      {
        property: 'og:description',
        content:
          'A private personal AI assistant with a secure core: orchestrator, model engine, memory and permission-bounded skills.',
      },
    ],
  }),
  component: ChatPage,
});

const MODES: { id: AssistantMode; label: string }[] = [
  { id: 'companion', label: 'Companion' },
  { id: 'programming', label: 'Programming' },
  { id: 'developer', label: 'Developer' },
];

function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<AssistantMode>('companion');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, pending]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || pending) return;

    const next: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setError(null);
    setPending(true);

    try {
      const response = await sendChatMessage({
        message: text,
        mode,
        history: next.slice(-12),
        ...(conversationId ? { conversationId } : {}),
      });
      setConversationId(response.conversationId);
      setMessages([
        ...next,
        { role: 'assistant', content: response.message },
      ]);
    } catch (caught) {
      setError(
        caught instanceof V1ApiError
          ? caught.message
          : 'V1 could not reach its model engine. Try again in a moment.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AppShell>
      <main className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-10 md:px-10">
          <div className="mx-auto w-full max-w-[720px]">
            {messages.length === 0 ? (
              <div className="pt-10">
                <h1 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.04em] md:text-[38px]">
                  How can I help you
                  <br />
                  today?
                </h1>
                <p className="mt-4 max-w-[440px] text-sm leading-relaxed text-muted-foreground">
                  I run on a secure core: no device access, no code execution,
                  and every skill asks before it acts.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={
                      message.role === 'user' ? 'flex justify-end' : 'flex'
                    }
                    data-testid={`message-${message.role}`}
                  >
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        message.role === 'user'
                          ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                          : 'border border-border bg-card'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {pending ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                  </div>
                ) : null}
              </div>
            )}
            {error ? (
              <p
                className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                data-testid="text-chat-error"
              >
                {error}
              </p>
            ) : null}
            <div ref={endRef} />
          </div>
        </div>

        <div className="border-t border-border/80 bg-background/90 px-6 py-5 backdrop-blur md:px-10">
          <div className="mx-auto w-full max-w-[720px]">
            <div className="mb-3 flex gap-2">
              {MODES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMode(option.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    mode === option.id
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/60'
                  }`}
                  data-testid={`button-mode-${option.id}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <form
              onSubmit={submit}
              className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2.5"
            >
              <label className="sr-only" htmlFor="v1-message">
                Message V1 Agent
              </label>
              <textarea
                id="v1-message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    void submit(event);
                  }
                }}
                rows={1}
                placeholder="Ask V1 anything…"
                className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
                data-testid="input-message"
              />
              <button
                type="submit"
                disabled={pending || input.trim().length === 0}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] transition-opacity disabled:opacity-40"
                aria-label="Send message"
                data-testid="button-send"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.4} />
              </button>
            </form>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
