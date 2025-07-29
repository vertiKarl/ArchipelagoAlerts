import { Client, Item, Player } from "archipelago.js";
import type { Alert } from "./alert";
import { Queue } from "./queue";
import { images, sfx } from "../sources.json";
import { stringToHue } from "./util";

export class NameToBeDetermined {
  private clients: Map<string, Client> = new Map();
  private alertQueue = new Queue<Alert>();
  private isAnimating = false;

  constructor(host: string, port: number, slots: string[], password?: string) {
    const app = document.querySelector("#app");
    if (!app) return;

    const img = document.createElement("img");
    img.id = "visual";
    app.appendChild(img);

    const h1 = document.createElement("h1");
    h1.id = "text";
    app.appendChild(h1);

    const audio = document.createElement("audio");
    audio.id = "audio";
    app.appendChild(audio);

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
    this.alertQueue.addEventListener("PushFrame", () => {
      this.displayAlert();
    });

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

  registerAlert(alert: Alert) {
    console.log("registering alert");
    this.alertQueue.push(alert);
  }

  private displayAlert() {
    if (this.isAnimating) return;
    console.log("Next Alert");
    const app = document.querySelector("#app") as HTMLElement;
    if (!app) return;
    const img = app.querySelector("#visual") as HTMLImageElement;
    const audio = app.querySelector("#audio") as HTMLAudioElement;
    const text = app.querySelector("#text") as HTMLHeadingElement;

    const alert = this.alertQueue.pop()[0];
    if (!alert) {
      return;
    }

    this.isAnimating = true;
    let timeout = 4000;

    app.classList.remove("hide");
    app.classList.remove("hide-long");
    app.offsetWidth; // trigger browser to reflow because animations are dumb

    switch (alert.type) {
      case "AlertItem": {
        const item =
          (alert.payload as Item) ||
          ({
            progression: false,
            name: "TestItem",
            sender: {
              name: "TestSender",
            },
          } as Item);
        const itemImages = item?.progression
          ? images.progressionItemReceived
          : images.itemReceived;
        const image = itemImages[Math.floor(Math.random() * itemImages.length)];
        const itemSounds = item?.progression
          ? sfx.progressionItemReceived
          : sfx.itemReceived;
        const sound = itemSounds[Math.floor(Math.random() * itemSounds.length)];

        img!.src = image;
        text!.innerHTML = `${alert.slot} received <item class="${
          item.progression ? "progression" : "item"
        }">${item.name}</item> from <player style="color: hsl(${stringToHue(
          item.sender.name
        )}, 80%, 50%);">${item.sender.name}</player>`;
        audio!.src = sound;

        if (sound) audio!.play();
        app.classList.add("hide");
        timeout = item.progression ? 4000 : 2500;
        break;
      }
      case "AlertTrap": {
        const trap =
          (alert.payload as Item) ||
          ({
            name: "TestTrap",
            sender: {
              name: "TestSender",
            },
          } as Item);
        const trapImages = images.trapReceived;
        const image = trapImages[Math.floor(Math.random() * trapImages.length)];
        const trapSounds = sfx.trapReceived;
        const sound = trapSounds[Math.floor(Math.random() * trapSounds.length)];

        img!.src = image;
        text!.innerHTML = `Received <trap>${
          trap.name
        }</item> from <player style="color: hsl(${stringToHue(
          trap.sender.name
        )}, 80%, 50%);">${trap.sender.name}</player>`;
        audio!.src = sound;

        if (sound) audio!.play();
        app.classList.add("hide");
        break;
      }
      case "AlertGoal": {
        const player = (alert.payload as Player) || { name: "TestAlert" };
        const goalImages = images.goalCompleted;
        const image = goalImages[Math.floor(Math.random() * goalImages.length)];
        const goalSounds = sfx.goalCompleted;
        const sound = goalSounds[Math.floor(Math.random() * goalSounds.length)];

        img!.src = image;
        text!.innerHTML = `<player style="hsl(${stringToHue(
          player.name
        )}, 80%, 50%")>${
          player.name
        }</player> has completed their <goal>goal</goal>!`;
        app.classList.add("hide-long");

        audio!.src = sound;

        if (sound) audio!.play();
        break;
      }
      case "AlertDeath": {
        interface Death {
          source: string;
          time: number;
          reason: string;
        }
        const death: Death = alert.payload || {
          source: "TestPlayer",
          time: 0,
          reason: "TestAlert",
        };
        const deathImages = images.deathlink;
        const image =
          deathImages[Math.floor(Math.random() * deathImages.length)];
        const deathSounds = sfx.deathlink;
        const sound =
          deathSounds[Math.floor(Math.random() * deathSounds.length)];

        img!.src = image;
        text!.innerHTML = `<player style="hsl(${stringToHue(
          death.source
        )}, 80%, 50%")>${
          death.source
        }</player> <death>died</death> because of <reason>${
          death.reason
        }</reason>!`;
        app.classList.add("hide-long");

        audio!.src = sound;

        if (sound) audio!.play();

        timeout = 10000;
        break;
      }
      case "AlertMeta": {
        const slot = alert.slot;
        const info = alert.payload;
        text.innerHTML = `<player style="hsl(${stringToHue(
          slot
        )})">${slot}</player>: ${info}`;
        app.classList.add("hide");

        break;
      }
      default: {
        console.error("Event", alert.type, "not implemented!");
        break;
      }
    }

    app.classList.add("fade-in");

    console.log("start timeout");
    setTimeout(() => {
      this.isAnimating = false;
      this.displayAlert();
    }, timeout);
  }
}
