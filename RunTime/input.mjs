/* File: Input.mjs
 * Author: Rhuan
 * Date: 30/09/2017
 * Input handling routines including priority handling for miniSphere 5.0
 * Usage: FIX ME - WRITE USAGE HERE OR EXTERNAL GUIDE DOC
 * License for input.mjs
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

let inputUsers = [];
let userPriorities = [];
let nextID     = 0;
let usePriority = false;
let kb = Keyboard.Default;

export class Input
{
	constructor(priority = 0)
	{
		inputUsers.push(nextID);
		userPriorities.push(priority);
		if(priority > 0)
		{
			usePriority = true;	
		}
		this.ID     = nextID;
		this.token  = 0;
		this.keys;
		this.state = 0;
		this.value = 0;
		this.priority = priority;
		nextID = nextID + 1;
	}

	dispose()
	{
		let position = inputUsers.indexOf(this.ID);
		if(position === -1)
		{
			Input.error("non-existent input disposed");
		}
		inputUsers.splice(position, 1);
		userPriorities.splice(position,1);
	}

	takeInput()
	{
		let position = inputUsers.indexOf(this.ID);
		let target = 0;
		if(position === -1)
		{
			Input.error("input requested by non-existent process");
		}
		if(usePriority === true)
		{
			for(; target < position && userPriorities[target] > this.priority; ++target);
		}
		if(target === 0)
		{
			inputUsers.splice(position, 1);
			inputUsers.unshift(this.ID);
			userPriorities.splice(position,1);
			userPriorities.unshift(this.priority);
		}
		else if(target !== position)
		{
			inputUsers.splice(position, 1);
			inputUsers.splice(target, 0, this.ID);
			userPriorities.splice(position,1);
			userPriorities.splice(target, 0, this.priority);
		}
	}

	yieldInput()
	{
		let position = inputUsers.indexOf(this.ID);
		if(position === -1)
		{
			Input.error("input surrendered by non-existent process");
		}
		inputUsers.splice(position, 1);
		inputUsers.push(this.ID);
		userPriorities.splice(position,1);
		userPriorities.push(this.priority);
	}

	clearQueue()
	{
		if(inputUsers[0] === this.ID)
		{
			kb.clearQueue();
		}
	}

	getKey()
	{
		if(inputUsers[0] === this.ID)
		{
			return kb.getKey();
		}
		else
		{
			return null;
		}
	}

	getChar(key, shifted = false)
	{
		return kb.getChar(key, shifted);
	}

	isPressed(key)
	{
		if(inputUsers[0] === this.ID)
		{
			return kb.isPressed(key);
		}
		else
		{
			return false;
		}
	}

	async waitForKey(key, allowContinuous = false)
	{
		return await this.waitForInput([key], allowContinuous);
	}
	
	waitForInput(keys, allowContinuous = false)
	{
		this.keys = keys;
		this.state = 0;
		return new Promise((resolve) =>
		{
			if(allowContinuous === false)
			{
				let job = Dispatch.onUpdate(() =>
				{
					let done = true;
					switch(this.state)
					{
					case(0):
						this.state = 1;
						for(let i = 0; i < this.keys.length; ++i)
						{
							if(this.isPressed(this.keys[i]) === true)
							{
								this.state = 0;
							}
						}
						break;
					case(1):
						for(let i = 0; i < this.keys.length; ++i)
						{
							if(this.isPressed(this.keys[i]) === true)
							{
								this.state = 2;
								this.value = this.keys[i];
							}
						}
						break;
					case(2):
						for(let i = 0; i < this.keys.length; ++i)
						{
							if(this.isPressed(this.keys[i]) === true)
							{
								done = false;
							}
						}
						if(done === true)
						{
							job.cancel();
							resolve(this.value);
						}
						break;
					}
				});
			}
			else
			{
				let job = Dispatch.onUpdate(() =>
				{
					let done = false;
					for(let i = 0; i < this.keys.length; ++i)
					{
						if(this.isPressed(this.keys[i]) === true)
						{
							done = true;
							this.value = this.keys[i];
						}
					}
					if(done)
					{
						job.cancel();
						resolve(this.value);
					}
				});
			}
		});
	}

	async getNextKey(clearQueue = true, permittedKeys = [])
	{
		if(clearQueue === true)
		{
			await this.waitForPriority();
			this.clearQueue();
		}
		return new Promise((resolve) =>
		{
			if(permittedKeys.length === 0)
			{
				let job = Dispatch.onUpdate(() =>
				{
					let pressedKey = this.getKey();
					if(pressedKey !== null)
					{
						job.cancel();
						resolve(pressedKey);
					}

				});
			}
			else
			{
				let job = Dispatch.onUpdate(() =>
				{
					let pressedKey = this.getKey();
					if(pressedKey !== null)
					{
						for(let i = 0; i < permittedKeys.length; ++i)
						{
							if(pressedKey === permittedKeys[i])
							{
								job.cancel();
								resolve(pressedKey);
							}
						}
					}
				});
			}
		});
	}

	waitForPriority()
	{
		return new Promise((resolve) =>
		{
			let job = Dispatch.onUpdate(() =>
			{
				if(inputUsers[0] === this.ID)
				{
					job.cancel();
					resolve(true);
				}
			});
		});
	}


	static error(description)
	{
		throw new Error("InputSystem error: " + description);
	}
}




