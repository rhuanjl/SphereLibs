//@ts-check
import {Input} from "$/input";

export class Talking
{
	constructor(HUD, windowStyle, x = 5, y = (screen.height * 2/3), keys = [Key.Enter, Key.Space],
		width = screen.width - 10, height = screen.height /3 - 10, font = Font.Default)
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
	}

	async talk(speaker, text)
	{
		return await this.queueTalk(speaker, [text]);
	}

	async queueTalk(speaker, textQueue)
	{
		for(let i = 0; i < textQueue.length; ++i)
		{
			this.queue.push({speaker: speaker, text:textQueue[i]});
		}
		this.input.takeInput();

		return await this.processQueue();
	}

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
			hudRefs.push(HUD.addStatic(ws.renderWindow(x, y, width, height, true, [0.8, 1, 1, 0.8])));
			if(current.speaker.length > 0)
			{
				hudRefs.push(HUD.addStatic(ws.renderWindow(x + 20,y - 10, 80, 20, true, [0.8, 1, 1, 0.8])));
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