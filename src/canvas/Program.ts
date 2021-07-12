export class Program {
    public program: WebGLProgram | null;

    constructor(private gl: WebGLRenderingContext) {
        this.program = this.gl.createProgram();
        this.attach = this.attach.bind(this);
        this.link = this.link.bind(this);
        this.use = this.use.bind(this);
        this.getAttributeLocation = this.getAttributeLocation.bind(this);
        this.setMatrixUniform = this.setMatrixUniform.bind(this);
    }

    attach(shader: any) {
        this.gl.attachShader(this.program!, shader.shader)
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
}