/*Template map script file for use with MEngine and SEngine,
Copyright Richard Lawrence, please see MEngine.mjs for license details

Usage:
Each map must have a mapscript with the same name (except for the extension)

Currently two types of map scripts are supported:
1. Trigger scripts
2. Person scripts

An object should be exported for each, see comments below that explain
how to set up these objects*/


/*trigger scripts for this map, object must be named triggerScripts
Each property should:
a) be named with the name of the trigger
b) itself have two properties: onPlayer() and onOther()
	when the player steps on the trigger onPLayer() will be called
	when a different entitiy steps on the trigger onOther will be called

Each function takes two parameters:
1. runTime - this is an object you pass
to the SEngine constructor attach any runtime functions you want to call
from mapscripts as properites of it.
2. player/other - this is the entity triggering the script - see SEngine.mjs
for the properites they have, you can also store private data on them as extra
properties*/

export const triggerScripts =
{
	nameOfTriggerOne :
	{
		onPlayer(runTime, player)
		{

		},
		onOther(runTime, other)
		{

		}
	},
	nameOfTriggerTwo :
	{
		onPlayer(runTime, player)
		{

		},
		onOther(runTime, other)
		{

		}
	}
};

/*Entity scripts for this map, object must be named entityScripts
Each property should:
a) be named with the name of the entity
b) itself have six properties:
	onSetup()
	onDestroy()
	onTouchPlayer()
	onTouchOther()
	onTalk()
	onIdle()

	If you want a function to involve a delayed action try making it async
	see example below (any of the scripts can be async)

TODO: add more documentation here -for now see comments in personTwo below*/


export const entityScripts =
{
	personOne :
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
		async onTalk (runTime, self, player)//example async function
		{
			self.frozen = true;//entity doesn't move when frozen (see SENgine.mjs)
			self.faceEntity(player);//face the player - see SEngine.mjs
			await runTime.talk(self.id, "Hey how are you?");//function would need to exist in your runTime object and return a promise
			//see talk.mjs for example talk function that works this way
			self.frozen = false;//unfreeze when the talking is over
		},
		onIdle (runTime, self)
		{//example random movement code
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
	personTwo :
	{
		onSetup (runTime, self)
		{
			//on creation
		},
		onDestroy (runTime, self)
		{
			//on destruction
		},
		onTouchPlayer (runTime, self, player)
		{
			//when touched by the player
		},
		onTouchOther (runTime, self, other)
		{
			//when touching a different entity - not the player
		},
		onTalk (runTime, self, player)
		{
			//when the player talks to them (touches + presses action key)
		},
		onIdle (runTime, self)
		{
			//when their queue is empty
		}
	}
};

