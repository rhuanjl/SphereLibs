/*Template map script file for use with MEngine and SEngine,
Copyright Richard Lawrence, please see MEngine.mjs for license details

Usage:
Each map must have a mapscript with the same name (except for the extension)

Currently three types of map scripts are supported:
1. Trigger scripts
2. Person scripts
3. Map scripts

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
			self.data.talkedTo = false;//store entity data on self.data
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
			if(self.data.talkedTo === false)
			{
				await runTime.talk(self.id, "Hey how are you?");//function would need to exist in your runTime object and return a promise
				self.data.talkedTo = true;//keep track of the fact that we've talked
			}
			else//if you've aready talked say something different
			{
				await runTime.talk(self.id, "Haven't we talked before?");//function would need to exist in your runTime object and return a promise
			}
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

/*Map scripts for this map, object must be named mapScripts
Should have eight properties:
	onExit()
	onEnter()
	onUpdate()
	onRender()
	onLeaveEast()
	onLeaveWest()
	onLeaveNorth()
	onLeaveSouth()

	The first 4 functions take 2 parameters:
	1. runTime - runTime object supplied when instantiating MEngine
	2. map - an object representing the map you're on

	The remaining 4 functions take an extra parameter:
	3. player - an Entity object from SEngine - the player controlled entity that has walked off of the map

	*/


export const mapScripts =
{
	onExit (runTime, map)
	{
		//called from the setMap method - when using it to change map whilst on this map
	},
	onEnter (runTime, map)
	{
		//called from the update method - when it is the first frame on this map 
	},
	onUpdate (runTime, map)
	{
		//called from the update method every frame on the map
	},
	onRender (runTime, map)
	{
		//called form the render method after the map and sprites are drawn every frame on this map
	},
	onLeaveEast (runTime, map, player)
	{
		//called when a player controlled entity walks off the edge of the map
		//player is the entity object that walked off
	},
	onLeaveWest (runTime, map, player)
	{
		//see above
	},
	onLeaveNorth (runTime, map, player)
	{
		//see above
	},
	onLeaveSouth (runTime, map, player)
	{
		//see above
	}
};