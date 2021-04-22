/**
 * Represents a WebGL shader object and provides a mechanism to load shaders from HTML
 * script tags.
 */

export class Shader {
    shader: WebGLShader | null;
    constructor(gl: WebGLRenderingContext, script: any) {
        this.shader = null;
        if (script.type == "x-shader/x-fragment") {
            this.shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (script.type == "x-shader/x-vertex") {
            this.shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            console.error("Unknown shader type: " + script.type);
            return;
        }
        
        // Send the source to the shader object.
        gl.shaderSource(this.shader!, script.source);
        
        // Compile the shader program.
        gl.compileShader(this.shader!);
        
        // See if it compiled successfully.
        if (!gl.getShaderParameter(this.shader!, gl.COMPILE_STATUS)) {
            console.error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(this.shader!));
        }
    }
}

