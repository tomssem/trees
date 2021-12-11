const canvasSketch = require("canvas-sketch");
import {random} from "canvas-sketch-util"
var _ = require("lodash");

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
    context.lineTo(...this.pos);
    context.stroke();
    this.children.forEach(element => {
      context.beginPath();
      context.moveTo(...this.pos);
      element.draw(context);
    });
  }
}

function map(func, tree) {
    return new Tree(func(tree.pos), _.map(tree.children, _.partial(map, func)));
}

function reduce(funcAcross, funcAlong, accum, tree) {
  if(!tree.children || tree.children.length === 0) {
    return funcAlong(accum, tree.pos);
  } else {
    const mapFunc = _.partial(reduce, funcAcross, funcAlong, accum);
    console.log(tree.children.map(mapFunc));
    return funcAlong(tree.pos, funcAcross(tree.children.map(mapFunc)));
  }
  console.log("Here?");
}

function depth(tree) {
  const ones = (pos) => 1;
  const plus = (a, b) => a + b;
  console.log(map(ones, tree));
  return reduce(_.max, plus, 0, map(ones, tree));
}

class TreeGenerator {
  constructor(startPos, depth, tree) {
    this.startPos = startPos;
    this.depth = depth;
    this.tree = tree;
  }

  next() {
    if(this.tree === undefined) {
      this.tree = new Tree(this.startPos);
      return this.tree;
    }
  }
}

const tree = new Tree([500, 500], [new Tree([400, 600], [new Tree([800, 900])]), new Tree([600, 600])]);

const sketch = () => {
  return ({ context, width, height }) => {
    context.fillStyle = "blue";
    context.strokeStyle = "white";
    context.fillRect(0, 0, width, height);

    context.lineWidth = "6";
    context.beginPath();
    context.moveTo(100, 100);
    context.lineTo(200, 200);
    tree.draw(context);
    console.log(depth(tree));
  };
};

canvasSketch(sketch, settings);
