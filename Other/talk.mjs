/*Example talk script for demo purposes with MEngine.mjs
Copyright Richard Lawrence, see MEngine.mjs for full license details*/

/*This code is intended as an example and not part of the main libs,
whilst you may use it please be aware that I may make breaking changes
to it in the future with no or minimal warning.

The purpose of this code is to show how an asynch talk function can be written
that would work well with MEngine and SEngine.*/


//Use input.mjs for input handling
//May need to update path for this in any specific game
//Note this is also dependent on HUDSystem.mjs
//But takes a pre-created instance of the HUD as an input so doesn't need to import it
import {Input} from "$/input";

/*Wrap all the features as a class
- enables initialisation that sets key properties
- enables briefactual talk commands
- unfortunately means the talk commands are class methods not bare functions*/

//There may be a better way to do this
export class Talking
{
	/**
	 * Creates an instance of Talking.
	 * @param {object} HUD - instance of HUDSystem class
	 * @param {object} windowStyle - instance of windowStyle class from HUDsystem.mjs
	 * @param {number} [x=5] -x coordiante for text boxes
	 * @param {number} [y=(Surface.Screen.height * 2/3)] - y coordinate for textboxes
	 * @param {array} [keys=[Key.Enter, Key.Space]] - allowed Keys for closing a textbox
	 * @param {number} [width=Surface.Screen.width - 10] - width of textboxes
	 * @param {number} [height=Surface.Screen.height /3 - 10] -height of textboxes
	 * @param {object} [font=Font.Default] -font to use for text
	 * @memberof Talking
	 */
	constructor(HUD, windowStyle, x = 5, y = (Surface.Screen.height * 2/3), keys = [Key.Enter, Key.Space],
		width = Surface.Screen.width - 10, height = Surface.Screen.height /3 - 10, font = Font.Default)
	{
		this.HUD         = HUD;
		this.windowStyle = windowStyle;
		this.input       = new Input();
		this.font        = font;
		this.x           = x;
		this.y           = y;
		this.width       = width |0;
		this.height      = height |0;
		this.queue       = [];
		this.keys        = keys;
		this.mask = new Color(0.8, 1, 1, 0.8);
	}

	/**
	 * async Talk function
	 * call this with await if you want to pause your current function untll the talk completes
	 * as this is asynch it does not block the event loop
	 * @param {string} speaker - name of person speaking appears on first line
	 * @param {string} text - appears on second line (and on - auto wordwrapped)
	 * @returns {promise} - resolves when textbox closed
	 * @memberof Talking
	 */
	async talk(speaker, text)
	{
		return await this.queueTalk(speaker, [text]);
	}

	
	/**
	 * async multi-talk function
	 * call this with await if you want to pause your current function untll the talk completes
	 * as this is asynch it does not block the event loop
	 * @param {string} speaker  - name of person speaking appears on first line
	 * @param {array} textQueue - array of different things to say - each entry is drawn as one text box
	 * 							- when each textbox is closed the next one opens
	 * @returns {promise} - resolves when textbox closed
	 * @memberof Talking
	 */
	async queueTalk(speaker, textQueue)
	{
		for(let i = 0; i < textQueue.length; ++i)
		{
			this.queue.push({speaker: speaker, text:textQueue[i]});
		}
		this.input.takeInput();

		return await this.processQueue();
	}

	/**
	 * proxess Queue - internal function do not call this
	 * This is the logic used for the above talk operations
	 * 1. Removes the first queued talk from the queue
	 * 2. Adds that talk to the HUDSystem
	 * 3. yields to the event loop untill input is recieved
	 * 4. upon reciving input removes the talk from the HUD
	 * 5. Return to 1 untill queue empty
	 * 6. Surrenders control of input and returns
	 * @returns {promise} - resovles when all talking is finished
	 * @memberof Talking
	 */
	async processQueue()
	{
		while(this.queue.length > 0)
		{
			let x = this.x;
			let y = this.y;
			let width = this.width;
			let height = this.height;
			let ws = this.windowStyle;
			let HUD = this.HUD;
			let hudRefs = [];
			
			let current = this.queue.shift();
			hudRefs.push(HUD.addStatic(ws.renderWindow(x, y, width, height, this.mask)));
			if(current.speaker.length > 0)
			{
				hudRefs.push(HUD.addStatic(ws.renderWindow(x + 20,y - 10, 80, 20, this.mask)));
				hudRefs.push(HUD.addText(x + 25, y -7, current.speaker, this.font, 70));
			}
			hudRefs.push(HUD.addText(x + 10, y + 15, current.text, this.font, width - 20));
			await this.input.waitForInput(this.keys);
			for(let i = 0; i < hudRefs.length; ++i)
			{
				this.HUD.remove(hudRefs[i]);
			}
		}
		this.input.yieldInput();
		return true;
	}
}