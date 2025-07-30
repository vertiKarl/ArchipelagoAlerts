import { Client } from "archipelago.js";
import type { Alert } from "./Alert";
import { DisplayManager } from "./DisplayManager";

export class ConnectionHandler {
  private clients: Map<string, Client> = new Map();
  private display = new DisplayManager();

  /**
   * A management class handling connecting to the archipelago instance,
   * receiving events and sending them over to the DisplayManager.
   * @param host The domain or ip adress of the archipelago instance
   * @param port The port of the archipelago instance
   * @param slots An array of slots to connect to
   * @param password Optionally provide a password to the instance
   */
  constructor(host: string, port: number, slots: string[], password?: string) {
    this.setupClients(host, port, slots, password);
  }

  /**
   * Initializes the clients map and opens the relevant connections.
   * @param host The domain or ip adress of the archipelago instance
   * @param port The port of the archipelago instance
   * @param slots An array of slots to connect to
   * @param password Optionally provide a password to the instance
   */
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
        this.clients.set(slot, client);
      } catch (err) {
        console.error(err);
      }
    }
  }

  /**
   * Adds eventlisteners to all relevant archipelago events
   * @param client The client to hook the events from
   */
  private hookEvents(client: Client) {
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

      client.items.on("hintReceived", (hint) => {
        const alert: Alert = {
          slot: client.name,
          type: "AlertHint",
          payload: hint,
        };
        this.registerAlert(alert);
      });

      client.messages.on("countdown", (text, value, _nodes) => {
        // it's redundant to show the countdown alert twice
        // so we only respect it for one client
        if (client.name !== this.clients.entries().next().value?.[0]) return;
        if (text.endsWith("s")) {
          // this event gives us the length of the timer,
          // so we will lock the queue till this event is over.
          this.display.lockQueue();
          setTimeout(() => {
            // this is a failsafe if we never received the last countdown event
            this.display.unlockQueue();
          }, value * 1000);
        } else {
          console.log("Countdown:", value);
          const alert: Alert = {
            slot: client.name,
            type: "AlertCountdown",
            payload: value,
          };
          this.registerAlert(alert, true);
          if (value === 0) {
            this.display.unlockQueue();
          }
        }
      });

      // without this timeout we run into a race condition
      // leading to a blank client.name
      setTimeout(() => {
        console.log("Logged in as", client.name);
        const connectedAlert: Alert = {
          slot: client.name,
          type: "AlertMeta",
          payload: "Successfully connected to archipelago!",
        };

        this.registerAlert(connectedAlert);
      }, 200);
    });
  }

  /**
   * Adds an alert to the displaymanager queue
   * @param alert The Alert to be added
   * @param skipQueue If the queue should be skipped or not (high priority)
   */
  public registerAlert(alert: Alert, skipQueue?: boolean) {
    console.log(
      "Registering",
      alert.type,
      "(Skipping queue:",
      (skipQueue ? "Yes" : "No") + ")"
    );
    this.display.push(alert, skipQueue);
  }
}
