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


/*

CEngine is designed to:
- handle collision between polygons of any shape
- be as efficient as possible
- integrate seemlessly with the Dispatch API
- integrate seemlessly with SEngine and MEngine BUT also work alone
*/



//primary class for external use
export class CEngine
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
		this.tSize      = 0;
	}
	static error(description)
	{
		throw new Error("CEngine error: " + description);
	}

	/**
	 * Function for colliding an entity from SEngine with other entities and Map Obstructions
	 * Returns an array of all found collisions
	 * 
	 * #needs better documentation
	 * 
	 * @param {any} ref 
	 * @param {any} layer 
	 * @param {any} x 
	 * @param {any} y 
	 * @param {number} [d_x=0] 
	 * @param {number} [d_y=0] 
	 * @param {any} polygons 
	 * @returns 
	 * @memberof CEngine
	 */
	collide(ref, layer, x, y, d_x=0, d_y=0, polygons)
	{
		var i = 0, j = 0, k = 0, l = 0;
		var collisions = [];
		let tile_size = this.tSize;
		var s_x = 0, s_y = 0, l_x = 0, l_y = 0, t_x = 0, t_y = 0, n_x = 0, n_y = 0;
		var m = 0, n = 0;
		var map = this.MEngine.map;
		var tile_map = map.layers[layer].tileMap;
		let triggers = map.layers[layer].triggers;
		let maxCoord = this.SEngine.table[layer].length;
		var tile_x = Math.floor(x/tile_size);
		var tile_y = Math.floor(y/tile_size);

		var c1 = 0, c2 = 0, c3 = 0;
		switch(this.cType)
		{//#FIX ME 1 currently does nothing of any use without SEngine
		//#FIX ME 2 mode 0 is useless at the moment
		case(0):
			if(tile_x + d_x >= 0 && tile_y >= 0)
			{
				c1 = this.SEngine.table[layer][tile_x + d_x][tile_y];
				if(c1 > 0 && c1 !== ref)
				{
					collisions.push(new Collision(spriteCollision, c1 - 1));
				}
			}
			if(tile_x >= 0 && tile_y + d_y >= 0)
			{
				c2 = this.SEngine.table[layer][tile_x][tile_y + d_y];
				if(c2 > 0 && c2 !== ref)
				{
					collisions.push(new Collision(spriteCollision, c2 - 1));
				}
			}
			if(tile_x + d_x >= 0 && tile_y + d_y >= 0)
			{
				c3 = this.SEngine.table[layer][tile_x + d_x][tile_y + d_y];
				if(c3 > 0 && c3 !== ref)
				{
					collisions.push(new Collision(spriteCollision, c3 - 1));
				}
			}
			if(typeof this.MEngine === "object")
			{
				if(tile_x + d_x >= 0 && tile_y >= 0)
				{
					c1 = this.MEngine.map.layers[layer].obs[tile_x + d_x][tile_y];
					if(c1 === 0)
					{
						collisions.push(new Collision(tileCollision, c1));
					}
				}
				if(tile_x >= 0 && tile_y + d_y >= 0)
				{
					c2 = this.MEngine.map.layers[layer].obs[tile_x][tile_y  + d_y];
					if(c2 === 0)
					{
						collisions.push(new Collision(tileCollision, c2));
					}
				}
				if(tile_x + d_x >= 0 && tile_y + d_y >= 0)
				{
					c3 = this.MEngine.map.layers[layer].obs[tile_x + d_x][tile_y + d_y];
					if(c3 === 0)
					{
						collisions.push(new Collision(tileCollision, c3));
					}
				}
			}
			break;
		case(1):
			for (l = 0; l < polygons.length; ++ l)
			{
				if(polygons[l].type === 0)
				{
					s_x = polygons[l].x - polygons[l].w + d_x;
					l_x = polygons[l].w * 2;
					s_y = polygons[l].y - polygons[l].w + d_y;
					l_y = l_x;
				}
				else if(polygons[l].type === 1)
				{
					s_x = polygons[l].x + d_x;
					l_x = polygons[l].w;
					s_y = polygons[l].y + d_y;
					l_y = polygons[l].h;
				}
				else
				{
					CEngine.error("unknown polygon type given for colision, valid types are 0 and 1, " + polygons[l].type + " was supplied.");
				}

				t_x = Math.max(Math.floor(s_x / tile_size) - 1, 0);
				t_y = Math.max(Math.floor(s_y / tile_size) - 1, 0);
				n_x = Math.min(Math.ceil((s_x + l_x) / tile_size) + 1, maxCoord);
				n_y = Math.min(Math.ceil((s_y + l_y) / tile_size) + 1, maxCoord);

				for(j = t_x; j < n_x; ++j)
				{
					for (k = t_y; k < n_y; ++ k)
					{
						let cache = this.SEngine.table[layer][j][k];
						for(m = 0; m < cache.end; ++m)
						{
							if(cache.list[m] !== ref)
							{
								for(n = 0; n < this.SEngine.entities[cache.list[m]].poly.length; ++n)
								{
									if(CEngine.polysCollide(d_x, d_y, polygons[l], this.SEngine.entities[cache.list[m]].poly[n]))
									{
										collisions.push(new Collision(spriteCollision, cache.list[m]));
									}
								}
							}
						}
					}
				}
				if(typeof this.MEngine === "object")
				{//#RE-FACTOR ME, tile collisions could be more efficient than this
					t_x = Math.max(Math.floor(s_x / map.tile_w),0);
					t_y = Math.max(Math.floor(s_y / map.tile_h),0);
					n_x = Math.min(Math.floor((s_x + l_x) / map.tile_w), tile_map[0].length);
					n_y = Math.min(Math.floor((s_y + l_y) / map.tile_h), tile_map.length);

					let polyToCollide = {
						type : polygons[l].type,
						x : polygons[l].x + d_x,
						y : polygons[l].y + d_y,
						w : polygons[l].w,
						h : polygons[l].h
					};

					let tX = t_x * map.tile_w;

					for(i = t_x; i <= n_x; ++i)
					{
						let tY = t_y * map.tile_h;
						for(j = t_y; j <= n_y; ++j)
						{
							let tileObs = map.tiles[tile_map[j][i]].obs;
							
							for(k = 0; k < tileObs.length; ++k)
							{
								if(CEngine.polysCollide(tX, tY, tileObs[k], polyToCollide))
								{
									collisions.push(new Collision(tileCollision, tile_map[j][i]));
								}
							}
							tY += map.tile_h;
						}
						tX += map.tile_w;
					}
				}
				if(triggers.length > 0)
				{
					let width = tile_map[0].length;
					let offset = t_x + t_y * width;
					let xCount = n_x - t_x;
					let yCount = n_y - t_y;
					let last   = 1 + offset + xCount + yCount * width;
					let length = triggers.length;
					let cutoff = n_x;

					for(i = 0; i < length && triggers[i].index < offset; ++i);
					if(i < length)
					{
						let xOffset = triggers[i].index % width;
						for(; i < length; ++i, ++xOffset)
						{
							if(triggers[i].index < last )
							{						
								if(xOffset === width)
								{
									xOffset = 0;
								}
								if(xOffset >= t_x && xOffset <= cutoff)
								{
									collisions.push(new Collision(triggerCollision, triggers[i].id, this.MEngine.map.triggerScripts[triggers[i].name]));
								}
							}
							else
							{
								i = length;
							}
						}
					}
				}
			}
			break;
		case(2):
			CEngine.error("unknown cType, expected 0 or 1, " + this.cType + " was supplied");
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
	 * @param {any} _one 
	 * @param {any} two 
	 * @returns 
	 * @memberof CEngine
	 */
	static polysCollide(x=0, y=0, _one, two)
	{
		let result = false;
		let one = {x: _one.x + x, y:_one.y + y, type: _one.type, w:_one.w, h:_one.h};
		if(one.type === 0)
		{
			if(two.type === 0)
			{//circle with circle
				result = (((one.x - two.x) * (one.x - two.x) + (one.y - two.y) * (one.y - two.y)) <= ((one.w + two.w) * (one.w + two.w)));
			}
			else if(two.type === 1)
			{//circle with rect
				let x_d = one.x - two.x - two.w /2;
				x_d = x_d < 0 ? -x_d : x_d;
				let y_d = one.y - two.y - two.h /2;
				y_d = y_d < 0 ? -y_d : y_d;
				if((x_d > (two.w/2 + one.w)) || (y_d > (two.h/2 + one.w)))
				{//distance between centres > radius + half width or height of square
					result = false;
				}
				else
				{
					if(x_d <= two.w/2 || y_d <= two.h/2)
					{//distance between centres < half width or height of square (combined with check above)
						result = true;
					}
					else
					{//final check pythag
						x_d = x_d - two.w/2;
						y_d = y_d - two.h/2;
						result = ((x_d * x_d + y_d * y_d) <= one.w * one.w);
					}
				}
			}
			else
			{
				CEngine.error ("Unknown polygon type given to collision engine, valid types are 0 or 1, supplied type was " + two.type);
			}
		}
		else if(one.type === 1)
		{
			if(two.type === 0)
			{//circle with rect
				let x_d = two.x - one.x - one.w /2;
				x_d = x_d < 0 ? -x_d : x_d;
				let y_d = two.y - one.y - one.h /2;
				y_d = y_d < 0 ? -y_d : y_d;
				if((x_d > (one.w/2 + two.w)) || (y_d > (one.h/2 + two.w)))
				{//distance between centres > radius + half width or height of square
					result = false;
				}
				else
				{
					if(x_d <= one.w/2 || y_d <= one.h/2)
					{//distance between centres < half width or height of square (combined with check above)
						result = true;
					}
					else
					{//final check pythag
						x_d = x_d - one.w/2;
						y_d = y_d - one.h/2;
						result = ((x_d * x_d + y_d * y_d) <= two.w * two.w);
					}
				}
			}
			else if(two.type === 1)
			{//rect with rect
				result = (
					(one.x <= (two.x + two.w)) &&
					((one.x + one.w) >= two.x) &&
					(one.y <= (two.y + two.h)) &&
					((one.y + one.h) >= two.y));
			}
			else
			{
				CEngine.error ("Unknown polygon type given to collision engine, valid types are 0 or 1, supplied type was " + two.type);
			}
		}
		else
		{
			CEngine.error ("Unknown polygon type given to collision engine, valid types are 0 or 1, supplied type was " + one.type);
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
//add more here


//#ENHANCE ME - should this record above/below etc? if yes need to implement above
class Collision
{
	constructor(type, ref, scripts={})
	{
		this.type      = type;
		this.ref       = ref;
		this.scripts   = scripts;
	}
}




//Everything below here is incomplete/not yet usable


//add type, source and polygon

/* polygon format
    type: 0 = circle, 1 = rect
    x, y = coords of top left for rects centre for circles
    w = width of rect, radius of circle
    h = height of rect, 0 for circles*/

//sort polygons into segments to optimise collision performance
//this is an idea that is not currently used
/*CEngine.prototype.sortPolys = function(width, height, segment_width, segment_height, layers)
{
  this.segments = new Array(layers);
  var polygons;

  for(var i = 0, j = 0, k = 0, l = 0; i < layers; ++ i)
  {
    this.segments[i] = new Array(1 + (segment_width / width)|0);
    for(j = 0; j < this.segments[i].length; ++ j)
    {
      this.segments[i][j] = new Array(1 + (segument_height / height)|0);
      for(k = 0; k < this.segments[i][j].length; ++ k)
      {
        this.segments[i][j][k] = new Segment(width * j, height * k, width, height, this.max_length);
        polygons = this.collide("n/a", i, 0, 0, 0, 0, 0, [this.segments[i][j][k]]);
        for(l = 0; l < polygons.length; ++l)
        {//master array with tiered referencing? adjust collision object so we can use that?
          this.segments[i][j][k].polygons[l]  = polygons[l];
        }
      }
    }
  }
}

function Segment(x, y, w, h, max_length)
{//subdivide this - map_polys - entity_polys - other_polys
	this.x        = x;
	this.y        = y;
	this.x2       = x + w;
	this.y2       = y + h;
	this.polygons = new Array(max_length);
	this.length   = 0;

	//these extra properties let us use the Segment as a Poly
	this.type = 1;
	this.w    = w;
	this.h    = h;
}
*/
/*
var heap = new ArrayBuffer(0x10000);
var stdlib = { Math: Math, Int32Array : Int32Array};
var lib = new asmJS(stdlib, null, heap);

function asmJS(stdlib, foreign, heap)
{
	"use asm";
	var access = new stdlib.Int32Array(heap);
	var imul = stdlib.Math.imul;
	var fround = stdlib.Math.fround;
	var sqrt = stdlib.Math.sqrt;
	var oneLength = 0;
	var twoLength = 0;
	var offset = 0;
	var safeOffset = 0;
	
	function seperatingAxisTheorem(one, two)
	{
		one = one|0;
		two = two|0;

		oneLength = one|0;
		twoLength = two|0;
		safeOffset = (imul((one + two)|0,2) + 1)|0;



	}




	
	function norm_p_y (shape, vertex)
	{
		shape = shape|0;
		vertex = vertex|0;

		var temp_x = 0;
		var temp_y = 0;

		temp_x = perpX(shape, vertex)|0;
		temp_y = perpY(shape, vertex)|0;
		
		return fround((temp_y|0) / sqrt(fround((imul(temp_x, temp_x) + imul(temp_y, temp_y))|0)));
	}

	function norm_p_x (shape, vertex)
	{
		shape = shape|0;
		vertex = vertex|0;

		var temp_x = 0;
		var temp_y = 0;

		temp_x = perpX(shape, vertex)|0;
		temp_y = perpY(shape, vertex)|0;
		
		return fround((temp_x|0) / sqrt(fround((imul(temp_x, temp_x) + imul(temp_y, temp_y))|0)));
	}

	function norm_x (shape, vertex)
	{
		shape = shape|0;
		vertex = vertex|0;

		var temp_x = 0;
		var temp_y = 0;

		temp_x = x(shape, vertex)|0;
		temp_y = y(shape, vertex)|0;
		
		return fround((temp_x|0) / sqrt(fround((imul(temp_x, temp_x) + imul(temp_y, temp_y))|0)));
	}

	function norm_y (shape, vertex)
	{
		shape = shape|0;
		vertex = vertex|0;

		var temp_x = 0;
		var temp_y = 0;

		temp_x = x(shape, vertex)|0;
		temp_y = y(shape, vertex)|0;
		
		return fround((temp_y|0) / sqrt(fround((imul(temp_x, temp_x) + imul(temp_y, temp_y))|0)));
	}

	function x (shape, vertex)
	{
		shape = shape|0;
		vertex = vertex|0;
		if (shape == 1)
		{
			offset = imul(vertex, 2);
		}
		else
		{
			offset = imul(vertex + oneLength, 2);
		}
		return access[offset] |0;
	}

	function y (shape, vertex)
	{
		shape = shape|0;
		vertex = vertex|0;
		if (shape == 1)
		{
			offset = imul(vertex, 2);
		}
		else
		{
			offset = imul(vertex + oneLength, 2);
		}
		return access[offset+1] |0;
	}

	function perpX (shape, vertex)
	{
		shape = shape|0;
		vertex = vertex|0;
		if (shape == 1)
		{
			offset = imul(vertex, 2);
		}
		else
		{
			offset = imul(vertex + oneLength, 2);
		}
		return access[offset+1] |0;
	}

	function perpY (shape, vertex)
	{
		shape = shape|0;
		vertex = vertex|0;
		if (shape == 1)
		{
			offset = imul(vertex, 2);
		}
		else
		{
			offset = imul(vertex + oneLength, 2);
		}
		return -access[offset] |0;
	}

	function dot(shape1, vertex1, shape2, vertex2)
	{
		shape1  = shape1|0;
		vertex1 = vertex1|0;
		shape2  = shape2|0;
		vertex2 = vertex2|0;
		return imul(x(shape1, vertex1), x(shape2, vertex2)) + imul(y(shape1, vertex1), y(shape2, vertex2));
	}

	return {seperatingAxisTheorem : seperatingAxisTheorem};
}*/