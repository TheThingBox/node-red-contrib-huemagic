module.exports = function(RED)
{
	"use strict";

	function HueTap(config)
	{
		RED.nodes.createNode(this, config);

		var scope = this;
		var bridge = RED.nodes.getNode(config.bridge);
		let moment = require('moment');
		
		//
		// MEMORY
		this.lastUpdated = false;
		
		//
		// CHECK CONFIG
		if(!config.sensorid || bridge == null)
		{
			this.status({fill: "red", shape: "ring", text: "not configured"});
			return false;
		}

		//
		// UPDATE STATE
		scope.status({fill: "grey", shape: "dot", text: "waiting…"});

		//
		// ON UPDATE
		bridge.events.on('sensor' + config.sensorid, function(sensor)
		{
			var lastUpdated = scope.lastUpdated || false;

			if(sensor.state.lastUpdated != lastUpdated)
			{
				scope.lastUpdated = sensor.state.lastUpdated;

				// RETURN ON FIRST DEPLOY
				if (lastUpdated === false) {
					return;
				}

				var message = {};
				message.payload = {button: 0, updated: moment.utc(sensor.state.lastUpdated).local().format()};

				message.info = {};
				message.info.id = sensor.id;
				message.info.uniqueId = sensor.uniqueId;
				message.info.name = sensor.name;
				message.info.type = sensor.type;

				message.info.model = {};
				message.info.model.id = sensor.model.id;
				message.info.model.manufacturer = sensor.model.manufacturer;
				message.info.model.name = sensor.model.name;
				message.info.model.type = sensor.model.type;

				if(sensor.state.buttonEvent == 34)
				{
					message.payload.button = 1;
					scope.send([message,null,null,null]);
				}
				else if(sensor.state.buttonEvent == 16)
				{
					message.payload.button = 2;
					scope.send([null,message,null,null]);
				}
				else if(sensor.state.buttonEvent == 17)
				{
					message.payload.button = 3;
					scope.send([null,null,message,null]);
				}
				else if(sensor.state.buttonEvent == 18)
				{
					message.payload.button = 4;
					scope.send([null,null,null,message]);
				}

				
			}
			else
			{
				scope.status({fill: "grey", shape: "dot", text: "waiting…"});
			}
		});


		//
		// CLOSE NDOE / REMOVE RECHECK INTERVAL
		this.on('close', function()
		{
			bridge.events.removeAllListeners('sensor' + config.sensorid);
		});
	}

	RED.nodes.registerType("hue-tap", HueTap);
}
