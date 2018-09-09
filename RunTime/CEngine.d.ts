/* File: CEngine.mjs
 * Author: Rhuan
 * Date: 27/10/2017
 * Collision System for miniSphere game engine
 * Usage: FIX ME - WRITE USAGE HERE OR EXTERNAL GUIDE DOC
 * License for MEngine.mjs, SEngine.mjs and CEngine.mjs and related files
 * Copyright (c) 2017 Richard Lawrence (Rhuan)
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 * Except as contained in this notice, the name(s) of the above copyright holders
 * shall not be used in advertising or otherwise to promote the sale, use or other
 * dealings in this Software without prior written authorization.
 */

//@ts-check

/// <reference path="../SphereV2.d.ts" />
import SEngine from "./SEngine";
import MEngine from "./MEngine";


/*

CEngine is designed to:
- handle collision between polygons of any shape
- be as efficient as possible
- integrate seemlessly with the Dispatch API
- integrate seemlessly with SEngine and MEngine BUT also work alone
- doesn't really work alone at the moment #FinishMe
*/

//primary class for external use
export default class CEngine
{
    constructor(cType?: number)
    SEngine : SEngine
    MEngine : MEngine
    cType   : number
    tFract  : number

    /**
     * Function for colliding an entity from SEngine with other entities and Map Obstructions
     * Returns an array of all found collisions
     * 
     * #needs better documentation
     */
    collide(ref: number, layer: number, x: number, y: number, d_x: number, d_y: number, polygons: Polygon[]): Collision[]

    /**
     * Static method for colliding two polys
     * the first poly is translated by x, y before the comparison
     * 
     * Supports rectangles and circles only
     * 
     */
    static polysCollide(x: number, y: number, _one: Polygon, two: Polygon): boolean

}


//#FIX ME make collision returns consistent
//this needs more thought # FINISH ME

//define collision types
declare const spriteCollision = 0;
declare const tileCollision = 1;
declare const triggerCollision = 2;
declare const zoneCollision = 3;
//add more here

declare function findFirst(array: {index: number}[], target : number) : number

declare class Polygon
{
    constructor(type : number, x : number, y : number, w : number, h : number)
    type  : number
    x     : number
    y     : number
    w     : number
    h     : number
}

declare function placeHolder(name : string, type : string) : { onPlayer : Function, onOther : Function}

/**@typedef {Object} polygon
 * @property {number} x
 * @property {number} y
 * @property {number} w - for a circle this is the radius
 * @property {number} h - unused for circles
 * @property {number} type - 0 = circle, 1 = rectangle
*/

export declare class Collision
{
    constructor(type : number, ref : string, scripts:{[name:string] : Function})
    type : number
    ref : string
    scripts : {[name:string] : Function}
}

declare class CEngineError extends Error
{
    constructor(message : string)
}
