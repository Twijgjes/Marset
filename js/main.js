// Defining a namespace
var MARSET = MARSET || {
  VERSION: '0.0.1'
};

// Game variable for "static" access, very useful when debugging
var game;

window.onload = function() {
  
  // Create a new Game object when the page is loaded
  game = new MARSET.Game();
  // console.log(game);
  game.init();
  game.update();

};

// This is the game class, it also contains game controller logic
MARSET.Game = function(userSettings) {
  
  // Disable scrollbars
  document.documentElement.style.overflow = 'hidden';  // firefox, chrome
  document.body.scroll = "no"; // ie only

  // - Global variables -
  this.terrainWidthExtents = 100;
  this.terrainDepthExtents = 100;
  
  // Graphics variables
  this.container;
  this.stats;
  this.camera;
  this.controls;
  this.scene;
  this.renderer;
  //this.texture;
  this.clock = new THREE.Clock();

  // Physics
  this.physics;

  // GUI - dat.gui (contains terrain gen vars)
  this.guiController;

  // Terrain generator
  this.terrainGenerator;

  // Obsolete vvvvv
  // this.time = 0;
  // this.objectTimePeriod = 3;
  // this.timeNextSpawn = time + objectTimePeriod;
  // this.maxNumObjects = 30;
  // this.terrainHalfWidth;
  // this.terrainHalfDepth;

  this.updateObjs = new Array();
  this.lateUpdateObjs = new Array();

  window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame     || 
            function(/* function */ callback, /* DOMElement */ element){
              window.setTimeout(callback, 1000 / 60);
            };
  })();

};

MARSET.Game.prototype = {

  init: function() {
    
    this.guiController = new MARSET.GuiController(this);
    this.initGraphics(this.terrainGenerator);
    this.terrainGenerator = new MARSET.TerrainGenerator(this, this.guiController);
    this.physics = new MARSET.Physics(this, this.terrainGenerator, this.guiController);
    
    // Implement later
    /*
    var title = new MARSET.Title();
    this.pause = false;
    this.update();
    this.render();
    this.pause = true;
    */

  },

  initGraphics: function() {
    // var terrainHalfWidth = terrainWidth / 2;
    // var terrainHalfDepth = terrainDepth / 2;

    this.container = document.getElementById( 'container' );
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor( 0xbfd1e5 );
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.container.innerHTML = "";
    this.container.appendChild( this.renderer.domElement );
    this.stats = new Stats();
    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.top = '0px';
    this.container.appendChild( this.stats.domElement );
    this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 );
    this.scene = new THREE.Scene();
    // this.camera.position.y = hData[ terrainHalfWidth + terrainHalfDepth * this.terrainWidth ] * ( this.terrainMaxHeight - this.terrainMinHeight ) + 5;
    // this.camera.position.z = this.terrainDepthExtents / 2;
    this.camera.position.y = 100;
    this.camera.position.z = 100;
    this.camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );
    this.controls = new THREE.OrbitControls( this.camera );

    // Lighting setup
    var light = new THREE.DirectionalLight( 0xffffff, .8 );
    light.position.set( 100, 100, 50 );
    light.castShadow = true;
    var dLight = 200;
    var sLight = dLight * 0.25;
    light.shadow.camera.left = -sLight;
    light.shadow.camera.right = sLight;
    light.shadow.camera.top = sLight;
    light.shadow.camera.bottom = -sLight;
    light.shadow.camera.near = dLight / 30;
    light.shadow.camera.far = dLight;
    light.shadow.mapSize.x = 1024 * 2;
    light.shadow.mapSize.y = 1024 * 2;
    this.scene.add(light);
    var ambientLight = new THREE.AmbientLight( 0xffffff, .4 ); // soft white light
    this.scene.add( ambientLight );

    window.addEventListener( 'resize', this.onWindowResize, false );
  },

  update: function() {
    //requestAnimationFrame(this.update.bind(this));
    //this.render();
    this.stats.update();
    if(!this.pause){
      /* FPS setup */
      this.fps_now = new Date;
      this.deltaTime = (this.fps_now - this.fps_last)/1000;
      this.fps = 1000/(this.fps_now - this.fps_last);
      this.fps_last = this.fps_now;
      //console.log(this.deltaTime);
  
      for(var i = this.updateObjs.length - 1; i >= 0; i--){
        if(this.updateObjs[i].destroyFlag == true){
          this.updateObjs.splice(i, 1);
          continue;
        }
        this.updateObjs[i].update(this.deltaTime);
      }
  
      for(var i = this.lateUpdateObjs.length - 1; i >= 0; i--){
        if(this.lateUpdateObjs[i].destroyFlag == true){
          this.lateUpdateObjs.splice(i, 1);
          continue;
        }
        this.lateUpdateObjs[i].lateUpdate(this.deltaTime);
      }
    }

    this.render();

    if(!this.pause) 
      requestAnimFrame(function(){ this.update()}.bind(this) );

  },

  render: function () {
    var deltaTime = this.clock.getDelta();
    this.physics.updatePhysics( deltaTime );
    this.controls.update( deltaTime );
    this.renderer.render( this.scene, this.camera );
    this.time += deltaTime;
  },

  onWindowResize: function() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
  },

  // Dont use this yet
  restart: function(){
    this.updateObjs = new Array();
    this.lateUpdateObjs = new Array();
    
    var title = new MARSET.Title();

    this.pause = false;
    // this.fps_last = (new Date);
    this.update();

    // console.log("restarting!");
  },

  addUpdateObj: function(obj){
    this.updateObjs.push(obj);
    if(obj.destroyFlag == undefined) obj["destroyFlag"] = false;
  },

  addLateUpdateObj: function(obj){
    this.lateUpdateObjs.push(obj);
    if(obj.destroyFlag == undefined) obj["destroyFlag"] = false;
  },
  
};

MARSET.GuiController = function(game){
  // Variables
  this.game = game;
  this.cratersPerSquareUnit = 0.022888;
  //this.terrainWidth = 256;
  //this.terrainDepth = 256;
  this.terrainSize = 256;
  this.defaultHeight = 15;
  this.shallowMode = false;
  this.minRadius = 20;
  this.maxRadius = 75;
  this.heightData = null;
  this.terrainMinHeight = -20;
  this.terrainMaxHeight = 20;
  this.datGui = new dat.GUI();

  // TODO: put this in the prototype
  this.regenerate = function(){
    console.log("Regenerating with: " + 
      // this.terrainWidth + " " +
      // this.terrainDepth + " " +
      this.terrainSize + " " +
      this.cratersPerSquareUnit + " " +
      this.defaultHeight + " " +
      this.shallowMode + " " +
      this.minRadius + " " +
      this.maxRadius + " "
    );
    this.terrainWidth = Math.floor(this.terrainWidth);
    this.terrainDepth = Math.floor(this.terrainDepth);
    this.terrainSize  = Math.floor(this.terrainSize );
    this.minRadius    = Math.floor(this.minRadius   );
    this.maxRadius    = Math.floor(this.maxRadius   );
    this.game.scene.remove(this.game.terrainGenerator.terrainMesh);
    this.game.terrainGenerator.generateTerrain();
    // tWidth, tDepth, cratersPerSqUnit, dampedMode, minRadius, maxRadius, defaultHeight
    //this.game.terrainGenerator.initTerrainMesh(this.heightData, this.terrainSize, this.terrainSize);
  };
  this.removeTerrain = function(){
    this.game.scene.remove(this.game.terrainMesh);
  };
  this.test = function(){
    alert('Hallo?');
  };

  // Put the variables in the dat.gui
  this.init();
}

MARSET.GuiController.prototype = {

  init: function(){
    this.datGui.add(this, 'defaultHeight');
    this.datGui.add(this, 'cratersPerSquareUnit', 0, .1);
    this.datGui.add(this, 'minRadius', 1, 300);
    this.datGui.add(this, 'maxRadius', 1, 300);
    //this.datGui.add(guiFunctions, 'terrainWidth', 16, 2048);
    //this.datGui.add(guiFunctions, 'terrainDepth', 16, 2048);
    this.datGui.add(this, 'terrainSize', 16, 2048);
    this.datGui.add(this, 'shallowMode');
    this.datGui.add(this, 'regenerate');
    this.datGui.add(this, 'removeTerrain');
    this.datGui.add(this, 'test');
  },

}

MARSET.TerrainGenerator = function(game, settings){
  this.game = game;
  this.settings = settings;
  this.heightData;
  this.terrainMesh;
  this.generateTerrain();
}

MARSET.TerrainGenerator.prototype = {

  generateTerrain: function(){

    var totalHeightPoints = this.settings.terrainSize * this.settings.terrainSize;
    if(this.heightData == null || this.heightData.length != totalHeightPoints){
      this.heightData = new Float32Array(totalHeightPoints);
    }
    var cratersN = Math.round(totalHeightPoints * this.settings.cratersPerSquareUnit);

    console.log(cratersN);

    this.generateCraters( 
      this.heightData, 
      cratersN, 
      this.settings.terrainSize, 
      this.settings.terrainSize, 
      this.settings.shallowMode, 
      this.settings.minRadius, 
      this.settings.maxRadius, 
      this.settings.defaultHeight 
    );
    this.initTerrainMesh();
  },

  initTerrainMesh: function(){
    var geometry = new THREE.PlaneBufferGeometry( 100, 100, this.settings.terrainSize - 1, this.settings.terrainSize - 1 );
    geometry.rotateX( -Math.PI / 2 );
    var vertices = geometry.attributes.position.array;
    geometry.addAttribute( 'color', new THREE.BufferAttribute( new Float32Array(vertices.length), 3) );
    var colors = geometry.attributes.color.array;
    //var colors = geometry.attributes.color.array;
    
    for ( var i = 0, j = 0, l = vertices.length; i < l; i++, j += 3 ) {
      // j + 1 because it is the y component that we modify
      vertices[ j + 1 ] = this.heightData[ i ];
      //color[j+1] = new THREE.Color(171, 121, 94);
    }

    var yHigh = 0;
    var yLow = 0;
    for (var k = 0; k < colors.length; k += 3){
      //colors[k] = 3;
      yHigh = vertices[k+1] > yHigh ? vertices[k+1] : yHigh;
      yLow = vertices[k+1] < yLow ? vertices[k+1] : yLow;
      var clrAdd = 10;
      // Variation in height stays between -8 and 8.
      var total = 50;
      var start = vertices[k+1] + 8;
      var range = 16;
      clrAdd -= (total / range) * start;
      // Clr lo = 30
      // Clr hi = -40
      colors[k]   = (171 + clrAdd) / 255;
      colors[k+1] = (121 + clrAdd) / 255;
      colors[k+2] = (94  + clrAdd) / 255;
    }
    //console.log("vertex y high: " + yHigh + " vertex yLow: " + yLow);
    geometry.attributes.color.needsUpdate = true;
    geometry.computeVertexNormals();
    var groundMaterial = new THREE.MeshPhongMaterial( { 
      //color: "rgb(171, 121, 94)", 
      shading: THREE.FlatShading, 
      shininess: 0,
      vertexColors: THREE.VertexColors
    } );
    var terrainMesh = new THREE.Mesh( geometry, groundMaterial );
    //console.log(terrainMesh);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    this.game.scene.add( terrainMesh );
    this.terrainMesh = terrainMesh;
  },

  generateCraters: function (data, craters, width, depth, shallowMode, minRadius, maxRadius, defaultHeight){
    for ( var n = 0; n < data.length; n++ ) {
      data[n] = defaultHeight;
    }

    for ( var c = 0; c < craters; c++ ) {
      var radius = minRadius + Math.random() * (maxRadius - minRadius);
      var dimension = Math.round(radius);
      var craterData = this.generateCrater(dimension, dimension, 1 + Math.random() * 2);
      var x = Math.round( Math.random() * ( width + radius * 2 ) - radius);
      var y = Math.round( Math.random() * ( depth + radius * 2 ) - radius);
      var position = new THREE.Vector2(x, y);
      for ( var i = 0; i < craterData.length; i++ ) {
        if( craterData[i] == 0 )
          continue;
        var cdx = i % dimension;
        var cdy = i > dimension ? Math.floor(i / dimension) : 0;
        var di = (y + cdy) * depth + x + cdx;
        //console.log("i: " + i + " cdx: " + cdx + " cdy: " + cdy);

        if (di >= 0 && di < data.length ){
          if(shallowMode) {
            data[di] = defaultHeight + craterData[i] < data[di] ? defaultHeight + craterData[i] : data[di];
          }
          else {
            var result = data[di] + craterData[i];
            var divisor = result < 0 ? 1 + (result * -1) : 1;
            craterData[i] /= divisor;
            data[di] += craterData[i];
          }
          
        }
      }
    }
    return data;
  },

  generateCrater: function (width, depth, maxCraterDepth){
    var offset = Math.PI; // The offset over the sine wave
    var range = Math.PI / 6; // The range over the sine wave
    var radius = width/2; // The radius of the crater
    var maxHeight = 5;
    var size = width * depth;
    var data = new Float32Array(size);
    var middle = new THREE.Vector2(width/2, depth/2);
    var i = 0;
    var maxLo = 0;
    var maxHi = 0;

    for ( var y = 0; y < depth; y++ ) {
      for ( var x = 0; x < width; x++ ) {
        var pos = new THREE.Vector2(x, y);
        // Calculate the normalized distance of the heightmap point from the crater center
        var distance = middle.distanceTo(pos);
        if(distance < radius){
          var normDist =  Math.PI + (distance / radius) * (Math.PI/2);
      
          // Get the value by passing it in cos or sin or something
          var height = Math.cos(normDist);
          height *= maxCraterDepth;
          maxLo = height < maxLo ? height : maxLo;
          maxHi = height > maxHi ? height : maxHi;
  
          //height *= maxHeight;
          data[i] = isNaN(height) ? data[i-1] : height;
        }
        else 
        {
          data[i] = 0;
        }
        
        i++;
      }
    }
    //console.log("Crater creator:");
    //console.log("Max height: " + maxHi + " max low: " + maxLo);
    return data;
  },

}

MARSET.Physics = function(game, terrainGenerator, settings){
  // Reference variables
  this.game = game;
  this.terrainGenerator = terrainGenerator;
  this.settings = settings;

  // Physics variables
  this.collisionConfiguration;
  this.dispatcher;
  this.broadphase;
  this.solver;
  this.physicsWorld;
  this.terrainBody;
  this.dynamicObjects = [];
  this.transformAux1 = new Ammo.btTransform();
  this.ammoHeightData = null;
  this.initPhysics();
}

MARSET.Physics.prototype = {

  initPhysics: function(){
    // Physics configuration
    this.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    this.dispatcher = new Ammo.btCollisionDispatcher( this.collisionConfiguration );
    this.broadphase = new Ammo.btDbvtBroadphase();
    this.solver = new Ammo.btSequentialImpulseConstraintSolver();
    this.physicsWorld = new Ammo.btDiscreteDynamicsWorld( this.dispatcher, this.broadphase, this.solver, this.collisionConfiguration );
    this.physicsWorld.setGravity( new Ammo.btVector3( 0, -6, 0 ) );
    // Create the terrain body
    groundShape = this.createTerrainShape( 
      this.terrainGenerator.heightData, 
      this.settings.terrainSize, 
      this.settings.terrainSize, 
      this.settings.terrainMinHeight, 
      this.settings.terrainMaxHeight 
    );
    var groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    // Shifts the terrain, since bullet re-centers it on its bounding box.
    groundTransform.setOrigin( new Ammo.btVector3( 0, ( this.settings.terrainMaxHeight + this.settings. terrainMinHeight ) / 2, 0 ) );
    var groundMass = 0;
    var groundLocalInertia = new Ammo.btVector3( 0, 0, 0 );
    var groundMotionState = new Ammo.btDefaultMotionState( groundTransform );
    var groundBody = new Ammo.btRigidBody( new Ammo.btRigidBodyConstructionInfo( groundMass, groundMotionState, groundShape, groundLocalInertia ) );
    this.physicsWorld.addRigidBody( groundBody );
  },

  updatePhysics: function ( deltaTime ) {
    this.physicsWorld.stepSimulation( deltaTime, 10 );
    // Update objects
    for ( var i = 0, il = this.dynamicObjects.length; i < il; i++ ) {
      var objThree = this.dynamicObjects[ i ];
      var objPhys = objThree.userData.physicsBody;
      var ms = objPhys.getMotionState();
      if ( ms ) {
        ms.getWorldTransform( transformAux1 );
        var p = transformAux1.getOrigin();
        var q = transformAux1.getRotation();
        objThree.position.set( p.x(), p.y(), p.z() );
        objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
      }
    }
  },

  createTerrainShape: function( hData, terrainWidth, terrainDepth, terrainMinHeight, terrainMaxHeight) {
    // TODO: remove use for this.
    var terrainWidthExtents = 100;
    var terrainDepthExtents = 100;

    // This parameter is not really used, since we are using PHY_FLOAT height data type and hence it is ignored
    var heightScale = 1;
    // Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
    var upAxis = 1;
    // hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
    var hdt = "PHY_FLOAT";
    // Set this to your needs (inverts the triangles)
    var flipQuadEdges = false;
    // Creates height data buffer in Ammo heap
    ammoHeightData = Ammo._malloc(4 * terrainWidth * terrainDepth);
    // Copy the javascript height data array to the Ammo one.
    var p = 0;
    var p2 = 0;
    for ( var j = 0; j < terrainDepth; j++ ) {
      for ( var i = 0; i < terrainWidth; i++ ) {
        // write 32-bit float data to memory
        Ammo.HEAPF32[ ammoHeightData + p2 >> 2 ] = hData[ p ];
        p++;
        // 4 bytes/float
        p2 += 4;
      }
    }
    // Creates the heightfield physics shape
    var heightFieldShape = new Ammo.btHeightfieldTerrainShape(
      terrainWidth,
      terrainDepth,
      ammoHeightData,
      heightScale,
      terrainMinHeight,
      terrainMaxHeight,
      upAxis,
      hdt,
      flipQuadEdges
      );
    // Set horizontal scale
    var scaleX = terrainWidthExtents / ( terrainWidth - 1 );
    var scaleZ = terrainDepthExtents / ( terrainDepth - 1 );
    heightFieldShape.setLocalScaling( new Ammo.btVector3( scaleX, 1, scaleZ ) );
    heightFieldShape.setMargin( 0.05 );
    return heightFieldShape;
  },

}