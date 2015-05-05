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
  this.renderer.setSize(window.innerWidth, window.innerHeight);
  this.renderer.setClearColor(0xffffff, 0);
  this.renderer.domElement.id = "canvas";
  this.renderer.context.getProgramInfoLog = function () {
      return ''
  }; // muzzle

  // effect = new THREE.AnaglyphEffect( this.renderer );
  // effect.setSize( window.innerWidth, window.innerHeight );


  document.body.appendChild(this.renderer.domElement);

  this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1500);
  this.camera.position.set(0, 0, 500);
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
      },
      color: {
          type: 'c',
          value: []
      },
  };

  console.log(users.fragShader);

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
        (Math.random() - 0.5) * 1000));
      attributes.texIndex.value.push(i);
      attributes.color.value.push(new THREE.Color(0xffffff));
      zPos += inc;
  }

  var particles = new THREE.PointCloud(geometry, material);
  particles.sortParticles = true;
  this.container.add(particles);
};

World.prototype.render = function () {
    this.container.rotation.y += 0.001;
    // for (var i = 0; i < this.container.children.length; i++ ) {
    //   this.container.children[i].position.z += 1;
    //   if (this.container.children[i].position.z > 500)
    //     this.container.children[i].position.z -= 1500;
    // }
    this.renderer.render(this.scene, this.camera);
};

World.prototype.resize = function () {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
};


var world = new World();