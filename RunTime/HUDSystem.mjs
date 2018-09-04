/* File: HUDSystem.mjs
 * Author: Rhuan
 * Date: 27/10/2017
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

import {DrawingBuffer} from "./PixelBuffer";
import DataStream from "data-stream";

export default class HUDSystem
{
    /**
     * Creates an instance of HUDSystem.
     * All instances support static objects (objects that once added never change)
     * Enable Dynamic to also support dynamic objects which you can edit
     * @param {boolean} [enableDynamic=false]
     * @memberof HUDSystem
     */
    constructor(enableDynamic = false)
    {
        this.staticShapes  = [];
        this.types         = [];
        this.staticIDs     = [];
        this.ids           = [];
        this.model         = null;
        this.ready         = true;
        this.transform     = new Transform();
        this.nextID        = 0;
        this.enableStatic  = false;
        this.enableDynamic = enableDynamic;
        if (enableDynamic === true)
        {
            this.dynamicIDs = [];
            this.dynamics = [];
            this.dynamicsAfterStatics = true;
            this.shader = new Shader({
                fragmentFile : "#/shaders/image.frag.glsl",
                vertexFile   : "#/shaders/image.vert.glsl"
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


    /**
     * addStatic(shape)
     * add a pre-created shape to the HUD as a static object
     * @param {object} shape - must be a Sphere shape object
     * @returns {number} an ID number that can be used to remove it
     * @memberof HUDSystem
     */
    addStatic(shape)
    {
        this.enableStatic = true;
        this.ids.push(this.nextID);
        this.staticShapes.push(shape);
        this.staticIDs.push(this.nextID);
        this.types.push(0);
        this.ready = false;
        this.nextID += 1;
        return this.nextID - 1;
    }

    /**
     * addDynamic(dynamicData)
     * add a dynamic object to the HUD
     * The dynamic object must:
     * - define a draw function which takes transform as a paremeter
     * - the transform will be the HUD's transform object and should
     *         be applied to the object every draw
     * Any other inputs or updates the object needs should be properites of it
     * 
     * Note dynamics are drawn on top of statics by default
     * can be swapped to under by changing HUDSystem#dynamicsAfterStatics to false
     * cannot do half and half with one HUD object
     * @param {object} dynamicData 
     * @returns {number} ID can be used to remove this object from the HUD or to get access to the object
     * @memberof HUDSystem
     */
    addDynamic(dynamicData)
    {
        if (this.enableDynamic === true)
        {
            this.ids.push(this.nextID);
            this.dynamics.push(dynamicData);
            this.dynamicIDs.push(this.nextID);
            this.types.push(1);
            this.nextID += 1;
            return this.nextID - 1;
        }
        else
        {
            throw new HUDSystemError("dynamic object added to HUD without dynamic enabled.");
        }
    }


    /**
     * getDynamic(id)
     * Returns the dynamic object at the specified id i.e. the parameter given to addDynamic
     * 
     * @param {number} id 
     * @returns dynamicObject
     * @memberof HUDSystem
     */
    getDynamic(id)
    {
        if (this.enableDynamic === true)
        {
            const position = this.dynamicIDs.indexOf(id);
            if (position !== -1)
            {
                return this.dynamics[position];
            }
            else
            {
                throw new HUDSystemError("getDynamic called with id " + id + " but no dynamic object exists with that id.");
            }
        }
        else
        {
            throw new HUDSystemError("getDynamic called with id " + id + " but designated HUD has dynamic disabled.");
        }
    }

    /**
     * remove(id)
     * remove a shape from the HUD
     * id must be the number returned when you added the shape
     * @param {number} id 
     * @memberof HUDSystem
     */
    remove(id)
    {
        const position = this.ids.indexOf(id);
        if (position === -1)
        {
            throw new HUDSystemError("attempt to remove item with id " + id + " from HUD but that id does not exist");
        }
        else
        {
            const type = this.types[position];
            if (type === 0)
            {
                const truePosition = this.staticIDs.indexOf(id);
                this.staticIDs.splice(truePosition, 1);
                this.staticShapes.splice(truePosition, 1);
                this.ready = false;
            }
            else
            {//handle dynamic here - omission of this.ready = false is intentional
                const truePosition = this.dynamicIDs.indexOf(id);
                this.dynamics.splice(truePosition, 1);
                this.dynamicIDs.splice(truePosition, 1);
            }
            this.ids.splice(position, 1);
            this.types.splice(position, 1);
        }
    }

    /**
     * draw()
     * Call this from your render function or dispatch it with dispatch#onRender
     * 
     * @memberof HUDSystem
     */
    draw()
    {
        if (this.ready === false)
        {
            this.model = new Model(this.staticShapes);
            this.model.transform = this.transform;
            this.ready = true;
        }
        if (this.enableDynamic === true)
        {
            if (this.dynamicsAfterStatics === true)
            {
                if (this.enableStatic === true)
                {
                    this.model.draw();
                }
                this.drawDynamics();
            }
            else
            {
                this.drawDynamics();
                if (this.enableStatic === true)
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

    /**
     * drawDynamics()
     * draw the Dynamics only - don't call this
     * let draw() call it internally
     * 
     * @memberof HUDSystem
     */
    drawDynamics()
    {
        const length = this.dynamics.length;
        for (let i = 0; i < length; ++i)
        {
            this.dynamics[i].draw(this.transform);
        }
    }

    /**
     * addDynamicRect(x, y, width, height, colour, texture = null)
     * Create a dynamic rectangle object and add it to the HUD
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} width 
     * @param {number} height 
     * @param {any} colour 
     * @param {any} [texture=null] 
     * @returns {number} id
     * @memberof HUDSystem
     */
    addDynamicRect(x, y, width, height, colour, texture = null)
    {
        if (this.enableDynamic === true)
        {
            return this.addDynamic(new DynamicRect(x, y, width, height, colour, texture, this.shader));
        }
        else
        {
            throw new HUDSystemError("attempt to add a dynamic Rectangle to a HUDSystem which has dynamics disabled");
        }
    }

    /**
     * addVariableText()
     * Creates a dynamic object for text that can be changed or moved
     * Adds the object immediately to the HUD and returns its ID number
     * See class DynamicText below for more info
     * @param {string} text - the initial text to draw
     * @param {number} x -initial coordinates
     * @param {number} y 
     * @param {number} [wrapWidth=Surface.Screen.width] -wordwrap width
     * @param {object} [font=Font.Default] - initial font to use
     * @param {object} [colour=Color.White] -initial colour
     * @returns {number} id
     * @memberof HUDSystem
     */
    addVariableText(text, x, y, wrapWidth = Surface.Screen.width, font = Font.Default, colour=Color.White)
    {
        if (this.enableDynamic === true)
        {
            return this.addDynamic(new DynamicText(text, x, y, wrapWidth, font, colour));
        }
        else
        {
            throw new HUDSystemError("attempt to add a dynamic Variable Bar to a HUDSystem which has dynamics disabled");
        }
    }


    /**
     * addVariableBar()
     * Creates a dynamic object rectangle that can grow larger and smaller
     * Adds the object immediately to the HUD and returns its ID number
     * Designed to be used as a heath bar or the like
     * See class DynamicBar below for more info
     * 
     * @param {number} x -top left corner coordinate
     * @param {number} y 
     * @param {number} width -full size dimensions
     * @param {number} height 
     * @param {number} [fadeDirection=0] - 0 = fade right to left, 1 = fade left to right, 2 top to bottom, 3 bottom to top
     * @param {object} [colourOne=Color.Green] - colour at full size
     * @param {object} [colourTwo=Color.Red]  - colour to fade to as it shrinks
     * @param {object} [texture=null] -texture to use
     * @returns {number} id
     * @memberof HUDSystem
     */
    addVariableBar(x, y, width, height, fadeDirection = 0, colourOne = Color.Green, colourTwo = Color.Red, texture = null)
    {
        if (this.enableDynamic === true)
        {
            return this.addDynamic(new DynamicBar(x, y, width, height, fadeDirection, colourOne, colourTwo, texture, this.shader));
        }
        else
        {
            throw new HUDSystemError("attempt to add a dynamic Variable Bar to a HUDSystem which has dynamics disabled");
        }
    }

    /**
     * addText()
     * Creates a static text object
     * Immediately adds this object to the HUD and returns the id number
     * 
     * @param {number} x  - top left coordinate
     * @param {number} y 
     * @param {string} text  - string to draw
     * @param {Font} [font=Font.Default]  - font to use
     * @param {number} [wrapWidth=Surface.Screen.width]  - word wrap width
     * @param {Color} [colour=Color.White] 
     * @returns {number} id
     * @memberof HUDSystem
     */
    addText(x, y, text, font=Font.Default, wrapWidth=Surface.Screen.width, colour=Color.White)
    {
        return this.addStatic(HUDSystem.renderImage(HUDSystem.text(text, font, wrapWidth, colour), x, y));
    }

    /**
     * addImage(texture, x, y, mask)
     * Add a Sphere Texture object to the HUD as an image
     * at x,y with colour, mask (note if no mask is supplied it defaults to white)
     * returns the id number
     * 
     * @param {object} texture 
     * @param {number} x 
     * @param {number} y 
     * @param {object} mask 
     * @returns  {number} id
     * @memberof HUDSystem
     */
    addImage(texture, x, y, mask)
    {
        return this.addStatic(HUDSystem.render(texture, x, y, mask));
    }

    /**
     * addBuffer(buffer, x, y, mask)
     * render a DrawingBuffer as an image and add it to the HUD at x, y as a static object
     * See PixelBuffer.mjs for explanation of Drawing Buffers
     * returns the id number in the HUD
     * @param {object} buffer - instance of DrawingBuffer
     * @param {number} x 
     * @param {number} y 
     * @param {object} mask -Sphere colour object(defaults to white)
     * @returns {number} id
     * @memberof HUDSystem
     */
    addBuffer(buffer, x, y, mask)
    {
        return this.addStatic(HUDSystem.render(new Texture(buffer.data, buffer.width, buffer.height), x, y, mask));
    }

    /**
     * addImageFromFile(filename, x, y, mask)
     * Loads an image from a file, and immediately adds it to the HUD as a static object
     * returns the id number in the HID
     * @param {string} filename - SphereFS path for image
     * @param {number} x -top left corner
     * @param {number} y 
     * @param {object} mask -Sphere colour object - defaults to white
     * @returns {number} -id
     * @memberof HUDSystem
     */
    addImageFromFile(filename, x, y, mask)
    {
        return this.addStatic(HUDSystem.render(new Texture(filename), x, y, mask));
    }

    //STATIC methods - below helper functions are used internally

    static text(text, font, wrapWidth, colour)
    {
        const size = font.getTextSize(text, wrapWidth);
        const height = Math.max(size.height, font.height + 5);
        const output = new Surface(size.width, height);
        font.drawText(output, 0, 0, text, colour, wrapWidth);

        return output.toTexture();
    }

    static renderImage(texture, x, y, mask = Color.White)
    {
        return HUDSystem.render(texture, x, y, texture.width, texture.height, mask);
    }

    static render(texture, x, y, width, height, mask = Color.White)
    {
        const vbo = new VertexList([
            {x : x, y : y, z : 0, u : 0, v : 1, color : mask},
            {x : x + width, y : y, z : 0, u : 1, v : 1, color : mask},
            {x : x, y : y + height, z : 0, u : 0, v : 0, color : mask},
            {x : x + width, y : y + height, z : 0, u : 1, v : 0, color : mask}
        ]);

        return new Shape(ShapeType.TriStrip, texture, vbo);
    }
}

/**
 * WindowStyle class
 * Sphere v2 implementation of SPherev1 windowstyles
 * uses PixelBuffer.mjs for composition
 * 
 * @export
 * @class WindowStyle
 */
export class WindowStyle
{
    /**
     * Creates an instance of WindowStyle.
     * This can then be used for drawing windows
     * (Think sphere v1 LoadWindowStyle)
     * @param {string} filename path to a .rws file
     * @memberof WindowStyle
     */
    constructor(filename)
    {
        const data = new DataStream(filename, FileOp.Read);

        if (data.readStringRaw(4) !== ".rws")
        {
            throw new HUDSystemError("window style file provided not a .rws file.");
        }
        if (data.readUint16(true) !== 2)
        {
            throw new HUDSystemError("only supports .rws version 2 - provided file is a different version.");
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

    /**
     *renderWindow(x, y, width, height, mask)
     * returns a Sphere shape object made from the windowStyle
     * @param {number} x - top left coordinate
     * @param {number} y 
     * @param {number} width - dimensions
     * @param {number} height 
     * @param {object} mask - Sphere colour object
     * @returns {object} - SPhere shape
     * @memberof WindowStyle
     */
    renderWindow(x, y, width, height, mask)
    {
        const drawnBuffer = this.compose(width, height, mask);
        return HUDSystem.renderImage(new Texture(width, height, drawnBuffer.data), x, y);
    }

    /**
     * compose(width, height, mask=Color.White)
     * Returns a DrawingBuffer that is the windowStyle with the provided dimensions
     * Use via renderWindow for simple cases
     * @param {any} width 
     * @param {any} height 
     * @param {any} [mask=Color.White] 
     * @returns 
     * @memberof WindowStyle
     */
    compose(width, height, mask=Color.White)
    {
        if (this.upper_left.width  + this.upper_right.width > width ||
            this.upper_left.height + this.lower_left,height > height)
        {
            throw new HUDSystemError("window requested smaller than can be drawn with this style.");
        }
        const output = new DrawingBuffer(width, height, false);


        const widthCount  = Math.ceil((width  - this.upper_left.width  - this.upper_right.width) / this.top.width);
        const heightCount = Math.ceil((height - this.upper_left.height - this.lower_left.height) / this.left.height);

        //#FIX ME currently this does tiled window styles only

        //draw the background
        for (let i = 0, j = 0; j < heightCount; ++j, i = 0)
        {
            for (; i < widthCount; ++i)
            {
                output.drawBuffer(
                    this.upper_left.width  + i * this.background.width,
                    this.upper_left.height + j * this.background.height, this.background);
            }
        }

        //draw top and bottom
        for (let i = 0; i < widthCount; ++i)
        {
            output.drawBuffer(this.upper_left.width + i * this.top.width, 0, this.top);
            output.drawBuffer(this.lower_left.width + i * this.top.width, height - this.bottom.height, this.bottom);
        }

        //draw left and right
        for (let i = 0; i < heightCount; ++i)
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
        if (mask !== Color.White)
        {
            const maskArray = [mask.r, mask.g, mask.b, mask.a];
            output.mask(maskArray);
        }
        return output;
    }
}

export class DynamicRect
{
    constructor(x, y, width, height, colour, texture = null, shader)
    {
        this._x = x|0;
        this._y = y|0;
        this._width = Math.ceil(width);
        this._height = Math.ceil(height);
        this._colour = colour;
        this._texture = texture;
        this.shader = shader.clone();
        this.model = new Model([HUDSystem.render(texture, 0, 0, 1, 1, Color.White)], this.shader);
        this.mainTransform = new Transform();
        this.currentTransform = new Transform();
        this.model.transform = this.currentTransform;
        this._needsUpdate = true;
    }

    update()
    {
        this.shader.setColorVector("tintColor", this._colour);
        this.mainTransform.identity();
        this.mainTransform.scale(this._width, this._height);
        this.mainTransform.translate(this._x, this._y);
        this._needsUpdate = false;
    }

    set colour(value)
    {
        if (this._colour.a !== value.a ||
            this._colour.r !== value.r ||
            this._colour.g !== value.g ||
            this._colour.b !== value.b)
        {
            this._colour = value;
            this._needsUpdate = true;
        }
    }

    get colour()
    {
        return this._colour;
    }


    set height(value)
    {
        if (this._height !== value)
        {
            this._height = value;
            this._needsUpdate = true;
        }
    }

    get height()
    {
        return this._height;
    }

    set width(value)
    {
        if (this._width !== value)
        {
            this._width = value;
            this._needsUpdate = true;
        }
    }

    get width()
    {
        return this._width;
    }

    set y(value)
    {
        if (this._y !== value)
        {
            this._y = value;
            this._needsUpdate = true;
        }
    }

    get y()
    {
        return this._y;
    }

    set x(value)
    {
        if (this._x !== value)
        {
            this._x = value;
            this._needsUpdate = true;
        }
    }

    get x()
    {
        return this._x;
    }

    draw(transform)
    {
        if (this._needsUpdate === true)
        {
            this.update();
        }
        this.currentTransform.identity();
        this.currentTransform.compose(this.mainTransform);
        this.currentTransform.compose(transform);
        this.model.draw();
    }
}


/**
 * A dynamic Bar for the HudSystem
 * Create via HUDSystem.addVariableBar
 * Generally should not directly instantiate this class
 * Then change this.fraction (between 1 and 0) to shrink/fade the bar
 * Note you will need to use HUDSystem#getDynamic to get a copy of the object
 * ...may enable translating it as a future feature
 * 
 * @export
 * @class DynamicBar
 */
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
        this.shader = shader.clone();
        this.model = new Model([HUDSystem.render(texture, 0, 0, width, height, Color.White)], this.shader);
        this.mainTransform = new Transform();
        this.currentTransform = new Transform();
        this.model.transform = this.currentTransform;
        this.fraction = 1;
        this.lastFraction = 0;
        this.fadeDirection = fadeDirection;
    }

    update()
    {
        if (this.fraction !== this.lastFraction)
        {
            this.mainTransform.identity();
            const factor = Math.max(this.fraction,0);
            if (this.fadeDirection < 2)
            {
                this.mainTransform.scale(factor, 1);
            }
            else
            {
                this.mainTransform.scale(1, factor);
            }
            switch (this.fadeDirection)
            {
            case 0:
                this.mainTransform.translate(this.x, this.y);
                break;
            case 1:
                this.mainTransform.translate(this.x + Math.round(this.width * (1 - factor)), this.y);
                break;
            case 2:
                this.mainTransform.translate(this.x, this.y + Math.round(this.height * (1 - factor)));
                break;
            case 3:
                this.mainTransform.translate(this.x, this.y);
                break;
            }
            this.shader.setColorVector("tintColor", Color.mix(this.colourOne, this.colourTwo, factor, 1 - factor));
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

/**
 * Dynamic text
 * create with and add to HUD with HUDSystem#addVariableText()
 * Generally should not directly instantiate this class
 * see comments below for what you can do after creation
 * Note you will need to use HUDSystem#getDynamic to get a copy of the object
 * 
 * Most changes are done via getters and setters SO you can just write to the relevant properites
 * e.g. to change the text do instanceOfDynamicText.text = "This text is different now";
 * @export
 * @class DynamicText
 */
export class DynamicText
{
    constructor(text, x, y, wrapWidth = Surface.Screen.width, font = Font.Default, colour=Color.White)
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

    /**
     * Change the text being drawn
     * instance.text = "new text";
     * @memberof DynamicText
     */
    set text (value)
    {
        if (this._text !== value)
        {
            this._text = value;
            this._needsUpdate = true;
        }
    }

    get text ()
    {
        return this._text;
    }

    /**
     * Change the font being used
     * instance.font = newFontObject
     * @memberof DynamicText
     */
    set font (value)
    {
        if (this._font !== value)
        {
            this._font = value;
            this._needsUpdate = true;
        }
    }

    get font ()
    {
        return this._font;
    }

    /**
     * change the wrapWidth
     * 
     * @memberof DynamicText
     */
    set wrapWidth (value)
    {
        if (this._wrapWidth !== value)
        {
            this._wrapWidth = value;
            this._needsUpdate = true;
        }
    }

    get wrapWidth ()
    {
        return this._wrapWidth;
    }

    /**
     * Change the colour being used
     * 
     * @memberof DynamicText
     */
    set colour (value)
    {
        if (this._colour !== value)
        {
            this._colour= value;
            this._needsUpdate = true;
        }
    }

    get colour ()
    {
        return this._colour;
    }

    /**
     * Move the text
     * 
     * @memberof DynamicText
     */
    set x (value)
    {
        if (this._x !== value)
        {
            this._x = value;
            this._needsMove = true;
        }
    }

    get x ()
    {
        return this._x;
    }

    /**
     * Move the text
     * 
     * @memberof DynamicText
     */
    set y (value)
    {
        if (this._y !== value)
        {
            this._y = value;
            this._needsMove = true;
        }
    }

    get y ()
    {
        return this._y;
    }


    /**
     * draw the text
     * This will normally be called by HUDSystem#draw
     * So you should not call it directly
     * 
     * @param {any} transform 
     * @memberof DynamicText
     */
    draw(transform)
    {
        this.update();
        this.currentTransform.identity();
        this.currentTransform.compose(this.mainTransform);
        this.currentTransform.compose(transform);
        this.model.draw();
    }

    /**
     * Updates the text if values have been changed
     * Don't call this directly
     * 
     * @memberof DynamicText
     */
    update()
    {
        if (this._needsUpdate === true)
        {
            this.shape.texture = HUDSystem.text(this._text, this._font, this._wrapWidth, this._colour);
            this._needsUpdate  = false;
        }
        if (this._needsMove === true)
        {
            this.mainTransform.identity();
            this.mainTransform.translate(this._x, this._y);
            this._needsMove = false;
        }
    }
}

class HUDSystemError extends Error
{
    constructor(message)
    {
        super("HUDSystem error: " + message);
    }
}