import "./style.css";
import type { AlertType } from "./Alert";
import { ConnectionHandler } from "./ConnectionHandler";

const app = document.querySelector("#app") as HTMLElement;

// Sample URL
// [base]/?host=archipelago.gg&port=69696&slots=Karl,Karl2&password=

window.onload = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("invalid") !== null || urlParams.size === 0) {
    const fApSetttings = document.createElement("form");
    fApSetttings.id = "apsettings";
    const iHost = document.createElement("input");
    iHost.placeholder = "Host";
    iHost.value = "archipelago.gg";
    const iPort = document.createElement("input");
    iPort.placeholder = "Port";
    iPort.type = "number";
    iPort.min = "20000";
    iPort.max = "65535";
    const dSlots = document.createElement("div");
    dSlots.id = "slots";

    function addSlot() {
      const iSlot = document.createElement("input");
      iSlot.placeholder = "Slot";
      dSlots.appendChild(iSlot);
    }

    function removeSlot() {
      const childs = dSlots.children;
      if (childs.length > 1) childs[childs.length - 1].remove();
    }

    addSlot();

    const dSlotControl = document.createElement("div");
    dSlotControl.id = "SlotControls";

    const bAddSlot = document.createElement("button");
    bAddSlot.innerText = "+";
    bAddSlot.type = "button";
    bAddSlot.onclick = addSlot;
    const bRemoveSlot = document.createElement("button");
    bRemoveSlot.innerText = "-";
    bRemoveSlot.type = "button";
    bRemoveSlot.onclick = removeSlot;

    dSlotControl.appendChild(bAddSlot);
    dSlotControl.appendChild(bRemoveSlot);

    const dSlotContainer = document.createElement("div");
    dSlotContainer.id = "SlotContainer";
    dSlotContainer.appendChild(dSlots);
    dSlotContainer.appendChild(dSlotControl);

    const iPassword = document.createElement("input");
    iPassword.placeholder = "Password (optional)";
    const iSubmit = document.createElement("input");
    iSubmit.type = "submit";
    fApSetttings.appendChild(iHost);
    fApSetttings.appendChild(iPort);
    fApSetttings.appendChild(dSlotContainer);
    fApSetttings.appendChild(iPassword);
    fApSetttings.appendChild(iSubmit);

    fApSetttings.addEventListener("submit", function (event) {
      event.preventDefault();
      window.location.href =
        window.location.href.split("?")[0] +
        `?host=${iHost.value}` +
        `&port=${Number(iPort.value)}` +
        // this gets the value of all Slot input boxes
        `&slots=${([...dSlots.children] as HTMLInputElement[]).map(function (
          input: HTMLInputElement
        ) {
          return input.value;
        })}` +
        `&password=${iPassword.value}`;
    });

    app.innerHTML = "<h1>Connect to Archipelago</h1>";
    app.appendChild(fApSetttings);
  } else {
    const host = urlParams.get("host");
    const port = Number(urlParams.get("port"));
    const slots = urlParams.get("slots");
    const password = urlParams.get("password") || undefined;

    if (
      !host ||
      host.length <= 0 ||
      !port ||
      !slots ||
      slots.length <= 0 ||
      port <= 20000 ||
      port > 65535
    ) {
      window.location.href = window.location.href.split("?")[0] + "?invalid";
      return;
    } else {
      const handler = new ConnectionHandler(
        host,
        port,
        slots.split(","),
        password
      );
      // useful for testing
      // just run generateAlert("AlertItem") to view an example alert!
      (window as any).generateAlert = (type: AlertType) => {
        handler.registerAlert({ slot: "TestSlot", type, payload: "" });
      };
    }
  }
};
