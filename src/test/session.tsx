import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { SessionProvider } from "@/lib/session";

/**
 * Renders a component inside the session provider, the way the app does.
 * Tests stub `fetch` to answer /v1/me, which is what resolves the session.
 */
export function renderWithSession(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">): RenderResult {
  function Wrapper({ children }: { children: ReactNode }) {
    return <SessionProvider>{children}</SessionProvider>;
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
