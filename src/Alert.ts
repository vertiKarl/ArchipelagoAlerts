export type AlertType =
  | "AlertMeta"
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
