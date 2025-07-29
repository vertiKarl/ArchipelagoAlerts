import type { Alert } from "./Alert";
import { Queue } from "./Queue";
import { stringToHue } from "./util";
import { images, sfx } from "../sources.json";
import type { Item, Player } from "archipelago.js";

export class DisplayManager {
  private alertQueue = new Queue<Alert>();
  private isAnimating = false;

  constructor() {
    const app = document.querySelector("#app");
    if (!app) {
      throw new Error(
        "DisplayManager: Initialization failed, no element with id app found!"
      );
    }

    const img = document.createElement("img");
    img.id = "visual";
    app.appendChild(img);

    const h1 = document.createElement("h1");
    h1.id = "text";
    app.appendChild(h1);

    const audio = document.createElement("audio");
    audio.id = "audio";
    app.appendChild(audio);

    this.alertQueue.addEventListener("PushFrame", () => {
      this.displayAlert();
    });
  }

  public push(alert: Alert) {
    this.alertQueue.push(alert);
  }

  private displayAlert() {
    if (this.isAnimating) return;
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
        text!.innerHTML = `<player style="color: hsl(${stringToHue(
          alert.slot
        )}, 80%, 50%);">${alert.slot}</player> received <item class="${
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
        text!.innerHTML = `<player style="color: hsl(${stringToHue(
          player.name
        )}, 80%, 50%)">${
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
        text!.innerHTML = `<player style="color: hsl(${stringToHue(
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
        text.innerHTML = `<player style="color: hsl(${stringToHue(
          slot
        )}, 80%, 50%)">${slot}</player>: ${info}`;
        app.classList.add("hide");

        break;
      }
      default: {
        console.error("Event", alert.type, "not implemented!");
        break;
      }
    }

    app.classList.add("fade-in");
    setTimeout(() => {
      this.isAnimating = false;
      this.displayAlert();
    }, timeout);
  }
}
