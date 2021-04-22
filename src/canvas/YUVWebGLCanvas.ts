import { Size } from "../utils/Size";
import { Program } from "./Program";
import { Script } from "./Script";
import { Shader } from "./Shader";
import { Texture } from "./Texture";
import { WebGLCanvas } from "./WebGLCanvas";

var vertexShaderScript = Script.createFromSource("x-shader/x-vertex", `
  attribute vec3 aVertexPosition;
  attribute vec2 aTextureCoord;
  uniform mat4 uMVMatrix;
  uniform mat4 uPMatrix;
  varying highp vec2 vTextureCoord;
  void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    vTextureCoord = aTextureCoord;
  }
`);


var fragmentShaderScript = Script.createFromSource("x-shader/x-fragment", `
  precision highp float;
  varying highp vec2 vTextureCoord;
  uniform sampler2D YTexture;
  uniform sampler2D UTexture;
  uniform sampler2D VTexture;
  const mat4 YUV2RGB = mat4
  (
   1.1643828125, 0, 1.59602734375, -.87078515625,
   1.1643828125, -.39176171875, -.81296875, .52959375,
   1.1643828125, 2.017234375, 0, -1.081390625,
   0, 0, 0, 1
  );

  void main(void) {
   gl_FragColor = vec4( texture2D(YTexture,  vTextureCoord).x, texture2D(UTexture, vTextureCoord).x, texture2D(VTexture, vTextureCoord).x, 1) * YUV2RGB;
  }
`);

export class YUVWebGLCanvas extends WebGLCanvas {
    YTexture: Texture | null = null
    UTexture: Texture | null = null;
    VTexture: Texture | null = null;
    constructor(canvas: HTMLCanvasElement, size: Size) {
        super(canvas, size);
    }

    onInitShaders() {
        this.program = new Program(this.gl);
        this.program.attach(new Shader(this.gl, vertexShaderScript));
        this.program.attach(new Shader(this.gl, fragmentShaderScript));
        this.program.link();
        this.program.use();
        this.vertexPositionAttribute = this.program.getAttributeLocation("aVertexPosition");
        this.gl.enableVertexAttribArray(this.vertexPositionAttribute);
        this.textureCoordAttribute = this.program.getAttributeLocation("aTextureCoord");;
        this.gl.enableVertexAttribArray(this.textureCoordAttribute);
    }

    onInitTextures() {
        console.log("creatingTextures: size: " + this.size);
        this.YTexture = new Texture(this.gl, this.size, null);
        this.UTexture = new Texture(this.gl, this.size.getHalfSize(), null);
        this.VTexture = new Texture(this.gl, this.size.getHalfSize(), null);
    }

    onInitSceneTextures() {
        this.YTexture!.bind(0, this.program, "YTexture");
        this.UTexture!.bind(1, this.program, "UTexture");
        this.VTexture!.bind(2, this.program, "VTexture");
    }

    fillYUVTextures(y: any, u: any, v: any) {
        this.YTexture!.fill(y, null);
        this.UTexture!.fill(u, null);
        this.VTexture!.fill(v, null);
    }

    decode(buffer: any, width: number, height: number) {
        if (!buffer)
            return;

        var lumaSize = width * height;
        var chromaSize = lumaSize >> 2;

        this.YTexture!.fill(buffer.subarray(0, lumaSize), null);
        this.UTexture!.fill(buffer.subarray(lumaSize, lumaSize + chromaSize), null);
        this.VTexture!.fill(buffer.subarray(lumaSize + chromaSize, lumaSize + 2 * chromaSize), null);
        this.drawScene();
    }

    toString() {
        return "YUVCanvas Size: " + this.size;
    }
}