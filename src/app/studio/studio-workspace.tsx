"use client";

import { useActionState, useState } from "react";
import {
  generateDraftAction,
  saveDraftAction,
  type GenerateState,
  type SaveState,
} from "@/lib/actions/generate";
import { CONTENT_TYPES } from "@/lib/ai/content-types";
import type { ContentItem } from "@/lib/content-item";

const GEN_INIT: GenerateState = {
  ok: false,
  error: null,
  text: null,
  demo: false,
  kind: null,
};
const SAVE_INIT: SaveState = { ok: false, error: null };

const inputCls =
  "rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40 dark:border-white/15";

export function StudioWorkspace({
  recentDrafts,
}: {
  recentDrafts: ContentItem[];
}) {
  const [kind, setKind] = useState(CONTENT_TYPES[0].id);
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState("");
  const [refine, setRefine] = useState("");

  const [genState, genAction, genPending] = useActionState(
    generateDraftAction,
    GEN_INIT,
  );
  const [saveState, saveAction, savePending] = useActionState(
    saveDraftAction,
    SAVE_INIT,
  );

  // When a new generation result arrives, load it into the editable draft.
  // "Adjust state during render" (compare against the previously handled state)
  // rather than an effect — this is the React-recommended pattern and avoids a
  // cascading-render lint error.
  const [handledGen, setHandledGen] = useState<GenerateState | null>(null);
  if (genState !== handledGen) {
    setHandledGen(genState);
    if (genState.ok && genState.text !== null) {
      setDraft(genState.text);
      setRefine("");
    }
  }

  const activeType =
    CONTENT_TYPES.find((t) => t.id === kind) ?? CONTENT_TYPES[0];

  return (
    <div className="grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-5">
        {/* Content type picker */}
        <div className="flex flex-wrap gap-2">
          {CONTENT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setKind(t.id)}
              aria-pressed={t.id === kind}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                t.id === kind
                  ? "border-foreground bg-foreground text-background font-medium"
                  : "border-black/15 text-foreground/70 hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="-mt-2 text-xs text-foreground/50">
          {activeType.description}
        </p>

        {/* Generate form */}
        <form action={genAction} className="flex flex-col gap-3">
          <input type="hidden" name="kind" value={kind} />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">What should we write about?</span>
            <textarea
              name="topic"
              rows={2}
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={activeType.topicPlaceholder}
              className={inputCls}
            />
          </label>
          <button
            type="submit"
            disabled={genPending}
            className="inline-flex w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            {genPending ? "Generating…" : "Generate"}
          </button>
        </form>

        {genState.error ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            {genState.error}
          </p>
        ) : null}

        {/* Draft editor */}
        {draft ? (
          <div className="flex flex-col gap-3">
            {genState.demo ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Demo mode — add ANTHROPIC_API_KEY to generate real on-brand copy.
              </p>
            ) : null}
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Draft (editable)</span>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={12}
                className={`${inputCls} font-mono text-[13px] leading-relaxed`}
              />
            </label>

            {/* Refine & regenerate — reuses the same topic + kind */}
            <form action={genAction} className="flex flex-col gap-2">
              <input type="hidden" name="kind" value={kind} />
              <input type="hidden" name="topic" value={topic} />
              <div className="flex gap-2">
                <input
                  name="refine"
                  value={refine}
                  onChange={(e) => setRefine(e.target.value)}
                  placeholder="Refine, e.g. make it punchier, add a stat"
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="submit"
                  disabled={genPending}
                  className="whitespace-nowrap rounded-md border border-black/15 px-3 py-2 text-sm disabled:opacity-50 dark:border-white/15"
                >
                  {genPending ? "…" : "Refine"}
                </button>
              </div>
            </form>

            {/* Save draft */}
            <form action={saveAction} className="flex items-center gap-2">
              <input type="hidden" name="kind" value={kind} />
              <input type="hidden" name="body" value={draft} />
              <input
                name="title"
                placeholder="Draft title (optional)"
                className={`${inputCls} flex-1`}
              />
              <button
                type="submit"
                disabled={savePending}
                className="whitespace-nowrap rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
              >
                {savePending ? "Saving…" : "Save draft"}
              </button>
            </form>
            {saveState.error ? (
              <p className="text-sm text-red-600 dark:text-red-400">
                {saveState.error}
              </p>
            ) : null}
            {saveState.ok ? (
              <p className="text-sm text-green-600 dark:text-green-400">
                Draft saved.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Recent drafts */}
      <aside className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Recent drafts</h3>
        {recentDrafts.length === 0 ? (
          <p className="text-sm text-foreground/50">
            Saved drafts show up here.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recentDrafts.map((d) => (
              <li
                key={d.id}
                className="rounded-md border border-black/10 p-3 text-sm dark:border-white/10"
              >
                <p className="font-medium">{d.title ?? "Untitled draft"}</p>
                <p className="mt-0.5 text-xs text-foreground/50">
                  {d.kind.replace(/_/g, " ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
