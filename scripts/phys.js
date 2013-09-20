//var intuitivePhysics = {}

/*
shim layer with setTimeout fallback
from paul irish:
http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
*/
window.requestAnimFrame = (function(){
return  window.requestAnimationFrame       || 
        window.webkitRequestAnimationFrame || 
        window.mozRequestAnimationFrame    || 
        window.oRequestAnimationFrame      || 
        window.msRequestAnimationFrame     ||
        function(/* function */ callback,
                 /* DOMElement */ element){
          window.setTimeout(callback, 1000 / 60);
        };
})();

var requestId;

/*
function start() {
    if (!requestId) {
       loop();
    }
}*/

function stopAnim() {
  if (requestId) {
    window.cancelAnimationFrame(requestId);
    requestId = undefined;
  }
}

var SCALE = 30; // 1 meter = 30 pixels
_worldWidth = 350;
_worldHeight = 500;

var  b2World = Box2D.Dynamics.b2World,
     b2Vec2 = Box2D.Common.Math.b2Vec2,
     b2AABB = Box2D.Collision.b2AABB,
     b2BodyDef = Box2D.Dynamics.b2BodyDef,
     b2Body = Box2D.Dynamics.b2Body,
     b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
     b2Fixture = Box2D.Dynamics.b2Fixture,
     b2MassData = Box2D.Collision.Shapes.b2MassData,
     b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
     b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
     b2DebugDraw = Box2D.Dynamics.b2DebugDraw,
     b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef;

var world = new b2World(
   new b2Vec2(0, 10), //gravity
   true               //allow sleep
);

// same fixture definition for all objects
var fixDef = new b2FixtureDef;
fixDef.density = 1.0;
fixDef.friction = 0.1;
fixDef.restitution = 0.2;

var bodyDef = new b2BodyDef;
bodyDef.angle = 0;

function listToArray(list, recurse) {
	var array = [];
	while (list.length > 0) {
		var left = list[0];
		array.push((Array.isArray(left) && recurse) ? listToArray(left) : left);
		list = list[1];
	}
	return array;
}

var the_empty_list = [];

function arrayToList(arr) {
	if (arr.length == 0) {
		return the_empty_list;
	} else {
		return [arr[0], arrayToList(arr.slice(1))];
	}
}

function clearWorld() {
  var count = world.GetBodyCount();
  for (var i=0; i<count; i++) {
    var body = world.GetBodyList();
    world.DestroyBody(body);
  }
}

//take church world maker and apply it to the box2d world
function applyWorld(initialWorld) {
  var worldList = churchWorld_to_jsWorld(initialWorld);
  for (var i=0; i<worldList.length; i++) {
    var worldObj = worldList[i];
    var shapeProps = worldObj[0];
    var shape = shapeProps[0];
    var isStatic = shapeProps[1];
    var dims = shapeProps[2];
    var position = worldObj[1];
    if (isStatic) {
      bodyDef.type = b2Body.b2_staticBody;
    } else {
      bodyDef.type = b2Body.b2_dynamicBody;
    }
    if (shape == "circle") {
      var r = dims[0] / SCALE;
      fixDef.shape = new b2CircleShape(r);
    } else if (shape == "rect") {
      var w = dims[0] / SCALE;
      var h = dims[1] / SCALE;
      fixDef.shape = new b2PolygonShape;
      fixDef.shape.SetAsBox(w, h);
    } else {
      console.log("error 0");
    }
    bodyDef.position.x = position[0] / SCALE;
    bodyDef.position.y = position[1] / SCALE;
    world.CreateBody(bodyDef).CreateFixture(fixDef);
    /*if (shape == "rect") {
      console.log(myShape.GetBody().GetFixtureList().GetShape().GetVertices());
    }*/
  }
  return initialWorld;
}

function jsWorld_to_churchWorld(world) {
  return arrayToList(world.map(function(object) {
    return arrayToList(object.map(function(property) {
      return arrayToList(property.map(function(element) {
        if (Object.prototype.toString.call(element) === '[object Array]') {
          return arrayToList(element);
        } else {
          return element;
        }
      }));
    }));
  }));
}

function churchWorld_to_jsWorld(world) {
  return listToArray(world).map(function(object) {
    var object = listToArray(object).map(function(property) {
      return listToArray(property);
    });
    object[0][2] = listToArray(object[0][2]);
    return object;
  });
}

function churchWorld_from_bodyList(body) {
  var worldList = [];
  while (body) {
    var isStatic;
    if (body.GetType() == 2) {
      var isStatic = false;
    } else {
      var isStatic = true;
    }
    var shapeInt = body.GetFixtureList().GetType();
    var shape;
    var dims;
    if (shapeInt == 0) {
      shape = "circle";
      dims = [body.GetFixtureList().GetShape().GetRadius() * SCALE];
    } else {
      shape = "rect";
      vertices = body.GetFixtureList().GetShape().GetVertices();
      dims = [vertices[2].x * 2 * SCALE, vertices[2].y * 2 * SCALE];
    }
    var x = body.GetPosition().x * SCALE;
    var y = body.GetPosition().y * SCALE;
    worldList.push([ [shape, isStatic, dims], [x, y] ]);
    body = body.GetNext();
  }
  return jsWorld_to_churchWorld(worldList);
}

function getDynamicObjPositions(churchWorld) {
  var worldList = churchWorld_to_jsWorld(churchWorld);
  var positions = [];
  for (var i=0; i<worldList.length; i++) {
    var worldObj = worldList[i];
    var isStatic = worldObj[0][1];
    if (isStatic == false) {
      positions.push(worldObj[1]);
    }
  }
  return positions;
}

_emptyWorld = arrayToList([]);

//add a circle at specified position (x and y are between 0 and 1) and radius. return world with circle added.
_addCircle = function(churchWorld, x, y, r, isStatic) {
  var jsWorld = churchWorld_to_jsWorld(churchWorld);
  jsWorld.push( [ ["circle", isStatic, [r]],
                    [x, y] ] );
  return jsWorld_to_churchWorld(jsWorld);
}

_addRect = function(churchWorld, x, y, w, h, isStatic) {
  var jsWorld = churchWorld_to_jsWorld(churchWorld);
  jsWorld.push( [ ["rect", isStatic, [w, h]],
                    [x, y] ] );
  return jsWorld_to_churchWorld(jsWorld);
}

_plinkoWhichBin = function(finalWorld, ncol) {
  var positions = getDynamicObjPositions(finalWorld);
  var x = positions[0][0];
  return Math.round(x / (_worldWidth / ncol));
}

_plinkoWorld = function(nrow, ncol) {
  var pegRadius = 3;
  var wallWidth = 5;
  var binHeight = 120;
  //ground
  var ground = [ [ "rect", true, [_worldWidth, wallWidth] ],
                 [ _worldWidth / 2, _worldHeight ]];
  //pegs
  var pegs = [];
  var pegShapeProperties = ["circle", true, [pegRadius]];
  for (var r=0; r<nrow; r++) {
    for (var c=0; c<ncol; c++) {
      var xpos = _worldWidth / (ncol + 1) * (c + 1);
      var ypos = (_worldHeight - binHeight) / (nrow + 2) * (r+1);
      pegs.push([ pegShapeProperties,
                  [ xpos, ypos]]);}}
  //walls
  var wallShapeProperties = ["rect", true, [wallWidth, _worldHeight]];
  function wall(xpos) {return [wallShapeProperties, [xpos, _worldHeight / 2]];}
  var walls = [wall(0), wall(_worldWidth)];
  //bins
  var bins = [];
  var binShapeProperties = ["rect", true, [wallWidth, binHeight]];
  var ypos = _worldHeight - (binHeight/2);
  for (var c=0; c < ncol + 2; c++) {
    var xpos = _worldWidth / (ncol+1) * c;
    bins.push([binShapeProperties, [xpos, ypos]])}
  return jsWorld_to_churchWorld([ground].concat(pegs, walls, bins));
}

_runPhysics = function(steps, initialWorld) {
  clearWorld();
  applyWorld(initialWorld);
  for (var s=0; s<steps; s++) {
    world.Step(
         1 / 60   //frame-rate
      ,  10       //velocity iterations
      ,  10       //position iterations
    );
  }
  return churchWorld_from_bodyList(world.GetBodyList());
}

_animatePhysics = function(steps, initialWorld) {
  function simulate(canvas, steps, initializeStep) {
    if (initializeStep) {
      clearWorld();
      applyWorld(initialWorld);
    }
    //setup debug draw
    var debugDraw = new b2DebugDraw();
    debugDraw.SetSprite(canvas[0].getContext("2d"));
    debugDraw.SetDrawScale(SCALE);
    debugDraw.SetFillAlpha(0.3);
    debugDraw.SetLineThickness(1.0);
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
    world.SetDebugDraw(debugDraw);

    function update(stepsSoFar) {
      if (stepsSoFar < steps) {
        world.Step(
             1 / 60   //frame-rate
          ,  10       //velocity iterations
          ,  10       //position iterations
        );
      } //else {
        //stopAnim();
      //}
      
      world.DrawDebugData();
      world.ClearForces();
      
      stepsSoFar++;
      requestId = requestAnimFrame(function() {update(stepsSoFar);});
    };

    requestAnimFrame(function() {update(0);});
  }
  
  return function($div) {
    var $physicsDiv = $("<div>").appendTo($div);
    $physicsDiv.append("<br/>");
    var $canvas = $("<canvas/>").appendTo($physicsDiv);
    $canvas.attr("width", _worldWidth)
           .attr("style", "background-color:#333333;")
           .attr("height", _worldHeight);
    $physicsDiv.append("<br/>");
    var initializeStep = true;
    simulate($canvas, 0, initializeStep);
    initializeStep = false;
    var $button = $("<button>Simulate</button>").appendTo($physicsDiv);
    $button.click(function() {
      simulate($canvas, steps, initializeStep);
      initializeStep = true;
    });
    var $clearButton = $("<button>Delete Animation Window</button>")
    $clearButton.appendTo($physicsDiv);
    $clearButton.click(function() {
      var count = world.GetBodyCount();
      for (var i=0; i<count; i++) {
        var body = world.GetBodyList();
        world.DestroyBody(body);
      }
      stopAnim();
      $physicsDiv.remove();
    });
    return "";
  };
}

_makeTowerWorld = function() {
  var wallWidth = 5;
  var tower = [ [ [ "rect", true, [_worldWidth, wallWidth] ],
                   [ _worldWidth / 2, _worldHeight ] ] ];
  function makeBlock() {
    var block = Array(2);
    block[0] = Array(3);
    block[1] = Array(2);
    block[0][0] = "rect";
    block[0][1] = false;
    return block;
  }
  function erinUniform(a,b) {
    return a + (b-a)*Math.random();
  }
  function randDim() {
    return Math.round(erinUniform(10,50));
  }
  function addBlock(prevObj, center) {
    var block = makeBlock();
    var w = randDim();
    var h = randDim();
    block[0][2] = [w, h];
    var prevX = prevObj[1][0];
    var prevY = prevObj[1][1];
    var prevW = prevObj[0][2][0];
    var prevH = prevObj[0][2][1];
    var x;
    if (center) {
      x = prevX;
    } else {
      x = erinUniform(prevX - (prevW/2) - (w/2), prevX + (prevW/2) + (w/2));
    }
    var y = prevY - prevH - h;
    block[1] = [x, y];
    tower.push(block);
  }
  var center = true;
  for (var i=0; i<5; i++) {
    var previous = tower[tower.length - 1];
    addBlock(previous, center);
    center = false;
  }
  console.log(format_result(jsWorld_to_churchWorld(tower)));
  return jsWorld_to_churchWorld(tower);
}

/*_jsDoesTowerFall = function(churchWorlds) {
  function worldSort(a,b) {
    return a[1][1] - b[1][1];
  }
  function approxEqual(a,b) {
    var eps = 10; //pixels
    return Math.abs(a - b) < eps;
  }
  var arrayWorlds = listToArray(churchWorlds);
  var finalWorld = churchWorld_to_jsWorld(arrayWorlds[0]).sort(worldSort);
  var initialWorld = churchWorld_to_jsWorld(arrayWorlds[1]).sort(worldSort);
  var towerFalls = false;
  for (var i=0; i<finalWorld.length; i++) {
    var initialObj = initialWorld[i];
    var finalObj = finalWorld[i];
    if (!approxEqual(initialObj[1][1], finalObj[1][1])) {
      towerFalls = true;
      return towerFalls;
    }
  }
  return towerFalls;
}*/

_max = function(listyList) {
  return Math.max.apply(Math, listToArray(listyList));
}
_min = function(listyList) {
  return Math.min.apply(Math, listToArray(listyList));
}
