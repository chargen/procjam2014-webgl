var gl,
    shaderProgram,
    triangleVertexPositionBuffer,
    squareVertexPositionBuffer,
    canvas = document.getElementById('canvas'),
    fragmentShaderSource = document.getElementById('fragmentshader').innerHTML,
    vertexShaderSource = document.getElementById('vertexshader').innerHTML;

function initGL(canvas) {
    try {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }

    if (!gl) {
        console.warn('Could not initialise WebGL, sorry :-(');
    }

    /*
     var extensions = {};

     gl.getSupportedExtensions().forEach(function (ext) {
     var v = gl.getExtension(ext);

     if (v) {
     extensions[ext] = v;
     }
     });
     */

    return gl;
}

function createShader(type, src) {
    var shader = gl.createShader(type);
    gl.shaderSource( shader, src );
    gl.compileShader( shader );

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(shader));
    }

    return shader;
}

function initShaders() {
    shaderProgram = gl.createProgram();

    var vertexShader = createShader( gl.VERTEX_SHADER, vertexShaderSource),
        fragmentShader = createShader( gl.FRAGMENT_SHADER, fragmentShaderSource );

    // Attach pre-existing shaders
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);

    gl.linkProgram(shaderProgram);

    gl.useProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.warn("Could not initialise shaders");
    }

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.iResolution = gl.getUniformLocation(shaderProgram, "iResolution");
    shaderProgram.iMove = gl.getUniformLocation(shaderProgram, "iMove");
    shaderProgram.iGlobalTime = gl.getUniformLocation(shaderProgram, "iGlobalTime");
    shaderProgram.iDistortion = gl.getUniformLocation(shaderProgram, "iDistortion");
    shaderProgram.iSeaLevel = gl.getUniformLocation(shaderProgram, "iSeaLevel");
    shaderProgram.iScale = gl.getUniformLocation(shaderProgram, "iScale");

    //shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    //shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}

;

function initBuffers() {
    triangleVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    var vertices = [
        -1, -1, -1, 4, 4, -1
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    triangleVertexPositionBuffer.itemSize = 2;
    triangleVertexPositionBuffer.numItems = 3;
}

function drawScene(options) {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var quality = options.actualQuality;
    gl.uniform1f(shaderProgram.iScale, options.scale * quality);
    gl.uniform1f(shaderProgram.iDistortion, options.distortion);
    gl.uniform1f(shaderProgram.iSeaLevel, options.seaLevel);
    gl.uniform2f(shaderProgram.iMove, options.moveX, options.moveY);

    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    //setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);
}

initGL(canvas);
initShaders();
initBuffers();

gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.DITHER);

function resize(options) {
    var quality = options.actualQuality;
    canvas.style.webkitTransform = canvas.style.transform = 'scale3d(' + quality + ', ' + quality + ', 1)';
    canvas.width = Math.ceil(document.body.clientWidth / quality);
    canvas.height = Math.ceil(document.body.clientHeight / quality);

    //options.debug = canvas.style.transform + ' : ' + canvas.width;
}

var needUpdate = true;

var options = {
    quality: 1.,
    actualQuality: 1.,
    scale: 1.,
    distortion: 1.,
    seaLevel: 0.45,
    moveX: 0,
    moveY : 0,
    debug: ''
};


/* EVENTS */

var down = false,
    downPosition = [0,0],
    currentPosition = [0,0];

canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    if (!e.ctrlKey && !e.metaKey) {
        if (!down) {
            down = true;
            downPosition[0] = e.touches[0].clientX;
            downPosition[1] = e.touches[0].clientY;
            currentPosition[0] = e.touches[0].clientX;
            currentPosition[1] = e.touches[0].clientY;
        }
    }
}, false);

canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    if (down) {
        currentPosition[0] = e.touches[0].clientX;
        currentPosition[1] = e.touches[0].clientY;
        needUpdate = true;
    }
}, false);

canvas.addEventListener('touchend', function (e) {
    e.preventDefault();
    down = false;
    needUpdate = true;
    downPosition[0] = downPosition[1] = currentPosition[0] = currentPosition[1] = 0;
}, false);

canvas.addEventListener('mousedown', function (e) {
    if (!e.ctrlKey && !e.metaKey) {
        if (!down) {
            down = true;
            downPosition[0] = e.clientX;
            downPosition[1] = e.clientY;
            currentPosition[0] = e.clientX;
            currentPosition[1] = e.clientY;
        }
    }
}, false);

canvas.addEventListener('mousemove', function (e) {
    if (down) {
        currentPosition[0] = e.clientX;
        currentPosition[1] = e.clientY;
        needUpdate = true;
    }
});

canvas.addEventListener('mouseup', function (e) {
    down = false;
    needUpdate = true;
    downPosition[0] = downPosition[1] = currentPosition[0] = currentPosition[1] = 0;
}, false);

window.addEventListener('resize', function () { needUpdate = true; }, false);
window.addEventListener('wheel', function (e) {
    e.preventDefault();
    options.scale = Math.max(0.25, Math.min(5, options.scale + e.deltaY / 200));
    needUpdate = true;
}, false);

/* RENDERING */

var previousTime = 0;

function render(time) {
    time = time || 0;

    var deltaTime = time - previousTime;

    if (needUpdate) {
        options.moveX += (currentPosition[0] - downPosition[0]) / 60 * deltaTime;
        options.moveY += (downPosition[1] - currentPosition[1]) / 60 * deltaTime;
        options.actualQuality = down ? Math.max(3, options.quality) : options.quality;

        resize(options);
        drawScene(options);
        needUpdate = !!down;
    }

    previousTime = time;

    requestAnimationFrame(render);
}

resize(options);
render();

var gui = new dat.GUI(),
    controllers = [];

controllers.push(gui.add(options, 'quality', { High: 0.5, Good: 1, Medium: 2, Bad: 5 }));
controllers.push(gui.add(options, 'scale').min(0.25).max(5).step(0.01).listen());
controllers.push(gui.add(options, 'distortion').min(0.).max(3).step(0.01));
controllers.push(gui.add(options, 'seaLevel').min(0.3).max(0.6).step(0.01));
controllers.push(gui.add(options, 'moveX').listen());
controllers.push(gui.add(options, 'moveY').listen());
//controllers.push(gui.add(options, 'debug').listen());

controllers.forEach(function (controller) {
    controller.onChange(function () {
        needUpdate = true;
    });

    controller.onFinishChange(function () {
        needUpdate = true;
    });
});
