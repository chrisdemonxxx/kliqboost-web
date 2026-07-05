"use client";

import { useActionState } from "react";
import {
  saveBrandProfile,
  type BrandProfileState,
} from "@/lib/actions/brand-profile";
import { arrayToLines, type BrandProfile } from "@/lib/brand-profile";

const INITIAL: BrandProfileState = { error: null, ok: false };

const inputCls =
  "rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40 dark:border-white/15";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {hint ? <span className="text-xs text-foreground/50">{hint}</span> : null}
      {children}
    </label>
  );
}

export function BrandProfileForm({
  profile,
}: {
  profile: BrandProfile | null;
}) {
  const [state, formAction, pending] = useActionState(
    saveBrandProfile,
    INITIAL,
  );

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      <Field label="Brand name">
        <input
          name="name"
          required
          defaultValue={profile?.name ?? ""}
          placeholder="Acme Co."
          className={inputCls}
        />
      </Field>

      <Field label="Description" hint="A short summary of what the brand is.">
        <textarea
          name="description"
          rows={3}
          defaultValue={profile?.description ?? ""}
          placeholder="A friendly SaaS helping small teams ship marketing faster."
          className={inputCls}
        />
      </Field>

      <Field
        label="Product / service"
        hint="What you sell or offer to customers."
      >
        <textarea
          name="products_services"
          rows={3}
          defaultValue={profile?.products_services ?? ""}
          className={inputCls}
        />
      </Field>

      <Field label="Target audience" hint="Who the brand is for.">
        <textarea
          name="target_audience"
          rows={2}
          defaultValue={profile?.target_audience ?? ""}
          className={inputCls}
        />
      </Field>

      <Field
        label="Tone of voice"
        hint="How the brand should sound, e.g. warm, expert, playful."
      >
        <input
          name="brand_voice"
          defaultValue={profile?.brand_voice ?? ""}
          placeholder="Warm, confident, jargon-free"
          className={inputCls}
        />
      </Field>

      <Field label="Key messages" hint="One message per line.">
        <textarea
          name="key_messages"
          rows={4}
          defaultValue={arrayToLines(profile?.key_messages)}
          placeholder={"Save hours every week\nNo marketing experience needed"}
          className={inputCls}
        />
      </Field>

      <Field
        label="Banned phrases"
        hint="One per line. The AI will never use these."
      >
        <textarea
          name="banned_phrases"
          rows={3}
          defaultValue={arrayToLines(profile?.banned_phrases)}
          placeholder={"cheap\nguaranteed"}
          className={inputCls}
        />
      </Field>

      <Field label="Website" hint="Optional.">
        <input
          name="website_url"
          type="url"
          defaultValue={profile?.website_url ?? ""}
          placeholder="https://example.com"
          className={inputCls}
        />
      </Field>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : profile ? "Save changes" : "Create profile"}
        </button>
        {state.ok ? (
          <span role="status" className="text-sm text-green-600 dark:text-green-400">
            Saved.
          </span>
        ) : null}
        {state.error ? (
          <span role="alert" className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
