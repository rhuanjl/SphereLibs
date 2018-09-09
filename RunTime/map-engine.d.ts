/* File: map-engine.d.ts
 * Author: Rhuan
 * Date: 05/11/2017
 * 2D Map Engine for miniSphere game engine
 * Usage: FIX ME - WRITE USAGE HERE OR EXTERNAL GUIDE DOC
 * License for map-engine.mjs, MEngine.mjs, SEngine.mjs and CEngine.mjs and related files
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

//Import the components of the map-engine
import MEngine from "./MEngine";//core map-engine
import SEngine, {Entity, loadSES} from "./SEngine";//Sprite/Entity handling and function for loading a sprite
import CEngine from "./CEngine";//collision handling



/**
 * The MapEngine class is a wrapper around MEngine, SEngine and CEngine that initialises
 * them in a "standard" way and provides a simpler shared API for working with them.
 */
export default class MapEngine
{
    /**
     * Creates an instance of MapEngine.
     * 
     * The runtime object is a pseduo-global object it will be provided as a parameter to all map and sprite scripts
     * Use it to hand around functions/properties you need access to in mulitple map/sprite scripts
     */
    constructor(runTime: object)
    runTime : object;
    CEngine : CEngine;
    SEngine : SEngine;
    MEngine : MEngine;
    started : false;
    paused :  false;
    hidden :  false;
    update :  JobToken;
    render :  JobToken;
    _camera : {x : number, y : number, zoom : number, layer : number} | {x : number, y : number, zoom : number} | null;

    /**
     * set the path for map scripts either:
     * - relative to the map files OR
     * - prefixed with a SphereFS prefix
     * */
    mapScriptsPath : string

    /**
     * Create an entity and add them to the map
     * Returns the entity object
     * 
     * x, y and layer all default to 0
     */
    createCharacter(name: string, spriteSet: string, x?: number, y?: number, layer?: number): object

    /**
     * Add default input (4 directional arrows + talk key) to provided character
     * the parameter should be the character object, not their name.
     * 
     * This also marks them as the player character for the Engine.
     */
    attachInput(character: Entity) : void

    /**
     * Add an input of some kind to be monitored whilst the map is running
     * if continuous is false (default) input is registered a maximum of once per button press
     * if true it is registered every frame whilst the button is pressed
     */
    addInput(key: Key, onPress: Function, continuous?: boolean, parameter?: object, onRelease?: Function): number

    /**
     * Return the entity object that has the given name
     * Throws an error if there is no entity with that name
     */
    getEntity(name: string): Entity

    /**
     * Readonly property, true if all entities on the map have empty movement queues
     * false if any entity is doing anything
     * @readonly 
     */
    readonly idle: boolean


    /**
     * Start the map engine - note this is an async function
     * To centre the map on a character supply that character's object as the second parameter
     * @param {string} firstMap //name of mapFile to use as first map ".mem" format
     * @param {{x:number, y:number, zoom:number}} [cameraObject={x: 0, y: 0, zoom: 1}] //object with x and y (and optionally zoom properties) where to focus the camera on the map
     */
    start(firstMap: string, cameraObject: { x: number; y: number; zoom: number; }) : Promise<void>

    /**
     * changeMap changes the current map. It requires that a map is currently running
     * it awaits that map's onExit script then awaits setMap for the new map
     * returns a promise that resolves after awaiting the new map's onEnter script
     * 
     * Optionally takes x and y coordinates to move the camera object to
     * Also optionally takes a layer parameter - if your camera object is an entity this
     * can set it to a different layer on the new map.
     * @param {string} newMap - name of map file to change to
     * @param {number} [x=this._camera.x] - x coordinate to set the camera to
     * @param {number} [y=this._camera.y] - y coordinate to set the camera to
     * @param {number} [layer=-1] - layer coordinate to set the "camera" to
     * @returns
     * @memberof MapEngine
     */
    changeMap(newMap: string, x?: number, y?: number, layer?: number) : Promise<void>

    /**
     * set this to true to block the map engine from taking input
     * set to false to re-enable input
     * 
     * NOTE: this is write only
     */
    blockInput : boolean
    

    /**
     * Camera object
     * 
     * The screen will be centered on the map x and y coordinates of this object
     * and this object's "zoom" property will be applied as a zoom to the map
     * 
     * By default you would set the camera to your player character
     */

    camera : { x: number; y: number; zoom: number; }| { x: number; y: number; zoom: number; layer : number}

    /**
     * Pause the map engine - only if it's running
     * A no-op if the map engine is already paused
     */
    pause() : void

    /**
     * Resume the map engine - ONLY if it's running
     * A no-op if the map engine is not paused
     */
    resume() : void

    /**
     * Hide the map-engine (stop drawing it) - only if it's running
     * Note this doesn't stop updating
     * This is a no-op if it's already hidden
     */
    hide() : void

    /**
     * Start drawing the map-engine again - only if it's running
     * A no-op if it's not hidden
     */
    show() : void

    /**
     * Stop drawing a specific layer of the map
     * Can only call this when the map-engine is running
     * 
     * Defaults to hiding `layer` 0 if not specified
     */
    hideLayer(layer?: number)

    /**
     * Start drawing a specific layer of the map
     * Can only call this when the map-engine is running
     * Note - if the layer has not first been hidden with hideLayer this is a no-op
     *
     * Defaults to showing `layer` 0 if not specified
     */
    showLayer(layer: number)

    /**
     * Stop the map-engine
     * - Note after using this you would need to start() again
     * - Note this method isn't entirely finished - it disposes of the map but not the entities
     * - This means if you follow it with start() you will keep any entities created with createCharacter
     * (though it will correctly dispose of map specific entities)
     */
    stop() : void
}



