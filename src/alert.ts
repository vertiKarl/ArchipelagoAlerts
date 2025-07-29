export type AlertType =
  | "AlertMeta"
  | "AlertItem"
  | "AlertTrap"
  | "AlertGoal"
  | "AlertDeath";

export interface Alert {
  slot: string;
  type: AlertType;
  payload: any;
}
