/* File: HUDSystem.mjs
 * Author: Rhuan
 * Date: 23/09/2017
 * This script allows the creation of a HUD - a combination of one or more images
 * windows, pieces of text, or other graphics that can be drawn and manipulated 
 * as if they were one object.
 * 
 * It also contains shortcut functions fot the generation of certain graphical
 * objects.
 * 
 * Note: It requires the DrawingBuffer from my PixelBuffer module in order to compose
 * windows from sphere .rws files, it also requires the DataStream Object from the
 * sphere-runtime for the loading of .rws files.
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

import {DrawingBuffer} from "$/PixelBuffer";
import DataStream from "dataStream";



export class HUDSystem
{
	constructor(enableDynamic = false)
	{
		this.staticShapes = [];
		this.types = [];
		this.staticIDs = [];
		this.ids = [];
		this.model;
		this.ready = true;
		this.transform = new Transform();
		this.nextID = 0;
		this.enableStatic = false;
		this.enableDynamic = enableDynamic;
		if(enableDynamic === true)
		{
			this.dynamicIDs = [];
			this.dynamics = [];
			this.dynamicsAfterStatics = true;
			this.shader = new Shader({
				fragmentFile: "#/shaders/tintedImage.frag.glsl",
				vertexFile:   "#/shaders/tintedImage.vert.glsl"
			});
		}

		//de-reference the Transformation functions to ease use
		//note the matrix accessor is excluded as it is an advanced feature
		this.identity  = ()              => this.transform.identity();
		this.compose   = (transform)     => this.transform.compose(transform);
		this.rotate    = (angle, vx, vy) => this.transform.rotate(angle, vx, vy);
		this.scale     = (sx, sy)        => this.transform.scale(sx, sy);
		this.translate = (tx, ty)        => this.transform.translate(tx, ty);
	}


	//add a pre-created shape to the HUD as a static object
	//returns an ID number that can be used to remove it
	addStatic(shape)
	{
		this.enableStatic = true;
		this.ids.push(this.nextID);
		this.staticShapes.push(shape);
		this.staticIDs.push(this.nextID);
		this.types.push(0);
		this.ready = false;
		this.nextID += 1;
		return (this.nextID - 1);
	}

	//add a dynamic object to the HUD
	//it must define a draw function which takes transform as a paremeter
	//where transform is the HUD's transformation object
	//Inputs/updates it needs should be other properties of the object
	//returns an ID number which can be used:
	//a) to remove the object AND
	//b) to access the object with getDynamic (see below)
	//Note dynamics are drawn on top of statics by default
	//can be swapped to under by changing HUDSystem#dynamicsAfterStatics to false
	//cannot do half and half with one HUD object
	addDynamic(dynamicData)
	{
		if(this.enableDynamic === true)
		{
			this.ids.push(this.nextID);
			this.dynamics.push(dynamicData);
			this.dynamicIDs.push(this.nextID);
			this.types.push(1);
			this.nextID += 1;
			return (this.nextID - 1);
		}
		else
		{
			HUDSystem.error("dynamic object added to HUD without dynamic enabled.");
		}
	}

	getDynamic(id)
	{
		if(this.enableDynamic === true)
		{
			let position = this.dynamicIDs.indexOf(id);
			if(position !== -1)
			{
				return this.dynamics[position];
			}
			else
			{
				HUDSystem.error("getDynamic called with id " + id + " but no dynamic object exists with that id.");
			}
		}
		else
		{
			HUDSystem.error("getDynamic called with id " + id + " but designated HUD has dynamic disabled.");
		}
	}

	//remove a shape from the HUD
	remove(id)
	{
		let position = this.ids.indexOf(id);
		if(position === -1)
		{
			HUDSystem.error("attempt to remove item with id " + id + " from HUD but that id does not exist");
		}
		else
		{
			let type = this.types[position];
			if(type === 0)
			{
				let truePosition = this.staticIDs.indexOf(id);
				this.staticIDs.splice(truePosition, 1);
				this.staticShapes.splice(truePosition, 1);
				this.ready = false;
			}
			else
			{//handle dynamic here - omission of this.ready = false is intentional
				let truePosition = this.dynamicIDs.indexOf(id);
				this.dynamics.splice(truePosition, 1);
				this.dynamicIDs.splice(truePosition, 1);
			}
			this.ids.splice(position, 1);
			this.types.splice(position, 1);
		}
	}

	//draw the HUD - call this from your render function
	draw()
	{
		if(this.ready === false)
		{
			this.model = new Model(this.staticShapes);
			this.model.transform = this.transform;
			this.ready = true;
		}
		if(this.enableDynamic === true)
		{
			if(this.dynamicsAfterStatics === true)
			{
				if(this.enableStatic === true)
				{
					this.model.draw();
				}
				this.drawDynamics();
			}
			else
			{
				this.drawDynamics();
				if(this.enableStatic === true)
				{
					this.model.draw();
				}
			}
		}
		else
		{
			this.model.draw();
		}
	}

	drawDynamics()
	{
		let length = this.dynamics.length;
		for(let i = 0; i < length; ++i)
		{
			this.dynamics[i].draw(this.transform);
		}
	}

	addVariableText(text, x, y, wrapWidth = screen.width, font = Font.Default, colour=Color.White)
	{
		if(this.enableDynamic === true)
		{
			return this.addDynamic(new DynamicText(text, x, y, wrapWidth, font, colour));
		}
		else
		{
			HUDSystem.error("attempt to add a dynamic Variable Bar to a HUDSystem which has dynamics disabled");
		}
	}


	addVariableBar(x, y, width, height, fadeDirection = 0, colourOne = Color.Green, colourTwo = Color.Red, texture = null)
	{
		if(this.enableDynamic === true)
		{
			return this.addDynamic(new DynamicBar(x, y, width, height, fadeDirection, colourOne, colourTwo, texture, this.shader));
		}
		else
		{
			HUDSystem.error("attempt to add a dynamic Variable Bar to a HUDSystem which has dynamics disabled");
		}
	}

	//write text to the HUD at x, y
	addText(x, y, text, font, wrapWidth, colour)
	{
		if(!colour)
		{
			colour = Color.White;
		}
		if(!wrapWidth)
		{
			wrapWidth = screen.width;
		}
		if(!font)
		{
			font = Font.Default;
		}
		return this.addStatic(HUDSystem.renderImage(HUDSystem.text(text, font, wrapWidth, colour), x, y));
	}

	//add an already loaded image/texture to the HUD at x, y with colour mask, mask
	//mask is an optional parameter
	addImage(texture, x, y, mask)
	{
		return this.addStatic(HUDSystem.render(texture, x, y, mask));
	}

	//render a DrawingBuffer as an image and add it to the HUD at x, y
	addBuffer(buffer, x, y, mask)
	{
		return this.addStatic(HUDSystem.render(new Texture(buffer.data, buffer.width, buffer.height), x, y, mask));
	}

	//load an image from a file and add it to the HUD at x, y
	addImageFromFile(filename, x, y, mask)
	{
		return this.addStatic(HUDSystem.render(new Texture(filename), x, y, mask));
	}

	static text(text, font, wrapWidth, colour)
	{
		let size = font.getTextSize(text, wrapWidth);
		let height = Math.max(size.height, font.height + 5);
		let output = new Surface(size.width, height);
		font.drawText(output, 0, 0, text, colour, wrapWidth);

		return output.toTexture();
	}

	static renderImage(texture, x, y, mask = Color.White)
	{
		return HUDSystem.render(texture, x, y, texture.width, texture.height, mask);
	}

	static render(texture, x, y, width, height, mask = Color.White)
	{
		let vbo = new VertexList([
			{x : x, y : y, z : 0, u : 0, v : 1, color : mask},
			{x : x + width, y : y, z : 0, u : 1, v : 1, color : mask},
			{x : x, y : y + height, z : 0, u : 0, v : 0, color : mask},
			{x : x + width, y : y + height, z : 0, u : 1, v : 0, color : mask}
		]);

		return new Shape(ShapeType.TriStrip, texture, vbo);
	}

	static error(description)
	{
		throw new Error("HUD system error " + description);
	}
}

export class WindowStyle
{
	constructor(filename)
	{
		let data = new DataStream(filename, FileOp.Read);

		if(data.readStringRaw(4) !== ".rws")
		{
			HUDSystem.error("window style file provided not a .rws file.");
		}
		if(data.readUint16(true) !== 2)
		{
			HUDSystem.error("only supports .rws version 2 - provided file is a different version.");
		}
		data.position = data.position + 1;

		this.mode = data.readUint8();
		this.corners = new Array(4);
		this.corners[0] = data.read(4);
		this.corners[1] = data.read(4);
		this.corners[2] = data.read(4);
		this.corners[3] = data.read(4);
		data.position = data.position + 40;

		this.upper_left  = new DrawingBuffer(data.readUint16(true), data.readUint16(true), true, data);
		this.top         = new DrawingBuffer(data.readUint16(true), data.readUint16(true), true, data);
		this.upper_right = new DrawingBuffer(data.readUint16(true), data.readUint16(true), true, data);
		this.right       = new DrawingBuffer(data.readUint16(true), data.readUint16(true), true, data);
		this.lower_right = new DrawingBuffer(data.readUint16(true), data.readUint16(true), true, data);
		this.bottom      = new DrawingBuffer(data.readUint16(true), data.readUint16(true), true, data);
		this.lower_left  = new DrawingBuffer(data.readUint16(true), data.readUint16(true), true, data);
		this.left        = new DrawingBuffer(data.readUint16(true), data.readUint16(true), true, data);
		this.background  = new DrawingBuffer(data.readUint16(true), data.readUint16(true), true, data);

	}

	renderWindow(x, y, width, height, applyMask, mask)
	{
		let drawnBuffer = this.compose(width, height, applyMask, mask);
		
		return HUDSystem.renderImage(new Texture(width, height, drawnBuffer.data), x, y);
	}

	compose(width, height, applyMask, mask)
	{
		if(((this.upper_left.width  + this.upper_right.width) > width) ||
			(this.upper_left.height + this.lower_left,height) > height)
		{
			HUDSystem.error("window requested smaller than can be drawn with this style.");
		}
		let output = new DrawingBuffer(width, height, false);


		let widthCount  = Math.ceil((width  - this.upper_left.width  - this.upper_right.width) / this.top.width);
		let heightCount = Math.ceil((height - this.upper_left.height - this.lower_left.height) / this.left.height);

		//#FIX ME currently this does tiled window styles only

		//draw the background
		for(let i = 0, j = 0; j < heightCount; ++j, i = 0)
		{
			for(; i < widthCount; ++i)
			{
				output.drawBuffer(
					this.upper_left.width  + i * this.background.width,
					this.upper_left.height + j * this.background.height, this.background);
			}
		}

		//draw top and bottom
		for(let i = 0; i < widthCount; ++i)
		{
			output.drawBuffer(this.upper_left.width + (i * this.top.width), 0, this.top);
			output.drawBuffer(this.lower_left.width + (i * this.top.width), height - this.bottom.height, this.bottom);
		}

		//draw left and right
		for(let i = 0; i < heightCount; ++i)
		{
			output.drawBuffer(0, this.upper_left.height + i * this.left.height, this.left);
			output.drawBuffer(width - this.right.width, this.upper_right.height + i * this.right.height, this.right);
		}

		//draw corners
		output.drawBuffer(0,                              0,                                this.upper_left);
		output.drawBuffer(width - this.upper_right.width, 0,                                this.upper_right);
		output.drawBuffer(0,                              height - this.lower_left.height,  this.lower_left);
		output.drawBuffer(width - this.lower_right.width, height - this.lower_right.height, this.lower_right);
		
		//mask it
		if(applyMask === true)
		{
			output.mask(mask);
		}
		return output;
	}
}

export class DynamicBar
{
	constructor(x, y, width, height, fadeDirection, colourOne, colourTwo, texture = null, shader)
	{
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.colourOne = colourOne;
		this.colourTwo = colourTwo;
		this.model = new Model([HUDSystem.render(texture, 0, 0, width, height, Color.White)], shader.clone());
		this.mainTransform = new Transform();
		this.currentTransform = new Transform();
		this.model.transform = this.currentTransform;
		this.fraction = 1;
		this.lastFraction = 0;
		this.fadeDirection = fadeDirection;
	}

	update()
	{
		if(this.fraction !== this.lastFraction)
		{
			this.mainTransform.identity();
			let factor = Math.max(this.fraction,0);
			if(this.fadeDirection < 2)
			{
				this.mainTransform.scale(factor, 1);
			}
			else
			{
				this.mainTransform.scale(1, factor);
			}
			switch(this.fadeDirection)
			{
			case(0):
				this.mainTransform.translate(this.x, this.y);
				break;
			case(1):
				this.mainTransform.translate(this.x + Math.round(this.width * (1 - factor)), this.y);
				break;
			case(2):
				this.mainTransform.translate(this.x, this.y + Math.round(this.height * (1 - factor)));
				break;
			case(3):
				this.mainTransform.translate(this.x, this.y);
				break;
			}
			this.model.shader.setColorVector("tintColor", Color.mix(this.colourOne, this.colourTwo, factor, 1 - factor));
			this.lastFraction = this.fraction;
		}
	}
	draw(transform)
	{
		this.update();
		this.currentTransform.identity();
		this.currentTransform.compose(this.mainTransform);
		this.currentTransform.compose(transform);
		this.model.draw();
	}
}

export class DynamicText
{
	constructor(text, x, y, wrapWidth = screen.width, font = Font.Default, colour=Color.White)
	{
		this._text            = text;
		this._x               = x;
		this._y               = y;
		this._font            = font;
		this._wrapWidth       = wrapWidth;
		this._colour          = colour;
		this._needsUpdate     = true;
		this._needsMove       = true;
		this.shape            = HUDSystem.renderImage(HUDSystem.text(text, font, wrapWidth, colour), 0, 0);
		this.model            = new Model([this.shape]);
		this.mainTransform    = new Transform();
		this.currentTransform = new Transform();
		this.model.transform  = this.currentTransform;
	}

	set text (value)
	{
		if(this._text !== value)
		{
			this._text = value;
			this._needsUpdate = true;
		}
	}

	get text ()
	{
		return this._text;
	}

	set font (value)
	{
		if(this._font !== value)
		{
			this._font = value;
			this._needsUpdate = true;
		}
	}

	get font ()
	{
		return this._font;
	}

	set wrapWidth (value)
	{
		if(this._wrapWidth !== value)
		{
			this._wrapWidth = value;
			this._needsUpdate = true;
		}
	}

	get wrapWidth ()
	{
		return this._wrapWidth;
	}

	set colour (value)
	{
		if(this._colour !== value)
		{
			this._colour= value;
			this._needsUpdate = true;
		}
	}

	get colour ()
	{
		return this._colour;
	}

	set x (value)
	{
		if(this._x !== value)
		{
			this._x = value;
			this._needsMove = true;
		}
	}

	get x ()
	{
		return this._x;
	}

	set y (value)
	{
		if(this._y !== value)
		{
			this._y = value;
			this._needsMove = true;
		}
	}

	get y ()
	{
		return this._y;
	}

	update()
	{
		if(this._needsUpdate === true)
		{
			this.shape.texture = HUDSystem.text(this._text, this._font, this._wrapWidth, this._colour);
			this._needsUpdate  = false;
		}
		if(this._needsMove === true)
		{
			this.mainTransform.identity();
			this.mainTransform.translate(this._x, this._y);
			this._needsMove = false;
		}
	}

	draw(transform)
	{
		this.update();
		this.currentTransform.identity();
		this.currentTransform.compose(this.mainTransform);
		this.currentTransform.compose(transform);
		this.model.draw();
	}
}