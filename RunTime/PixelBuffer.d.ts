/* File: PixelBuffer.d.ts
 * Author: Rhuan
 * Date: 21/09/2017
 * This script allows manipulation of images held as an array of RGBA (4 Uint8s per pixel)
 * It can also convert a tightly packed array of tiles each one comprised of RGBA pixel data
 * In to an array from 1st pixel to last of the whole image
 * 
 * Usage: There are 3 classes for external usage:
 * 1. DrawingBuffer
 * A Drawing Buffer can be used to create images by drawing with primative functions
 * A new drawing buffer is created as a rectangle of transparent pixels
 * Two paremeters are required for creation: width and height (in pixels)
 * let art = new DrawingBuffer(100, 200);
 * Drawing methods can be called to draw into it
 * e.g. to draw a line from 5,50 to 10, 40 you would do:
 * art.line(5, 50, 10, 40, [0.8, 0, 0, 1]);
 * Colours are always passed as an array of r, g, b, a with values from 0 to 1.0
 * Note all 4 values always be provided, alpha will not default when not specified
 * the finalise() method returns an object containing just width, height and data
 * these can be saved to a file or passed as the parameters to new Texture() for drawing
 * 
 * 2. TileBuffer
 * A TileBuffer is to hold a tileset or set of sprites or something similar
 * The purpose of a TileBuffer is to draw onto a MapBuffer
 * the constructor's arguments are:
 * a. source - the data source normally a filestream object
 * (note the pointer must be at the start of the tile data and the data is assumed to be
 * one after another, not an image where the tiles are drawn in rows already)
 * b. tileWidth - the width of each tile in pixels
 * c. tileHeight - the height of each tile in pixels
 * d. numTiles - the number of tiles in total
 * 
 * To convert this into an image of all of the tiles call tileBuffertoTexture
 * It will return width, height and data (the same as the finalise method for a Drawing Buffer)
 * 
 * 3. MapBuffer
 * THe purpose of a MapBuffer is to draw Tiles onto it, it takes 3 parameters:
 * a. tilesWide (the width of the map in tiles)
 * b. tilesHigh (the height of the map in )
 * c. tileBuffer (a tileBuffer object you're going to draw from onto this map)
 * 
 * You can draw onto the Map with the setTileInBuffer method it requires 2 arguments:
 * a. tile - the tile to draw counted from the start of the tileBuffer (0 is the first tile)
 * b. target - the tile to draw to, 0 is the first one - counted left to right along each row
 * of the map
 * 
 * When all tiles are drawn you can use the tileBuffertoTexture on the map to return width, height
 * and data as above these can be handed to new Texture
 * 
 * License for MEngine.mjs, SEngine.mjs and related files
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

 /// <reference path="../SphereV2.d.ts" />

 import DataStream from "data-stream";

//Internal class do not use directly
declare class PixelBuffer
{
    constructor(buffer : ArrayBuffer, width : number, height : number)
}

//Internal class do not use directly
declare class internalTileBuffer extends PixelBuffer
{
    constructor(buffer : ArrayBuffer, tileWidth : number, tileHeight : number, tilesWide : number, tilesHigh : number)

    /**Convert a buffer of tightly packed tile data into a buffer that can be converted to a texture*/
    tileBufferToTexture() : { width : number, height : number, data : ArrayBuffer}

}

/**A MapBuffer is a buffer of data created from a TileBuffer
 * to assemble a larger image out of smaller parts
 */
export class MapBuffer extends internalTileBuffer
{
    constructor(tilesWide : number, tilesHigh : number, tileBuffer : TileBuffer)
    /**Place the specified tile fomr this buffer's tileBuffer into the specified target location in this buffer*/
    setTileInBuffer(tile : number, target : number) : void
}

/**A TileBuffer is a buffer of tile data intended for
 * generating a map or some other image constructed of smaller parts
 * It is stored in a tightly packed format to ease editing of the target image
 */
export class TileBuffer extends internalTileBuffer
{
    constructor(source : DataStream, tileWidth : number, tileHeight : number, numTiles : number)
}

/**A DrawingBuffer is an width * height * 4 buffer of bytes representing an image
 * That can be drawn onto and otherwise manipulated in avrious ways before then being rendered
 * into an actual image
 */
export class DrawingBuffer extends PixelBuffer
{
    constructor(width : number, height : number, preFilled : boolean, source : DataStream | Texture)

    drawBuffer(x : number, y : number, buffer : PixelBuffer, add : boolean) : void

    /**
     * mask(colour)
     * Apply a colour mask represented as an array of 4 numbers to the whole buffer
     * @param {[number, number, number, number]} colour 
     * @memberof DrawingBuffer
     */
    mask(colour : [number, number, number, number]) : void

    solidRectangle(x1 : number, y1 : number, x2 : number, y2 : number, colour : [number, number, number, number])

    outlinedRectangle(x1 : number, y1 : number, x2 : number, y2 : number, thickness : number, colour : [number, number, number, number]) : void

    solidCircle(x : number, y : number, r : number, colour : [number, number, number, number]) : void
 
    outlinedCircle(x : number, y : number, r : number, thickness : number, colour : [number, number, number, number]) : void

    line(x1 : number, x2 : number, y1 : number, y2 : number, colour : [number, number, number, number]) : void

    rotate (radians : number) : void

    readonly texture : Texture

    //set the pixel at (x, y) to colour
    setPixel(x : number, y : number, colour : [number, number, number, number])

    finalise() : { width : number, height : number, data : ArrayBuffer}

    //methods below this point are for internal use only
    private internalSetPixel(x : number, y : number, combinedColour : Uint32Array) : void

    private internalLine(x1 : number, x2 : number, y1 : number, y2 : number, cColour : Uint32Array)

    static combineColour(r : number, g : number, b : number, a : number) : Uint32Array

}