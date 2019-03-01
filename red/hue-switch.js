module.exports = function(RED)
{
	"use strict";

	function HueSwitch(config)
	{
		RED.nodes.createNode(this, config);

		var scope = this;
		let bridge = RED.nodes.getNode(config.bridge);
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
				//console.log("sensor:", sensor);
				
				var message = {};
				
				// DEFINE HUMAN READABLE BUTTON NAME
				var buttonName = "";
				var buttonNb = 0;
				if(sensor.state.buttonEvent < 2000)
				{
					buttonName = "On";
					buttonNb = 1;
					message.intent=1;
				}
				else if(sensor.state.buttonEvent < 3000)
				{
					buttonName = "Dim Up";
					buttonNb = 2;
					message.intent=2;
				}
				else if(sensor.state.buttonEvent < 4000)
				{
					buttonName = "Dim Down";
					buttonNb = 3;
					message.intent=3;
				}
				else
				{
					buttonName = "Off";
					buttonNb = 4;
					message.intent=0;
				}

				// DEFINE HUMAN READABLE BUTTON ACTION
				var buttonAction = "";
				var buttonActionRaw = parseInt(sensor.state.buttonEvent.toString().substring(3));

				if(buttonActionRaw == 0)
				{
					buttonAction = "pressed";
				}
				else if(buttonActionRaw == 1)
				{
					buttonAction = "holded";
				}
				else if(buttonActionRaw == 2)
				{
					buttonAction = "short released";
				}
				else
				{
					buttonAction = "long released";
				}

				
				message.payload = {};
				message.payload.button = sensor.state.buttonEvent;
				message.payload.buttonnb = buttonNb;
				message.payload.name = buttonName;
				message.payload.action = buttonAction;
				message.payload.updated = moment.utc(sensor.state.lastUpdated).local().format();

				message.info = {};
				message.info.id = sensor.id;
				message.info.uniqueId = sensor.uniqueId;
				message.info.name = sensor.name;
				message.info.type = sensor.type;
				message.info.softwareVersion = sensor.softwareVersion;
				message.info.battery = sensor.config.battery;

				message.info.model = {};
				message.info.model.id = sensor.model.id;
				message.info.model.manufacturer = sensor.model.manufacturer;
				message.info.model.name = sensor.model.name;
				message.info.model.type = sensor.model.type;
				

				switch (buttonNb) {
					
					case 1:
					scope.send([message, null, null, null]);
					break;
					
					case 2:
					scope.send([null, message, null, null]);
					break;
					
					case 3:
					scope.send([null, null, message, null]);
					break;
					
					case 4:
					scope.send([null, null, null, message]);
					break;

					default: // happen?
					scope.send([message, null, null, null]);
					}
				
				scope.status({fill: "green", shape: "dot", text: buttonName + " " + buttonAction});
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

	RED.nodes.registerType("hue-switch", HueSwitch);
}
