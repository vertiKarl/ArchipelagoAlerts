export type AlertType = "AlertItem" | "AlertGoal";


export interface Alert {
    type: AlertType,
    payload: any
}