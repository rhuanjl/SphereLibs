/* File: rmpLoader.mjs
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

import {DataStream} from "cell-runtime";

export function convertRMP(output, input)
{
	let data = loadRMP(input[0]);
	writeMEM(data, output);
}

function writeMEM(data, fileName)
{
	let outputFile = new DataStream(fileName, FileOp.Write);
	//lead out with the tile data
	outputFile.writeUint16(data.numTiles, true);
	outputFile.writeUint16(data.tileWidth, true);
	outputFile.writeUint16(data.tileHeight, true);
	outputFile.write(data.tileData);
	for(let i = 0, j = 0; i < data.tiles.length; ++i, j = 0)
	{
		outputFile.writeString16(data.tiles[i].name, true);
		outputFile.writeUint8(data.tiles[i].animated);
		outputFile.writeUint16(data.tiles[i].obs.length, true);
		for(;j < data.tiles[i].obs.length; ++j)
		{
			outputFile.writeUint8(data.tiles[i].obs[j].type);
			outputFile.writeUint16(data.tiles[i].obs[j].x, true);
			outputFile.writeUint16(data.tiles[i].obs[j].y, true);
			outputFile.writeUint16(data.tiles[i].obs[j].w, true);
			outputFile.writeUint16(data.tiles[i].obs[j].h, true);
		}
	}
	let numAnims = data.animTiles.length;
	outputFile.writeUint16(numAnims, true);
	for(let i = 0; i < numAnims; ++i)
	{
		let currentLength = data.animTiles[i].length;
		outputFile.writeUint16(currentLength, true);
		for(let j = 0; j < currentLength; ++j)
		{
			outputFile.writeUint16(data.animTiles[i][j].index, true);
			outputFile.writeUint16(data.animTiles[i][j].delay, true);
			outputFile.writeUint16(data.animTiles[i][j].next, true);
		}
	}
	outputFile.writeUint8(data.repeating);
	outputFile.writeUint16(data.width, true);//map width/height in tiles
	outputFile.writeUint16(data.height, true);	
	outputFile.writeUint8(data.layers.length);
	for(let i = 0, j = 0; i < data.layers.length; ++i, j = 0)
	{
		outputFile.writeUint16(data.layers[i].width, true);	
		outputFile.writeUint16(data.layers[i].height, true);
		outputFile.writeUint16(data.layers[i].flags, true);//what's this meant to do, kept for now
		outputFile.writeFloat32(data.layers[i].parallaxX, true);//what's this meant to do, kept for now
		outputFile.writeFloat32(data.layers[i].parallaxY, true);//what's this meant to do, kept for now
		outputFile.writeFloat32(data.layers[i].scrollX, true);//what's this meant to do, kept for now
		outputFile.writeFloat32(data.layers[i].scrollY, true);//what's this meant to do, kept for now
		outputFile.writeUint8(data.layers[i].reflective, true);
		outputFile.writeUint32(data.layers[i].segments.length, true);
		outputFile.writeUint16(data.layers[i].zones.length, true);
		outputFile.writeUint16(data.layers[i].triggers.length, true);
		outputFile.write(data.layers[i].tiles);
		for(; j < data.layers[i].segments.length; ++j)
		{
			outputFile.writeUint8(data.layers[i].segments[j].type);
			outputFile.writeUint16(data.layers[i].segments[j].x, true);
			outputFile.writeUint16(data.layers[i].segments[j].y, true);
			outputFile.writeUint16(data.layers[i].segments[j].w, true);
			outputFile.writeUint16(data.layers[i].segments[j].h, true);
		}
		for(j = 0; j < data.layers[i].zones.length; ++j)
		{
			outputFile.writeString16(data.layers[i].zones[j].name, true);
			outputFile.writeUint16(data.layers[i].zones[j].steps, true);
			outputFile.writeUint8(data.layers[i].zones[j].poly.type);
			outputFile.writeUint16(data.layers[i].zones[j].poly.x, true);
			outputFile.writeUint16(data.layers[i].zones[j].poly.y, true);
			outputFile.writeUint16(data.layers[i].zones[j].poly.w, true);
			outputFile.writeUint16(data.layers[i].zones[j.poly].h, true);
		}
		for(j = 0; j < data.layers[i].triggers.length; ++j)
		{
			outputFile.writeString16(data.layers[i].triggers[j].name, true);
			outputFile.writeUint16(Math.floor(data.layers[i].triggers[j].x / data.tileWidth), true);
			outputFile.writeUint16(Math.floor(data.layers[i].triggers[j].y / data.tileHeight), true);
		}
	}
	outputFile.writeUint16(data.entities.length, true);
	for(let i = 0; i < data.entities.length; ++i)
	{
		outputFile.writeString16(data.entities[i].name, true);
		outputFile.writeUint16(data.entities[i].x, true);
		outputFile.writeUint16(data.entities[i].y, true);
		outputFile.writeUint8(data.entities[i].layer);
		outputFile.writeString16(data.entities[i].sprite, true);
	}
}


function loadRMP(fileName)
{
	let inputFile = new DataStream(fileName, FileOp.Read);

	if(inputFile.readStringRaw(4) !== ".rmp")
	{
		throw new Error("rmpLoader provided with file that is not an rmp file filename is " + fileName);
	}
	inputFile.position = inputFile.position + 3;//skip version number (always 1) and type which is meaningless

	let numLayers = inputFile.readUint8();

	inputFile.position = inputFile.position + 1;//skip reserved byte

	let numEntities = inputFile.readUint16(true);

	//skip startX, startY, (Uint16s) startLayer, startDirection (Uint8s) <- not used with MEngine
	inputFile.position = inputFile.position + 6;
	let numStrings = inputFile.readUint16(true);

	let numZones = inputFile.readUint16(true);

	let repeating = inputFile.readUint8();
	inputFile.position = inputFile.position + 234;

	/*  -strings are all currently ignored, they are:
		0 - tileset file (obsolete)
		1 - music file
		2 - script file (obsolete)
		3 - entry script
		4 - exit script
		5 - north script
		6 - east script
		7 - south script
		8 - west script*/
	for(let i = 0; i < numStrings; ++i)
	{
		inputFile.readString16(true);
	}

	let width = 0;
	let height = 0;

	//load main Layer data - 1st key output
	let layers = new Array(numLayers);
	for(let i = 0; i < numLayers; ++i)
	{
		layers[i] =
		{
			width       : inputFile.readUint16(true),
			height      : inputFile.readUint16(true),
			flags       : inputFile.readUint16(true),
			parallaxX   : inputFile.readFloat32(true),
			parallaxY   : inputFile.readFloat32(true),
			scrollX     : inputFile.readFloat32(true),
			scrollY     : inputFile.readFloat32(true),
			numSegments : inputFile.readUint32(true),
			reflective  : inputFile.readUint8(),
			zones       : [],
			triggers    : []
		};
		width = Math.max(width, layers[i].width);
		height = Math.max(height, layers[i].height);
		inputFile.position = inputFile.position + 3;//skip 3 reserved bytes
		layers[i].name = inputFile.readString16(true);
		layers[i].tiles = inputFile.read(2 * layers[i].width * layers[i].height);

		layers[i].segments = new Array(layers[i].numSegments);
		for(let j = 0; j < layers[i].numSegments; ++j)
		{
			let x = inputFile.readUint32(true);
			let y = inputFile.readUint32(true);
			layers[i].segments[j] = new Polygon(1, x, y, inputFile.readUint32(true) - x, inputFile.readUint32(true) - y);
		}
	}

	//load entity data 2nd key output
	//and load trigger data - attached into layer objects from above
	let entities   = [];
	for(let i = 0; i < numEntities; ++i)
	{
		let x     = inputFile.readUint16(true);
		let y     = inputFile.readUint16(true);
		let layer = inputFile.readUint16(true);
		let type  = inputFile.readUint16(true);

		inputFile.position = inputFile.position + 8;//skip 8 reserved bytes

		if(layer > numLayers)
		{
			throw new Error("layer number " + layer + "for entity" + i + " but total layers in rmp are " + numLayers);
		}
		if(type == 1)
		{
			entities.push(
				{
					x          : x,
					y          : y,
					layer      : layer,
					name       : inputFile.readString16(true),
					sprite     : inputFile.readString16(true).replace(".rss",".ses"),
				});
			inputFile.position = inputFile.position + 2;//skip reading number of scripts as always 5
			inputFile.position = inputFile.readUint16(true) + inputFile.position;//burn the scripts I don't want them
			inputFile.position = inputFile.readUint16(true) + inputFile.position;
			inputFile.position = inputFile.readUint16(true) + inputFile.position;
			inputFile.position = inputFile.readUint16(true) + inputFile.position;
			inputFile.position = inputFile.readUint16(true) + inputFile.position;
			inputFile.position = inputFile.position + 16;//skip the reserved bytes
		}
		else if (type == 2)
		{
			layers[layer].triggers.push(
				{
					x      : x,
					y      : y,
					name   : inputFile.readString16(true)//note per spec this is script - but no name and need an ID
				});
		}
	}

	//load zone data - attached into layer objects from above
	for(let i = 0; i < numZones; ++i)
	{
		let x1 = inputFile.readUint16(true);
		let y1 = inputFile.readUint16(true);
		let x2 = inputFile.readUint16(true);
		let y2 = inputFile.readUint16(true);
		let layer = inputFile.readUint16(true);
		let steps = inputFile.readUint16(true);
		inputFile.position = inputFile.position + 4;
		let name = inputFile.readString16(true);//script field re-purposed as a ref
		layers[layer] = {
			poly : new Polygon(1, x1, x2, x2 - x1, y2 - y1),
			steps : steps,
			name : name
		};
	}

	if(inputFile.readStringRaw(4) !== ".rts")
	{
		throw new Error("Tile signiture not found either .rmp file is corrupt/out of date or there's an error in the reader script");
	}
	inputFile.position = inputFile.position + 2;//skip version number - always 1
	let numTiles = inputFile.readUint16(true);
	let tileWidth = inputFile.readUint16(true);
	let tileHeight = inputFile.readUint16(true);
	let tileSize = tileWidth * tileHeight;

	inputFile.position = inputFile.position + 244;//skip 3 reserved bytes then 1 byte "has_obstructions" then 240 reserved bytes
	//has_obstructions is aassumed to always be true

	//load rawTile data 3rd key Output
	let tileData = inputFile.read(numTiles * tileWidth * tileHeight * 4);

	//load and process tile properties 4th key output
	let rawTiles = new Array(numTiles);
	let animatedTiles = [];
	for(let i = 0; i < numTiles; ++i)
	{
		inputFile.position = inputFile.position + 1;//skip 1 reserved byte
		let animated = inputFile.readUint8();
		let nextTile = inputFile.readUint16(true);
		let delay = inputFile.readUint16(true);
		inputFile.position = inputFile.position + 1;//skip 1 reserved byte
		let obsType = inputFile.readUint8();
		let numSegments = inputFile.readUint16(true);
		let nameLength = inputFile.readUint16(true);
		inputFile.position = inputFile.position + 20;//skip 20 reserved bytes

		let tileName = inputFile.readStringRaw(nameLength);

		let tileObs = [];
		if(obsType == 1)
		{
			for(let j = 0; j < tileSize; ++j)
			{
				if(inputFile.readUint8() === 1)
				{
					tileObs.push(new Polygon(1, j % tileWidth, Math.floor(j / tileHeight), 1, 1));
				}
			}
		}
		else
		{
			for(let j = 0; j < numSegments; ++j)
			{
				let x1 = inputFile.readUint16(true);
				let y1 = inputFile.readUint16(true);
				let x2 = inputFile.readUint16(true);
				let y2 = inputFile.readUint16(true);

				let x_ = Math.min(x1, x2);
				let y_ = Math.min(y1, y2);
				let w  = Math.max(Math.min(Math.abs(x1 - x2), tileWidth -x_),0);
				let h  = Math.max(Math.min(Math.abs(y1 - y2), tileHeight -y_),0);
				
				tileObs.push(new Polygon(1, x_, y_, w, h));
			}
		}
		if(animated === 1)
		{
			animatedTiles.push(i);
		}
		rawTiles[i] =
		{
			name     : tileName,
			animated : animated,
			nextTile : nextTile,
			delay    : delay,
			obs      : tileObs
		};
	}
	let usedAnims = [];
	let createdAnims = [];
	
	//build a set of animatedTile objects and an extra index array into them
	for(let i = 0, totalAnims = animatedTiles.length, tempLength = 0, currentAnim = 0; i < totalAnims; ++i)
	{
		let position = 0;
		let currentChain = [];
		let currentFrame = animatedTiles[i];//set the first tile
		let lastTile = 0;
		//unroll the animation
		while(fastIndex(usedAnims, tempLength, currentFrame) === tempLength)
		{
			let tileAccess = rawTiles[currentFrame];
			if(!tileAccess || tileAccess.animated !== 1)
			{
				throw new Error("Animated tile number " + lastTile + " has non-animated tile as next tile - this is not permitted \n full chain is:" + JSON.stringify(currentChain));
			}
			currentChain[position] = 
			{
				index : currentFrame,
				delay : tileAccess.delay,
				next  : (position + 1)
			};
			usedAnims[tempLength] = currentFrame;
			lastTile = currentFrame;
			currentFrame = rawTiles[currentFrame].nextTile;
			++ position;
			++ tempLength;//indicate that we've increased the length of the used Anims array
		}
		if(position > 0)
		{
			currentChain[position - 1].next = 0;//put in the loop back to start
			createdAnims[currentAnim] = currentChain;//store what we've made
			++currentAnim;//move down to the next Anim
		}
	}


	return {
		width      : width,
		height     : height,
		repeating  : repeating,
		layers     : layers,
		entities   : entities,
		numTiles   : numTiles,
		tileWidth  : tileWidth,
		tileHeight : tileHeight,
		tileData   : tileData,
		tiles      : rawTiles,
		animTiles  : createdAnims
	};
}

//faster version of Array#indexOf
//no real need for this optimisation
//but I wanted it :P
function fastIndex(inputArray, inputLength, value)
{
	for(let i = 0; i < inputLength; ++i)
	{
		if(inputArray[i] === value)
		{
			return i;
		}
	}
	return inputLength;
}


class Polygon
{
	constructor(type, x, y, w, h)
	{
		this.type = type;
		this.x    = x;
		this.y    = y;
		this.w    = w;
		this.h    = h;
	}
}