import { Client } from "archipelago.js";
import type { Alert } from "./Alert";
import { DisplayManager } from "./DisplayManager";

export class ConnectionHandler {
  private clients: Map<string, Client> = new Map();
  private display = new DisplayManager();

  constructor(host: string, port: number, slots: string[], password?: string) {
    this.setupClients(host, port, slots, password);
  }

  private async setupClients(
    host: string,
    port: number,
    slots: string[],
    password?: string
  ) {
    for (const slot of slots) {
      const client = new Client();
      try {
        console.log(
          "Trying to connect to",
          `${host}:${port} with slot ${slot} and password ${password}`
        );
        this.hookEvents(client);

        await client.login(`${host}:${port}`, slot, undefined, {
          password: password || "", // for some reason the client does not connect when omitting the password field
        });
        console.log("passed login");
        this.clients.set(slot, client);
      } catch (err) {
        console.error(err);
      }
    }
  }

  private hookEvents(client: Client) {
    console.log("hooking events");

    client.socket.on("connected", () => {
      client.items.on("itemsReceived", (items, index) => {
        if (index != 0) {
          for (const item of items) {
            let alert: Alert;
            if (!item.trap) {
              alert = { slot: client.name, type: "AlertItem", payload: item };
            } else {
              alert = { slot: client.name, type: "AlertTrap", payload: item };
            }
            this.registerAlert(alert);
          }
        }
      });

      client.messages.on("goaled", (_text, player, _nodes) => {
        const alert: Alert = {
          slot: client.name,
          type: "AlertGoal",
          payload: player,
        };

        this.registerAlert(alert);
      });

      client.deathLink.on("deathReceived", (source, time, cause) => {
        const alert: Alert = {
          slot: client.name,
          type: "AlertDeath",
          payload: {
            source,
            time,
            cause,
          },
        };

        this.registerAlert(alert);
      });

      client.items.on("hintReceived", (_hint) => {
        // stub
      });

      client.items.on("hintFound", (_hint) => {
        // stub
      });

      client.messages.on("itemCheated", (_text, _item, _nodes) => {
        // stub
      });

      // without this timeout we run into a race condition
      // leading to a blank client.name
      setTimeout(() => {
        const connectedAlert: Alert = {
          slot: client.name,
          type: "AlertMeta",
          payload: "Successfully connected to archipelago!",
        };

        this.registerAlert(connectedAlert);
      }, 200);
    });
  }

  public registerAlert(alert: Alert) {
    console.log("registering alert");
    this.display.push(alert);
  }
}
