var THREE = require('three.js');
require('./anaglyph')(THREE);
var users = require('./users').users;

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

  this.clock = new THREE.Clock();

  document.body.appendChild(this.renderer.domElement);

  this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1500);
  this.camera.position.set(0, 0, 700);
  this.scene = new THREE.Scene();

  this.container = new THREE.Object3D();
  this.scene.add(this.container);

  var scene = this.scene;

  var particleCount = users.length;

  var uniforms = {
      texture: {
          type: 't',
          value: THREE.ImageUtils.loadTexture('images/unicorns.png')
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

  var geometry = new THREE.Geometry();

  var zPos = -1000;

  var inc = 1500 / particleCount;

  for (var i = 0; i < particleCount; i++) {
      geometry.vertices.push(new THREE.Vector3(
        (Math.random() - 0.5) * 1000,
        (Math.random() - 0.5) * 1000,
        zPos));
      attributes.texIndex.value.push(i);
      zPos += inc;
  }

  // make a grid
  // for (var i = 0; i < particleCount; i++) {
  //   var row = Math.floor(i/32);
  //   var col = i % 32;
  //   var pos = new THREE.Vector3(
  //     -(500) + col * 32,
  //     -(500) + row * 32,
  //     0
  //     );
  //   geometry.vertices.push(pos)
  //   attributes.texIndex.value.push(i);
  // }


  var particles = new THREE.PointCloud(geometry, material);
  particles.sortParticles = true;
  this.particlesGeom = geometry;
  this.container.add(particles);
};

World.prototype.cycleFaces = function (interval) {

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
}

World.prototype.fly = function() {
  var dt = 1;
  var i, l = this.particlesGeom.vertices.length;
  for (i = 0; i < l; i++) {
    p = this.particlesGeom.vertices[i];
    p.z += dt;

    if (p.z > this.camera.position.z) {
      p.z += -1500;
    }
  }

  this.particlesGeom.verticesNeedUpdate = true;

}


World.prototype.shake = function() {
  var d = this.clock.getElapsedTime() * 10;

  for (var i = 0; i < this.particlesGeom.vertices.length; i++) {
    this.particlesGeom.vertices[i].x += 10*(Math.random() - 0.5) * Math.sin(d);
    this.particlesGeom.vertices[i].y += 10*(Math.random() - 0.5) * Math.sin(d);
  }

  this.particlesGeom.verticesNeedUpdate = true;
}

World.prototype.render = function () {
  //this.cycleFaces(100);
  this.fly();
  // this.shake();
  this.renderer.render(this.scene, this.camera);
};

World.prototype.resize = function () {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
};


var world = new World();