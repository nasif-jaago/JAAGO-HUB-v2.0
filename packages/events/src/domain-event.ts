export interface DomainEvent<T = unknown> {
  id: string;
  name: string;
  orgId: string;
  correlationId: string;
  userId?: string;
  timestamp: string;
  payload: T;
  version: number;
}

export type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void> | void;
