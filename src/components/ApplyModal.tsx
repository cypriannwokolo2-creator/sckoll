"use client";

import { useState } from "react";
import { ApiError, api, type Opportunity } from "@/lib/api";

/** Pitch + bid form for applying to an opportunity. Notifies the parent on success. */
export default function ApplyModal({ opp, onClose, onApplied }: { opp: Opportunity; onClose: () => void; onApplied: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(form: FormData) {
    setError(null);
    setBusy(true);
    try {
      const bid = Number(form.get("bidAmount"));
      await api.apply(opp.id, {
        pitch: String(form.get("pitch") ?? ""),
        bidType: String(form.get("bidType") ?? "fixed"),
        ...(Number.isFinite(bid) && bid > 0 ? { bidAmount: bid } : {}),
      });
      onApplied();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not submit your application.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sckoll-auth-card" style={{ marginTop: "2rem" }}>
      <div className="sckoll-auth-card-heading">
        <p className="sckoll-kicker">Your pitch</p>
        <h2>Apply with context</h2>
        <p>Minimum 50 characters. Reference the brief, your proof, and your plan — not a generic paragraph.</p>
      </div>
      {error && <p className="sckoll-auth-error">{error}</p>}
      <form className="sckoll-auth-form" action={(f) => void onSubmit(f)}>
        <label>
          Pitch
          <textarea required name="pitch" rows={6} minLength={50} maxLength={3000} placeholder="Why you fit, what you would do first, and proof you have done it before…" />
        </label>
        <label>
          Bid type
          <select name="bidType" defaultValue={opp.rateType === "hourly" ? "hourly" : "fixed"}>
            <option value="fixed">Fixed price ($)</option>
            <option value="hourly">Hourly ($/hr)</option>
          </select>
        </label>
        <label>
          Your bid (optional)
          <input name="bidAmount" type="number" min={0} placeholder="4000" />
        </label>
        <button type="submit" className="sckoll-button sckoll-button-dark" disabled={busy}>
          {busy ? "Sending…" : "Send application"} <span>↗</span>
        </button>
        <button type="button" className="sckoll-social-button" onClick={onClose}>
          Cancel
        </button>
      </form>
    </div>
  );
}
