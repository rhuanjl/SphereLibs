/* File: map-engine.mjs
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
/// <reference path="./SphereLibs.d.ts" />

//Import the components of the map-engine
import MEngine from "./MEngine";//core map-engine
import SEngine, {loadSES} from "./SEngine";//Sprite/Entity handling and function for loading a sprite
import CEngine from "./CEngine";//collision handling

//Note there are additional dependencies imported through the above files:
//The following two modules must be in the same folder as these modules
//PixelBuffer.mjs - is used by MEngine and SEngine for manipulating and loading sprite/map graphics
//input.mjs is used by SEngine for handling input checks
//The following miniSphere system modules are used - these come with miniSphere and should already be in place
//data-stream.mjs - used for file loading
//focus-target.mjs - used for input priority handling - allows you to have the map running in the background
//                      whilst a different system takes input and the map doesn't

//the map-engine class, default so a user can call it anything they like when importing
export default class MapEngine
{
    /**
     * Creates an instance of MapEngine.
     * 
     * The runtime object is a pseduo-global object it will be provided as a parameter to all map and sprite scripts
     * Use it to hand around functions/properties you need access to in mulitple map/sprite scripts
     * @param {any} [runTime={}] 
     * @memberof MapEngine
     */
    constructor(runTime={})
    {
        this.runTime = runTime;
        if (!runTime.hasOwnProperty("engine"))
        {
            runTime.engine = this;
        }
        this.CEngine = new CEngine();
        this.SEngine = new SEngine(runTime, this.CEngine);//initiate SEngine
        this.MEngine = new MEngine(runTime, this.SEngine, this.CEngine);//initiate MEngine
        this.started = false;
        this.paused = false;
        this.hidden = false;
        this.update = null;
        this.render = null;
        /**@type camera */
        this._camera = null;
    }

    /**
     * set the path for map scripts either:
     * - relative to the map files OR
     * - prefixed with a SphereFS prefix
     * @param {string} value
     * @memberof MapEngine
     */
    set mapScriptsPath (value)
    {
        value = value.slice(-1) === "/" ? value : value + "/";
        this.MEngine.scriptsPath = value;
    }

    /**
     * set the path for map scripts
     * note expected to be relative to map files
     * @memberof MapEngine
     */
    get mapScriptsPath ()
    {
        return this.MEngine.scriptsPath;
    }

    /**
     * Create an entity and add them to the map
     * Returns the entity object
     * @param {string} name //name of the entity
     * @param {string} spriteSet  //name of the spriteset file to use 
     * @param {number} [x=0] 
     * @param {number} [y=0] 
     * @param {number} [layer=0] 
     * @returns {object} entity
     */
    createCharacter(name, spriteSet, x=0, y=0, layer=0)
    {
        return this.SEngine.addEntity(name, loadSES(spriteSet), true, x, y, layer);
    }

    /**
     * Add default input (4 directional arrows + talk key) to provided character
     * the parameter should be the character object, not their name
     * @param {Entity} character 
     */
    attachInput(character)
    {
        this.SEngine.addDefaultInput(character);
    }

    /**
     * Add another input of some kind to be monitored whilst the map is running
     * Only first two parameters are required, the other 3 are optional
     * 
     * @param {Key} key - key to check for
     * @param {function} onPress - function to call when it's pressed
     * @param {boolean} [continuous=false] - allow continuous input - function can trigger every frame
     *                                       or false to only call the function once for each press
     * @param {any} [parameter=null] - parameter to pass to the function, e.g. a person object
     * @param {function} onRelease - function to call when the key is released
     * @returns {number} - the number of inputs added in total (will be one higher each time this is called)
     * @memberof MapEngine
     */
    addInput(key, onPress, continuous = false, parameter = null, onRelease = function(){})
    {
        return this.SEngine.addInput(key, continuous, parameter, onPress, onRelease);
    }

    /**
     * Return the entity object that has the given name
     * Throws an error if there is no entity with that name
     * @param {string} name 
     * @returns {Entity} Entity
     */
    getEntity(name)
    {
        return this.SEngine.getEntity(name);
    }

    /**
     * Readonly property, true if all entities on the map have empty movement queues
     * false if any entity is doing anything
     * @returns {boolean} idle
     * @readonly 
     */
    get idle()
    {
        return this.SEngine.idle;
    }


    /**
     * Start the map engine - note this is an async function
     * To centre the map on a character supply that character's object as the second parameter
     * @param {string} firstMap //name of mapFile to use as first map ".mem" format
     * @param {camera} [cameraObject={x: 0, y: 0, zoom: 1}] //object with x and y (and optionally zoom properties) where to focus the camera on the map
     */
    async start(firstMap, cameraObject = {x : 0, y : 0, zoom : 1})
    {
        this._camera = cameraObject;
        if (!this._camera.zoom)//if this supplied camera object doesn't have a zoom property give it one
        {
            this._camera.zoom = 1;
        }
        await this.MEngine.setMap(firstMap);
        this.blockInput = true;

        this.update = Dispatch.onUpdate(()=>
        {
            this.MEngine.update(this._camera.x, this._camera.y, this._camera.zoom);
        });
        this.render = Dispatch.onRender(()=>this.MEngine.render());
        this.started = true;
        this.blockInput = false;
    }

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
     * @returns {Promise<void>} 
     * @memberof MapEngine
     */
    async changeMap(newMap, x = this._camera.x, y = this._camera.y, layer = -1)
    {
        if (this.started !== true)
        {
            throw new Error("Attempt to change map when the map-engine is not running.");
        }
        await this.MEngine.setMap(newMap);
        this._camera.x = x;
        this._camera.y = y;
        if (layer > -1)
        {
            this._camera.layer = layer;
        }
        return this.MEngine.changing;
    }

    /**
     * set this to true to block the map engine from taking input
     * set to false to re-enable input
     * @param {boolean} value
     * @memberof MapEngine
     */
    set blockInput (value)
    {
        if (value === true)
        {
            this.SEngine.input.yieldInput();
        }
        else
        {
            this.SEngine.input.takeInput();
        }
    }

    /* Camera object
     * 
     * The screen will be centered on the map x and y coordinates of this object
     * and this object's "zoom" property will be applied as a zoom to the map
     * 
     * By default you would set the camera to your player character
     */
    set camera (cameraObject)
    {
        if (this.started === true)
        {
            if (!this._camera.zoom)//if this supplied camera object doesn't have a zoom property give it one
            {
                this._camera.zoom = 1;
            }
            this._camera = cameraObject;
        }
        else
        {
            throw new Error("Attempt to change camera when the map-engine is not running.");
        }
    }

    /**
     * get the current camera object.
     * @memberof MapEngine
     */
    get camera ()
    {
        return this._camera;
    }

    /**
     * Pause the map engine - only if it's running
     * A no-op if the map engine is already paused
     * @memberof MapEngine
     */
    pause()
    {
        if (this.started === true)
        {
            if (this.paused === false)
            {
                this.update.cancel();
                this.paused = true;
                this.yieldInput();
            }
        }
        else
        {
            throw new Error("Attempt to pause the map-engine when it is not running.");
        }
    }

    /**
     * Resume the map engine - ONLY if it's running
     * A no-op if the map engine is not paused
     * @memberof MapEngine
     */
    resume()
    {
        if (this.started === true)
        {
            if (this.paused === true)
            {
                this.update = Dispatch.onUpdate(()=>
                {
                    this.MEngine.update(this._camera.x, this._camera.y, this._camera.zoom);
                });
                this.paused = false;
                this.blockInput = false;
            }
        }
        else
        {
            throw new Error("Attempt to resume the map-engine when it is not running or is not paused.");
        }
    }

    /**
     * Hide the map-engine (stop drawing it) - only if it's running
     * Note this doesn't stop updating
     * This is a no-op if it's already hidden
     * @memberof MapEngine
     */
    hide()
    {
        if (this.started === true)
        {
            if (this.hidden === false)
            {
                this.render.cancel();
                this.hidden = true;
            }
        }
        else
        {
            throw new Error("Attempt to hide the map-engine when it is not running.");
        }
    }

    /**
     * Start drawing the map-engine again - only if it's running
     * A no-op if it's not hidden
     * @memberof MapEngine
     */
    show()
    {
        if (this.started === true)
        {
            if (this.hidden === true)
            {
                this.render = Dispatch.onRender(()=>this.MEngine.render());
                this.hidden = false;
            }
        }
        else
        {
            throw new Error("Attempt to show the map-engine when it is not running or is not hidden.");
        }
    }

    /**
     * Stop drawing a specific layer of the map
     * Can only call this when the map-engine is running
     * 
     * @param {number} [number=0]
     * @memberof MapEngine
     */
    hideLayer(number=0)
    {
        if (this.started === true)
        {
            this.MEngine.map.layers[number].visible = false;
        }
        else
        {
            throw new Error("Attempt to hide a layer in the map when the map-engine is not running.");
        }
    }

    /**
     * Start drawing a specific layer of the map
     * Can only call this when the map-engine is running
     * Note - if the map has not first been hidden with hideLayer this is a no-op
     * 
     * @param {number} [number=0]
     * @memberof MapEngine
     */
    showLayer(number=0)
    {
        if (this.started === true)
        {
            this.MEngine.map.layers[number].visible = true;
        }
        else
        {
            throw new Error("Attempt to show a layer in the map when the map-engine is not running.");
        }
    }

    /**
     * Stop the map-engine
     * - Note after using this you would need to start() again
     * - Note this method isn't entirely finished - it disposes of the map but not the entities
     * - This means if you follow it with start() you will keep any entities created with createCharacter
     * (though it will correctly dispose of map specific entities)
     * 
     * @memberof MapEngine
     */
    stop()
    {
        if (this.started === true)
        {
            if (this.paused === false)
            {
                this.update.cancel();
            }
            if (this.hidden === false)
            {
                this.render.cancel();
            }
            this.blockInput = true;
            this.MEngine.map = null;//let the map get GC'd
            //#FIX ME enable GC'ing SEngine data here to
        }
        else
        {
            throw new Error("Attempt to stop the map-engine when it is not running.");
        }
    }
}

/**@typedef {object} camera
 * @property {number} x
 * @property {number} y
 * @property {number} [zoom]
 * @property {number} [layer]
 */

