/* File: rssLoader.mjs
 * Author: Rhuan
 * Date: 17/09/2017
 * MEngine is 2D map engine for miniSphere game engine
 * this file loads files made in the original SPhere"s .rmp format
 * it then converts them for use with MEngine
 * Usage: FIX ME - WRITE USAGE HERE OR EXTERNAL GUIDE DOC
 * License for MEngine.mjs, SEngine.mjs and CEngine.mjs
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

import {TileBuffer, MapBuffer} from "./PixelBuffer";

import {DataStream} from "cell-runtime";

export function convertRSS(outputFile, inputFile)
{
    writeSprite(outputFile, loadRSS(inputFile[0]));
}


export function loadRSS(filename)
{
    const inputFile = new DataStream(filename, FileOp.Read);

    const header = inputFile.readStruct(RSSHeader);
    inputFile.position = inputFile.position + 106;
    if (header.version !== 3)
    {
        throw new Error("Incompatible RSS file cannot be loaded - " + filename);
    }
    const images = new TileBuffer(inputFile, header.frameWidth, header.frameHeight, header.numImages);
    const rssDirections = new Array(header.numDirections);
    let imagesWide = 0;

    for (let i = 0; i < header.numDirections; ++i)
    {
        const numFrames = inputFile.readInt16(true);
        inputFile.position = inputFile.position + 6;
        const name = inputFile.readString16(true);
        const frames = new Array(numFrames);
        for (let j = 0; j < numFrames; ++j)
        {
            frames[j] = {
                index : inputFile.readInt16(true),
                delay : inputFile.readInt16(true)
            };
            inputFile.position = inputFile.position + 4;
        }
        rssDirections[i] =
        {
            name      : name,
            numFrames : numFrames,
            frames    : frames
        };
        imagesWide = Math.max(imagesWide, numFrames);
    }

    const spriteSheet = new MapBuffer(imagesWide, header.numDirections, images);
    const outputDirections = new Array(header.numDirections);

    for (let i = 0; i < header.numDirections; ++i)
    {
        outputDirections[i] =
        {//#FIX ME - speed, uses first frames delay, ignores subsequent frames
            id     : rssDirections[i].name,
            vector : [0,0,0],
            speed  : rssDirections[i].frames[0].delay,
            frames : rssDirections[i].numFrames,
            reset  : 5
        };
        //give vectors to directions
        let x = 0, y = 0, z = 0;
        if (outputDirections[i].id.indexOf("north") !== -1)
        {
            --y;
        }
        if (outputDirections[i].id.indexOf("south") !== -1)
        {
            ++y;
        }
        if (outputDirections[i].id.indexOf("west") !== -1)
        {
            --x;
        }
        if (outputDirections[i].id.indexOf("east") !== -1)
        {
            ++x;
        }
        outputDirections[i].vector = [x,y,z];
        for (let j = 0; j < rssDirections[i].numFrames; ++j)
        {
            spriteSheet.setTileInBuffer(rssDirections[i].frames[j].index, i * imagesWide + j);
        }
    }

    const offset = [Math.floor((header.baseX1+header.baseX2)/2), Math.floor((header.baseY1+header.baseY2)/2)];

    const poly = {
        type : 1,//#FIX ME this is wrong
        x    : Math.floor(Math.min(header.baseX1, header.baseX2)),
        y    : Math.floor(Math.min(header.baseY1, header.baseY2)),
        w    : Math.abs(header.baseX1 - header.baseX2),
        h    : Math.abs(header.baseY1 - header.baseY2)
    };
    return {
        directions  : outputDirections,
        spriteSheet : spriteSheet.tileBufferToTexture(),
        frameWidth  : header.frameWidth,
        frameHeight : header.frameHeight,
        poly        : poly,
        offset      : offset
    };
}


export function writeSprite (filename, data)
{
    const outputFile = new DataStream(filename, FileOp.Write);

    //dimensions
    outputFile.writeUint16(data.frameWidth, true);
    outputFile.writeUint16(data.frameHeight, true);

    //poly
    outputFile.writeUint8(1);//number of polys, with an rss it'll always be 1
    outputFile.writeUint8(data.poly.type);
    outputFile.writeInt16(data.poly.x -data.offset[0], true);
    outputFile.writeInt16(data.poly.y - data.offset[1], true);
    outputFile.writeUint16(data.poly.w, true);
    outputFile.writeUint16(data.poly.h, true);

    //offset to apply when drawing - v1 used mid point of base as coordinates
    outputFile.writeUint16(data.offset[0], true);
    outputFile.writeUint16(data.offset[1], true);

    //directions
    outputFile.writeUint16(data.directions.length, true);

    for (let i = 0; i < data.directions.length; ++i)
    {
        const dat = data.directions[i];
        outputFile.writeString16(dat.id,true);
        outputFile.writeInt8(dat.vector[0]);
        outputFile.writeInt8(dat.vector[1]);
        outputFile.writeInt8(dat.vector[2]);
        outputFile.writeUint8(dat.speed);
        outputFile.writeUint8(dat.frames);
        outputFile.writeUint8(dat.reset);
    }
    outputFile.writeUint16(data.spriteSheet.width, true);
    outputFile.writeUint16(data.spriteSheet.height, true);
    outputFile.write(data.spriteSheet.data);
}

//#FIX ME - cut out the use of this - inline the loads above
//will run slightly faster and be easier to follow
const RSSHeader =
{
    signature     : {type : "fstring", length : 4},
    version       : {type : "uint16le"},
    numImages     : {type : "uint16le"},
    frameWidth    : {type : "uint16le"},
    frameHeight   : {type : "uint16le"},
    numDirections : {type : "uint16le"},
    baseX1        : {type : "uint16le"},
    baseY1        : {type : "uint16le"},
    baseX2        : {type : "uint16le"},
    baseY2        : {type : "uint16le"},
};