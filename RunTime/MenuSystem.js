/* File: MenuSystem.mjs
 * Author: Rhuan
 * Date: 27/10/2017
 * Example Menu Syste, for miniSphere game engine
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

//This is very much a work in progress, async menu system

/*To do:
1. Add support for different styles of menu
2. Test menus with windows and other graphical features
3. Add intuitive support for child menus*/

//Dependencies you may need to update the paths
//HUDSystem for drawing the menu
import HUDSystem from "./HUDSystem";
//input system for input
import Input from "./input";

/**
 * Currently one MenuSystem instance = one menu
 * 
 * Future plan is to have submenus etc within one instance - not yet supported
 * 
 * @export
 * @class MenuSystem
 * @extends {HUDSystem}
 */
export class MenuSystem extends HUDSystem
{
    /**
     * Creates an instance of MenuSystem.
     * @param {number} [x=0] -Coordinates of top left corner
     * @param {number} [y=0] 
     * @param {object} [font=Font.Default] Sphere font object for text
     * @memberof MenuSystem
     */
    constructor(x = 0, y = 0, font = Font.Default)
    {
        super(true);
        this.options       = [];
        this.selection     = 0;
        this.lastSelection = 0;
        this.input         = new Input();
        this.font          = font;
        this.tokens        = [];
        this.waiting       = false;
        this.keys          = [];
        this.effects       = [];
        this.x             = x;
        this.y             = y;
        this.nextX         = x;
        this.nextY         = y;
        this.direction     = 0;
        this.executing     = false;
        this.handler       = null;
    }

    /**
     * Add a key with an effect to the MenuSystem
     * Effect is currently called as a parameterless function
     * 
     * #FIX ME add a parameter?
     * 
     * @param {number} key 
     * @param {function} effect 
     * @memberof MenuSystem
     */
    addInputKey(key, effect)
    {
        if (this.keys.indexOf(key) === -1)
        {
            this.keys.push(key);
            this.effects.push(effect);
        }
        else
        {
            throw new MenuSystemError("Same key added twice.");
        }
    }

    /**
     * Remove a key
     * 
     * @param {number} key 
     * @memberof MenuSystem
     */
    removeInputKey(key)
    {
        const offset = this.keys.indexOf(key);
        if (offset !== -1)
        {
            this.keys.splice(offset,1);
            this.effects.splice(offset,1);
        }
        else
        {
            throw new MenuSystemError("Key removed that was never added.");
        }
    }

    /**
     * Add default keys for a vertical list menu
     * 
     * @memberof MenuSystem
     */
    addVListKeys()
    {
        this.addInputKey(Key.Down,   ()=>this.selectionDown());
        this.addInputKey(Key.Up,     ()=>this.selectionUp());
        this.addInputKey(Key.Enter,  ()=>this.confirm());
        this.addInputKey(Key.Escape, ()=>this.cancel());
    }

    /**
     * Add a text option to a menu
     * 
     * By default these stack one above the other if no coordinates given
     * #Improve me - add alternate defaults
     * 
     * @param {string} text 
     * @param {number} [x=this.nextX] 
     * @param {number} [y=this.nextY] 
     * @param {object} [unselectedColour=Color.White] 
     * @param {object} [selectedColour=Color.Blue] 
     * @memberof MenuSystem
     */
    addTextOption(text, x = this.nextX, y = this.nextY, unselectedColour = Color.White, selectedColour = Color.Blue)
    {
        this.options.push(new TextOption(this, text, x, y, unselectedColour, selectedColour));
        if (x === this.nextX && y === this.nextY)
        {
            switch (this.direction)
            {
            case 0:
                this.nextY = y + this.font.height;
                break;
            case 1:
                this.nextY = y - this.font.height;
                break;
            //implement horizontal too
            }
        }
    }

    /**
     * Add any kind of option
     * 
     * Must have a selected() and an unselected method()
     * Must be a dynamic object (as defined in HUDSystem) - add as a dynamic object first
     * 
     * @param {any} option 
     * @memberof MenuSystem
     */
    addOption(option)
    {
        if (!option.selected)
        {
            throw new MenuSystemError("added an option with no selection method");
        }
        if (!option.unselected)
        {
            throw new MenuSystemError("added an option with no deselection method");
        }
        const position = this.dynamicIDs.indexOf(option.token);
        if (position === -1)
        {
            throw new MenuSystemError("added an option that is not yet a Dynamic HUD Object");
        }
        this.options.push(option);
    }

    /**
     * Remove an option from the menu
     * 
     * @param {any} token 
     * @memberof MenuSystem
     */
    removeOption(token)
    {
        const options = this.options;
        const length = options.length;
        for (let position = 0; position < length; ++position)
        {
            if (token === options[position].token)
            {
                options.splice(position, 1);
                this.remove(token);
                return;
            }
        }
        throw new MenuSystemError ("Attempt to remove non-existent option from menu");
    }

    /**
     * Called on update when the menu is running
     * Overwrite this if you'd like something to happen once a frame during the menu
     * 
     * @memberof MenuSystem
     */
    update()
    {
        //blank function that can be overwritten to add any custom updates
    }

    /**
     * internal update function don't use externally
     * 
     * @memberof MenuSystem
     */
    internalUpdate()
    {
        this.update();
        if (this.waiting === false)
        {
            this.processUpdate();
        }
    }

    /**
     * Process inputs during the menu's execution
     * Don't call this externally
     * 
     * @memberof MenuSystem
     */
    async processUpdate()
    {
        this.waiting = true;
        const key = await this.input.waitForInput(this.keys);
        this.effects[this.keys.indexOf(key)]();
        if (this.selection !== this.lastSelection)
        {
            this.options[this.selection].selected();
            this.options[this.lastSelection].unselected();
            this.lastSelection = this.selection;
        }
        this.waiting = false;
    }

    /**
     * Start the menu
     * 
     * This returns a promise that resolves as the id number of the selected option when the menu finishes
     * 
     * @returns 
     * @memberof MenuSystem
     */
    start()
    {
        if (this.keys.length < 1 || this.keys.length !== this.effects.length)
        {
            throw new MenuSystemError("Menu Input not setup correctly");
        }
        if (this.options.length < 1)
        {
            throw new MenuSystemError("Menu has no options");
        }
        this.input.takeInput();
        this.options[this.selection].selected();
        this.executing = true;
        this.tokens[0] = Dispatch.onUpdate(()=>this.internalUpdate());
        this.tokens[1] = Dispatch.onRender(()=>this.draw());
        return new Promise((resolve, reject)=>
        {
            this.handler = {resolve, reject};
        });
    }

    /**
     * End the menu stops updating/drawing AND resolves the promise created by start()
     * 
     * @memberof MenuSystem
     */
    end()
    {
        this.executing = false;
        this.input.yieldInput();
        for (let i = 0, length = this.tokens.length; i < length; ++i)
        {
            this.tokens[i].cancel();
        }
        this.handler.resolve(this.selection);
    }

    /**
     * Dispose of the input object associated with the menu
     * Call this if never intending to use this menu again
     * 
     * @memberof MenuSystem
     */
    dispose()
    {
        this.input.disposeInput();
    }

    /**
     * helper method - user chooses currently selected option
     * 
     * @memberof MenuSystem
     */
    confirm()
    {
        this.lastSelection = this.selection;
        this.end();
    }

    /**
     * helper method - user cancels the menu
     * 
     * @memberof MenuSystem
     */
    cancel()
    {
        this.lastSelection = this.selection;
        this.selection = -1;
        this.end();
    }

    /**
     * helper method - go up one selection
     * 
     * @memberof MenuSystem
     */
    selectionUp()
    {
        if (this.selection > 0)
        {
            --this.selection;
        }
        else
        {
            this.selection = this.options.length - 1;
        }
    }

    /**
     * helper method - go down one selection
     * 
     * @memberof MenuSystem
     */
    selectionDown()
    {
        if (this.selection < this.options.length - 1)
        {
            ++this.selection;
        }
        else
        {
            this.selection = 0;
        }
    }
}


/**
 * Helper class - used by MenuSystem#addTextOption
 * 
 * don't use this directly
 * 
 * @class TextOption
 */
class TextOption
{
    constructor(menu, text, x, y, unselectedColour = Color.White, selectedColour = Color.Blue)
    {
        this.token = menu.addVariableText(text, x, y, Surface.Screen.width, menu.font, unselectedColour);
        this.selectable = true;
        this.access = menu.getDynamic(this.token);
        this.selectedColour = selectedColour;
        this.unselectedColour = unselectedColour;
    }
    selected()
    {
        this.access.colour = this.selectedColour;
    }
    unselected()
    {
        this.access.colour = this.unselectedColour;
    }
}

class MenuSystemError extends Error
{
    /**
    * Creates an instance of MenuSystemError.
    * @param {string} message 
    * @memberof MenuSystemError
    */
    constructor(message)
    {
        super("MenuSystem Error: " + message);
    }
}