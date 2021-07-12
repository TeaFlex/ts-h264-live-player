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
  uniform sampler2D FTexture;

  void main(void) {
   gl_FragColor = texture2D(FTexture,  vTextureCoord);
  }
`);

export class FilterWebGLCanvas extends WebGLCanvas {

    FTexture?: Texture;

    constructor(canvas: HTMLCanvasElement, size: any, useFrameBuffer?: boolean) {
        super(canvas, size, useFrameBuffer);
    }

    onInitShaders() {
      this.program = new Program(this.gl);
      this.program.attach(new Shader(this.gl, vertexShaderScript));
      this.program.attach(new Shader(this.gl, fragmentShaderScript));
      this.program.link();
      this.program.use();
      this.vertexPositionAttribute = this.program.getAttributeLocation("aVertexPosition");
      this.gl.enableVertexAttribArray(this.vertexPositionAttribute);
      this.textureCoordAttribute = this.program.getAttributeLocation("aTextureCoord");
      this.gl.enableVertexAttribArray(this.textureCoordAttribute);
    }
    
    onInitTextures() {
      console.log("creatingTextures: size: " + this.size);
      this.FTexture = new Texture(this.gl, this.size, this.gl.RGBA);
    }
  
    onInitSceneTextures() {
      this.FTexture!.bind(0, this.program!, "FTexture");
    }
  
    process(buffer: Uint8Array, output: ArrayBufferView) {
      this.FTexture!.fill(buffer);
      this.drawScene();
      this.readPixels(output);
    }
  
    toString() {
      return "FilterWebGLCanvas Size: " + this.size;
    }
}