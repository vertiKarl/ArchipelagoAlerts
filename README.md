[![Deploy static content to Pages](https://github.com/vertiKarl/ArchipelagoAlerts/actions/workflows/deploy.yml/badge.svg)](https://github.com/vertiKarl/ArchipelagoAlerts/actions/workflows/deploy.yml)

# An alerts page for Archipelago

Just setup your archipelago connection and enjoy alerts!
Customization is planned but is currently limited to local installs.

![Alert Preview](https://i.imgur.com/YLIufrx.png)

## To setup in obs

1. Visit https://vertikarl.github.io/ArchipelagoAlerts and enter your login information for archipelago.
2. Add the generated URL as a browser source to obs. (you will be redirected)

## To setup locally

This is needed to customize the alerts. (e.g. changing sounds, images or even changing the text!)

### Clone this repo

`git clone https://github.com/vertiKarl/ArchipelagoAlerts.git`

### Install dependencies

`yarn install`

### Running

Use local test server: `yarn dev`  
Build: `yarn build`  
Start/Serve: `yarn preview`

### Customizing

- To change sounds or images checkout /sources.json!
- Text can be found in /public/lang/[id].json, PRs for more translations are always welcome!
