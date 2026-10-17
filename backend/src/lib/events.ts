/**
 * Minimal in-process event bus. Handlers are synchronous subscribers;
 * the notify() fan-out in routes/notifications.ts is the only publisher
 * path that matters. Redis pub/sub later: swap emit() for publish and
 * add a subscriber that calls the same handlers.
 */
export type EventHandler = (event: AppEvent) => void | Promise<void>;

export interface AppEvent {
  /** Dotted name, e.g. "application.received". */
  type: string;
  /** User who should be notified (never the actor — enforced by callers). */
  userId: string;
  title: string;
  body?: string;
  link?: string;
  /** Email payload when this event also sends mail. */
  email?: { subject: string; html: string; tags?: string[] };
}

const handlers = new Set<EventHandler>();

export function onEvent(handler: EventHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export async function emit(event: AppEvent): Promise<void> {
  for (const handler of handlers) {
    await handler(event);
  }
}

export function handlerCount(): number {
  return handlers.size;
}
