/* File: PixelBuffer.mjs
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


//#FIX ME needs blend modes so you can draw multiple things on one buffer properly

//Internal class do not use directly
class PixelBuffer
{
	constructor(buffer, width, height)
	{
		this.data    = buffer; 
		this.pixels  = new Uint32Array(this.data);
		this.rgba    = new Uint8Array(this.data);
		this.width   = width;
		this.height  = height;
	}
}

//Internal class do not use directly
class internalTileBuffer extends PixelBuffer
{
	constructor(buffer, tileWidth, tileHeight, tilesWide, tilesHigh)
	{
		super(buffer, tileWidth * tilesWide, tileHeight * tilesHigh);

		this.length     = this.width * this.height;
		this.tileWidth  = tileWidth;
		this.tileHeight = tileHeight;
		this.tileSize   = tileWidth * tileHeight;
		this.tilesWide  = tilesWide;
		this.tilesHigh  = tilesHigh;
		this.strip      = this.tileSize * tilesWide;
	}
	
	tileBufferToTexture()
	{
		//dereference everything to make the below loop smaller, neater and maybe even faster
		let input       = this.pixels;
		let length      = this.length |0;
		let tileWidth   = this.tileWidth |0;
		let width       = this.width |0;
		let strip       = this.strip |0;
		let output      = new Uint32Array(length);
		for(let i = 0, x = 0, a = 0, b = 0, c = 0; i < length; c += strip, b = 0)
		{
			for(; b < width; b += tileWidth, a = 0)
			{
				for(; a < strip; a += width, x = 0)
				{
					for(; x < tileWidth; ++x, ++i)
					{
						output[(x + a + b + c)] = input[i];
					}
				}
			}
		}
		return {
			width  : width, 
			height : this.height,
			data   : output.buffer
		};
	}
}


export class MapBuffer extends internalTileBuffer
{
	constructor(tilesWide, tilesHigh, tileBuffer)
	{
		super(new ArrayBuffer(tileBuffer.tileWidth * tilesWide * tileBuffer.tileHeight * tilesHigh * 4),
			tileBuffer.tileWidth, tileBuffer.tileHeight, tilesWide, tilesHigh);
		
		this.tileBuffer = tileBuffer;
	}

	setTileInBuffer(tile, target)
	{
		let tStart    = this.tileSize * tile;
		this.pixels.set(this.tileBuffer.pixels.subarray(tStart, tStart + this.tileSize), this.tileSize * target);
	}
}

export class TileBuffer extends internalTileBuffer
{
	constructor(source, tileWidth, tileHeight, numTiles)
	{
		let shortBuffer = source.read(tileWidth * tileHeight * numTiles * 4);
		let roundWidth = Math.ceil(Math.sqrt(tileWidth * tileHeight * numTiles)) * 2;
		let buffer = new ArrayBuffer(roundWidth * roundWidth);
		let shortView = new Uint8Array(shortBuffer);
		let fullView = new Uint8Array(buffer);
		fullView.set(shortView);
		super(buffer, tileWidth, tileHeight, roundWidth, roundWidth);
	}
}

export class DrawingBuffer extends PixelBuffer
{
	constructor(width, height, prefilled, source)
	{
		let data;
		if (prefilled === true)
		{
			data = source.read(width * height * 4);
		}
		else
		{
			data = new ArrayBuffer(width * height * 4);
		}
		super(data, width, height);
	}
	//draw a different buffer on to this one
	//the buffer parameter can be a DrawingBuffer OR the return value
	//from DrawingBuffer#finalise or TileBuffer/MapBuffer#tileBufferToTexture
	//if add is true the colour values of the buffer being drawn are added
	//if add is false the buffer being drawn overwrites the one it's drawn on
	//#FIX ME should allow multiplicative blending
	drawBuffer(x, y, buffer, add)
	{
		let input, output;
		if(add === true)
		{
			input = new Uint8Array(buffer.data);
			output = this.rgba;
		}
		else
		{
			input  = new Uint32Array(buffer.data);
			output = this.pixels;
		}
		let outputWidth = this.width;
		let width  = Math.min(this.width - x, buffer.width);
		let height = Math.min(this.height -y, buffer.height);
		for(let j = 0, i = 0, k = 0; j < height; ++j, i = 0)
		{
			for(; i < width; ++i, ++k)
			{
				if(add === true)
				{
					let offset = 4 * ((x +i) + (y + j) * outputWidth);
					output[offset    ] = Math.min(input[k * 4    ] + output[offset    ], 255);
					output[offset + 1] = Math.min(input[k * 4 + 1] + output[offset + 1], 255);
					output[offset + 2] = Math.min(input[k * 4 + 2] + output[offset + 2], 255);
					output[offset + 3] = Math.min(input[k * 4 + 3] + output[offset + 3], 255);					
				}
				else
				{
					output[(x +i) + (y + j) * outputWidth] = input[k];
				}
			}
		}
	}

	mask(colour)
	{
		let width = this.width;
		let height = this.height;
		let offset = 0;
		let rgba = this.rgba;
		for(let i = 0, j = 0; j < height; ++j, i = 0)
		{
			for(; i < width; ++i)
			{
				offset = (i + j * width) * 4;
				rgba[offset    ] = Math.floor(rgba[offset    ] * colour[0]);
				rgba[offset + 1] = Math.floor(rgba[offset + 1] * colour[1]);
				rgba[offset + 2] = Math.floor(rgba[offset + 2] * colour[2]);
				rgba[offset + 3] = Math.floor(rgba[offset + 3] * colour[3]);
			}
		}
	}

	solidRectangle(x1, y1, x2, y2, colour)
	{
		let cColour = DrawingBuffer.combineColour(...colour);
		for(let i = x1, j = 0; i <= x2; ++i)
		{
			for(j = y1; j <= y2; ++j)
			{
				this.internalSetPixel(i, j, cColour);
			}
		}
	}

	outlinedRectangle(x1, y1, x2, y2, thickness, colour)
	{	
		let cColour = DrawingBuffer.combineColour(...colour);
		for(let k = 0; k < thickness; ++ k)
		{
			this.internalLine(x1, y1 + k, x2, y1 + k, cColour);
			this.internalLine(x1, y2 - k, x2, y2 - k, cColour);
			this.internalLine(x1 + k, y1, x1 + k, y2, cColour);
			this.internalLine(x2 - k, y1, x2 - k, y1, cColour);
		}
	}

	solidCircle(x, y, r, colour)
	{
		let x1 = x - r;
		let x2 = x + r;
		let y1 = y - r;
		let y2 = y + r;

		let xi = 0;
		let yi = 0;

		let cColour = DrawingBuffer.combineColour(...colour);

		for(let i = x1; i < x2; ++i)
		{
			for(let j = y1; j < y2; ++j)
			{
				xi = (i - x);
				yi = (j - y);
				if((xi * xi + yi * yi) <= (r * r))
				{
					this.internalSetPixel(i, j, cColour);
				}
			}
		}
	}

	outlinedCircle(x, y, r, thickness, colour)
	{
		let x1 = x - r;
		let x2 = x + r;
		let r2 = r * r;

		let cColour = DrawingBuffer.combineColour(...colour);

		for(let k = 0, xt2 = x2; k < thickness; ++k, --xt2)
		{
			for(let i = x1 + thickness; i < xt2; ++i)
			{
				let yt = Math.sqrt(r2 +(i * i)) + y;
				this.internalSetPixel(i, yt, cColour);
			}
		}
	}

	line(x1, x2, y1, y2, colour)
	{
		let m = Math.floor((y2 - y1) / (x2 - x1));
		let c = y1 - (m * x1);

		let cColour = DrawingBuffer.combineColour(...colour);

		for(let i = x1; i <= x2; ++i)
		{
			this.internalSetPixel(i, i * m + c, cColour);
		}
	}


	//set the pixel at (x, y) to colour
	setPixel(x, y, colour)
	{
		let offset = x + y * this.width * 4;
		this.rgba[offset]     = Math.floor(colour[0] * 255);
		this.rgba[offset + 1] = Math.floor(colour[1] * 255);
		this.rgba[offset + 2] = Math.floor(colour[2] * 255);
		this.rgba[offset + 3] = Math.floor(colour[3] * 255);
	}

	finalise()
	{
		return {
			width  : this.width, 
			height : this.height,
			data   : this.data
		};
	}

	//methods below this point are for internal use only
	internalSetPixel(x, y, combinedColour)
	{
		this.pixels[x + y * this.width] = combinedColour;
	}

	internalLine(x1, x2, y1, y2, cColour)
	{
		let m = Math.floor((y2 - y1) / (x2 - x1));
		let c = y1 - (m * x1);

		for(let i = x1; i <= x2; ++i)
		{
			this.internalSetPixel(i, i * m + c, cColour);
		}
	}

	static combineColour(r, g, b, a)
	{
		let colour = new Uint8Array(4);
		colour[0] = Math.floor(r * 255);
		colour[1] = Math.floor(g * 255);
		colour[2] = Math.floor(b * 255);		
		colour[3] = Math.floor(a * 255);
		return new Uint32Array(colour);
	}
}