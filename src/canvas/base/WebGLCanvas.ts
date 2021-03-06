import { Size } from "../../utils/Size";
import { Program } from "./Program";
import { Script } from "./Script";
import { Shader } from "./Shader";
import { Texture } from "./Texture";
import { 
    Matrix, 
    Vector, 
    makePerspective 
} from "../../utils/sylvesterGlUtils";
import { Canvas } from "./Canvas";

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
  uniform sampler2D texture;
  void main(void) {
    gl_FragColor = texture2D(texture, vTextureCoord);
  }
`);

export abstract class WebGLCanvas extends Canvas {

    public gl: WebGLRenderingContext;
    public frameBuffer: WebGLFramebuffer | null = null;
    public frameBufferTexture: WebGLTexture | null = null;
    public quadVPBuffer: WebGLBuffer | null = null;
    public quadVTCBuffer: WebGLBuffer | null = null;
    public program: Program | null = null;
    public mvMatrix?: Matrix;
    public perspectiveMatrix?: Matrix;
    public glNames: any;
    public vertexPositionAttribute: number = 0;
    public textureCoordAttribute: number = 0;
    public texture?: Texture;

    constructor(
        canvas: HTMLCanvasElement, 
        size: Size, 
        protected useFrameBuffer = false
    ) {
        super(canvas, size);
        this.canvas.height = size.h;
        this.canvas.width = size.w;
        this.gl = {} as WebGLRenderingContext;

        this.onInitWebGL();
        this.onInitShaders();
        this.initBuffers();

        if (useFrameBuffer)
            this.initFrameBuffer();

        this.onInitTextures();
        this.initScene();
    }

    /**
     * Initialize a frame buffer so that we can render off-screen.
     */
    initFrameBuffer() {
        var gl = this.gl;

        // Create framebuffer object and texture.
        this.frameBuffer = gl.createFramebuffer()!; 
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        this.frameBufferTexture = new Texture(this.gl, this.size, gl.RGBA);

        // Create and allocate renderbuffer for depth data.
        const renderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.size.w, this.size.h);

        // Attach texture and renderbuffer to the framebuffer.
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, (this.frameBufferTexture as any).texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    }

    /**
     * Initialize vertex and texture coordinate buffers for a plane.
     */
    initBuffers() {
        let gl = this.gl;
        
        // Create vertex position buffer.
        this.quadVPBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVPBuffer);
        let tmp = [
            1.0,  1.0, 0.0,
            -1.0,  1.0, 0.0, 
            1.0, -1.0, 0.0, 
            -1.0, -1.0, 0.0
        ];
        
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tmp), gl.STATIC_DRAW);
        //(this.quadVPBuffer as any).itemSize = 3;
        //(this.quadVPBuffer as any).numItems = 4;
        
        /*
        +--------------------+ 
        | -1,1 (1)           | 1,1 (0)
        |                    |
        |                    |
        |                    |
        |                    |
        |                    |
        | -1,-1 (3)          | 1,-1 (2)
        +--------------------+
        */
        
        const scaleX = 1.0;
        const scaleY = 1.0;
        
        // Create vertex texture coordinate buffer.
        this.quadVTCBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVTCBuffer);
        tmp = [
            scaleX, 0.0,
            0.0, 0.0,
            scaleX, scaleY,
            0.0, scaleY,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tmp), gl.STATIC_DRAW);
    }

    mvIdentity() {
        this.mvMatrix = Matrix.I(4);
    }
    
    mvMultiply(m: Matrix) {
        console.log(this.mvMatrix);
        
        (this.mvMatrix as any) = this.mvMatrix!.x(m);
    }

    mvTranslate(m: any) {
        this.mvMultiply(Matrix.Translation(Vector.create([m[0], m[1], m[2]]))!.ensure4x4()!);
    }

    setMatrixUniforms() {
        this.program!.setMatrixUniform("uPMatrix", new Float32Array(this.perspectiveMatrix!.flatten()));
        this.program!.setMatrixUniform("uMVMatrix", new Float32Array(this.mvMatrix!.flatten()));
    }

    initScene() {
        var gl = this.gl;

        // Establish the perspective with which we want to view the
        // scene. Our field of view is 45 degrees, with a width/height
        // ratio of 640:480, and we only want to see objects between 0.1 units
        // and 100 units away from the camera.

        this.perspectiveMatrix = makePerspective(45, 1, 0.1, 100.0);

        // Set the drawing position to the "identity" point, which is
        // the center of the scene.
        this.mvIdentity();

        // Now move the drawing position a bit to where we want to start
        // drawing the square.
        this.mvTranslate([0.0, 0.0, -2.4]);

        // Draw the cube by binding the array buffer to the cube's vertices
        // array, setting attributes, and pushing it to GL.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVPBuffer);
        gl.vertexAttribPointer(this.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

        // Set the texture coordinates attribute for the vertices.

        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVTCBuffer);
        gl.vertexAttribPointer(this.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);  

        this.onInitSceneTextures();

        this.setMatrixUniforms();

        if (this.frameBuffer) {
            console.log("Bound Frame Buffer");
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        }
    }

    checkLastError(operation: string) {
        var err = this.gl.getError();
        if (err != this.gl.NO_ERROR) {
            var name = this.glNames[err];
            name = (name) ? name + "(" + err + ")":
                ("Unknown WebGL ENUM (0x)");
            if (operation) {
                console.log("WebGL Error: %s, %s", operation, name);
            } else {
                console.log("WebGL Error: %s", name);
            }
            console.trace();
        }
    }

    onInitWebGL() {
        try {
            this.gl = this.canvas.getContext("webgl")!;
        } catch(e) {}

        if (!this.gl)
            console.error("Unable to initialize WebGL. Your browser may not support it.");
 
        if (this.glNames)
            return;
    
        this.glNames = {};
        for (const propertyName in (this.gl as any)) {
            if (typeof (this.gl as any)[propertyName] === 'number') {
                this.glNames[(this.gl as any)[propertyName]] = propertyName;
            }
        }
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
        this.texture = new Texture(this.gl, this.size, this.gl.RGBA);
    }

    onInitSceneTextures() {
        this.texture!.bind(0, this.program!, "texture");
    }

    drawScene() {
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    clearScene() {
        this.gl.clearColor(0,0,0,1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    readPixels(buffer: ArrayBufferView) {
        this.gl.readPixels(0, 0, this.size.w, this.size.h, this.gl.RGBA, this.gl.UNSIGNED_BYTE, buffer);
    }
}
