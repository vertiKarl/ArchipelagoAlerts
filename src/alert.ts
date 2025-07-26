export type AlertType = "AlertItem" | "AlertTrap" | "AlertGoal" | "AlertDeath";


export interface Alert {
    type: AlertType,
    payload: any
}