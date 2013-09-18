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

var CANVAS_WIDTH = 350;
var CANVAS_HEIGHT = 500;
var SCALE = 30; // 1 meter = 30 pixels

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

// same fixture definition for all objects
var fixDef = new b2FixtureDef;
fixDef.density = 1.0;
fixDef.friction = 0.1;
fixDef.restitution = 0.2;

_plinko = function(world) {
  nrow = 6;
  ncol = 7;

  // a ficture definition defines the properties of the object
  var fixDef = new b2FixtureDef;
  fixDef.density = 1.0;
  fixDef.friction = 0.1;
  fixDef.restitution = 0.2;

  // a body definition defines where it is and how it interacts w/ the world
  var bodyDef = new b2BodyDef;
  bodyDef.type = b2Body.b2_staticBody,
  bodyDef.position.x = CANVAS_WIDTH / 2 / SCALE,
  bodyDef.position.y = CANVAS_HEIGHT / SCALE;
  
  //ground
  fixDef.shape = new b2PolygonShape;
  // half width, half height.
  fixDef.shape.SetAsBox((600 / SCALE) / 2, (10/SCALE) / 2);
  world.CreateBody(bodyDef).CreateFixture(fixDef);

  var marbleRadius = 0.3;
  var pegRadius = 0.1;
  var binHeight = 4;
  var binWidth = 5/SCALE;
  
  //pegs
  fixDef.shape = new b2CircleShape(pegRadius);
  for (var r=0; r < nrow; r++) {
    for (var c=0; c < ncol; c++) {
      bodyDef.position.x = CANVAS_WIDTH / (ncol + 1) * (c + 1) / SCALE;
      bodyDef.position.y = ((CANVAS_HEIGHT / SCALE) - binHeight) /
                           (nrow + 1) *
                           (r + 1);
      world.CreateBody(bodyDef).CreateFixture(fixDef);
    }
  }
  
  //bins
  for (var c=0; c < ncol + 2; c++) {
    fixDef.shape = new b2PolygonShape;
    fixDef.shape.SetAsBox(binWidth / 2, binHeight / 2);
    bodyDef.position.x = CANVAS_WIDTH / (ncol + 1) * c / SCALE;
    bodyDef.position.y = (CANVAS_HEIGHT / SCALE) - (binHeight / 2);
    world.CreateBody(bodyDef).CreateFixture(fixDef);
  }
  
  //walls
  function drawWall(xpos) {
    fixDef.shape = new b2PolygonShape;
    fixDef.shape.SetAsBox(binWidth / 2, CANVAS_HEIGHT / 2 / SCALE);
    bodyDef.position.x = xpos;
    bodyDef.position.y = CANVAS_HEIGHT / 2 / SCALE;
    world.CreateBody(bodyDef).CreateFixture(fixDef);
  }
  drawWall(0);
  drawWall(CANVAS_WIDTH / SCALE);

  //falling marble
  bodyDef.type = b2Body.b2_dynamicBody;
  fixDef.shape = new b2CircleShape(marbleRadius);
  bodyDef.position.x = CANVAS_WIDTH / SCALE / 2 + (Math.random()-0.5)*0.1;
  bodyDef.position.y = 0;
  var marble = world.CreateBody(bodyDef).CreateFixture(fixDef);
  var marble2 = world.CreateBody(bodyDef).CreateFixture(fixDef);
}

//make a standard world, with standard size, gravity, object properties, etc. returns the empty world.
_makeWorld = function() {
  var world = new b2World(
     new b2Vec2(0, 10), //gravity
     true               //allow sleep
  );
  return world;
}

//this should add a viz area to the results section (like hist) and animate physics on world for specified number of time steps. return world as above. (note: possibly instead of animating right away we should render first frame and then have a "simulate" button, so that we can watch when we want…)
_animatePhysics = function(steps, world) {
  var initPositions = [];
  var body = world.GetBodyList();
  while (body != null) {
    var initX = body.GetPosition().x;
    var initY = body.GetPosition().y;
    var initPos = new b2Vec2(initX, initY);
    initPositions.push(initPos);
    body = body.GetNext();
  }

  function simulate(canvas, steps) {
    var body = world.GetBodyList();
    for (var i=0; i<initPositions.length; i++) {
      var initPos = initPositions[i];
      body.SetPosition(initPos);
      body.SetAwake(true);
      body = body.GetNext();
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
          ,  8//10       //velocity iterations
          ,  3//10       //position iterations
        );
      }
      
      world.DrawDebugData();
      world.ClearForces();
      
      stepsSoFar++;
      requestAnimFrame(function() {update(stepsSoFar);});
    };

    requestAnimFrame(function() {update(0);});
  }

  return function($div) {
    $div.append("<br/>");
    var $physicsDiv = $("<div>").appendTo($div);
    var $canvas = $("<canvas/>").appendTo($physicsDiv);
    $canvas.attr("width", CANVAS_WIDTH)
           .attr("height", CANVAS_HEIGHT)
           .attr("style", "background-color:#333333;");
    $physicsDiv.append("<br/>");
    var $button = $("<button>Simulate</button>").appendTo($physicsDiv);
    $button.click(function() {
      simulate($canvas, steps);
    });
    return "";
  };

};

//add a circle at specified position (x and y are between 0 and 1) and radius. return world with circle added.
_addCircle = function(world, x,y,r,isStatic) {
  return world;
}

//width and height are 1/2 widths!
_addRect = function(world, x,y,w,h,isStatic) {
}

//get the objects in a world, in some format that's easy to use in church. (e.g. a list of objects, where each object is a list of (type x y ..) or such.)
_getObjects = function(world) {
}

//this should run physics forward on world for specified number of time steps. return resulting world. no display or animation. (and no timeouts -- as fast as simulator runs…)
_runPhysics = function(steps, world) {
  return function($div) {
    return "";
  };
}
