# An alerts page for Archipelago

Just setup your archipelago connection and enjoy alerts!
Customization is planned but is currently limited to local installs.

## To setup in obs

1. Add `https://vertikarl.github.io/ArchipelagoAlerts/` as a browser source to obs.
2. Login to your archipelago session interactively. (OBS->right click on browser source->interact)

TODO: Add login via query params to simplify initial connection.

### Deleting a connection

There is a hotkey "Ctrl+C" to delete the current connection and reload. This does not seem to work in obs for now though.
To delete the connection in obs just put "?delete" after the url once and take it out once the connection has been cleared.

## To setup locally

### Clone this repo

`git clone https://github.com/vertiKarl/ArchipelagoAlerts.git`

### Install dependencies

`yarn install`

### Running

Use local test server: `yarn dev`  
Build: `yarn build`

When building use your favorite static site server to host the files!
