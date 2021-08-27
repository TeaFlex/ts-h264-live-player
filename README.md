# ts-h264-live-player
Typescript portage of [131/h264-live-player](https://github.com/131/h264-live-player/tree/master/vendor), the client-side h264 video player using WebSocket.

This package needs to be used with either [the server-side of 131/h264-live-player](https://github.com/131/h264-live-player) or either with the package [pistreamer](https://www.npmjs.com/package/pistreamer).

>Note: This package is meant to run on a browser. Trying to directly run it with node.js will result in an error.

## Installation

Via your favorite package manager:
```sh
#npm
npm i ts-h264-live-player
```
```sh
#yarn
yarn add ts-h264-live-player
```

Or by downloading the Javascript file (see releases on [Github](https://github.com/TeaFlex/ts-h264-live-player)):
```html
<script src="path/to/ts-h264-live-player.js"></script>
```
## Usage

Create an instance of the player:
```js
// Create a canvas element
let canvas = document.createElement("canvas");
// Or select an existing one
canvas = document.getElementById("mycanvas");
// And pass it to the player.
const player = new WSAvcPlayer(canvas);
```

Connect the player to the server:
```js
// By directly giving the address
player.connectByUrl("ws://someAddress.lan");

// Or by giving an Websocket object
const ws = new WebSocket("ws://someAddress.lan");
player.connectWithCustomClient(ws);
```

And control your video stream:
```js
// Using directly the methods
player.startStream();
player.stopStream();

// Or just by sending directly the request.
player.send("REQUESTSTREAM");
player.send("STOPSTREAM");
```

>Note that certain requests may not work depending on the server-side app you are using. Please, refer to the server-side app documentation.

## Build it !

You can build your player js file by building it directly from the repo. To do so, clone the repo as such:
```sh
git clone https://github.com/TeaFlex/ts-h264-live-player
```

Install all the dependencies:
```sh
npm i #or "yarn"
```

Then build it with the following command:
```sh
npm run build #or "yarn build"
```
The compiled file will appear in the `public` folder.

If you want to contribute to the project, you can also run it with:
```sh
npm start #or "yarn start"
```
That command will compile the project and serve the content of the `public` folder.