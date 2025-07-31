import "./style.css";

const app = document.querySelector("#app") as HTMLElement;

// Sample URL
// [base]/alerts/?host=archipelago.gg&port=69696&slots=Karl,Karl2&password=&lang=de-DE

document.addEventListener("DOMContentLoaded", async () => {
  const fApSetttings = app.querySelector("#apsettings");
  if (!fApSetttings) return;

  const sLang = fApSetttings.querySelector("#lang") as HTMLSelectElement;
  if (!sLang) return;

  const dSlots = fApSetttings.querySelector("#slots") as HTMLDivElement;
  if (!dSlots) return;

  window.navigator.languages.forEach((lang) => {
    const oLang = document.createElement("option");
    oLang.text = lang;
    oLang.value = lang;
    sLang.options.add(oLang);
  });

  const addButton = fApSetttings.querySelector("#addSlot") as HTMLButtonElement;
  const removeButton = fApSetttings.querySelector(
    "#removeSlot"
  ) as HTMLButtonElement;

  addButton.onclick = function addSlot() {
    const iSlot = document.createElement("input");
    iSlot.placeholder = "Slot";
    dSlots.appendChild(iSlot);
  };

  removeButton.onclick = function removeSlot() {
    const childs = dSlots.children;
    if (childs.length > 1) childs[childs.length - 1].remove();
  };

  fApSetttings.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!event.target) return;
    const data = new FormData(event.target as HTMLFormElement);
    const props = Object.fromEntries(data);

    window.location.href =
      window.location.href.split("?")[0] +
      `alerts/` +
      `?host=${props.host}` +
      `&port=${Number(props.port)}` +
      // this gets the value of all Slot input boxes
      `&slots=${([...dSlots.children] as HTMLInputElement[]).map(function (
        input: HTMLInputElement
      ) {
        return input.value;
      })}` +
      `&password=${props.password}` +
      `&lang=${props.lang}`;
  });
});
