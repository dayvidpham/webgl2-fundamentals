"use strict";

var vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;

// Used to pass in the resolution of the canvas
uniform vec2 u_resolution;

in vec3 a_color;
out vec4 v_color;

// all shaders have a main function
void main() {

  // convert the position from pixels to 0.0 to 1.0
  vec2 zeroToOne = a_position / u_resolution;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clipspace)
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  v_color = vec4(a_color, 1);
}
`;

var fragmentShaderSource = `#version 300 es

precision highp float;

in vec4 v_color;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  outColor = v_color;
}
`;


function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));  // eslint-disable-line
  gl.deleteShader(shader);
  return undefined;
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));  // eslint-disable-line
  gl.deleteProgram(program);
  return undefined;
}

function main() {
  // Get A WebGL context
  var canvas = document.querySelector("#c");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  // create GLSL shaders, upload the GLSL source, compile the shaders
  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  console.log(vertexShader, fragmentShader)
  // Link the two shaders into a program
  var program = createProgram(gl, vertexShader, fragmentShader);

  // look up where the vertex data needs to go.
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

  // look up uniform locations
  var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

  // Create a buffer
  var positionBuffer = gl.createBuffer();

  // Create a vertex array object (attribute state)
  var vao = gl.createVertexArray();

  // and make it the one we're currently working with
  gl.bindVertexArray(vao);

  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      positionAttributeLocation, size, type, normalize, stride, offset);

  var colorAttributeLocation = gl.getAttribLocation(program, "a_color");
  var colorBuffer = gl.createBuffer();
  // // Turn on the attribute
  gl.enableVertexAttribArray(colorAttributeLocation);
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 3;          // 4 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      colorAttributeLocation, size, type, normalize, stride, offset);

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // Bind the attribute/buffer set we want.
  gl.bindVertexArray(vao);

  // Pass in the canvas resolution so we can convert from
  // pixels to clipspace in the shader
  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

  let n = 50;
  setGeneratedRectangles(gl, positionBuffer, n, canvas.width, canvas.height);
  setGeneratedColors(gl, colorBuffer, n);
  // Draw the rectangle.
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 6*n;
  gl.drawArrays(primitiveType, offset, count);
}

// Returns a random integer from 0 to range - 1.
function randomInt(range) {
  return Math.floor(Math.random() * range);
}

// Fill the buffer with the values that define a rectangle.
function setGeneratedRectangles(gl, positionBuffer, n, maxCanvasWidth, maxCanvasHeight) {
  let stride = 12 // 3x2 = 6 vertices per rectangle, 2 dim * 6 = 12
  let positions = new Float32Array(n*stride); 
  for(let i = 0; i < n; i++) {
    let x = randomInt(maxCanvasWidth);
    let y = randomInt(maxCanvasHeight);
    let width = randomInt(maxCanvasWidth-x);
    let height = randomInt(maxCanvasHeight-y);
    let x1 = x;
    let x2 = x + width;
    let y1 = y;
    let y2 = y + height;
    let offset = i*stride
    positions[offset] = x1
    positions[offset+1] = y1
    positions[offset+2] = x2
    positions[offset+3] = y1
    positions[offset+4] = x1
    positions[offset+5] = y2
    positions[offset+6] = x2
    positions[offset+7] = y1
    positions[offset+8] = x2
    positions[offset+9] = y2
    positions[offset+10] = x1
    positions[offset+11] = y2
  }
  // console.log("positions:", n*stride);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

// Fill the buffer with the values that define a rectangle.
function setGeneratedColors(gl, colorBuffer, n) {
  // let stride = 3*2*4 // 3 vertices per triangle, 2 triangles per rectangle, 4 rgba channels per rect 6x4 = 24
  let stride = 3*2*3 // 3 vertices per triangle, 2 triangles per rectangle, 4 rgba channels per rect 6x4 = 24
  let colors = new Float32Array(n*stride);
  for(let i = 0; i < n; i++) {
    let r = Math.random();
    let g = Math.random();
    let b = Math.random();
    let offset = i*stride
    for(let j = offset; j < offset+stride; j += 3) {
      colors[j] = r;
      colors[j+1] = g;
      colors[j+2] = b;
      // colors[j+3] = 1;
      // console.log(j);
    }
  }
  // console.log("colors:", n*(stride / 4));
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
}

main();
