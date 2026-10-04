/**
 * Demo adjacent TypeScript snippet for Stash asset testing.
 */

export interface KitchenSinkMetric {
  id: string;
  name: string;
  value: number;
  status: "idle" | "running" | "completed";
}

export function evaluateMetric(metric: KitchenSinkMetric): string {
  return `[${metric.status.toUpperCase()}] ${metric.name}: ${metric.value}`;
}
