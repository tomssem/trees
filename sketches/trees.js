const canvasSketch = require("canvas-sketch");
import {random} from "canvas-sketch-util"
import math from "canvas-sketch-util/math";
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
    return funcAlong(tree.pos, funcAcross(tree.children.map(mapFunc)));
  }
}

function depth(tree) {
  if(tree === undefined) {
    return 0;
  }
  const ones = (pos) => 1;
  const plus = (a, b) => a + b;
  return reduce(_.max, plus, 0, map(ones, tree));
}

const treeExpander = (tree) => {
  const pos = [...tree.pos];
  if(tree.children.length === 0) {
    let children = [];
    for(let i = 0; i < 4; ++i) {
      const x = tree.pos[0] + random.range(1, 300);
      const y = tree.pos[1] + random.range(1, 300);
      children.push(new Tree([x, y]))
    }
    return new Tree(pos, children);
  } else {
    return new Tree(pos, tree.children.map(treeExpander));
  }
}

class TreeGenerator {
  constructor(startPos, maxDepth, tree) {
    this.startPos = startPos;
    this.maxDepth = maxDepth;
    this.tree = tree;
  }

  next() {
    if(depth(this.tree) >= this.maxDepth) {
      return {"done": true};
    }
    if(this.tree === undefined) {
      this.tree = new Tree(this.startPos);
    } else {
      this.tree = treeExpander(this.tree);
    }
    
    return {"value": this.tree, "done": false};
  }
}

const treeGen = new TreeGenerator([0, 0], 10);
let genTree;

let count = 0;

while(true) {
  const tmp = treeGen.next();
  if(tmp.done) {
    break;
  }
  genTree = tmp.value;
};

const sketch = () => {
  return ({ context, width, height }) => {
    context.fillStyle = "blue";
    context.strokeStyle = "white";
    context.fillRect(0, 0, width, height);
    context.globalAlpha = 0.3

    genTree.draw(context);
  };
};

canvasSketch(sketch, settings);
