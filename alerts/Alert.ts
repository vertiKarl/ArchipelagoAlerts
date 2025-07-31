export type AlertConnectionStatus = "success" | "failed" | "lost";

export type AlertType =
  | "AlertMeta"
  | "AlertConnection"
  | "AlertItem"
  | "AlertTrap"
  | "AlertGoal"
  | "AlertDeath"
  | "AlertHint"
  | "AlertCountdown";

export interface Alert {
  slot: string;
  type: AlertType;
  payload: any;
}
