import type { Alert, AlertConnectionStatus } from "./Alert";
import { Priority, Queue } from "./Queue";
import { pickRandom, stringToHue } from "./util";
import { images, sfx } from "../sources.json";
import type { Hint, Item, Player } from "archipelago.js";
import i18next from "i18next";
import i18nextLanguageDetector from "i18next-browser-languagedetector";
import i18nextHttpBackend, {
  type HttpBackendOptions,
} from "i18next-http-backend";

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

    const urlParams = new URLSearchParams(window.location.search);

    console.log("Initializing with language:", urlParams.get("lang"));

    this.initTranslator(urlParams.get("lang") || undefined);
  }

  private async initTranslator(lang?: string) {
    await i18next
      .use(i18nextLanguageDetector)
      .use(i18nextHttpBackend)
      .init<HttpBackendOptions>({
        debug: false, // @todo enable when run in dev mode
        fallbackLng: "en",
        lng: lang,
        supportedLngs: ["en", "de"],
        ns: ["alerts"],
        defaultNS: "alerts",
        load: "languageOnly",
        nonExplicitSupportedLngs: true,
        interpolation: {
          escapeValue: false,
        },
        backend: {
          loadPath: "/ArchipelagoAlerts/lang/{{lng}}.json",
        },
      });

    console.log("Translator initialized");
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
    let timeout = 2000;

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

        const translatedString = i18next.t("alerts.itemReceived", {
          sender: `<player style="color: hsl(${stringToHue(
            item.sender.name
          )}, 80%, 50%)">${item.sender.name}</player>`,
          receiver: `<player style="color: hsl(${stringToHue(
            alert.slot
          )}, 80%, 50%);">${alert.slot}</player>`,
          item: `<item class="${item.progression ? "progression" : "item"}">${
            item.name
          }</item>`,
        });

        text!.innerHTML = translatedString;
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
        const translatedString = i18next.t("alerts.trapReceived", {
          trap: `<trap>${trap.name}</trap>`,
          sender: `<player style="color: hsl(${stringToHue(
            trap.sender.name
          )}, 80%, 50%);">${trap.sender.name}</player>`,
          receiver: `<player style="color: hsl(${stringToHue(
            alert.slot
          )}, 80%, 50%);">${alert.slot}</player>`,
        });

        text!.innerHTML = translatedString;
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
        const translatedString = i18next.t("alerts.goalReceived", {
          sender: `<player style="color: hsl(${stringToHue(
            player.name
          )}, 80%, 50%)">${player.name}</player>`,
        });

        text!.innerHTML = translatedString;
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

        const translatedString = i18next.t("alerts.deathReceived", {
          victim: `<player style="color: hsl(${stringToHue(
            death.source
          )}, 80%, 50%")>${death.source}</player>`,
          reason: `<reason>${death.reason}</reason>`,
        });

        img!.src = image || "";
        text!.innerHTML = translatedString;
        app.classList.add("hide-long");

        audio!.src = sound || "";

        if (sound) audio!.play();

        timeout = 10000;
        break;
      }
      case "AlertConnection": {
        const { slot, payload } = alert;
        const { code }: { code: AlertConnectionStatus } = payload;

        const image = pickRandom(images.connection[code]);
        const sound = pickRandom(sfx.connection[code]);

        img.src = image || "";

        audio.src = sound || "";
        if (sound) audio.play();

        const translatedString = i18next.t(`alerts.connection.${code}`, {
          slot: `<player style="color: hsl(${stringToHue(slot)}, 80%, 50%")>${
            alert.slot
          }</player>`,
        });

        text.innerHTML = translatedString;
        app.classList.add(code === "success" ? "hide-short" : "hide");

        timeout = code === "success" ? 2000 : 800;

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

        let translatedString = i18next.t("alerts.hintReceived", {
          receiver: `<player style="color: hsl(${stringToHue(
            slot
          )}, 80%, 50%)">${slot}</player>`,
          item: `<item class="${item.progression ? "progression" : "item"}">${
            item.name
          }</item>`,
          location: `<location style="color: hsl(${stringToHue(
            item.locationName
          )}, 50%, 80%);">${item.locationName}</location>`,
        });

        translatedString += entrance !== "Vanilla" ? " (" + entrance + ")" : "";

        text.innerHTML = translatedString;

        app.classList.add("hide");
        break;
      }
      case "AlertCountdown": {
        const timer = alert.payload as number;
        const goTime = timer === 0;

        const goString = i18next.t("alerts.countdownGO");

        text.innerHTML = `<timer style="color: hsl(${
          timer * (360 / 10)
        }, 80%, 50%);">${goTime ? goString : timer}</timer>`;

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
        const translatedString = i18next.t("errors.eventNotImplemented", {
          type: alert.type,
        });
        console.error(translatedString);
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
