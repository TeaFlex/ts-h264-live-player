import { Size } from "../../utils/Size";

export abstract class Canvas {
    constructor(protected canvas: HTMLCanvasElement, protected size: Size) {
        console.log(this.toString());
    }

    toString(): string {
        return `${this.constructor.name} size: ${this.size}`;
    }
}