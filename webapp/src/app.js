var THREE = require('three.js');
require('./anaglyph')(THREE);
require('./parallaxBarrier')(THREE);
require('./bokeh')(THREE);
var users = require('./users').users;
var dt = require('delaunay-triangulate');


function World() {
  this.init();
}

World.prototype.init = function () {
  this.setupEnvironment();

  var scope = this;

  this.callResize = function () {
      scope.resize();
  };
  window.addEventListener('resize', this.callResize, false);

  this.callRender = function () {
      scope.render();
      scope.renderID = requestAnimationFrame(scope.callRender);
  };
  this.callRender();
};

World.prototype.setupEnvironment = function () {
  this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
  });
  this.width = window.innerWidth;
  this.height = window.innerHeight;

  this.renderer.setSize(this.width, this.height);
  this.renderer.setClearColor(0xffffff, 0);
  this.renderer.domElement.id = "canvas";
  this.renderer.context.getProgramInfoLog = function () {
      return ''
  }; // muzzle

  this.effect1 = new THREE.ParallaxBarrierEffect(this.renderer);
  this.effect2 = new THREE.AnaglyphEffect(this.renderer);
  this.effect1.setSize(this.width, this.height);
  this.effect2.setSize(this.width, this.height);
  this.useEffect = 0;

  this.material_depth = new THREE.MeshDepthMaterial();
  this.shaderSettings = {
    rings: 3,
    samples: 4
  };

  this.postprocessing = { enabled : true };

  this.initPostprocessing();

  this.clock = new THREE.Clock();

  document.body.appendChild(this.renderer.domElement);

  this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 3000);
  this.camera.position.set(0, 0, 700);
  this.scene = new THREE.Scene();

  this.container = new THREE.Object3D();
  this.scene.add(this.container);

  var scene = this.scene;

  var particleCount = users.length;

  var uniforms = {
      texture: {
          type: 't',
          value: THREE.ImageUtils.loadTexture('images/unicorns2.jpg')
      }
  };

  var attributes = {
      texIndex: {
          type: 'f',
          value: []
      }
  };

  this.attributes = attributes;

  var material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      attributes: attributes,
      vertexShader: document.getElementById('vertexShader').textContent,
      fragmentShader: document.getElementById('fragmentShader').textContent,
      transparent: true
  });


  var pointMaterial = new THREE.PointCloudMaterial({
    color: 0x09A7F7,
    size: 20,
    map: THREE.ImageUtils.loadTexture('images/disc.png'),
    transparent: true
  })


  var geometry = new THREE.Geometry();

  var zPos = -1000;

  var inc = 1500 / particleCount;

  var points = [];

  var x, y, z, r = 750;

  for (var i = 0; i < particleCount; i++) {
    do {
      x = (Math.random() - 0.5) * r*2;
      y = (Math.random() - 0.5) * r*2;
      z = (Math.random() - 0.5) * r*2;
    } while (((x*x) + (y*y) + (z*z)) > r*r)

    var pt = [x, y, z];

    var vt = new THREE.Vector3(x, y, z);

    points.push(pt);
    geometry.vertices.push(vt);
    attributes.texIndex.value.push(i);
    zPos += inc;
  }

  var tris = dt(points);

  var a, b, c, f;
  for (var i = 0; i < tris.length; i+= 5) {
    f = new THREE.Face3(tris[i][0], tris[i][1] , tris[i][2]);
    geometry.faces.push(f);
  }

  geometry.computeBoundingSphere();

  var meshMaterial = new THREE.MeshBasicMaterial({
    wireframe: true,
    color: 0xFF0044,
    transparent: true,
    opacity: 0.2
  });

  this.meshGeom = geometry.clone();

  var mesh = new THREE.Mesh(this.meshGeom, meshMaterial);

  this.container.add(mesh);

  // make a grid
  // for (var i = 0; i < particleCount; i++) {
  //   var row = Math.floor(i/32);
  //   var col = i % 32;
  //   var pos = new THREE.Vector3(
  //     -(500) + col * 32,
  //     -(500) + row * 32,
  //     -800
  //     );
  //   geometry.vertices.push(pos)
  //   attributes.texIndex.value.push(i);
  // }


  var particles = new THREE.PointCloud(geometry, pointMaterial);
  // var particles = new THREE.PointCloud(geometry, material);
  particles.sortParticles = true;
  this.particlesGeom = geometry;
  this.container.add(particles);
};

World.prototype.initPostprocessing = function() {

  this.postprocessing.scene = new THREE.Scene();

  this.postprocessing.camera = new THREE.OrthographicCamera(
      this.width / - 2, this.width / 2,
      this.height / 2, this.height / - 2,
      -10000, 10000 );
  this.postprocessing.camera.position.z = 100;

  this.postprocessing.scene.add( this.postprocessing.camera );

  var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };
  this.postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget( this.width, this.height, pars );
  this.postprocessing.rtTextureColor = new THREE.WebGLRenderTarget( this.width, this.height, pars );



  var bokeh_shader = THREE.BokehShader;

  this.postprocessing.bokeh_uniforms = THREE.UniformsUtils.clone( bokeh_shader.uniforms );

  this.postprocessing.bokeh_uniforms[ "tColor" ].value = this.postprocessing.rtTextureColor;
  this.postprocessing.bokeh_uniforms[ "tDepth" ].value = this.postprocessing.rtTextureDepth;

  this.postprocessing.bokeh_uniforms[ "textureWidth" ].value = this.width;
  this.postprocessing.bokeh_uniforms[ "textureHeight" ].value = this.height;

  this.postprocessing.materialBokeh = new THREE.ShaderMaterial( {
    uniforms: this.postprocessing.bokeh_uniforms,
    vertexShader: bokeh_shader.vertexShader,
    fragmentShader: bokeh_shader.fragmentShader,
    defines: {
      RINGS: this.shaderSettings.rings,
      SAMPLES: this.shaderSettings.samples
    }
  });

  this.postprocessing.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( this.width, this.height ), this.postprocessing.materialBokeh );
  this.postprocessing.quad.position.z = - 500;
  this.postprocessing.scene.add( this.postprocessing.quad );

};


World.prototype.cycleRandomFace = function(byHowMany) {
  var randIdx = Math.random() * this.attributes.texIndex.value.length | 0;

  this.attributes.texIndex.value[randIdx] = this.attributes.texIndex.value[randIdx] + byHowMany % this.attributes.texIndex.value.length;

  this.attributes.texIndex.needsUpdate = true;
};

World.prototype.cycleFaces = function (interval) {

  if (!this.e) {
    this.e = 0;
    this.oldE = 0;
  }

  this.e += this.clock.getDelta()*1000;

  if (this.e < (this.oldE + interval)) {
    return;
  }

  this.oldE = this.e;

  for (var i = 0; i < this.attributes.texIndex.value.length; i++) {
    this.attributes.texIndex.value[i] = this.attributes.texIndex.value[i]+1;
    if (this.attributes.texIndex.value[i] > users.length) {
      this.attributes.texIndex.value[i] = 0;
    }
  }

  this.attributes.texIndex.needsUpdate = true;
};

World.prototype.center = function() {
  var d = this.clock.getElapsedTime() * 10;

  var p, l = this.particlesGeom.vertices.length;
  var dx = 0.1;
  var dy = 0.1;

  for (var i = 0; i < l; i++) {
    p = this.particlesGeom.vertices[i];
    if (p.x > 0)
      p.x -= dx;
    else
      p.x += dx;
    if (p.y > 0)
      p.y -= dy;
    else
      p.y += dy;
  }

  this.particlesGeom.verticesNeedUpdate = true;
};

World.prototype.fly = function() {
  var dt = 0.5;
  var i, l = this.particlesGeom.vertices.length;
  for (i = 0; i < l; i++) {
    p = this.particlesGeom.vertices[i];
    mp = this.meshGeom.vertices[i];
    p.z += dt;
    mp.z += dt;

    if (p.z > this.camera.position.z) {
      p.z += -1500;
      mp.z += -1500;
    }
  }

  this.particlesGeom.verticesNeedUpdate = true;
  this.meshGeom.verticesNeedUpdate = true;
};

World.prototype.shake = function(amt, speed) {
  amt = amt || 1;

  var d = this.clock.getElapsedTime() * speed;

  var i, l = this.particlesGeom.vertices.length;
  var p, mp;
  var dx, dy;
  for (i = 0; i < l; i++) {
    p = this.particlesGeom.vertices[i];
    mp = this.meshGeom.vertices[i];
    dx = amt*(Math.random() - 0.5) * Math.sin(d);
    dy = amt*(Math.random() - 0.5) * Math.sin(d);

    p.x += dx;
    p.y += dy;
    mp.x += dx;
    mp.y += dy;
  }

  this.particlesGeom.verticesNeedUpdate = true;
  this.meshGeom.verticesNeedUpdate = true;
};

World.prototype.render = function () {
  var e = this.clock.getElapsedTime() * 0.1;
  this.container.rotation.y += 0.0002;
  this.container.rotation.x -= 0.0001;
  this.container.rotation.z += 0.0002;
  this.container.position.z = -500 * Math.sin(e);
  // this.cycleFaces(500);
  // this.cycleRandomFace(10);
  // this.fly();
  this.shake(0.1, 0.01);

  if ( this.postprocessing.enabled ) {

    this.renderer.clear();

    // Render scene into texture
    this.scene.overrideMaterial = null;
    this.renderer.render( this.scene, this.camera, this.postprocessing.rtTextureColor, true );

    // Render depth into texture
    this.scene.overrideMaterial = this.material_depth;
    this.renderer.render( this.scene, this.camera, this.postprocessing.rtTextureDepth, true );

    // Render bokeh composite
    this.renderer.render( this.postprocessing.scene, this.postprocessing.camera );


  } else {

    this.scene.overrideMaterial = null;

    this.renderer.clear();
    this.renderer.render( this.scene, this.camera );

  }


  // if (Math.random() > 0.99) {
  //   this.useEffect += 0.1;
  // }

  // if (this.useEffect > 0) {
  //   if (Math.random() > 0.5)
  //     this.effect1.render(this.scene, this.camera);
  //   else
  //     this.effect2.render(this.scene, this.camera);

  //   this.useEffect -= 0.01;
  // } else {
  //   this.renderer.render(this.scene, this.camera);
  // }
};

World.prototype.resize = function () {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.renderer.setSize(this.width, this.height);
    this.effect1.setSize(this.width, this.height);
    this.effect2.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
};


var world = new World();