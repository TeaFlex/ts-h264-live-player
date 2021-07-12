import { Shader } from "./Shader";

export class Program {
    private program: WebGLProgram | null;

    constructor(private gl: WebGLRenderingContext) {
        this.program = this.gl.createProgram();
    }

    attach(shader: Shader) {
        this.gl.attachShader(this.program!, shader.getShader()!)
    }

    link() {
        this.gl.linkProgram(this.program!);
        // If creating the shader program failed, alert.
        if (!this.gl.getProgramParameter(this.program!, this.gl.LINK_STATUS))
            console.error("Unable to initialize the shader program.");
    }

    use() {
        this.gl.useProgram(this.program!);
    }

    getAttributeLocation(name: string) {
        return this.gl.getAttribLocation(this.program!, name);
    }

    setMatrixUniform(name: string, array: Float32Array) {
        const uniform = this.gl.getUniformLocation(this.program!, name);
        this.gl.uniformMatrix4fv(uniform, false, array);
    }

    getProgram() {
        return this.program;
    }
}