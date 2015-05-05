var THREE = require('three.js');

var users = require('./users').users;


module.exports = function load () {

  var textures = [];

  var materials = users.slice(0, 16).map(function(u) {
    var texture = THREE.ImageUtils.loadTexture( "images/" + u.id + ".jpg" );

    textures.push(texture);

    return new THREE.PointCloudMaterial({
      size: 64,
      // map: texture,
      color: 0xffffff
      // transparent: true
    });




  });


  function buildFragmentShader() {

    var r = "";

    r += "uniform sampler2D textures[" + textures.length + "];\n";
    r += "varying vec3 vColor;\n";
    r += "varying float vTexIndex;\n";
    r += "void main() {\n";
    r += "vec4 startColor = vec4(vColor, 1.0);\n";
    r += "vec4 finalColor;\n";
    r += "int textureIndex = int(vTexIndex + 0.5);\n";

    for (var i = 0; i < textures.length; i++) {
      r += "if (textureIndex == " + i + ") {\n";
      r += "  finalColor = texture2D(textures[" + i + "], gl_PointCoord);\n";
      r += "}\n";
    }

    r += "gl_FragColor = startColor * finalColor;\n";
    r += "}";

    return r;

  }



  return {
    materials : materials,
    textures: textures,
    fragShader: buildFragmentShader()
  }


};

