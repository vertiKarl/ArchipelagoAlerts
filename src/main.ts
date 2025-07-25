import './style.css'
import { Client, Item, Player } from "archipelago.js";
import { Queue } from "./queue";
import { images, sfx } from "../sources.json";
import type { Alert, AlertType } from './alert';
import { stringToHue } from './util';

const app = document.querySelector('#app') as HTMLElement;
const client = new Client();

interface AP_SETTINGS {
  host: string,
  port: number,
  slot: string,
  password?: string
}

window.onload = async () => {

  async function saveArchipelagoSettings(data: AP_SETTINGS) {
    const form = document.querySelector('#apsettings');
    if(!form) return;

    if(
      data.host.length <= 0 ||
      data.port <= 20000 ||
      data.port >= 65535 ||
      data.slot.length <= 0
    ) return;

    try {
      await client.login(`${data.host}:${data.port}`, data.slot)
      const prevErr = app?.querySelector("#error");
      if(prevErr) {
        prevErr.parentNode?.removeChild(prevErr);
      }

      localStorage.archipelago = JSON.stringify(data);
    }
    catch (err) {
      console.error(err)
      const error = document.createElement("p");
      error.id = "error";
      error.innerHTML = "Couldn't connect to Archipelago, please check your settings.";
      if(app) {
        app.appendChild(error);
      }
      return;
    }
  }

  if(app) {
    if(!localStorage.archipelago) {
      const fApSetttings = document.createElement("form");
      fApSetttings.id = "apsettings";
      const iHost = document.createElement("input");
      iHost.placeholder = "Host";
      const iPort = document.createElement("input");
      iPort.placeholder = "Port";
      iPort.type = "number";
      iPort.min = "20000";
      iPort.max = "65535"
      const iSlot = document.createElement("input");
      iSlot.placeholder = "Slot";
      const iPassword = document.createElement("input");
      iPassword.placeholder = "Password (optional)";
      const iSubmit = document.createElement("input");
      iSubmit.type = "submit";
      fApSetttings.appendChild(iHost);
      fApSetttings.appendChild(iPort);
      fApSetttings.appendChild(iSlot);
      fApSetttings.appendChild(iPassword);
      fApSetttings.appendChild(iSubmit);

      fApSetttings.addEventListener('submit', function(event) {
        event.preventDefault();
        saveArchipelagoSettings({
          host: iHost.value,
          port: Number(iPort.value),
          slot: iSlot.value,
          password: iPassword.value
        });
      })

      app.innerHTML = '<h1>Connect to Archipelago</h1>';
      app.appendChild(fApSetttings);


    } else {
      const apsettings: AP_SETTINGS = JSON.parse(localStorage.archipelago);
      try {
        console.log("Trying to connect to archipelago with existing credentials")
        await client.login(`${apsettings.host}:${apsettings.port}`, apsettings.slot);
      } catch (err) {
        console.error(err);
      }
    }
  }
}


client.socket.on("connected", () => {
  console.log("connected")
  if(!app) return;

  const alertQueue = new Queue<Alert>();

  (window as any).generateAlert = (type: AlertType) => {
    alertQueue.push({type, payload: ""});
    console.log(alertQueue.data.length);
    sendAlert();
    console.log(alertQueue.data.length);
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

  client.items.on("itemsReceived", (items, index) => {
    if(index != 0) {
      for(const item of items) {
        const alert: Alert = {type: "AlertItem", payload: item};
        alertQueue.push(alert);
      }
      sendAlert();
    }
  });

  client.messages.on("goaled", (_text, player, _nodes) => {
    const alert: Alert = {
      type: 'AlertGoal',
      payload: player
    }

    alertQueue.push(alert);
    sendAlert();
  })

  let isAnimating = false;


  const sendAlert = () => {
    if(isAnimating) return;
    console.log("Next Alert")
    const img = app.querySelector("#visual") as HTMLImageElement;
    const audio = app.querySelector('#audio') as HTMLAudioElement;
    const text = app.querySelector("#text") as HTMLHeadingElement;
    
    const alert = alertQueue.pop()[0];
    if(!alert) {
      return;
    };

    isAnimating = true;
    let timeout = 2500;

    app.classList.remove("hide");
    app.classList.remove("hide-long");
    app.offsetWidth; // trigger browser to reflow because animations are dumb

    switch(alert.type) {
      case 'AlertItem':
        {
          const item = (alert.payload as Item) || {
            progression: false,
            name: "TestItem",
            sender: {
              name: "TestSender"
            }
          } as Item;
          const itemImages = item?.progression ? images.progressionItemReceived : images.itemReceived;
          const image = itemImages[Math.floor(Math.random() * itemImages.length)];
          const itemSounds = item?.progression ? sfx.progressionItemReceived : sfx.itemReceived;
          const sound = itemSounds[Math.floor(Math.random() * itemSounds.length)];

          img!.src = image;
          text!.innerHTML = `Received <item class="${item.progression ? "progression" : "item"}">${item.name}</item> from <player style="color: hsl(${stringToHue(item.sender.name)}, 80%, 50%);">${item.sender.name}</player>`
          audio!.src = sound;

          if(sound) audio!.play()
          app.classList.add("hide");
          break;
        }
      case 'AlertGoal':
        {
          const player = alert.payload as Player || {name: "TestAlert"};
          const goalImages = images.goalCompleted;
          const image = goalImages[Math.floor(Math.random() * goalImages.length)];
          const goalSounds = sfx.goalCompleted;
          const sound = goalSounds[Math.floor(Math.random() * goalSounds.length)];

          img!.src = image;
          text!.innerHTML = `<player style="hsl(${stringToHue(player.name)}, 80%, 50%")>${player.name}</player> has completed their <goal>goal</goal>!`
          app.classList.add("hide-long");

          audio!.src = sound;

          if(sound) audio!.play()

          timeout = 10000;
          break;
        }
    }

    app.classList.add("fade-in");



    console.log("start timeout")
    setTimeout(() => {
      isAnimating = false;
      sendAlert();
    }, timeout);
  }
})