/* File: CEngine.mjs
 * Author: Rhuan
 * Date: 27/10/2017
 * Collision System for miniSphere game engine
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

//@ts-check
/*

CEngine is designed to:
- handle collision between polygons of any shape
- be as efficient as possible
- integrate seemlessly with the Dispatch API
- integrate seemlessly with SEngine and MEngine BUT also work alone
- doesn't really work alone at the moment #FinishMe
*/

/**
 * CEngine handles collisions between objects in 2d space
 * currently handles SEngine sprites and MEngine tiles,
 * triggers, zones and map edges
 *
 * @export
 * @class CEngine
 */
export default class CEngine
{
    /**
     * Creates an instance of CEngine.
     * 
     * cType = collision type 0 = tiles, 1 = polys
     * 
     * currently only type 1 works
     * 
     * @param {number} cType 
     * @memberof CEngine
     */
    constructor(cType=1)
    {
        this.SEngine    = null;
        this.MEngine    = null;
        this.cType      = cType;
        this.tFract     = 0.1;
    }

    /**
     * Function for colliding an entity from SEngine with other entities and Map Obstructions
     * Returns an array of all found collisions
     * 
     * #needs better documentation
     * 
     * @param {number} ref 
     * @param {number} layer 
     * @param {number} x 
     * @param {number} y 
     * @param {number} [d_x=0] 
     * @param {number} [d_y=0] 
     * @param {polygon[]} polygons 
     * @returns {collision[]} collisions
     * @memberof CEngine
     */
    collide(ref, layer, x, y, d_x=0, d_y=0, polygons)
    {
        let i = 0, j = 0, k = 0, l = 0;
        const collisions = [];
        const tFract = this.tFract;
        let s_x = 0, s_y = 0, l_x = 0, l_y = 0, t_x = 0, t_y = 0, n_x = 0, n_y = 0;
        let m = 0, n = 0;
        const map = this.MEngine.map;
        const tile_map = map.layers[layer].tileMap;
        const triggers = map.layers[layer].triggers;
        const zones = map.layers[layer].zones;
        const zonesLength = zones.length;
        const maxCoord = this.SEngine.table[layer].length;
        const tile_x = Math.floor(x * tFract);
        const tile_y = Math.floor(y * tFract);
        const polyLength = polygons.length;

        let c1 = 0, c2 = 0, c3 = 0;
        switch (this.cType)
        {//#FIX ME 1 currently does nothing of any use without SEngine
        //#FIX ME 2 mode 0 is useless at the moment
        case 0:
            if (tile_x + d_x >= 0 && tile_y >= 0)
            {
                c1 = this.SEngine.table[layer][tile_x + d_x][tile_y];
                if (c1 > 0 && c1 !== ref)
                {
                    collisions.push(new Collision(spriteCollision, c1 - 1));
                }
            }
            if (tile_x >= 0 && tile_y + d_y >= 0)
            {
                c2 = this.SEngine.table[layer][tile_x][tile_y + d_y];
                if (c2 > 0 && c2 !== ref)
                {
                    collisions.push(new Collision(spriteCollision, c2 - 1));
                }
            }
            if (tile_x + d_x >= 0 && tile_y + d_y >= 0)
            {
                c3 = this.SEngine.table[layer][tile_x + d_x][tile_y + d_y];
                if (c3 > 0 && c3 !== ref)
                {
                    collisions.push(new Collision(spriteCollision, c3 - 1));
                }
            }
            if (typeof this.MEngine === "object")
            {
                if (tile_x + d_x >= 0 && tile_y >= 0)
                {
                    c1 = this.MEngine.map.layers[layer].obs[tile_x + d_x][tile_y];
                    if (c1 === 0)
                    {
                        collisions.push(new Collision(tileCollision, c1));
                    }
                }
                if (tile_x >= 0 && tile_y + d_y >= 0)
                {
                    c2 = this.MEngine.map.layers[layer].obs[tile_x][tile_y  + d_y];
                    if (c2 === 0)
                    {
                        collisions.push(new Collision(tileCollision, c2));
                    }
                }
                if (tile_x + d_x >= 0 && tile_y + d_y >= 0)
                {
                    c3 = this.MEngine.map.layers[layer].obs[tile_x + d_x][tile_y + d_y];
                    if (c3 === 0)
                    {
                        collisions.push(new Collision(tileCollision, c3));
                    }
                }
            }
            break;
        case 1:
            for (l = 0; l < polyLength; ++ l)
            {//OPTIMISE ME this could be more efficient
                if (polygons[l].type === 0)
                {
                    s_x = polygons[l].x - polygons[l].w + d_x;
                    l_x = polygons[l].w * 2;
                    s_y = polygons[l].y - polygons[l].w + d_y;
                    l_y = l_x;
                }
                else if (polygons[l].type === 1)
                {
                    s_x = polygons[l].x + d_x;
                    l_x = polygons[l].w;
                    s_y = polygons[l].y + d_y;
                    l_y = polygons[l].h;
                }
                else
                {
                    throw new CEngineError("unknown polygon type given for colision, valid types are 0 and 1, " + polygons[l].type + " was supplied.");
                }

                t_x = Math.max(Math.floor(s_x * tFract) - 1, 0);
                t_y = Math.max(Math.floor(s_y * tFract) - 1, 0);
                n_x = Math.min(Math.ceil((s_x + l_x) * tFract) + 1, maxCoord);
                n_y = Math.min(Math.ceil((s_y + l_y) * tFract) + 1, maxCoord);

                for (j = t_x; j < n_x; ++j)
                {
                    for (k = t_y; k < n_y; ++ k)
                    {
                        const cache = this.SEngine.table[layer][j][k];
                        for (m = 0; m < cache.end; ++m)
                        {
                            if (cache.list[m] !== ref)
                            {
                                for (n = 0; n < this.SEngine.entities[cache.list[m]].poly.length; ++n)
                                {
                                    if (CEngine.polysCollide(d_x, d_y, polygons[l], this.SEngine.entities[cache.list[m]].poly[n]))
                                    {
                                        collisions.push(new Collision(spriteCollision, cache.list[m]));
                                    }
                                }
                            }
                        }
                    }
                }
                if (typeof this.MEngine === "object")
                {//#OPTIMISE ME, tile collisions could be more efficient than this
                    t_x = Math.max(Math.floor(s_x * map.fract_w), 0);
                    t_y = Math.max(Math.floor(s_y * map.fract_h), 0);
                    n_x = Math.min(Math.floor((s_x + l_x) * map.fract_w), tile_map[0].length - 1);
                    n_y = Math.min(Math.floor((s_y + l_y) * map.fract_h), tile_map.length - 1);

                    const polyToCollide = {
                        type : polygons[l].type,
                        x    : polygons[l].x + d_x,
                        y    : polygons[l].y + d_y,
                        w    : polygons[l].w,
                        h    : polygons[l].h
                    };

                    let tX = t_x * map.tile_w;

                    for (i = t_x; i <= n_x; ++i)
                    {
                        let tY = t_y * map.tile_h;
                        for (j = t_y; j <= n_y; ++j)
                        {
                            const tileObs = map.tiles[tile_map[j][i]].obs;

                            for (k = 0; k < tileObs.length; ++k)
                            {
                                if (CEngine.polysCollide(tX, tY, tileObs[k], polyToCollide))
                                {
                                    collisions.push(new Collision(tileCollision, tile_map[j][i]));
                                }
                            }
                            tY += map.tile_h;
                        }
                        tX += map.tile_w;
                    }
                }
                if (triggers.length > 0)
                {
                    const width = tile_map[0].length;
                    const offset = t_x + t_y * width;
                    const xCount = n_x - t_x;
                    const yCount = n_y - t_y;
                    const last   = 1 + offset + xCount + yCount * width;
                    const length = triggers.length;
                    const cutoff = n_x;

                    i = findFirst(triggers, offset);
                    if (i < length)
                    {
                        const triggerScripts = this.MEngine.map.triggerScripts;
                        let xOffset = triggers[i].x;
                        for (; i < length; ++i, ++xOffset)
                        {
                            if (triggers[i].index < last)
                            {
                                if (xOffset === width)
                                {
                                    xOffset = 0;
                                }
                                if (xOffset >= t_x && xOffset <= cutoff)
                                {
                                    if (triggerScripts.hasOwnProperty(triggers[i].name))
                                    {
                                        collisions.push(new Collision(triggerCollision, triggers[i].id, triggerScripts[triggers[i].name]));
                                    }
                                    else
                                    {
                                        collisions.push(new Collision(triggerCollision, triggers[i].id, placeHolder(triggers[i].name, "TRIGGER")));
                                    }
                                }
                            }
                            else
                            {
                                i = length;
                            }
                        }
                    }
                }
                for (i = 0; i < zonesLength; ++i)
                {
                    if (CEngine.polysCollide(d_x, d_y, polygons[l], zones[i].poly))
                    {
                        const zoneScripts = this.MEngine.map.zoneScripts;
                        if (zoneScripts.hasOwnProperty(zones[i].name))
                        {
                            collisions.push(new Collision(zoneCollision, zones[i].name, zoneScripts[zones[i].name]));
                        }
                        else
                        {
                            collisions.push(new Collision(zoneCollision, zones[i].name, placeHolder(zones[i].name, "ZONE")));
                        }
                    }
                }
                if (this.SEngine.entities[ref].attached === true)
                {
                    map.leaving = true;
                    map.player = this.SEngine.entities[ref];
                    if (s_x < 0)
                    {
                        map.dir = 0;
                    }
                    else if (s_x + l_x > map.width)
                    {
                        map.dir = 1;
                    }
                    else if (s_y < 0)
                    {
                        map.dir = 2;
                    }
                    else if (s_y + l_y > map.height)
                    {
                        map.dir = 3;
                    }
                    else
                    {
                        map.leaving = false;
                    }
                }

            }
            break;
        case 2:
            throw new CEngineError("unknown cType, expected 0 or 1, " + this.cType + " was supplied");
        }
        return collisions;
    }

    /**
     * Static method for colliding two polys
     * the first poly is translated by x, y before the comparison
     * 
     * Supports rectangles and circles only
     * 
     * @static
     * @param {number} [x=0] 
     * @param {number} [y=0] 
     * @param {polygon} _one 
     * @param {polygon} two 
     * @returns {boolean} collided
     * @memberof CEngine
     */
    static polysCollide(x=0, y=0, _one, two)
    {
        let result = false;
        const one = {
            x    : _one.x + x,
            y    : _one.y + y,
            type : _one.type,
            w    : _one.w,
            h    : _one.h};
        if (one.type === 0)
        {
            if (two.type === 0)
            {//circle with circle
                result = (one.x - two.x) * (one.x - two.x) + (one.y - two.y) * (one.y - two.y) <= (one.w + two.w) * (one.w + two.w);
            }
            else if (two.type === 1)
            {//circle with rect
                let x_d = one.x - two.x - two.w / 2;
                x_d = x_d < 0 ? -x_d : x_d;
                let y_d = one.y - two.y - two.h / 2;
                y_d = y_d < 0 ? -y_d : y_d;
                if (x_d > two.w / 2 + one.w || y_d > two.h / 2 + one.w)
                {//distance between centres > radius + half width or height of square
                    result = false;
                }
                else
                {
                    if (x_d <= two.w/2 || y_d <= two.h / 2)
                    {//distance between centres < half width or height of square (combined with check above)
                        result = true;
                    }
                    else
                    {//final check pythag
                        x_d = x_d - two.w / 2;
                        y_d = y_d - two.h / 2;
                        result = x_d * x_d + y_d * y_d <= one.w * one.w;
                    }
                }
            }
            else
            {
                throw new CEngineError ("Unknown polygon type given to collision engine, valid types are 0 or 1, supplied type was " + two.type);
            }
        }
        else if (one.type === 1)
        {
            if (two.type === 0)
            {//circle with rect
                let x_d = two.x - one.x - one.w /2;
                x_d = x_d < 0 ? -x_d : x_d;
                let y_d = two.y - one.y - one.h /2;
                y_d = y_d < 0 ? -y_d : y_d;
                if (x_d > one.w / 2 + two.w || y_d > one.h / 2 + two.w)
                {//distance between centres > radius + half width or height of square
                    result = false;
                }
                else
                {
                    if (x_d <= one.w/2 || y_d <= one.h/2)
                    {//distance between centres < half width or height of square (combined with check above)
                        result = true;
                    }
                    else
                    {//final check pythag
                        x_d = x_d - one.w/2;
                        y_d = y_d - one.h/2;
                        result = x_d * x_d + y_d * y_d <= two.w * two.w;
                    }
                }
            }
            else if (two.type === 1)
            {//rect with rect
                result = one.x <= two.x + two.w &&
                         one.x + one.w >= two.x &&
                         one.y <= two.y + two.h &&
                         one.y + one.h >= two.y;
            }
            else
            {
                throw new CEngineError ("Unknown polygon type given to collision engine, valid types are 0 or 1, supplied type was " + two.type);
            }
        }
        else
        {
            throw new CEngineError ("Unknown polygon type given to collision engine, valid types are 0 or 1, supplied type was " + one.type);
        }
        return result;
    }
}


//#FIX ME make collision returns consistent
//this needs more thought # FINISH ME

//define collision types
const spriteCollision = 0;
const tileCollision = 1;
const triggerCollision = 2;
const zoneCollision = 3;
//add more here

/**
 * Simple binary chop function - searches through an ordered array of objects
 * looks for the first item with index property greater than or equal to specified value
 * @param {{index: number}[]} array
 * @param {number} target
 * @returns {number}
 */
function findFirst(array, target)
{
    let result = 0;
    const len = array.length;
    for (let min = 0, max = len - 1; max - min > 1; result = min + (max - min >> 1))
    {
        if (array[result].index < target)
        {
            min = result + 1;
        }
        else
        {
            max = result - 1;
        }
    }
    if (result >= 0)
    {
        while (result < len && array[result].index < target)
        {
            result = result + 1;
        }
    }
    else
    {
        result = 0;
    }
    return result;
}

// should we output debug information to a terminal? detect if we're running in spheRun
// SSj.now() returns 0 when in miniSphere
const terminal = SSj.now() > 0 ? true : false;

/**
 * Function that returns placeholder methods for zone/trigger collisions
 * Used when mapScript is missing the relevant zone or trigger
 * @param {string} name
 * @param {string} type
 * @returns {{onPlayer : function(): void, onOther : function(): void}}
 */
function placeHolder(name, type)
{
    if (terminal)
    {
        const player = `${type} - ${name}: activated by player but no script exists for it`;
        const other = `${type} - ${name}: activated by other but no script exists for it`;
        return {
            onPlayer : () => { SSj.log(player); },
            onOther  : () => { SSj.log(other); }
        };
    }
    else
    {
        return {
            onPlayer : function()  { },
            onOther  : function()  { }
        };
    }
}

/**@typedef {Object} polygon
 * @property {number} x
 * @property {number} y
 * @property {number} w - for a circle this is the radius
 * @property {number} h - unused for circles
 * @property {number} type - 0 = circle, 1 = rectangle
*/

/**@typedef {Object} collision  
 * @property {number} type
 * @property {string|number} ref
 * @property {object} scripts
*/

const emptyScripts = {};

//#ENHANCE ME - should this record above/below etc? if yes need to implement above
/**
 * 
 *
 * @param {number} type
 * @param {string|number} ref
 * @param {any} [scripts={}]
 * @returns {void}
 */
function Collision(type, ref, scripts=emptyScripts)//ES5 style intentionally (performance issue)
{
    this.type      = type;
    this.ref       = ref;
    this.scripts   = scripts;
}

class CEngineError extends Error
{
    constructor(message)
    {
        super("CEngine Error: " + message);
    }
}
