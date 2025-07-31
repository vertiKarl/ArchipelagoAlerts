import "../base/style.css"; // @todo split stylesheets
import type { AlertType } from "./Alert";
import { ConnectionHandler } from "./ConnectionHandler";

// Sample URL
// [base]/?host=archipelago.gg&port=69696&slots=Karl,Karl2&password=&lang=de-DE

window.onload = async () => {
  const urlParams = new URLSearchParams(window.location.search);
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
    window.location.href = window.location.href.split("alerts")[0];
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
};
