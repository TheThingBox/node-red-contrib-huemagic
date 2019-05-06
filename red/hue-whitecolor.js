module.exports = function(RED) {
  "use strict";

  function main(config) {
    RED.nodes.createNode(this, config);
    this.config = config;
    var node = this;

    this.on("input", function(msg) {
      msg.whitecolor = node.config.val;
      node.send(msg);
    });
  }
  RED.nodes.registerType("hue-whitecolor", main);
}
