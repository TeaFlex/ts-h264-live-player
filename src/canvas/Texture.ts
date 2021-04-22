import { Size } from "../utils/Size";

export class Texture {
    public texture: WebGLTexture;
    public format: any;
    public textureIDs: any = null;

    constructor(public gl: WebGLRenderingContext, public size: Size, format: any) {
        this.texture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        this.format = format ? format : gl.LUMINANCE; 
        gl.texImage2D(gl.TEXTURE_2D, 0, this.format, size.w, size.h, 0, this.format, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    fill(textureData: any, useTexSubImage2D: any) {
        var gl = this.gl;
        if(!(textureData.length >= this.size.w * this.size.h)) 
                throw "Texture size mismatch, data:" + textureData.length + ", texture: " + this.size.w * this.size.h;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        if (useTexSubImage2D) {
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.size.w , this.size.h, this.format, gl.UNSIGNED_BYTE, textureData);
        } else {
            // texImage2D seems to be faster, thus keeping it as the default
            gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.size.w, this.size.h, 0, this.format, gl.UNSIGNED_BYTE, textureData);
        }
    }
    bind(n: number, program: any, name: string) {
        var gl = this.gl;
        if (!this.textureIDs) {
            this.textureIDs = [gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2];
        }
        gl.activeTexture(this.textureIDs[n]);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(gl.getUniformLocation(program.program, name), n);
    }
}