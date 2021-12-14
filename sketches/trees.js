const canvasSketch = require("canvas-sketch");
import {random} from "canvas-sketch-util"
import math from "canvas-sketch-util/math";
import { create } from "lodash";
var _ = require("lodash");

const cyberColours = ["aqua", "blue", "violet", "coral", "cyan", "darkblue", "crimson",
                      "darkmagenta", "darkorange", "darkorchid", "darkvuilet", "deeppink",
                      "darkturquoise", "deepksyblue", "dogerblue", "goldenrod", "greenyellow", "indigo",
                      "magenta", "mediumturquise", "midnightblue", "orange", "orangered", "purple", "red",
                      "steelblue", "violet"]

const lightningBackgroundColours = ["violet", "darkblue", "crimson", "darkmagenta", "darkviolet",
"darkturquoise", "deepksyblue", "indigo", "midnightblue", "orangered", "purple", "steelblue", "violet"];

const settings = {
  dimensions: [ 2160, 2160 ]
};

const randomBackgroundColour = (nodeDrawer) => {
  return (context, tree) => {
    context.save();
    context.fillStyle = random.pick(lightningBackgroundColours);

    nodeDrawer(context, tree);

    context.restore();
  }

}

const randomCyberFillColour = (nodeDrawer) => {
  return (context, tree) => {
    context.save();
    context.fillStyle = random.pick(cyberColours);

    nodeDrawer(context, tree);

    context.restore();
  }

}

const randomFillColour = (nodeDrawer) => {
  return (context, tree) => {
    context.save();
    const r = random.rangeFloor(0, 256);
    const g = random.rangeFloor(0, 256);
    const b = random.rangeFloor(0, 256);
    context.fillStyle = `rgb(${r},${g},${b})`;

    nodeDrawer(context, tree);

    context.restore();
  }
}

const depthDependentConnectionDraw = (context, start, end) => {
  const width = depth(start)**2;
  context.save();

  context.lineWidth = width;

  context.beginPath();
  context.moveTo(...start.pos);
  context.lineTo(...end.pos);
  context.stroke();

  context.restore();
}

const standardConnectionDraw = (context, start, end) => {
  context.beginPath();
  context.moveTo(...start.pos);
  context.lineTo(...end.pos);
  context.stroke();
};

const depthDependentNodeDraw = (context, tree, factor) => {
  if(factor === undefined) {
    factor = 4;
  }
  const radius = depth(tree)**factor;
  context.beginPath();
  context.arc(...tree.pos, radius, 0, 2 * Math.PI);
  context.fill();
}

const standardNodeDraw = (context, tree) => {
  context.beginPath();
  context.arc(...tree.pos, 5, 0, 2 * Math.PI);
  context.fill();
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
    drawTree(context, element, nodeDraw, connectionDraw);
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

const createRandomRange = (from, to) => {
  return (_) => random.rangeFloor(from, to);
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

const verticalShiftFilter = (context, amount, frequency, width, height) => {
  for(let i = 0; i < width; ++i) {
    const offset = Math.floor(random.noise2D(i, 0, frequency) * amount);
    const copySlice = context.getImageData(i, 0, 1, height);
    context.putImageData(copySlice, i, offset);
  }
}

const horizontalShiftFilter = (context, amount, frequency, width, height) => {
  for(let i = 0; i < height; ++i) {
    const offset = Math.floor(random.noise2D(0, i, frequency) * amount);
    const copySlice = context.getImageData(0, i, width, 1);
    context.putImageData(copySlice, offset, i);
  }
}

const repeatShiftFilter = (context, amount, frequency, width, height, times) => {
  for(let i = 0; i < times; ++i) {
      verticalShiftFilter(context, amount, frequency, width, height);
      horizontalShiftFilter(context, amount, frequency, width, height);
  }
}

const randomRepeatShiftFilter = (context, amount, frequency, width, height, times) => {
  for(let i = 0; i < times; ++i) {
    if(Math.random() < 0.5) {
      console.log("1");
      verticalShiftFilter(context, amount, frequency, width, height);
      horizontalShiftFilter(context, amount, frequency, width, height);
    } else {
      console.log("2");
      horizontalShiftFilter(context, amount, frequency, width, height);
      verticalShiftFilter(context, amount, frequency, width, height);
    }
  }
}
const treeGen = new TreeGenerator(6, createConstNum(4), createRadialDensity(100));
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
    context.fillStyle = "darkmagenta";
    context.fillRect(0, 0, width, height);

    context.save();
    context.globalAlpha = 1;
    // context.filter = "blur(1px)";
    context.strokeStyle = "darkorange";
    context.fillStyle = "darkorange";
    context.translate(width / 2, height / 2);
    drawTree(context, genTree, randomBackgroundColour(depthDependentNodeDraw), noOp);
    randomRepeatShiftFilter(context, 50, 0.04, width, height, 150);
    context.restore();
  };
};

canvasSketch(sketch, settings);
