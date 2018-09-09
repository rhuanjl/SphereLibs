/* File: MEngine.d.ts
 * Author: Rhuan
 * Date: 27/10/2017
 * 2D Map Engine for miniSphere game engine
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

/// <reference path="../SphereV2.d.ts" />

import {MapBuffer, TileBuffer} from "./PixelBuffer";
import DataStream from "data-stream";
import SEngine from "./SEngine";
import CEngine from "./CEngine";


/**
 * MEngine is the core of the MapEngine.
 * This class handles storing, updating and drawing maps
 */
export default class MEngine
{
    /**
     * @param runTime - object to be given to map scripts when they're called - not currently used
     * @param SEngine - instance of SEngine class to handle sprites
     * @param CEngine - instance of CENgine class to handle collisions (must be shared with the SEngine instance)
     * @param shaderPath - path to customised shaders
     * @param width - width of the surface this will draw on
     * @param height - height of the surface this will draw on
     * @param scriptsPath - path to map scripts either relative to maps or with a sphereFS prefix
     */
    constructor(runTime: object, SEngine?: SEngine, CEngine?: CEngine, shaderPath?: string, width?: number, height?: number, scriptsPath?: string)
    
    shader         : Shader
    s_width        : number
    s_height       : number
    useTransform   : boolean
    transformation : Transform
    map            : object
    folder         : string
    DEBUG_MODE     : boolean
    col_tile_size  : number
    useSEngine     : boolean
    SEngine        : SEngine
    runTime        : object
    scriptsPath    : string
    changing       : Changing


    /**
     * Called to update the map should be done every frame
     * - Coordinates are for the point you wish the map to be centered on
     * - Defaults are x= 0, y = 0, zoom = 1
     * - This is designed to be used via Dispatch.onUpdate
     * - If using SEngine this automatically calls SEngine#update
     */
    update(x?: number, y?: number, zoom?: number) : void

    /**
     * Draw the whole map onto the provided surface
     * 
     * - Default surface is Surface.Screen
     * - This is Intended to be used via Dispatch.onRender
     * - start_layer and end_layer allow you to draw a specified range of layers only if wanted
     * 
     * Note if using SEngine the call to this.renderLayer within this method calls on to SEngine.renderLayer as well
     */
    render(surface?: Surface, start_layer?: number, end_layer?: number) : void

    /**
     * Draw one layer of the map onto the specified surface
     * 
     * If using SEngine this also draws the entities for the layer via calling SEngine#renderLayer
     */
    renderLayer(surface: Surface, layer: number) : void

    /**
     * Attach a transformation object to the whole map
     * Use this to rotate or translate or scale the rectangle the map is drawn in
     * For transititions or shrinking to a miniMap or the like
     * 
     * EXPERIMENTAL feature - not fully tested
     */
    attachTransformation(transformation: Transform) : void

    /**
     * Use this to remove a Transfom that was set with attachTransformation
     */
    detachTransformation() : void

    /**
     * Change the standard width and height of the box the map is drawn in
     * 
     * returns false if the map already the specified dimensions hence there was nothing to do
     * 
     * #Experimental feature, not fully tested
     */
    changeRes(width: number, height: number): boolean

    /**
     * Set a map - used to set the first map and to change map later.
     * 
     * Note this is an async function use it with an await or a .then
     * if you wish to schedule anything to happen after the map loads
     * 
     * Additionally the promise MEngine#changing will resolve after the
     * new map's onEnter script has completed
     */
    setMap(fileName: string) : Promise<void>


    /**
     * Add a trigger to the currently active map at
     * specified x, y tile coordinates and on the specified layer
     * 
     * With func as the function to call when it's triggered
     * 
     * Mode determines how to handle duplicates:
     * mode = 0 (default) - throw error for duplicate
     * mode = 1 when there is a duplicate create the new trigger
     *          but have it share the existing trigger's calback
     * mode = 2 overwrite the function used by the duplicate
     */
    addTrigger(name: string, x: number, y: number, layer: number, onPlayer: Function, onOther?: Function, mode?: number) : void

    /**Called when changing off of a map - overwrite this to specificy standard map exit behaviour.
     * 
     * This is called via Promise.all so if it is an async function or returns a promise the map change will be delayed
     * untill the promise resolves.
    */
    onExit   (runTime: object, map: object)

    /**Called when changing on to a map - overwrite this to specificy standard map entry behaviour.
     * 
     * This is called via Promise.all so if it is an async function or returns a promise the MEngine#changing
     * promise will not resolve untill this resolves.
    */
    onEnter  (runTime: object, map: object)
    /**Called every frame during update() - overwrite this to specificy standard update behaviour.*/
    onUpdate (runTime: object, map: object)
    /**Called every frame during render() after the drawing is completed - overwrite this to specificy standard render behaviour.*/
    onRender (runTime: object, map: object)
}


/**
 * set up a map animation - function for internal use
 *
 */
declare function MapAnimation(animationsArray: Array<any>, x: number, y: number, firstTile: number, shader: Shader, inUseAnimations: Array<any>) : object


declare class Changing extends Promise<void>
{
    constructor (method: Function)
    done : Function
}

declare class MEngineError extends Error
{
    constructor(message: string)
}
