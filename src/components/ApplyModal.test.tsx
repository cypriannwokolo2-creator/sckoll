import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Opportunity } from "@/lib/api";
import ApplyModal from "./ApplyModal";
const OPP: Opportunity = {
  id: "00000000-0000-0000-0000-000000000009",
  clientId: "client-1",
  category: "development-it",
  type: "project",
  title: "Rebuild a marketing site",
  description: "Long brief goes here.",
  skills: ["react"],
  budgetMin: null,
  budgetMax: null,
  rateType: "hourly",
  location: null,
  remote: true,
  status: "open",
  createdAt: "2026-10-17T10:00:00.000Z",
  updatedAt: "2026-10-17T10:00:00.000Z",
};

const PITCH = "I have shipped this exact scope three times; here is my plan for week one and the proof.";

function stubFetch(body: unknown, status = 200) {
  const fn = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () =>
    ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response,
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ApplyModal", () => {
  it("renders the pitch requirements and bid defaults for the opportunity", () => {
    render(<ApplyModal opp={OPP} onClose={vi.fn()} onApplied={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Apply with context" })).toBeInTheDocument();
    const pitch = screen.getByPlaceholderText(/Why you fit/);
    expect(pitch).toBeRequired();
    expect(pitch).toHaveAttribute("minlength", "50");
    expect(screen.getByRole("combobox")).toHaveValue("hourly");
    expect(screen.getByRole("button", { name: /send application/i })).toBeEnabled();
  });

  it("submits the pitch and reports success to the parent", async () => {
    const user = userEvent.setup();
    const onApplied = vi.fn();
    const fetchMock = stubFetch({ ok: true, application: { id: "a1" } });

    render(<ApplyModal opp={OPP} onClose={vi.fn()} onApplied={onApplied} />);
    await user.type(screen.getByPlaceholderText(/Why you fit/), PITCH);
    await user.click(screen.getByRole("button", { name: /send application/i }));

    await vi.waitFor(() => expect(onApplied).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain(`/v1/opportunities/${OPP.id}/apply`);
    expect(JSON.parse(String(init?.body ?? "{}"))).toMatchObject({ pitch: PITCH, bidType: "hourly" });
  });

  it("surfaces a server rejection and does not report success", async () => {
    const user = userEvent.setup();
    const onApplied = vi.fn();
    stubFetch({ error: "already_applied", message: "You already applied to this opportunity." }, 409);

    render(<ApplyModal opp={OPP} onClose={vi.fn()} onApplied={onApplied} />);
    await user.type(screen.getByPlaceholderText(/Why you fit/), PITCH);
    await user.click(screen.getByRole("button", { name: /send application/i }));

    expect(await screen.findByText("You already applied to this opportunity.")).toBeInTheDocument();
    expect(onApplied).not.toHaveBeenCalled();
  });

  it("closes when Cancel is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    stubFetch({ ok: true });

    render(<ApplyModal opp={OPP} onClose={onClose} onApplied={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
