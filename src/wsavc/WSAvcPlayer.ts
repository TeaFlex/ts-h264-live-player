import { EventEmitter } from "events";
import * as Canvases from "../canvas";
import { Avc } from "../utils/Consts";
import { Size } from "../utils/Size";

export class WSAvcPlayer extends EventEmitter {

  private canvas: HTMLCanvasElement;
  private canvasType: string;
  private avc: any;
  private ws: WebSocket | null;
  private pktnum: number;

  constructor(canvas: HTMLCanvasElement, canvasType?: string) {
    super();
    this.canvas = canvas;
    if(!canvasType) 
      canvasType = this.getCanvasTypes()[1];
    if(!this.getCanvasTypes().includes(canvasType)) {
      this.canvasType = this.getCanvasTypes()[1];
      console.warn(`"${canvasType}" is not a valid canvas type, ${this.canvasType} will be used instead.\nValid canvas types: ${this.getCanvasTypes()}.`);
    }
    else this.canvasType = canvasType;
    this.canvasType += "Canvas";
    this.avc = new Avc();
    this.ws = null;
    this.pktnum = 0;
  }

  decode(data: Uint8Array) {
    let naltype = "invalid frame";

    if (data.length > 4) {
      switch(data[4]) {
        case 0x65:
          naltype = "I frame";
          break;
        case 0x41:
          naltype = "P frame";
          break;
        case 0x67:
          naltype = "SPS";
          break;
        case 0x68:
          naltype = "PPS";
          break;
      }
    }
    this.avc.decode(data);
  }

  connectWithCustomClient(ws: WebSocket) {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.ws = ws;
    this.connect();
  }

  connectByUrl(url: string) {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.ws = new WebSocket(url);
    this.ws.binaryType = "arraybuffer";
    this.connect();
  }

  private connect() {
    this.ws!.onopen = () => {
      console.log(`Connected to the WebSocket server`);
    };

    let framesList: Uint8Array[] = [];

    this.ws!.onmessage = async (evt) => {
      if(typeof evt.data === "string")
        return this.cmd(JSON.parse(evt.data));

      this.pktnum++;

      const buffer = (evt.data instanceof Blob)? await evt.data.arrayBuffer(): evt.data;

      const frame = new Uint8Array(buffer);
      framesList.push(frame);
    };


    let running = true;

    const shiftFrame = () => {
      if(!running)
        return;

      if(framesList.length > 10) {
        console.log("Dropping frames", framesList.length);
        framesList = [];
      }

      let frame = framesList.shift();

      if(frame)
        this.decode(frame);
        
      requestAnimationFrame(shiftFrame);
    };
    shiftFrame.bind(this);
    shiftFrame();

    this.ws!.onclose = () => {
      running = false;
      console.log(`WSAvcPlayer: Connection closed on ${this.ws!.url}`);
    };
  }

  initCanvas(height: number, width: number) {
    const canvasFactory = ((Canvases as any)[this.canvasType]);
    const canvas = new canvasFactory(this.canvas, new Size(width, height));
    this.avc.onPictureDecoded = (buffer: Uint8Array, width: number, height: number) => {      
      canvas.decode(buffer, width, height);
    };
    this.emit("canvasReady", width, height);
  }

  cmd(cmd: {action: string, [key: string]: any}){
    console.log("Incoming request", cmd);

    if(cmd.action === "init") {
      this.initCanvas(cmd.width, cmd.height);
      this.canvas.width  = cmd.width;
      this.canvas.height = cmd.height;
    }
  }

  send(message: string) {
    if(this.ws) {
      this.ws.send(message);
      console.log(`"${message}" sent.`);
    }
  }

  startStream() {
    this.send("REQUESTRSTREAM");
  }

  stopStream() {
    this.send("STOPSTREAM");
  }

  disconnect() {
    this.ws!.close();
  }

  getCanvasTypes() {
    return Object.keys(Canvases as any).map(className => className.replace(/(Canvas)$/gm, ""));
  }
}
