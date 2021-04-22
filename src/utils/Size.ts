export class Size {
    constructor(public h: number, public w: number) {}

    toString(){
        return `(${this.w}, ${this.h})`;
    }

    getHalfSize() {
        return new Size(this.w >>> 1, this.h >>> 1);
    }

    length() {
        return this.h * this.w;
    }
}