const canvasSketch = require("canvas-sketch");
import {random} from "canvas-sketch-util"

const settings = {
  dimensions: [ 1080, 1080 ]
};

class Tree {
  constructor(pos, children) {
    this.pos = pos;
    if(children === undefined) {
      children = [];
    }
    this.children = children;
  }

  draw(context) {
    console.log(this.pos);
    context.lineTo(...this.pos);
    context.stroke();
    this.children.forEach(element => {
      context.beginPath();
      context.moveTo(...this.pos);
      element.draw(context);
    });
  }
}

const trees = new Tree([500, 500], [new Tree([400, 600]), new Tree([600, 600])]);

const sketch = () => {
  return ({ context, width, height }) => {
    context.fillStyle = "blue";
    context.strokeStyle = "white";
    context.fillRect(0, 0, width, height);

    context.lineWidth = "6";
    context.beginPath();
    context.moveTo(100, 100);
    context.lineTo(200, 200);
    trees.draw(context);
  };
};

canvasSketch(sketch, settings);
