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

//Import the components of the map-engine
import MEngine from "./MEngine";//core map-engine
import SEngine, {loadSES} from "./SEngine";//Sprite/Entity handling and function for loading a sprite
import CEngine from "./CEngine";//collision handling

//Note there are additional dependencies imported through tha above files:
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
        this._camera = null;
    }

    /**
     * set the path for map scripts
     * note expected to be relative to map files
     * 
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
     * 
     * @memberof MapEngine
     */
    get mapScriptsPath ()
    {
        return this.MEngine.scriptsPath;
    }

    /**
     * createCharacter(name, spriteSet, x=0, y=0, layer=0)
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

    takeInput()
    {
        this.SEngine.input.takeInput();
    }

    yieldInput()
    {
        this.SEngine.input.yieldInput();
    }

    /**
     * attachInput(character)
     * Add default input (4 directional arrows + talk key) to provided character
     * the parameter should be the character object, not their name
     * 
     * @param {object} character 
     */
    attachInput(character)
    {
        this.SEngine.addDefaultInput(character);
    }

    /**
     * addInput(key, onPress, continuous=false, parameter=null, onRelease)
     * Add another input of some kind to be monitored whilst the map is running
     * Only first two parameters are required, the other 3 are optional
     * 
     * @param {number} key - key to check for
     * @param {function} onPress - function to call when it's pressed
     * @param {boolean} [continuous=false] - allow continuous input - function can trigger every frame
     *                                       or false to only call the function once for each press
     * @param {any} [parameter=null] - parameter to pass to the function, e.g. a person object
     * @param {function} onRelease - function to call when the key is released
     * @returns - the number of inputs added in total (will be one higher each time this is called)
     * @memberof MapEngine
     */
    addInput(key, onPress, continuous = false, parameter = null, onRelease = function(){})
    {
        return this.SEngine.addInput(key, continuous, parameter, onPress, onRelease);
    }


    /**
     * getEntity(id)
     * Return the entity object that has the given name
     * Throws an error if there is no entity with that name
     * 
     * @param {string} name 
     * @returns {object} Entity
     */
    getEntity(name)
    {
        return this.SEngine.getEntity(name);
    }

    /**
     * Readonly property, true if all entities on the map have empty movement queues
     * false if any entity is doing anything
     * 
     * @returns {boolean} idle
     * @readonly 
     */
    get idle()
    {
        return this.SEngine.idle;
    }


    /**
     * start(firstMap, cameraObject = {x: 0, y: 0, zoom: 1})
     * Start the map engine - note this is an async function
     * Note: to centre the map on a character supply that character's object as the second parameter
     * 
     * @param {string} firstMap //name of mapFile to use as first map ".mem" format
     * @param {any} [cameraObject={x: 0, y: 0, zoom: 1}] //object with x and y (and optionally zoom properties) where to focus the camera on the map
     */
    async start(firstMap, cameraObject = {x : 0, y : 0, zoom : 1})
    {
        this._camera = cameraObject;
        if (!this._camera.zoom)//if this supplied camera object doesn't have a zoom property give it one
        {
            this._camera.zoom = 1;
        }
        await this.MEngine.setMap(firstMap);

        this.update = Dispatch.onUpdate(()=>
        {
            this.MEngine.update(this._camera.x, this._camera.y, this._camera.zoom);
        });
        this.render = Dispatch.onRender(()=>this.MEngine.render());
        this.started = true;
        this.takeInput();
    }

    /**
     * changeMap(newMap)
     * Change map - note this is an async function
     * 
     * @returns {Promise<boolean>} set - was the map set
     * @param {string} newMap name of mapFile to change to ".mem" format
     */
    async changeMap(newMap)
    {
        if (this.started === true)
        {
            return this.MEngine.setMap(newMap);
        }
        else
        {
            throw new Error("Attempt to change map when the map-engine is not running.");
        }
    }

    /**
     * camera
     * Supply a new camera object
     * use as mapEngine.camera = newCameraObject;
     * @param {any} cameraObject 
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
     * pause()
     * Pause the map engine - only if it's running
     * A no-op if the map engine is already paused
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
     * resume()
     * Resume the map engine - ONLY if it's running
     * A no-op if the map engine is not paused
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
                this.takeInput();
            }
        }
        else
        {
            throw new Error("Attempt to resume the map-engine when it is not running or is not paused.");
        }
    }

    /**
     * hide()
     * hide the map-engine (stop drawing it) - only if it's running
     * Note this doesn't stop updating
     * This is a no-op if it's already hidden
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
     * show()
     * start drawing the map-engine again - only if it's running
     * A no-op if it's not hidden
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
     * hideLayer(number=0)
     * Stop drawing a specific layer of the map
     * Can only call this when the map-engine is running
     * 
     * @param {number} [number=0] 
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
     * showLayer(number=0)
     * Start drawing a specific layer of the map
     * Can only call this when the map-engine is running
     * Note - if the map has not first been hidden with hideLayer this is a no-op
     * 
     * @param {number} [number=0] 
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
     *stop() 
     * Stop the map-engine
     * Note after using this you would need to start() again
     * Note this method isn't entirely finished - it disposes of the map but not the entities
     * This means if you follow it with start() you will keep any entities created with createCharacter
     * (though it will correctly dispose of map specific entities)
     * 
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
            this.yieldInput();
            this.MEngine.map = null;//let the map get GC'd
            //#FIX ME enable GC'ing SEngine data here to
        }
        else
        {
            throw new Error("Attempt to stop the map-engine when it is not running.");
        }
    }
}



