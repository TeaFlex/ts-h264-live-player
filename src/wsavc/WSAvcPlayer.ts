import { EventEmitter } from "events";
import { YUVCanvas } from "../canvas/YUVCanvas";
import { YUVWebGLCanvas } from "../canvas/YUVWebGLCanvas";
import { Avc } from "../utils/Consts";
import { Size } from "../utils/Size";

export class WSAvcPlayer extends EventEmitter {

  private canvas: HTMLCanvasElement;
  private canvasType: string;
  private avc: any;
  private ws: WebSocket | null;
  private pktnum: number;

  constructor(canvas: HTMLCanvasElement, canvasType: string) {
    super();
    this.canvas = canvas;
    this.canvasType = canvasType;
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
      const frame = new Uint8Array(await evt.data.arrayBuffer());
      
      framesList.push(frame);
    };


    var running = true;

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
    const canvasFactory = this.canvasType === "webgl" || this.canvasType == "YUVWebGLCanvas"
                        ? YUVWebGLCanvas
                        : YUVCanvas;
    
    const canvas = new canvasFactory(this.canvas, new Size(width, height));
    
    this.avc.onPictureDecoded = (buffer: any, width: any, height: any) => {
      canvas.decode(buffer, width, height);
    };
    this.emit("canvasReady", width, height);
  }

  cmd(cmd: any){
    console.log("Incoming request", cmd);

    if(cmd.action == "init") {
      this.initCanvas(cmd.width, cmd.height);
      this.canvas.width  = cmd.width;
      this.canvas.height = cmd.height;
    }
  }

  disconnect() {
    this.ws!.close();
  }
}
