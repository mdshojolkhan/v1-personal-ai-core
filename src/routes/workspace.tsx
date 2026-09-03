import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { Loader2, Send, Settings, X } from 'lucide-react';
import { sendChatMessage, V1ApiError } from '@/lib/v1/client';
import type { ChatMessage } from '@/lib/v1/types';

export const Route = createFileRoute('/workspace')({
  head: () => ({
    meta: [
      { title: 'V1 Workspace — Multi-AI terminal & app builder' },
      {
        name: 'description',
        content:
          'The V1 Workspace pairs a multi-assistant chat terminal with an app and web builder preview, project files and deploy prep in one dark console.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      {
        property: 'og:title',
        content: 'V1 Workspace — Multi-AI terminal & app builder',
      },
      {
        property: 'og:description',
        content:
          'A multi-assistant chat terminal beside a live app and web builder preview, project files and deploy prep.',
      },
    ],
  }),
  component: WorkspacePage,
});

const PROVIDERS = ['V1', 'ChatGPT', 'Grok', 'Gemini', 'AI Studio'] as const;
type Provider = (typeof PROVIDERS)[number];

const TOOLS = [
  'Prompt',
  'Generate',
  'Edit',
  'Preview',
  'Files',
  'Deploy',
] as const;
type Tool = (typeof TOOLS)[number];

const DEVICES = {
  Desktop: '850px',
  Tablet: '620px',
  Mobile: '380px',
} as const;
type Device = keyof typeof DEVICES;

const FILES = [
  '📁 src',
  '　📄 App.jsx',
  '　📁 components',
  '　📁 pages',
  '📄 package.json',
  '📄 README.md',
];

const emptyTranscripts = () =>
  Object.fromEntries(PROVIDERS.map((p) => [p, [] as ChatMessage[]])) as Record<
    Provider,
    ChatMessage[]
  >;

function WorkspacePage() {
  const [provider, setProvider] = useState<Provider>('V1');
  const [transcripts, setTranscripts] = useState(emptyTranscripts);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>('Preview');
  const [device, setDevice] = useState<Device>('Desktop');
  const [filesOpen, setFilesOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const messages = transcripts[provider];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, pending]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || pending) return;

    const next: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setTranscripts((prev) => ({ ...prev, [provider]: next }));
    setInput('');
    setError(null);
    setPending(true);
    try {
      const response = await sendChatMessage({
        message: text,
        mode: 'companion',
        history: next.slice(-12),
      });
      setTranscripts((prev) => ({
        ...prev,
        [provider]: [
          ...next,
          { role: 'assistant', content: response.message },
        ],
      }));
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
    <div className="v1ws flex h-[100dvh] flex-col overflow-hidden">
      <header
        className="flex h-[58px] shrink-0 items-center justify-between border-b px-4"
        style={{
          borderColor: 'var(--ws-border)',
          background: 'var(--ws-top)',
        }}
      >
        <div className="flex items-center gap-2.5 text-[17px] font-extrabold sm:text-xl">
          <span
            className="grid h-[34px] w-[34px] place-items-center rounded-[10px] font-black text-white"
            style={{
              background:
                'linear-gradient(135deg, var(--ws-accent), var(--ws-accent-2))',
            }}
          >
            V1
          </span>
          V1 Workspace
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setToast('Workspace saved on this device.')}
            className="rounded-[9px] border px-3 py-2 text-sm text-white"
            style={{
              borderColor: 'var(--ws-accent)',
              background: 'var(--ws-accent)',
            }}
            data-testid="button-save-workspace"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setToast('Settings live in the main app shell.')}
            className="rounded-[9px] border px-3 py-2"
            style={{
              borderColor: 'var(--ws-border)',
              background: 'var(--ws-panel)',
            }}
            aria-label="Workspace settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="relative grid min-h-0 flex-1 md:grid-cols-[38%_62%]">
        {/* ---------- Terminal ---------- */}
        <section
          className={`flex min-w-0 flex-col border-r ${builderOpen ? 'hidden md:flex' : 'flex'}`}
          style={{
            borderColor: 'var(--ws-border)',
            background: 'var(--ws-left)',
          }}
        >
          <div
            className="flex gap-1.5 overflow-x-auto border-b p-2.5"
            style={{ borderColor: 'var(--ws-border)' }}
          >
            {PROVIDERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setProvider(item)}
                className="whitespace-nowrap rounded-[9px] border px-2.5 py-2 text-sm"
                style={
                  provider === item
                    ? {
                        borderColor: '#6750d7',
                        background: '#19152e',
                        color: '#fff',
                      }
                    : {
                        borderColor: 'var(--ws-border)',
                        background: 'var(--ws-panel)',
                        color: 'var(--ws-muted)',
                      }
                }
                data-testid={`button-provider-${item}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div
            className="flex h-[52px] shrink-0 items-center justify-between border-b px-3.5"
            style={{ borderColor: 'var(--ws-border)' }}
          >
            <p className="font-bold">{provider} Terminal</p>
            <p className="text-xs" style={{ color: 'var(--ws-accent-2)' }}>
              ● {pending ? 'Working' : 'Ready'}
            </p>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--ws-muted)' }}>
                Start a {provider} thread. Each assistant keeps its own
                transcript in this workspace.
              </p>
            ) : null}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[88%] rounded-xl border px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  message.role === 'user' ? 'self-end' : 'self-start'
                }`}
                style={{
                  borderColor: 'var(--ws-border)',
                  background:
                    message.role === 'user'
                      ? 'var(--ws-user)'
                      : 'var(--ws-panel)',
                }}
                data-testid={`ws-message-${message.role}`}
              >
                <small
                  className="mb-1.5 block text-[10px]"
                  style={{ color: 'var(--ws-muted)' }}
                >
                  {message.role === 'user' ? 'You' : provider}
                </small>
                {message.content}
              </div>
            ))}
            {pending ? (
              <p
                className="flex items-center gap-2 text-sm"
                style={{ color: 'var(--ws-muted)' }}
              >
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
              </p>
            ) : null}
            {error ? (
              <p className="text-sm text-red-400" data-testid="ws-chat-error">
                {error}
              </p>
            ) : null}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={submit}
            className="flex shrink-0 gap-2 border-t p-3"
            style={{
              borderColor: 'var(--ws-border)',
              background: 'var(--ws-top)',
            }}
          >
            <label className="sr-only" htmlFor="ws-message">
              Message {provider}
            </label>
            <textarea
              id="ws-message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) void submit(event);
              }}
              placeholder={`Message ${provider}…`}
              className="max-h-[120px] min-h-[44px] flex-1 resize-none rounded-[10px] border p-2.5 text-sm outline-none focus:border-[#6750d7]"
              style={{
                borderColor: 'var(--ws-border)',
                background: 'var(--ws-panel)',
              }}
              data-testid="ws-input-message"
            />
            <button
              type="submit"
              disabled={pending || input.trim().length === 0}
              className="w-[46px] shrink-0 rounded-[10px] text-white disabled:opacity-40"
              style={{ background: 'var(--ws-accent)' }}
              aria-label="Send message"
              data-testid="ws-button-send"
            >
              <Send className="mx-auto h-4 w-4" />
            </button>
          </form>

          <button
            type="button"
            onClick={() => setBuilderOpen(true)}
            className="shrink-0 border-t p-3 text-sm md:hidden"
            style={{
              borderColor: 'var(--ws-border)',
              color: 'var(--ws-muted)',
            }}
          >
            Open builder →
          </button>
        </section>

        {/* ---------- Builder ---------- */}
        <section
          className={`min-w-0 flex-col ${builderOpen ? 'flex' : 'hidden md:flex'}`}
          style={{ background: 'var(--ws-right)' }}
        >
          <div
            className="flex h-[52px] shrink-0 items-center justify-between border-b px-3.5"
            style={{ borderColor: 'var(--ws-border)' }}
          >
            <p className="font-bold">V1 App / Web Builder</p>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: 'var(--ws-muted)' }}>
                {tool}
              </span>
              <button
                type="button"
                onClick={() => setBuilderOpen(false)}
                className="md:hidden"
                aria-label="Close builder"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            className="flex gap-1.5 overflow-x-auto border-b px-3 py-2.5"
            style={{ borderColor: 'var(--ws-border)' }}
          >
            {TOOLS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setTool(item);
                  if (item === 'Files') setFilesOpen((open) => !open);
                  else setFilesOpen(false);
                  if (item === 'Deploy')
                    setToast('Deploy prep is not wired up yet.');
                }}
                className="whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-sm"
                style={
                  tool === item
                    ? { borderColor: '#6750d7', background: '#1b1733' }
                    : {
                        borderColor: 'var(--ws-border)',
                        background: 'var(--ws-panel)',
                      }
                }
                data-testid={`button-tool-${item}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex min-h-0 flex-1 flex-col p-3">
            <div
              className="mb-2 flex items-center justify-between text-xs"
              style={{ color: 'var(--ws-muted)' }}
            >
              <span>V1 Demo Website · Live Preview</span>
              <span className="flex gap-1.5">
                {(Object.keys(DEVICES) as Device[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setDevice(item)}
                    className="rounded-[7px] border px-2 py-1"
                    style={{
                      borderColor:
                        device === item ? '#6750d7' : 'var(--ws-border)',
                      background: 'var(--ws-panel)',
                    }}
                    data-testid={`button-device-${item}`}
                  >
                    {item}
                  </button>
                ))}
              </span>
            </div>

            <div
              className="flex min-h-0 flex-1 justify-center overflow-auto rounded-xl border p-3 md:p-4"
              style={{
                borderColor: 'var(--ws-border)',
                background: 'var(--ws-stage)',
              }}
            >
              <DemoSite maxWidth={DEVICES[device]} />
            </div>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!prompt.trim()) return;
              setToast('Builder generation is coming in a later phase.');
              setPrompt('');
            }}
            className="flex shrink-0 gap-2 border-t p-2.5"
            style={{ borderColor: 'var(--ws-border)' }}
          >
            <label className="sr-only" htmlFor="ws-builder-prompt">
              Describe what to build
            </label>
            <input
              id="ws-builder-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the app or page you want…"
              className="flex-1 rounded-[9px] border p-2.5 text-sm outline-none focus:border-[#6750d7]"
              style={{
                borderColor: 'var(--ws-border)',
                background: 'var(--ws-panel)',
              }}
              data-testid="ws-input-prompt"
            />
            <button
              type="button"
              onClick={() => setToast('Builder generation is coming soon.')}
              className="rounded-[9px] border px-3 py-2 text-sm"
              style={{
                borderColor: 'var(--ws-border)',
                background: 'var(--ws-panel)',
              }}
            >
              Generate
            </button>
          </form>
        </section>

        {filesOpen ? (
          <aside
            className="absolute right-3.5 top-[72px] z-10 w-[280px] rounded-xl border p-3.5 shadow-2xl"
            style={{
              borderColor: 'var(--ws-border)',
              background: '#0f1520',
            }}
            data-testid="panel-files"
          >
            <h3 className="mb-3 text-sm font-bold">Project Files</h3>
            <ul className="space-y-0.5 text-sm" style={{ color: '#b8c1cf' }}>
              {FILES.map((file) => (
                <li
                  key={file}
                  className="cursor-default rounded-[7px] px-2 py-1.5 hover:bg-[var(--ws-hover)]"
                >
                  {file}
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>

      {toast ? (
        <div
          className="fixed bottom-4 right-4 z-20 rounded-[9px] border px-3 py-2.5 text-sm"
          style={{ borderColor: 'var(--ws-border)', background: '#121a27' }}
          role="status"
          data-testid="ws-toast"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function DemoSite({ maxWidth }: { maxWidth: string }) {
  return (
    <div
      className="min-h-full w-full overflow-hidden rounded-lg bg-white text-[#111827] shadow-[0_15px_50px_#0008] transition-[max-width] duration-300"
      style={{ maxWidth }}
    >
      <nav className="flex h-[54px] items-center justify-between border-b border-[#e5e7eb] px-6">
        <span className="font-black text-[#6d4aff]">V1</span>
        <span className="hidden text-xs text-[#64748b] sm:inline">
          Home　Projects　About　Contact
        </span>
      </nav>
      <div className="bg-gradient-to-b from-[#f7f5ff] to-white px-7 py-14 text-center">
        <h2 className="mb-3 text-[clamp(26px,5vw,48px)] font-semibold tracking-[-2px]">
          Build with V1 AI
        </h2>
        <p className="mx-auto mb-5 max-w-[560px] text-sm leading-relaxed text-[#64748b]">
          A modern AI workspace where multiple AI assistants meet a powerful app
          and web builder.
        </p>
        <span className="inline-block rounded-lg bg-[#6d4aff] px-4 py-2.5 text-sm text-white">
          Get Started
        </span>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-3">
        {[
          [
            'Multi-AI',
            'Keep ChatGPT, Grok, Gemini, AI Studio and V1 conversations separate.',
          ],
          [
            'AI Builder',
            'Describe your idea and turn it into a beautiful project preview.',
          ],
          [
            'Deploy',
            'Prepare projects for deployment from one professional workspace.',
          ],
        ].map(([title, body]) => (
          <div key={title} className="rounded-[10px] border border-[#e5e7eb] p-4">
            <b className="mb-1.5 block text-sm">{title}</b>
            <p className="m-0 text-xs leading-relaxed text-[#64748b]">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
