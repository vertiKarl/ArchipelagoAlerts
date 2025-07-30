import type { Alert } from "./Alert";
import { Priority, Queue } from "./Queue";
import { pickRandom, stringToHue } from "./util";
import { images, sfx } from "../sources.json";
import type { Hint, Item, Player } from "archipelago.js";

export class DisplayManager {
  private alertQueue = new Queue<Alert>();
  private isAnimating = false;

  /**
   * A management class handling the display of alerts
   * on the frontend
   */
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

  /**
   * Adds an alert object to the queue
   * @param alert The alert object to be added to the queue
   * @param skipQueue If the queue should be skipped (critical priority)
   */
  public push(alert: Alert, skipQueue?: boolean) {
    if (skipQueue) {
      this.isAnimating = false;
    }
    this.alertQueue.push(alert, skipQueue ? Priority.CRITICAL : Priority.LOW);
  }

  /**
   * Locks the queue for pop() operations unless of critical priority
   * NOTE: This does not stop push() operations.
   */
  public lockQueue() {
    this.alertQueue.lock();
  }

  /**
   * Unlocks the queue for pop() operations of all priorities.
   */
  public unlockQueue() {
    this.alertQueue.unlock();
  }

  private displayAlert() {
    if (this.isAnimating) return;
    const app = document.querySelector("#app") as HTMLElement;
    if (!app) return;
    const img = app.querySelector("#visual") as HTMLImageElement;
    const audio = app.querySelector("#audio") as HTMLAudioElement;
    const text = app.querySelector("#text") as HTMLHeadingElement;

    const alert = this.alertQueue.pop()?.[0];
    if (!alert) {
      return;
    }

    this.isAnimating = true;
    let timeout = 4000;

    app.classList.remove("hide");
    app.classList.remove("hide-long");
    app.classList.remove("hide-short");
    img.classList.remove("grayscale");

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
        const image = pickRandom(itemImages);
        const itemSounds = item?.progression
          ? sfx.progressionItemReceived
          : sfx.itemReceived;
        const sound = pickRandom(itemSounds);

        img!.src = image || "";
        text!.innerHTML = `<player style="color: hsl(${stringToHue(
          alert.slot
        )}, 80%, 50%);">${alert.slot}</player> received <item class="${
          item.progression ? "progression" : "item"
        }">${item.name}</item> from <player style="color: hsl(${stringToHue(
          item.sender.name
        )}, 80%, 50%);">${item.sender.name}</player>`;
        audio!.src = sound || "";

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

        const image = pickRandom(images.trapReceived);
        const sound = pickRandom(sfx.trapReceived);

        img!.src = image || "";
        text!.innerHTML = `Received <trap>${
          trap.name
        }</item> from <player style="color: hsl(${stringToHue(
          trap.sender.name
        )}, 80%, 50%);">${trap.sender.name}</player>`;
        audio!.src = sound || "";

        if (sound) audio!.play();
        app.classList.add("hide");
        break;
      }
      case "AlertGoal": {
        const player = (alert.payload as Player) || { name: "TestAlert" };
        const image = pickRandom(images.goalCompleted);
        const sound = pickRandom(sfx.goalCompleted);

        img!.src = image || "";
        text!.innerHTML = `<player style="color: hsl(${stringToHue(
          player.name
        )}, 80%, 50%)">${
          player.name
        }</player> has completed their <goal>goal</goal>!`;
        app.classList.add("hide-long");

        audio!.src = sound || "";

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

        const image = pickRandom(images.deathlink);
        const sound = pickRandom(sfx.deathlink);

        img!.src = image || "";
        text!.innerHTML = `<player style="color: hsl(${stringToHue(
          death.source
        )}, 80%, 50%")>${
          death.source
        }</player> <death>died</death> because of <reason>${
          death.reason
        }</reason>!`;
        app.classList.add("hide-long");

        audio!.src = sound || "";

        if (sound) audio!.play();

        timeout = 10000;
        break;
      }
      case "AlertMeta": {
        const slot = alert.slot;
        const info = alert.payload;
        const image = pickRandom(images.meta);
        const sound = pickRandom(sfx.meta);

        img.src = image || "";

        audio.src = sound || "";
        if (sound) audio.play();

        text.innerHTML = `<player style="color: hsl(${stringToHue(
          slot
        )}, 80%, 50%)">${slot}</player>: ${info}`;
        app.classList.add("hide");

        break;
      }
      case "AlertHint": {
        const { slot, payload } = alert;
        const { entrance, item, found } = (payload as Hint) || {
          found: true,
          item: {
            name: "TestItem",
            locationName: "TestLocation",
          },
          entrance: "TestEntrance",
        };
        let image = found
          ? pickRandom(images.oldHint)
          : pickRandom(images.newHint);
        const sound = found ? pickRandom(sfx.oldHint) : pickRandom(sfx.newHint);

        if (sound) {
          audio.src = sound;
          audio.play();
        }
        if (found && !image) {
          // old hint and no image defined
          // use new hint image and grayscale filter
          image = pickRandom(images.newHint);
          img.classList.add("grayscale");
        }

        if (image) img.src = image || "";

        text.innerHTML = `<player style="color: hsl(${stringToHue(
          slot
        )}, 80%, 50%)">${slot}</player>'s <item class="${
          item.progression ? "progression" : "item"
        }">${item.name}</item> is at <location style="color: hsl(${stringToHue(
          item.locationName
        )}, 50%, 80%);">${item.locationName}</location>!${
          entrance !== "Vanilla" ? " (" + entrance + ")" : ""
        }`;

        app.classList.add("hide");
        break;
      }
      case "AlertCountdown": {
        const timer = alert.payload as number;
        const goTime = timer === 0;
        text.innerHTML = `<timer style="color: hsl(${
          timer * (360 / 10)
        }, 80%, 50%);">${goTime ? "GO" : timer}</timer>`;

        const image = goTime ? images.countdownGo : images.countdownTimer;
        img.src = pickRandom(image) || "";

        const sound = goTime
          ? pickRandom(sfx.countdownGo)
          : pickRandom(sfx.countdownTimer);

        audio.src = sound || "";

        if (sound) {
          audio.play();
        }

        app.classList.add("hide-short");
        timeout = 800;
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
