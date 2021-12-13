const canvasSketch = require("canvas-sketch");
import {random} from "canvas-sketch-util"
import math from "canvas-sketch-util/math";
import { create } from "lodash";
var _ = require("lodash");

const settings = {
  dimensions: [ 1080, 1080 ]
};

const standardConnectionDraw = (context, start, end) => {
    context.globalAlpha = 0.9;
    context.filter = "blur(1px)";
    context.strokeStyle = "white";
    context.lineWidth = "1";
    context.beginPath();
    context.moveTo(...start.pos);
    context.lineTo(...end.pos);
    context.stroke();
};

const standardNodeDraw = (context, tree) => {
    context.globalAlpha = 0.9;
    context.filter = "blur(1px)";
    context.strokeStyle = "white";
    context.lineWidth = "1";
    context.beginPath();
    context.arc(...tree.pos, 5, 0, 2 * Math.PI);
    context.stroke();
};

const noOp = () => {};

const drawTree = (context, tree, nodeDraw, connectionDraw) => {
  if(nodeDraw === undefined) {
    nodeDraw = standardNodeDraw;
  }
  if(connectionDraw === undefined) {
    connectionDraw = standardConnectionDraw;
  }
  nodeDraw(context, tree);
  tree.children.forEach(element => {
    connectionDraw(context, tree, element);
    drawTree(context, element);
  });
}

class Tree {
  constructor(pos, children) {
    this.pos = pos;
    if(children === undefined) {
      children = [];
    }
    this.children = children;
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

const createConstNum = (num) => {
  return ((_) => num);
}

const createRadialDensity = (std) => {
  return (tree) => {
      const xRand = tree.pos[0];
      const yRand = tree.pos[1];
      const x = tree.pos[0] + random.gaussian(xRand, std);
      const y = tree.pos[1] + random.gaussian(yRand, std);
      return [x, y];
  }
}

const treeExpander = (numChildrenGenerator, positionDensity, tree) => {
  const pos = [...tree.pos];
  if(tree.children.length === 0) {
    const numChildren = numChildrenGenerator(tree);
    let children = [];
    for(let i = 0; i < numChildren; ++i) {
      children.push(new Tree(positionDensity(tree)));
    }
    return new Tree(pos, children);
  } else {
    const mapFunc = _.partial(treeExpander, numChildrenGenerator, positionDensity);
    return new Tree(pos, tree.children.map(mapFunc));
  }
}

class TreeGenerator {
  constructor(maxDepth, numChildrenGenerator, positionDensity) {
    this.startPos = [0, 0];
    this.maxDepth = maxDepth;
    this.numChildrenGenerator = numChildrenGenerator;
    this.positionDensity = positionDensity;
    this.tree = undefined;
  }

  next() {
    if(depth(this.tree) >= this.maxDepth) {
      return {"done": true};
    }
    if(this.tree === undefined) {
      this.tree = new Tree(this.startPos);
    } else {
      this.tree = treeExpander(this.numChildrenGenerator, this.positionDensity, this.tree);
    }
    
    return {"value": this.tree, "done": false};
  }
}

const treeGen = new TreeGenerator(4, createConstNum(10), createRadialDensity(20));
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
    context.fillRect(0, 0, width, height);

    context.save();
    context.translate(540, 540);
    drawTree(context, genTree);
    context.restore();
  };
};

canvasSketch(sketch, settings);
