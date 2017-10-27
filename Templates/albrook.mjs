export const triggerScripts =
{
	layerToOne :
	{
		onPlayer(runTime, player)
		{
			player.layer = 1;
		},
		onOther(runTime, other)
		{
			other.layer = 1;
		}
	},
	layerToZero :
	{
		onPlayer(runTime, player)
		{
			player.layer = 0;
		},
		onOther(runTime, other)
		{
			other.layer = 0;
		}
	}
};

export const entityScripts =
{
	Girl :
	{
		onSetup (runTime, self)
		{
			self.text = [
				"I love shopping!", "Should I buy a new hat?",
				"Or should buy a new dress instead?",
				"Oh wait! There's a sale! I'll just buy \none of everything." ];
			self.textNum = 0;
		},
		onDestroy (runTime, self)
		{

		},
		onTouchPlayer (runTime, self, player)
		{

		},
		onTouchOther (runTime, self, other)
		{

		},
		async onTalk (runTime, self, player)
		{
			self.frozen = true;
			self.faceEntity(player);
			await runTime.talk(self.id, self.text[self.textNum]);
			self.frozen = false;
			self.textNum = (self.textNum + 1) % 4;
		},
		onIdle (runTime, self)
		{
			let chance = (Math.random() * 10)|0;
			let dir = "";
			if(chance < 6)
			{
				dir = self.direction;
			}
			else
			{
				chance = (Math.random() * 4)|0;
				let options = ["north", "south", "east", "west"]
				dir = options[chance];
			}
			self.queueMove(dir, 8);
		}
	},
	Merchant :
	{
		onSetup (runTime, self)
		{

		},
		onDestroy (runTime, self)
		{

		},
		onTouchPlayer (runTime, self, player)
		{

		},
		onTouchOther (runTime, self, other)
		{

		},
		async onTalk (runTime, self, player)
		{
			self.frozen = true;
			self.faceEntity(player);
			await runTime.talk(self.id, "I'm all out of goods come back \nlater");
			self.frozen = false;
		},
		onIdle (runTime, self)
		{
			
		}
	},
	Sentry :
	{
		onSetup (runTime, self)
		{
			self.talkNum = 0;
		},
		onDestroy (runTime, self)
		{

		},
		onTouchPlayer (runTime, self, player)
		{

		},
		onTouchOther (runTime, self, other)
		{

		},
		async onTalk(runTime, self, player)
		{
			self.frozen = true;
			self.faceEntity(player);
			if(self.talkNum === 0)
			{
				await runTime.talk(self.id, "I'm so lost!");
				self.talkNum = 1;
			}
			else
			{
				await runTime.talk(self.id, "Let me tell you something. Those guys from Narshe are really tough! But get this, they really seem to go crazy for fast food.");
				self.talkNum = 0;
			}
			
			self.frozen = false;			
		},
		onIdle (runTime, self)
		{
			if (self.direction === "east")
			{
				self.queueMove("west", 60);
			}
			else
			{
				self.queueMove("east", 60);
			}
		}
	},
	birdnerd :
	{
		onSetup (runTime, self)
		{
			self.flying = (Math.random() > 0.4);
			let dirChoice = (Math.random() * 4)|0;
			if(self.flying === true)
			{
				self.layer = 3;
				let dirs = ["flynorth", "flysouth", "flywest", "flyeast"];
				self.queueMove(dirs[dirChoice], 16);
			}
			else
			{
				self.layer = 1;
				let dirs = ["north", "south", "west", "east"];
				self.queueMove(dirs[dirChoice], 8);
			}
		},
		onDestroy (runTime, self)
		{

		},
		onTouchPlayer (runTime, self, player)
		{

		},
		onTouchOther (runTime, self, other)
		{

		},
		async onTalk (runTime, self, player)
		{
			self.frozen = true;
			self.faceEntity(player);
			//implement a bird sound here
			//await runTime.queueTalk(self.id, ["This is my first message for you, yes you, you clown", "And here is a second message for good measure"]);
			self.frozen = false;
		},
		onIdle (runTime, self)
		{
			let chance = (Math.random() * 12)|0;
			let dir = "";
			if(chance < 7)
			{
				dir = self.direction;
			}
			else
			{
				let dirs = [];
				if(chance > 9)
				{
					if(self.flying === true)
					{
						if(self.obstructedOnLayer(1) !== true)
						{
							self.flying = false;
						}
					}
					else
					{
						self.flying = true;
					}
				}
				let dirChoice = (Math.random() * 4)|0;
				if(self.flying === true)
				{
					self.layer = 3;
					dirs = ["flynorth", "flysouth", "flywest", "flyeast"];
				}
				else
				{
					self.layer = 1;
					dirs = ["north", "south", "west", "east"];
				}
				dir = dirs[dirChoice];
			}
			self.queueMove(dir, 8);
		}
	},
	Sign1 :
	{
		onSetup (runTime, self)
		{
			
		},
		onDestroy (runTime, self)
		{

		},
		onTouchPlayer (runTime, self, player)
		{

		},
		onTouchOther (runTime, self, other)
		{

		},
		async onTalk (runTime, self, player)
		{
			self.frozen = true;
			await runTime.talk("Sign", "NORTH: Administration and Law Enforcement \nWEST: Wilderness \nSOUTH: Albrook Towers");
			self.frozen = false;
		},
		onIdle (runTime, self)
		{
			
		}
	}
};


