import {HUDSystem} from "./HUDSystem";
import {Input} from "./input";

export class MenuSystem extends HUDSystem
{
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
		this.handler;
	}

	addInputKey(key, effect)
	{
		if(this.keys.indexOf(key) === -1)
		{
			this.keys.push(key);
			this.effects.push(effect);
		}
		else
		{
			MenuSystem.error("Same key added twice.");
		}
	}

	removeInputKey(key)
	{
		let offset = this.keys.indexOf(key);
		if(offset !== -1)
		{
			this.keys.splice(offset,1);
			this.effects.splice(offset,1);
		}
		else
		{
			MenuSystem.error("Key removed that was never added.");
		}
	}

	addVListKeys()
	{
		this.addInputKey(Key.Down,   ()=>this.selectionDown());
		this.addInputKey(Key.Up,     ()=>this.selectionUp());
		this.addInputKey(Key.Enter,  ()=>this.confirm());
		this.addInputKey(Key.Escape, ()=>this.cancel());
	}

	addTextOption(text, x = this.nextX, y = this.nextY, unselectedColour = Color.White, selectedColour = Color.Blue)
	{
		this.options.push(new TextOption(this, text, x, y, unselectedColour, selectedColour));
		if(x === this.nextX && y === this.nextY)
		{
			switch(this.direction)
			{
			case(0):
				this.nextY = y + this.font.height;
				break;
			case(1):
				this.nextY = y - this.font.height;
				break;
				//implement horizontal too
			}
		}
	}

	addOption(option)
	{
		if(!option.selected)
		{
			MenuSystem.error("added an option with no selection method");
		}
		if(!option.unselected)
		{
			MenuSystem.error("added an option with no deselection method");
		}
		let position = this.dynamicIDs.indexOf(option.token);
		if(position === -1)
		{
			MenuSystem.error("added an option that is not yet a Dynamic HUD Object");
		}
		this.options.push(option);
	}
	
	removeOption(token)
	{
		let position = 0;
		let options = this.options;
		for(; token !== options[position].token; ++position);
		options.splice(position,1);
		this.remove(token);
	}

	update()
	{
		//blank function that can be overwritten to add any custom updates
	}

	internalUpdate()
	{
		this.update();
		if(this.waiting === false)
		{
			this.processUpdate();
		}
	}

	async processUpdate()
	{
		this.waiting = true;
		let key = await this.input.waitForInput(this.keys);
		SSj.log(key);
		this.effects[this.keys.indexOf(key)]();
		if(this.selection !== this.lastSelection)
		{
			this.options[this.selection].selected();
			this.options[this.lastSelection].unselected();
			this.lastSelection = this.selection;
		}
		this.waiting = false;
	}

	start()
	{
		if(this.keys.length < 1 || this.keys.length !== this.effects.length)
		{
			MenuSystem.error("Menu Input not setup correctly");
		}
		if(this.options.length < 1)
		{
			MenuSystem.error("Menu has no options");
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

	end()
	{
		this.executing = false;
		this.input.yieldInput();
		for(let i = 0, length = this.tokens.length; i < length; ++i)
		{
			this.tokens[i].cancel();
		}
		this.handler.resolve(this.selection);
	}



	dispose()
	{
		this.input.dispose();
	}

	confirm()
	{
		this.lastSelection = this.selection;
		this.end();
	}

	cancel()
	{
		this.lastSelection = this.selection;
		this.selection = -1;
		this.end();
	}	

	selectionUp()
	{
		if(this.selection > 0)
		{
			--this.selection;
		}
		else
		{
			this.selection = this.options.length - 1;
		}
	}

	selectionDown()
	{
		if(this.selection < (this.options.length - 1))
		{
			++this.selection;
		}
		else
		{
			this.selection = 0;
		}
	}

	static error(description)
	{
		throw new Error("MenuSystem Error: " + description);
	}
}


class TextOption
{
	constructor(menu, text, x, y, unselectedColour = Color.White, selectedColour = Color.Blue)
	{
		this.token = menu.addVariableText(text, x, y, screen.width, menu.font, unselectedColour);
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