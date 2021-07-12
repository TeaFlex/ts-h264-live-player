import { Size } from "../utils/Size";

export abstract class Canvas {
    constructor(protected canvas: HTMLCanvasElement, protected size: Size) {}

    toString(): string {
        return `${this.constructor.name}: ${this.size}`;
    }
}