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

//@ts-check

export class HUDSystem
{
    /**
     * Creates an instance of HUDSystem.
     * All instances support static objects (objects that once added never change)
     * Enable Dynamic to also support dynamic objects which you can edit
     * @param {boolean} [enableDynamic=false]
     * @memberof HUDSystem
     */
    constructor(enableDynamic?: boolean)

    staticShapes  : [];
    types         : [];
    staticIDs     : [];
    ids           : [];
    model         : Model
    ready         : boolean
    transform     : Transform
    nextID        : number
    enableStatic  : boolean
    enableDynamic : boolean
    dynamicIDs    : number[]
    dynamics      : object[]
    shader        : Shader
    dynamicsAfterStatics : boolean

    identity  () :void
    compose   (transform: Transform) : void
    rotate    (angle : number, vx : number, vy : number) : void
    scale     (sx : number, sy : number) : void
    translate (tx : number, ty : number) : void


    /**
     * addStatic(shape)
     * add a pre-created shape to the HUD as a static object
     * @param {object} shape - must be a Sphere shape object
     * @returns {number} an ID number that can be used to remove it
     */
    addStatic(shape: object): number

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
    addDynamic(dynamicData: object): number


    /**
     * getDynamic(id)
     * Returns the dynamic object at the specified id i.e. the parameter given to addDynamic
     * 
     * @param {number} id 
     * @returns dynamicObject
     * @memberof HUDSystem
     */
    getDynamic(id: number)

    /**
     * remove(id)
     * remove a shape from the HUD
     * id must be the number returned when you added the shape
     * @param {number} id 
     * @memberof HUDSystem
     */
    remove(id: number) : void

    /**
     * draw()
     * Call this from your render function or dispatch it with dispatch#onRender
     * 
     * @memberof HUDSystem
     */
    draw() : void

    /**
     * draw the Dynamics only - don't call this
     * let draw() call it internally
     * 
     * @memberof HUDSystem
     */
    drawDynamics() : void

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
    addDynamicRect(x: number, y: number, width: number, height: number, colour: any, texture?: any): number

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
    addVariableText(text: string, x: number, y: number, wrapWidth?: number, font?: Font, colour?: Color): number


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
    addVariableBar(x: number, y: number, width: number, height: number, fadeDirection?: number, colourOne?: Color, colourTwo?: Color, texture?: Texture): number

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
    addText(x: number, y: number, text: string, font?: Font, wrapWidth?: number, colour?: Color): number
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
    addImage(texture: object, x: number, y: number, mask: object): number

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
    addBuffer(buffer: object, x: number, y: number, mask: object): number

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
    addImageFromFile(filename: string, x: number, y: number, mask: object): number

    //STATIC methods - below helper functions are used internally

    static text(text, font, wrapWidth, colour) : Texture

    static renderImage(texture, x, y, mask?: Color) : Shape

    static render(texture, x, y, width, height, mask?: Color) : Shape
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
    constructor(filename: string)

    upper_left  : DrawingBuffer
    top         : DrawingBuffer
    upper_right : DrawingBuffer
    right       : DrawingBuffer
    lower_right : DrawingBuffer
    bottom      : DrawingBuffer
    lower_left  : DrawingBuffer
    left        : DrawingBuffer
    background  : DrawingBuffer

    /**
     *renderWindow(x, y, width, height, mask)
     * returns a Sphere shape object made from the windowStyle
     */
    renderWindow(x: number, y: number, width: number, height: number, mask: Color): Shape

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
    compose(width: any, height: any, mask?: Color) : DrawingBuffer
}

export class DynamicRect
{
    constructor(x : number, y : number, width : number, height : number, colour : Color, texture : Texture, shader : Shader)
    
    private _x : number
    private _y : number
    private _width : number
    private _height : number
    private _colour : number
    private _texture: Texture
    shader : Shader
    model : Model
    mainTransform : Transform 
    currentTransform : Transform 
    private _needsUpdate : boolean
    

    update() : void

    color : number


    height : number


    width : number

    x : number
    y : number


    draw(transform: Transform) : void
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
    constructor(x : number, y : number, width : number, height : number, fadeDirection : number, colourOne : Color, colourTwo : Color, texture : Texture, shader : Shader)
    x : number
    y : number
    width  : number
    height  : number
    colourOne : Color
    colourTwo : Color
    shader : Shader
    model : Model
    mainTransform : Transform
    currentTransform : Transform
    fraction : number
    private lastFraction  : number
    fadeDirection   : number

    update() : void

    draw(transform) : void
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
    constructor(text, x, y, wrapWidth? : number, font? : Font, colour? : Color)
    
    private _text            : string
    private _x               : number
    private _y               : number
    private _font            : Font
    private _wrapWidth       : number
    private _colour          : Color
    private _needsUpdate     : boolean
    private _needsMove       : boolean
    shape                    : Shape
    model                    : Model
    mainTransform    : Transform
    currentTransform : Transform

    /**
     * Change the text being drawn
     * instance.text = "new text";
     * @memberof DynamicText
     */
    text : string

    /**
     * Change the font being used
     * instance.font = newFontObject
     * @memberof DynamicText
     */
    font : Font

    /**
     * change the wrapWidth
     * 
     * @memberof DynamicText
     */
    wrapWidth : number
    
    colour : Color
    x : number
    y : number




    /**
     * draw the text
     * This will normally be called by HUDSystem#draw
     * So you should not call it directly
     * 
     */
    draw(transform: Transform) : void

    /**
     * Updates the text if values have been changed
     * Don't call this directly
     */
    update() : void
}

declare class HUDSystemError extends Error
{
    constructor(message : string)
}