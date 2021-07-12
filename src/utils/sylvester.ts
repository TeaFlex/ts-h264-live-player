// Typescript implementation of jcoglan's Sylvester library.
// https://github.com/jcoglan/sylvester
// This file only contains Matrix and Vector logic of Sylvester.

var Sylvester = {
    precision: 1e-6,
};

export class Vector {
    public elements: number[] = [];
    // Returns element i of the vector
    e(i: number) {
        return (i < 1 || i > this.elements.length) ? null : this.elements[i-1];
    }

    // Returns the number of elements the vector has
    dimensions() {
        return this.elements.length;
    }

    // Returns the modulus ('length') of the vector
    modulus() {
        return Math.sqrt(this.dot(this)!);
    }

    // Returns true iff the vector is equal to the argument
    eql(vector: Vector) {
        var n = this.elements.length;
        var V = vector.elements;
        if (n != V.length) { return false; }
        do {
        if (Math.abs(this.elements[n-1] - V[n-1]) > Sylvester.precision) { return false; }
        } while (--n);
        return true;
    }

    // Returns a copy of the vector
    dup() {
        return Vector.create(this.elements);
    }

    // Maps the vector to another vector according to the given function
    map(fn: (x: number, y: number) => any) {
        var elements: number[] = [];
        this.each(function(x, i) {
            elements.push(fn(x, i));
        });
        return Vector.create(elements);
    }
    
    // Calls the iterator for each element of the vector in turn
    each(fn: (x: number, y: number) => any) {
        var n = this.elements.length, k = n, i;
        do { i = k - n;
            fn(this.elements[i], i+1);
        } while (--n);
    }

    // Returns a new vector created by normalizing the receiver
    toUnitVector() {
        var r = this.modulus();
        if (r === 0) { return this.dup(); }
        return this.map(function(x) { return x/r; });
    }

    // Returns the angle between the vector and the argument (also a vector)
    angleFrom(vector: Vector) {
        var V = vector.elements;
        var n = this.elements.length, k = n, i;
        if (n != V.length) { return null; }
        var dot = 0, mod1 = 0, mod2 = 0;
        // Work things out in parallel to save time
        this.each(function(x, i) {
        dot += x * V[i-1];
        mod1 += x * x;
        mod2 += V[i-1] * V[i-1];
        });
        mod1 = Math.sqrt(mod1); mod2 = Math.sqrt(mod2);
        if (mod1*mod2 === 0) { return null; }
        var theta = dot / (mod1*mod2);
        if (theta < -1) { theta = -1; }
        if (theta > 1) { theta = 1; }
        return Math.acos(theta);
    }

    // Returns true iff the vector is parallel to the argument
    isParallelTo(vector: Vector) {
        var angle = this.angleFrom(vector);
        return (angle === null) ? null : (angle <= Sylvester.precision);
    }

    // Returns true iff the vector is antiparallel to the argument
    isAntiparallelTo(vector: Vector) {
        var angle = this.angleFrom(vector);
        return (angle === null) ? null : (Math.abs(angle - Math.PI) <= Sylvester.precision);
    }

    // Returns true iff the vector is perpendicular to the argument
    isPerpendicularTo(vector: Vector) {
        var dot = this.dot(vector);
        return (dot === null) ? null : (Math.abs(dot) <= Sylvester.precision);
    }

    // Returns the result of adding the argument to the vector
    add(vector: Vector) {
        var V = vector.elements;
        if (this.elements.length != V.length) { return null; }
        return this.map(function(x, i) { return x + V[i-1]; });
    }

    // Returns the result of subtracting the argument from the vector
    subtract(vector: Vector) {
        var V = vector.elements;
        if (this.elements.length != V.length) { return null; }
        return this.map(function(x, i) { return x - V[i-1]; });
    }

    // Returns the result of multiplying the elements of the vector by the argument
    multiply(k: number) {
        return this.map(function(x) { return x*k; });
    }

    x(k: number) { return this.multiply(k); }

    // Returns the scalar product of the vector with the argument
    // Both vectors must have equal dimensionality
    dot(vector: Vector) {
        var V = vector.elements;
        var i, product = 0, n = this.elements.length;
        if (n != V.length) { return null; }
        do { product += this.elements[n-1] * V[n-1]; } while (--n);
        return product;
    }

    // Returns the vector product of the vector with the argument
    // Both vectors must have dimensionality 3
    cross(vector: Vector) {
        var B = vector.elements;
        if (this.elements.length != 3 || B.length != 3) { return null; }
        var A = this.elements;
        return Vector.create([
        (A[1] * B[2]) - (A[2] * B[1]),
        (A[2] * B[0]) - (A[0] * B[2]),
        (A[0] * B[1]) - (A[1] * B[0])
        ]);
    }

    // Returns the (absolute) largest element of the vector
    max() {
        var m = 0, n = this.elements.length, k = n, i;
        do { i = k - n;
        if (Math.abs(this.elements[i]) > Math.abs(m)) { m = this.elements[i]; }
        } while (--n);
        return m;
    }

    // Returns the index of the first match found
    indexOf(x: number) {
        var index = null, n = this.elements.length, k = n, i;
        do { i = k - n;
        if (index === null && this.elements[i] == x) {
            index = i + 1;
        }
        } while (--n);
        return index;
    }

    // Returns a diagonal matrix with the vector's elements as its diagonal elements
    toDiagonalMatrix() {
        return Matrix.Diagonal(this.elements);
    }

    // Returns the result of rounding the elements of the vector
    round() {
        return this.map(function(x) { return Math.round(x); });
    }

    // Returns a copy of the vector with elements set to the given value if they
    // differ from it by less than Sylvester.precision
    snapTo(x: number) {
        return this.map(function(y) {
        return (Math.abs(y - x) <= Sylvester.precision) ? x : y;
        });
    }

    // Returns the vector's distance from the argument, when considered as a point in space
    distanceFrom(obj: any) {
        if (obj.anchor) { return obj.distanceFrom(this); }
        var V = obj.elements || obj;
        if (V.length != this.elements.length) { return null; }
        var sum = 0, part;
        this.each(function(x, i) {
        part = x - V[i-1];
        sum += part * part;
        });
        return Math.sqrt(sum);
    }

    // Rotates the vector about the given object. The object should be a 
    // point if the vector is 2D, and a line if it is 3D. Be careful with line directions!
    rotate(t: any, obj: any) {
        var V, R, x, y, z;
        switch (this.elements.length) {
        case 2:
            V = obj.elements || obj;
            if (V.length != 2) { return null; }
            R = Matrix.Rotation(t)!.elements;
            x = this.elements[0] - V[0];
            y = this.elements[1] - V[1];
            return Vector.create([
            V[0] + R[0][0] * x + R[0][1] * y,
            V[1] + R[1][0] * x + R[1][1] * y
            ]);
            break;
        case 3:
            if (!obj.direction) { return null; }
            var C = obj.pointClosestTo(this).elements;
            R = Matrix.Rotation(t, obj.direction)!.elements;
            x = this.elements[0] - C[0];
            y = this.elements[1] - C[1];
            z = this.elements[2] - C[2];
            return Vector.create([
            C[0] + R[0][0] * x + R[0][1] * y + R[0][2] * z,
            C[1] + R[1][0] * x + R[1][1] * y + R[1][2] * z,
            C[2] + R[2][0] * x + R[2][1] * y + R[2][2] * z
            ]);
            break;
        default:
            return null;
        }
    }

    // Returns the result of reflecting the point in the given point, line or plane
    reflectionIn(obj: any) {
        if (obj.anchor) {
        // obj is a plane or line
        var P = this.elements.slice();
        var C = obj.pointClosestTo(P).elements;
        return Vector.create([C[0] + (C[0] - P[0]), C[1] + (C[1] - P[1]), C[2] + (C[2] - (P[2] || 0))]);
        } else {
        // obj is a point
        var Q = obj.elements || obj;
        if (this.elements.length != Q.length) { return null; }
        return this.map(function(x, i) { return Q[i-1] + (Q[i-1] - x); });
        }
    }

    // Utility to make sure vectors are 3D. If they are 2D, a zero z-component is added
    to3D() {
        var V = this.dup();
        switch (V.elements.length) {
        case 3: break;
        case 2: V.elements.push(0); break;
        default: return null;
        }
        return V;
    }

    // Returns a string representation of the vector
    inspect() {
        return '[' + this.elements.join(', ') + ']';
    }

    // Set vector's elements from an array
    setElements(els: number[]) {
        this.elements = els.slice();
        return this;
    }

    static create(elements: number[]) {
        var V = new Vector();
        return V.setElements(elements);
    }

    static i = Vector.create([1,0,0]);
    static j = Vector.create([0,1,0]);
    static k = Vector.create([0,0,1]);

    static Random(n: number) {
        var elements: number[] = [];
        do { elements.push(Math.random());
        } while (--n);
        return Vector.create(elements);
    }

    static Zero(n: number) {
        var elements: number[] = [];
        do { elements.push(0);
        } while (--n);
        return Vector.create(elements);
    }
}

export class Matrix {
    public elements: Array<number[]> = [];
    public modulus?: number;

    // Returns element (i,j) of the matrix
    e(i: number, j: number) {
        if (i < 1 || i > this.elements.length || j < 1 || j > this.elements[0].length) { return null; }
        return this.elements[i-1][j-1];
    }

    // Returns row k of the matrix as a vector
    row(i: number) {
        if (i > this.elements.length) { return null; }
        return Vector.create(this.elements[i-1]);
    }

    // Returns column k of the matrix as a vector
    col(j: number) {
        if (j > this.elements[0].length) { return null; }
        var col = [], n = this.elements.length, k = n, i;
        do { i = k - n;
        col.push(this.elements[i][j-1]);
        } while (--n);
        return Vector.create(col);
    }

    // Returns the number of rows/columns the matrix has
    dimensions() {
        return {rows: this.elements.length, cols: this.elements[0].length};
    }

    // Returns the number of rows in the matrix
    rows() {
        return this.elements.length;
    }

    // Returns the number of columns in the matrix
    cols() {
        return this.elements[0].length;
    }

    // Returns true iff the matrix is equal to the argument. You can supply
    // a vector as the argument, in which case the receiver must be a
    // one-column matrix equal to the vector.
    eql(matrix: Matrix) {
        var M = matrix.elements;
        if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M)!.elements; }
        if (this.elements.length != M.length ||
            this.elements[0].length != M[0].length) { return false; }
        var ni = this.elements.length, ki = ni, i, nj, kj = this.elements[0].length, j;
        do { i = ki - ni;
        nj = kj;
        do { j = kj - nj;
            if (Math.abs(this.elements[i][j] - M[i][j]) > Sylvester.precision) { return false; }
        } while (--nj);
        } while (--ni);
        return true;
    }

    // Returns a copy of the matrix
    dup() {
        return Matrix.create(this.elements);
    }

    // Maps the matrix to another matrix (of the same dimensions) according to the given function
    map(fn: (x: number, i: number, j: number) => number) {
        var els: number[][] = [], ni = this.elements.length, ki = ni, i, nj, kj = this.elements[0].length, j;
        do { i = ki - ni;
        nj = kj;
        els[i] = [];
        do { j = kj - nj;
            els[i][j] = fn(this.elements[i][j], i + 1, j + 1);
        } while (--nj);
        } while (--ni);
        return Matrix.create(els);
    }

    // Returns true iff the argument has the same dimensions as the matrix
    isSameSizeAs(matrix: Matrix) {
        var M = matrix.elements;
        if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M)!.elements; }
        return (this.elements.length == M.length &&
            this.elements[0].length == M[0].length);
    }

    // Returns the result of adding the argument to the matrix
    add(matrix: Matrix) {
        var M = matrix.elements;
        if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M)!.elements; }
        if (!this.isSameSizeAs(matrix)) { return null; }
        return this.map(function(x, i, j) { return x + M[i-1][j-1]; });
    }

    // Returns the result of subtracting the argument from the matrix
    subtract(matrix: Matrix) {
        var M = matrix.elements;
        if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M)!.elements; }
        if (!this.isSameSizeAs(matrix)) { return null; }
        return this.map(function(x, i, j) { return x - M[i-1][j-1]; });
    }

    // Returns true iff the matrix can multiply the argument from the left
    canMultiplyFromLeft(matrix: Matrix) {
        var M = matrix.elements;
        if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M)!.elements; }
        // this.columns should equal matrix.rows
        return (this.elements[0].length == M.length);
    }

    // Returns the result of multiplying the matrix from the right by the argument.
    // If the argument is a scalar then just multiply all the elements. If the argument is
    // a vector, a vector is returned, which saves you having to remember calling
    // col(1) on the result.
    multiply(matrix: Matrix | number) {
        if (typeof matrix === "number") {
            return this.map(function(x) { return x * matrix; });
        }
        var returnVector = (!!matrix.modulus);
        var M = matrix.elements;
        if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M)!.elements; }
        if (!this.canMultiplyFromLeft(matrix)) { return null; }
        var ni = this.elements.length, ki = ni, i, nj, kj = M[0].length, j;
        var cols = this.elements[0].length, elements: number[][] = [], sum, nc, c;
        do { i = ki - ni;
        elements[i] = [];
        nj = kj;
            do { j = kj - nj;
                sum = 0;
                nc = cols;
                do { c = cols - nc;
                sum += this.elements[i][c] * M[c][j];
                } while (--nc);
                elements[i][j] = sum;
            } while (--nj);
        } while (--ni);
        var N = Matrix.create(elements);
        return returnVector ? N!.col(1) : N;
    }

    x(matrix: Matrix) { return this.multiply(matrix); }

    // Returns a submatrix taken from the matrix
    // Argument order is: start row, start col, nrows, ncols
    // Element selection wraps if the required index is outside the matrix's bounds, so you could
    // use this to perform row/column cycling or copy-augmenting.
    minor(a: number, b: number, c: number, d: number) {
        var elements: number[][] = [], ni = c, i, nj, j;
        var rows = this.elements.length, cols = this.elements[0].length;
        do { i = c - ni;
        elements[i] = [];
        nj = d;
        do { j = d - nj;
            elements[i][j] = this.elements[(a+i-1)%rows][(b+j-1)%cols];
        } while (--nj);
        } while (--ni);
        return Matrix.create(elements);
    }

    // Returns the transpose of the matrix
    transpose() {
        var rows = this.elements.length, cols = this.elements[0].length;
        var elements: number[][] = [], ni = cols, i, nj, j;
        do { i = cols - ni;
        elements[i] = [];
        nj = rows;
        do { j = rows - nj;
            elements[i][j] = this.elements[j][i];
        } while (--nj);
        } while (--ni);
        return Matrix.create(elements);
    }

    // Returns true iff the matrix is square
    isSquare() {
        return (this.elements.length == this.elements[0].length);
    }

    // Returns the (absolute) largest element of the matrix
    max() {
        var m = 0, ni = this.elements.length, ki = ni, i, nj, kj = this.elements[0].length, j;
        do { i = ki - ni;
        nj = kj;
        do { j = kj - nj;
            if (Math.abs(this.elements[i][j]) > Math.abs(m)) { m = this.elements[i][j]; }
        } while (--nj);
        } while (--ni);
        return m;
    }

    // Returns the indeces of the first match found by reading row-by-row from left to right
    indexOf(x: number) {
        var index = null, ni = this.elements.length, ki = ni, i, nj, kj = this.elements[0].length, j;
        do { i = ki - ni;
        nj = kj;
        do { j = kj - nj;
            if (this.elements[i][j] == x) { return {i: i+1, j: j+1}; }
        } while (--nj);
        } while (--ni);
        return null;
    }

    // If the matrix is square, returns the diagonal elements as a vector.
    // Otherwise, returns null.
    diagonal() {
        if (!this.isSquare) { return null; }
        var els = [], n = this.elements.length, k = n, i;
        do { i = k - n;
        els.push(this.elements[i][i]);
        } while (--n);
        return Vector.create(els);
    }

    // Make the matrix upper (right) triangular by Gaussian elimination.
    // This method only adds multiples of rows to other rows. No rows are
    // scaled up or switched, and the determinant is preserved.
    toRightTriangular() {
        var M = this.dup(), els;
        var n = this.elements.length, k = n, i, np, kp = this.elements[0].length, p;
        do { i = k - n;
        if (M!.elements[i][i] == 0) {
            for (let j = i + 1; j < k; j++) {
            if (M!.elements[j][i] != 0) {
                els = []; np = kp;
                do { p = kp - np;
                els.push(M!.elements[i][p] + M!.elements[j][p]);
                } while (--np);
                M!.elements[i] = els;
                break;
            }
            }
        }
        if (M!.elements[i][i] != 0) {
            for (let j = i + 1; j < k; j++) {
                var multiplier = M!.elements[j][i] / M!.elements[i][i];
                els = []; np = kp;
                do { p = kp - np;
                    // Elements with column numbers up to an including the number
                    // of the row that we're subtracting can safely be set straight to
                    // zero, since that's the point of this routine and it avoids having
                    // to loop over and correct rounding errors later
                    els.push(p <= i ? 0 : M!.elements[j][p] - M!.elements[i][p] * multiplier);
                } while (--np);
                M!.elements[j] = els;
            }
        }
        } while (--n);
        return M;
    }

    toUpperTriangular() { return this.toRightTriangular(); }

    // Returns the determinant for square matrices
    determinant() {
        if (!this.isSquare()) { return null; }
        var M = this.toRightTriangular();
        var det = M!.elements[0][0], n = M!.elements.length - 1, k = n, i;
        do { i = k - n + 1;
        det = det * M!.elements[i][i];
        } while (--n);
        return det;
    }

    det() { return this.determinant(); }

    // Returns true iff the matrix is singular
    isSingular() {
        return (this.isSquare() && this.determinant() === 0);
    }

    // Returns the trace for square matrices
    trace() {
        if (!this.isSquare()) { return null; }
        var tr = this.elements[0][0], n = this.elements.length - 1, k = n, i;
        do { i = k - n + 1;
        tr += this.elements[i][i];
        } while (--n);
        return tr;
    }

    tr() { return this.trace(); }

    // Returns the rank of the matrix
    rank() {
        var M = this.toRightTriangular(), rank = 0;
        var ni = this.elements.length, ki = ni, i, nj, kj = this.elements[0].length, j;
        do { i = ki - ni;
        nj = kj;
        do { j = kj - nj;
            if (Math.abs(M!.elements[i][j]) > Sylvester.precision) { rank++; break; }
        } while (--nj);
        } while (--ni);
        return rank;
    }
    
    rk() { return this.rank(); }

    // Returns the result of attaching the given argument to the right-hand side of the matrix
    augment(matrix: Matrix) {
        var M = matrix.elements;
        if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M)!.elements; }
        var T = this.dup(), cols = T!.elements[0].length;
        var ni = T!.elements.length, ki = ni, i, nj, kj = M[0].length, j;
        if (ni != M.length) { return null; }
        do { i = ki - ni;
        nj = kj;
        do { j = kj - nj;
            T!.elements[i][cols + j] = M[i][j];
        } while (--nj);
        } while (--ni);
        return T;
    }

    // Returns the inverse (if one exists) using Gauss-Jordan
    inverse() {
        if (!this.isSquare() || this.isSingular()) { return null; }
        var ni = this.elements.length, ki = ni, i, j;
        var M = this.augment(Matrix.I(ni)!)!.toRightTriangular();
        var np, kp = M!.elements[0].length, p, els, divisor;
        var inverse_elements: number[][] = [], new_element;
        // Matrix is non-singular so there will be no zeros on the diagonal
        // Cycle through rows from last to first
        do { i = ni - 1;
        // First, normalise diagonal elements to 1
        els = []; np = kp;
        inverse_elements[i] = [];
        divisor = M!.elements[i][i];
        do { p = kp - np;
            new_element = M!.elements[i][p] / divisor;
            els.push(new_element);
            // Shuffle of the current row of the right hand side into the results
            // array as it will not be modified by later runs through this loop
            if (p >= ki) { inverse_elements[i].push(new_element); }
        } while (--np);
        M!.elements[i] = els;
        // Then, subtract this row from those above it to
        // give the identity matrix on the left hand side
        for (j = 0; j < i; j++) {
            els = []; np = kp;
            do { p = kp - np;
            els.push(M!.elements[j][p] - M!.elements[i][p] * M!.elements[j][i]);
            } while (--np);
            M!.elements[j] = els;
        }
        } while (--ni);
        return Matrix.create(inverse_elements);
    }

    inv() { return this.inverse(); }

    // Returns the result of rounding all the elements
    round() {
        return this.map(function(x) { return Math.round(x); });
    }

    // Returns a copy of the matrix with elements set to the given value if they
    // differ from it by less than Sylvester.precision
    snapTo(x: number) {
        return this.map(function(p) {
        return (Math.abs(p - x) <= Sylvester.precision) ? x : p;
        });
    }

    // Returns a string representation of the matrix
    inspect() {
        var matrix_rows = [];
        var n = this.elements.length, k = n, i;
        do { i = k - n;
        matrix_rows.push(Vector.create(this.elements[i]).inspect());
        } while (--n);
        return matrix_rows.join('\n');
    }

    // Set the matrix's elements from an array. If the argument passed
    // is a vector, the resulting matrix will be a single column.
    setElements(els: number[][]) {
        var i, elements = els;
        if (typeof(elements[0][0]) != 'undefined') {
        var ni = elements.length, ki = ni, nj, kj, j;
        this.elements = [];
        do { i = ki - ni;
            nj = elements[i].length; kj = nj;
            this.elements[i] = [];
            do { j = kj - nj;
            this.elements[i][j] = elements[i][j];
            } while (--nj);
        } while(--ni);
        return this;
        }
    }

    static create(elements: number[][]) {
        var M = new Matrix();
        return M.setElements(elements);
    }

    static I(n: number) {
        var els: number[][] = [], k = n, i, nj, j;
        do { i = k - n;
            els[i] = []; nj = k;
            do { j = k - nj;
            els[i][j] = (i == j) ? 1 : 0;
            } while (--nj);
        } while (--n);
        return Matrix.create(els);
    }

    static Diagonal(elements: number[]) {
        var n = elements.length, k = n, i;
        var M = Matrix.I(n);
        do { i = k - n;
            M!.elements[i][i] = elements[i];
        } while (--n);
        return M;
    }

    static Rotation(theta: number, a?: Vector) {
        if (!a) {
            return Matrix.create([
                [Math.cos(theta),  -Math.sin(theta)],
                [Math.sin(theta),   Math.cos(theta)]
            ]);
        }
        var axis = a.dup();
        if (axis.elements.length != 3) { return null; }
        var mod = axis.modulus();
        var x = axis.elements[0]/mod, y = axis.elements[1]/mod, z = axis.elements[2]/mod;
        var s = Math.sin(theta), c = Math.cos(theta), t = 1 - c;
        // Formula derived here: http://www.gamedev.net/reference/articles/article1199.asp
        // That proof rotates the co-ordinate system so theta
        // becomes -theta and sin becomes -sin here.
        return Matrix.create([
            [ t*x*x + c, t*x*y - s*z, t*x*z + s*y ],
            [ t*x*y + s*z, t*y*y + c, t*y*z - s*x ],
            [ t*x*z - s*y, t*y*z + s*x, t*z*z + c ]
        ]);
    }

    static RotationX(t: number) {
        var c = Math.cos(t), s = Math.sin(t);
        return Matrix.create([
            [  1,  0,  0 ],
            [  0,  c, -s ],
            [  0,  s,  c ]
        ]);
    }

    static RotationY(t: number) {
        var c = Math.cos(t), s = Math.sin(t);
        return Matrix.create([
            [  c,  0,  s ],
            [  0,  1,  0 ],
            [ -s,  0,  c ]
        ]);
    }

    static RotationZ(t: number) {
        var c = Math.cos(t), s = Math.sin(t);
        return Matrix.create([
            [  c, -s,  0 ],
            [  s,  c,  0 ],
            [  0,  0,  1 ]
        ]);
    }

    static Random(n: number, m: number) {
        return Matrix.Zero(n, m)!.map(
            function() { return Math.random(); }
        );
    }

    static Zero(n: number, m: number) {
        var els: number[][] = [], ni = n, i, nj, j;
        do { i = n - ni;
            els[i] = [];
            nj = m;
            do { j = m - nj;
            els[i][j] = 0;
            } while (--nj);
        } while (--ni);
        return Matrix.create(els);
    }
}