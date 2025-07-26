export type AlertType = "AlertMeta" | "AlertItem" | "AlertTrap" | "AlertGoal" | "AlertDeath";


export interface Alert {
    type: AlertType,
    payload: any
}