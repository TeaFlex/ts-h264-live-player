import "sylvester";
const { Matrix, Vector } = require("sylvester");

interface ModMatrix extends Sylvester.MatrixStatic {
    element?: number[];
    Translation: (v: Vector) => ModMatrix;
    flatten: () => number[];
    ensure4x4: () => any;
}

export const modMatrix: ModMatrix = Matrix;
export { Vector };

// augment Sylvester some
(Matrix as any).Translation = function (v: Vector)
{
  if (v.elements.length == 2) {
    var r = Matrix.I(3);
    r.elements[2][0] = v.elements[0];
    r.elements[2][1] = v.elements[1];
    return r;
  }

  if (v.elements.length == 3) {
    var r = Matrix.I(4);
    r.elements[0][3] = v.elements[0];
    r.elements[1][3] = v.elements[1];
    r.elements[2][3] = v.elements[2];
    return r;
  }

  throw "Invalid length for Translation";
};

(Matrix as any).prototype.flatten = function ()
{
    var result = [];
    if (this.elements.length == 0)
        return [];


    for (var j = 0; j < this.elements[0].length; j++)
        for (var i = 0; i < this.elements.length; i++)
            result.push(this.elements[i][j]);
    return result;
};

(Matrix as any).prototype.ensure4x4 = function()
{   
    if (this.elements.length == 4 &&
        this.elements[0].length == 4)
        return this;

    if (this.elements.length > 4 ||
        this.elements[0].length > 4)
        return null;

    for (var i = 0; i < this.elements.length; i++) {
        for (var j = this.elements[i].length; j < 4; j++)
            this.elements[i].push((i === j)? 1 : 0);
    }

    for (var i: number = this.elements.length; i < 4; i++) {
        const tab = [0, 0, 0, 0];
        tab[i] = 1;
        this.elements.push(tab);
    }

    return this;
};


(Vector as any).prototype.flatten = function ()
{
    return this.elements;
};

//
// gluPerspective
//
export function makePerspective(fovy: any, aspect: any, znear: any, zfar: any)
{
    var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
    var ymin = -ymax;
    var xmin = ymin * aspect;
    var xmax = ymax * aspect;

    return makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
}

//
// glFrustum
//
function makeFrustum(left: any, right: any,
                     bottom: any, top: any,
                     znear: any, zfar: any)
{
    var X = 2*znear/(right-left);
    var Y = 2*znear/(top-bottom);
    var A = (right+left)/(right-left);
    var B = (top+bottom)/(top-bottom);
    var C = -(zfar+znear)/(zfar-znear);
    var D = -2*zfar*znear/(zfar-znear);

    return $M([[X, 0, A, 0],
               [0, Y, B, 0],
               [0, 0, C, D],
               [0, 0, -1, 0]]);
}

console.log();
