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

  // this.effect = new THREE.AnaglyphEffect(this.renderer);
  // this.effect.setSize(this.width, this.height);

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


  var pointMaterial = new THREE.PointCloudMaterial({
    color: 0x09A7F7,
    size: 20,
    map: THREE.ImageUtils.loadTexture('images/disc.png'),
    transparent: true
  })


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

  var a, b, c, f;
  for (var i = 0; i < particleCount; i+=3) {
    a = i;
    b = (i + 1) % particleCount;
    c = (i + 2) % particleCount;
    f = new THREE.Face3(a, b, c);
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

World.prototype.cycleRandomFace = function(byHowMany) {
  var randIdx = Math.random() * this.attributes.texIndex.value.length | 0;

  this.attributes.texIndex.value[randIdx] = this.attributes.texIndex.value[randIdx] + byHowMany % this.attributes.texIndex.value.length;

  this.attributes.texIndex.needsUpdate = true;

}

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
}

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
  this.container.rotation.y += 0.0001;
  // this.cycleFaces(500);
  this.cycleRandomFace(10);
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