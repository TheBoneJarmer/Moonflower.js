var canvas = [];
var ctx = [];

var vbuffer = [];
var tcbuffer = [];

var Game = {
    scale: 1,
    mobile: false,

    Window: {
        ratio: 1,

        resize: function(maxwidth, maxheight) {
            for (let i=0; i<canvas.length; i++) {
                const scaleX = maxwidth / canvas[i].width;
                const scaleY = maxheight / canvas[i].height;
                const ratio = Math.min(scaleX, scaleY);

                this.ratio = ratio;

                canvas[i].width *= ratio;
                canvas[i].height *= ratio;
                canvas[i].style.position = "absolute";
                canvas[i].style.top = "0px";
                canvas[i].style.left = "0px";
                canvas[i].style.width = canvas[0].width + "px";
                canvas[i].style.height = canvas[0].height + "px";
            }
        },
        setSize: function(width, height) {
            for (let i=0; i<canvas.length; i++) {
                canvas[i].width = width;
                canvas[i].height = height;
                //canvas[i].style.width = width + "px";
                //canvas[i].style.height = height + "px";
            }
        },
        setLocation: function(x, y) {
            for (let i=0; i<canvas.length; i++) {
                canvas[i].style.position = "absolute";
                canvas[i].style.left = x + "px";
                canvas[i].style.top = y + "px";
            }
        },
        center() {
            for (let i=0; i<canvas.length; i++) {
                canvas[i].style.position = "absolute";
                canvas[i].style.top = "0px";
                canvas[i].style.left = (window.innerWidth / 2) - (canvas[i].width / 2) + "px";
            }
        },
    },

    addLayer: function(canvasId, contextType) {
        const i = canvas.length;

        canvas[i] = document.getElementById(canvasId);
        ctx[i] = canvas[i].getContext(contextType);
        ctx[i].type = contextType;

        if (contextType == "webgl") {
            vbuffer[i] = ctx[i].createBuffer();
            tcbuffer[i] = ctx[i].createBuffer();
        }
    },

    init: function() {
        let vertexShaderSourceSprite = "";
        let fragmentShaderSourceSprite = "";
        let vertexShaderSource = "";
        let fragmentShaderSource = "";

        //Init shaders
        vertexShaderSource = "attribute vec2 aposition;";
        vertexShaderSource += "varying vec2 vtexcoord;";
        vertexShaderSource += "uniform vec2 uresolution;";
        vertexShaderSource += "uniform vec2 urotation;";
        vertexShaderSource += "uniform vec2 utranslation;";
        vertexShaderSource += "uniform vec2 uscale;";
        vertexShaderSource += "void main() {";
        vertexShaderSource += "vec2 rotatedPosition = vec2(aposition.x * urotation.y + aposition.y * urotation.x, aposition.y * urotation.y - aposition.x * urotation.x);";
        vertexShaderSource += "vec2 position = (rotatedPosition + utranslation) * uscale;"
        vertexShaderSource += "vec2 zeroToOne = position / uresolution;";
        vertexShaderSource += "vec2 zeroToTwo = zeroToOne * 2.0;";
        vertexShaderSource += "vec2 clipSpace = zeroToTwo - 1.0;";
        vertexShaderSource += "gl_Position = vec4(clipSpace.x, -clipSpace.y, 0, 1);";
        vertexShaderSource += "}";

        fragmentShaderSource = "precision mediump float;";
        fragmentShaderSource += "uniform vec4 ucolor;"
        fragmentShaderSource += "void main() {";
        fragmentShaderSource += "gl_FragColor = ucolor;";
        fragmentShaderSource += "}";

        vertexShaderSourceSprite = "attribute vec2 aposition;";
        vertexShaderSourceSprite += "attribute vec2 atexcoord;";
        vertexShaderSourceSprite += "varying vec2 vtexcoord;";
        vertexShaderSourceSprite += "uniform vec2 uresolution;";
        vertexShaderSourceSprite += "uniform vec2 urotation;";
        vertexShaderSourceSprite += "uniform vec2 utranslation;";
        vertexShaderSourceSprite += "uniform vec2 uscale;";
        vertexShaderSourceSprite += "void main() {";
        vertexShaderSourceSprite += "vec2 rotatedPosition = vec2(aposition.x * urotation.y + aposition.y * urotation.x, aposition.y * urotation.y - aposition.x * urotation.x);";
        vertexShaderSourceSprite += "vec2 position = (rotatedPosition + utranslation) * uscale;"
        vertexShaderSourceSprite += "vec2 zeroToOne = position / uresolution;";
        vertexShaderSourceSprite += "vec2 zeroToTwo = zeroToOne * 2.0;";
        vertexShaderSourceSprite += "vec2 clipSpace = zeroToTwo - 1.0;";
        vertexShaderSourceSprite += "vtexcoord = atexcoord;";
        vertexShaderSourceSprite += "gl_Position = vec4(clipSpace.x, -clipSpace.y, 0, 1);";
        vertexShaderSourceSprite += "}";

        fragmentShaderSourceSprite = "precision mediump float;";
        fragmentShaderSourceSprite += "varying vec2 vtexcoord;";
        fragmentShaderSourceSprite += "uniform vec4 ucolor;"
        fragmentShaderSourceSprite += "uniform sampler2D uimage;"
        fragmentShaderSourceSprite += "void main() {";
        fragmentShaderSourceSprite += "vec4 finalcolor = ucolor;";
        fragmentShaderSourceSprite += "finalcolor += texture2D(uimage, vtexcoord);";
        fragmentShaderSourceSprite += "gl_FragColor = finalcolor;";
        fragmentShaderSourceSprite += "}";

        // Create the shaders
        for (let i=0; i<canvas.length; i++) {
            if (ctx[i].type != "webgl") {
                continue;
            }

            Shaders.default[i] = new Shader(i, vertexShaderSource, fragmentShaderSource);
            Shaders.sprite[i] = new Shader(i, vertexShaderSourceSprite, fragmentShaderSourceSprite);
        }

        //Init controls 
        Cursor.init();
        Keyboard.init();
    },
}

/* GRAPHICS */
let Shaders = {
    default: [],
    sprite: []
}

function Camera() {
    return {
        render: function() {
            for (let i=0; i<canvas.length; i++) {
                if (ctx[i].type == "webgl") {
                    ctx[i].enable(ctx[i].BLEND);
                    ctx[i].blendFunc(ctx[i].SRC_ALPHA, ctx[i].ONE_MINUS_SRC_ALPHA);
    
                    ctx[i].viewport(0, 0, canvas[i].width, canvas[i].height);
                    ctx[i].clear(ctx[i].COLOR_BUFFER_BIT);   
                }
    
                if (ctx[i].type == "2d") {
                    ctx[i].clearRect(0, 0, canvas[i].width, canvas[i].height);
                }
            }
        }
    }
}

function Shader(layer, vsource, fsource) {
    var program = ctx[layer].createProgram();
    var vshader = ctx[layer].createShader(ctx[layer].VERTEX_SHADER);
    var fshader = ctx[layer].createShader(ctx[layer].FRAGMENT_SHADER);

    ctx[layer].shaderSource(vshader, vsource);
    ctx[layer].shaderSource(fshader, fsource);
    ctx[layer].compileShader(vshader);
    ctx[layer].compileShader(fshader);

    var status1 = ctx[layer].getShaderParameter(vshader, ctx[layer].COMPILE_STATUS);
    var status2 = ctx[layer].getShaderParameter(fshader, ctx[layer].COMPILE_STATUS);

    if (status1 == false) {
        console.log(ctx[layer].getShaderInfoLog(vshader));
    }
    if (status2 == false) {
        console.log(ctx[layer].getShaderInfoLog(fshader));
    }

    ctx[layer].attachShader(program, vshader);
    ctx[layer].attachShader(program, fshader);
    ctx[layer].linkProgram(program);
    ctx[layer].deleteShader(vshader);
    ctx[layer].deleteShader(fshader);

    return program;
}

function Sprite(path) {
    var img = new Image();
    img.src = path;
    img.onload = function() {
        this.texture = [];

        for (let i=0; i<canvas.length; i++) {
            if (ctx[i].type != "webgl") {
                continue;
            }

            this.texture[i] = ctx[i].createTexture();

            ctx[i].bindTexture(ctx[i].TEXTURE_2D, this.texture[i]);
            ctx[i].texParameteri(ctx[i].TEXTURE_2D, ctx[i].TEXTURE_WRAP_S, ctx[i].CLAMP_TO_EDGE);
            ctx[i].texParameteri(ctx[i].TEXTURE_2D, ctx[i].TEXTURE_WRAP_T, ctx[i].CLAMP_TO_EDGE);
            ctx[i].texParameteri(ctx[i].TEXTURE_2D, ctx[i].TEXTURE_MIN_FILTER, ctx[i].NEAREST);
            ctx[i].texParameteri(ctx[i].TEXTURE_2D, ctx[i].TEXTURE_MAG_FILTER, ctx[i].NEAREST);
            ctx[i].texImage2D(ctx[i].TEXTURE_2D, 0, ctx[i].RGBA, ctx[i].RGBA, ctx[i].UNSIGNED_BYTE, this);
        }
    }

    return img;
}

function drawSprite(layer, sprite, frameHor, frameVert, frameWidth, frameHeight, x, y, width, height, angle, offX, offY) {
    if (ctx[layer].type == "webgl") {
        var sin = Math.sin(Math.toRadians(angle + 90));
        var cos = Math.cos(Math.toRadians(angle + 90));
        var tcx = (1 / (sprite.width / frameWidth)) * frameHor;
        var tcy = (1 / (sprite.height / frameHeight)) * frameVert;
        var difx = 1 / (sprite.width / frameWidth);
        var dify = 1 / (sprite.height / frameHeight);
        var vertices = [offX, offY, offX + width, offY, offX, offY + height, offX + width, offY, offX, offY + height, offX + width, offY + height];
        var texcoords = [tcx, tcy, tcx + difx, tcy, tcx, tcy + dify, tcx + difx, tcy, tcx, tcy + dify, tcx + difx, tcy + dify];
        
        var positionAttribLocation = ctx[layer].getAttribLocation(Shaders.sprite[layer], "aposition");
        var texcoordAttribLocation = ctx[layer].getAttribLocation(Shaders.sprite[layer], "atexcoord");
        var translationUniformLocation = ctx[layer].getUniformLocation(Shaders.sprite[layer], "utranslation");
        var scaleUniformLocation = ctx[layer].getUniformLocation(Shaders.sprite[layer], "uscale");
        var rotationUniformLocation = ctx[layer].getUniformLocation(Shaders.sprite[layer], "urotation");
        var resolutionUniformLocation = ctx[layer].getUniformLocation(Shaders.sprite[layer], "uresolution");
        var colorUniformLocation = ctx[layer].getUniformLocation(Shaders.sprite[layer], "ucolor");

        ctx[layer].bindBuffer(ctx[layer].ARRAY_BUFFER, vbuffer[layer]);
        ctx[layer].bufferData(ctx[layer].ARRAY_BUFFER, new Float32Array(vertices), ctx[layer].STATIC_DRAW);
        ctx[layer].bindBuffer(ctx[layer].ARRAY_BUFFER, tcbuffer[layer]);
        ctx[layer].bufferData(ctx[layer].ARRAY_BUFFER, new Float32Array(texcoords), ctx[layer].STATIC_DRAW);
        ctx[layer].bindTexture(ctx[layer].TEXTURE_2D, sprite.texture[layer]);
        ctx[layer].useProgram(Shaders.sprite[layer]);
        ctx[layer].enableVertexAttribArray(positionAttribLocation);
        ctx[layer].enableVertexAttribArray(texcoordAttribLocation);
        ctx[layer].uniform2f(translationUniformLocation, x, y);
        ctx[layer].uniform2f(rotationUniformLocation, cos, sin);
        ctx[layer].uniform2f(scaleUniformLocation, Game.scale, Game.scale);
        ctx[layer].uniform2f(resolutionUniformLocation, canvas[layer].width, canvas[layer].height);
        ctx[layer].uniform4f(colorUniformLocation, 0, 0, 0, 0);
        ctx[layer].bindBuffer(ctx[layer].ARRAY_BUFFER, vbuffer[layer]);
        ctx[layer].vertexAttribPointer(positionAttribLocation, 2, ctx[layer].FLOAT, false, 0, 0);    
        ctx[layer].bindBuffer(ctx[layer].ARRAY_BUFFER, tcbuffer[layer]);
        ctx[layer].vertexAttribPointer(texcoordAttribLocation, 2, ctx[layer].FLOAT, false, 0, 0);
        ctx[layer].drawArrays(ctx[layer].TRIANGLES, 0, 6);
    }

    if (ctx[layer].type == "2d") {
        var frameX = frameWidth * frameHor;
        var frameY = frameHeight * frameVert;

        ctx[layer].save();
        ctx[layer].translate(offX, offY);
        ctx[layer].rotate(angle);
        ctx[layer].drawImage(sprite, frameX, frameY, frameWidth, frameHeight, x, y, width, height);
        ctx[layer].restore();
    }
}

function drawRectangle(layer, x, y, angle, width, height, offx, offy, r, g, b, a, filled = true, lineWidth = 1) {
    if (ctx[layer].type == "webgl") {
        let vertices = [];

        if (filled) {
            vertices = [
                offx, offy,
                offx + width, offy,
                offx, offy + height,
    
                offx + width, offy, 
                offx, offy + height,
                offx + width, offy + height
            ];
        } else {
            vertices = [
                // Top
                offx, offy,
                offx + width, offy,
                offx, offy + lineWidth,

                offx + width, offy,
                offx, offy + lineWidth,
                offx + width, offy + lineWidth,

                // Bottom
                offx, offy + height,
                offx + width, offy + height,
                offx, offy + lineWidth + height,

                offx + width, offy + height,
                offx, offy + lineWidth + height,
                offx + width, offy + lineWidth + height,

                // Left
                offx, offy,
                offx + lineWidth, offy,
                offx, offy + height,

                offx + lineWidth, offy,
                offx, offy + height,
                offx + lineWidth, offy + height,

                // Right
                offx + width, offy,
                offx + width + lineWidth, offy,
                offx + width, offy + height,

                offx + width + lineWidth, offy,
                offx + width, offy + height,
                offx + width + lineWidth, offy + height
            ];
        }

        drawPolygon(layer, vertices, x, y, angle, r, g, b, a);
    }

    if (ctx[layer].type == "2d") {
        ctx[layer].save();
        ctx[layer].translate(offx, offy);
        ctx[layer].rotate(angle);

        if (filled) {
            ctx[layer].fillStyle = rgbToHex(r,g,b);
            ctx[layer].fillRect(x, y, width, height);
        } else {
            ctx[layer].strokeStyle = rgbToHex(r,g,b);
            ctx[layer].lineWidth = lineWidth;
            ctx[layer].strokeRect(x, y, width, height);
        }

        ctx[layer].restore();
    }
}
function drawCircle(layer, radius, x, y, sangle, eangle, r, g, b, a) {
    if (ctx[layer].type == "webgl") {
        let vertices = [];

        //Generate the circle's vertices
        for (var i=sangle; i<eangle; i++) {
            const newx0 = Math.cos((i + 0) / 180 * Math.PI) * radius;
            const newy0 = Math.sin((i + 0) / 180 * Math.PI) * radius;
            const newx1 = Math.cos((i + 1) / 180 * Math.PI) * radius;
            const newy1 = Math.sin((i + 1) / 180 * Math.PI) * radius;

            vertices.push(newx0);
            vertices.push(newy0);
            vertices.push(0);
            vertices.push(0);
            vertices.push(newx1);
            vertices.push(newy1);
        }

        drawPolygon(layer, vertices, x, y, 0, r, g, b, a);
    }

    if (ctx[layer].type == "2d") {
        ctx[layer].fillStyle = rgbToHex(r,g,b);
        ctx[layer].arc(x, y, radius, sangle, eangle);
    }
}

/* WEBGL ONLY */
function drawLine(layer, x1, y1, x2, y2, r, g, b, a, scale = 1, angle = 0) {
    let width = Math.distanceBetweenVectors(x1, y1, x2, y2);
    let height = scale;
    let offx = -(scale / 2);
    let offy = -(scale / 2);

    angle += Math.degreesBetweenVectors(x1, y1, x2, y2);

    const vertices = [
        offx, offy,
        offx + width, offy,
        offx, offy + height,

        offx + width, offy,
        offx, offy + height,
        offx + width, offy + height
    ];

    drawPolygon(layer, vertices, x1, y1, angle, r, g, b, a);
}
function drawPolygon(layer, vertices, x, y, angle, r, g, b, a) {
    var cos = Math.cos(Math.toRadians(angle + 90));
    var sin = Math.sin(Math.toRadians(angle + 90));

    var positionAttribLocation = ctx[layer].getAttribLocation(Shaders.default[layer], "aposition");
    var rotationUniformLocation = ctx[layer].getUniformLocation(Shaders.default[layer], "urotation");
    var scaleUniformLocation = ctx[layer].getUniformLocation(Shaders.default[layer], "uscale");
    var translationUniformLocation = ctx[layer].getUniformLocation(Shaders.default[layer], "utranslation");
    var resolutionUniformLocation = ctx[layer].getUniformLocation(Shaders.default[layer], "uresolution");
    var colorUniformLocation = ctx[layer].getUniformLocation(Shaders.default[layer], "ucolor");

    ctx[layer].bindBuffer(ctx[layer].ARRAY_BUFFER, vbuffer[layer]);
    ctx[layer].bufferData(ctx[layer].ARRAY_BUFFER, new Float32Array(vertices), ctx[layer].STATIC_DRAW);
    ctx[layer].bindTexture(ctx[layer].TEXTURE_2D, null);
    ctx[layer].useProgram(Shaders.default[layer]);
    ctx[layer].enableVertexAttribArray(positionAttribLocation);
    ctx[layer].uniform2f(translationUniformLocation, x, y);
    ctx[layer].uniform2f(rotationUniformLocation, cos, sin);
    ctx[layer].uniform2f(scaleUniformLocation, Game.scale, Game.scale);
    ctx[layer].uniform2f(resolutionUniformLocation, canvas[layer].width, canvas[layer].height);
    ctx[layer].uniform4f(colorUniformLocation, r / 255.0, g / 255.0, b / 255.0, a / 255.0);
    ctx[layer].bindBuffer(ctx[layer].ARRAY_BUFFER, vbuffer[layer]);
    ctx[layer].vertexAttribPointer(positionAttribLocation, 2, ctx[layer].FLOAT, false, 0, 0);
    ctx[layer].drawArrays(ctx[layer].TRIANGLES, 0, vertices.length / 2);
}

/* CONTEXT2D ONLY */
function drawText(layer, x, y, text, fontFamily = "Arial", fontSize = 10, r = 0, g = 0, b = 0) {
    ctx[layer].font = fontSize + "pt " + fontFamily;
    ctx[layer].fillStyle = rgbToHex(r, g, b);
    ctx[layer].fillText(text, x, y);
}

/* INPUT */
var Cursor = {
    x: 0,
    y: 0,
    down: false,
    up: false,

    init: function() {
        if (Game.mobile) {
            canvas[canvas.length - 1].addEventListener("touchstart", function(e) {
                Cursor.down = true;
                Cursor.x = e.changedTouches[0].clientX - canvas[canvas.length - 1].getBoundingClientRect().left;
                Cursor.y = e.changedTouches[0].clientY - canvas[canvas.length - 1].getBoundingClientRect().top;
                Cursor.x /= Game.Window.ratio;
                Cursor.y /= Game.Window.ratio;
                Cursor.x /= Game.scale;
                Cursor.y /= Game.scale;
            });
            canvas[canvas.length - 1].addEventListener("touchmove", function(e) {
                Cursor.x = e.changedTouches[0].clientX - canvas[canvas.length - 1].getBoundingClientRect().left;
                Cursor.y = e.changedTouches[0].clientY - canvas[canvas.length - 1].getBoundingClientRect().top;
                Cursor.x /= Game.Window.ratio;
                Cursor.y /= Game.Window.ratio;
                Cursor.x /= Game.scale;
                Cursor.y /= Game.scale;
            });
            canvas[canvas.length - 1].addEventListener("touchend", function(e) {
                Cursor.x = e.changedTouches[0].clientX - canvas[canvas.length - 1].getBoundingClientRect().left;
                Cursor.y = e.changedTouches[0].clientY - canvas[canvas.length - 1].getBoundingClientRect().top;
                Cursor.x /= Game.Window.ratio;
                Cursor.y /= Game.Window.ratio;
                Cursor.x /= Game.scale;
                Cursor.y /= Game.scale;
                Cursor.down = false;
                Cursor.up = true;
            });
        } else {
            canvas[canvas.length - 1].addEventListener("mousedown", function(e) {
                Cursor.down = true;
                Cursor.x = e.clientX - canvas[canvas.length - 1].getBoundingClientRect().left;
                Cursor.y = e.clientY - canvas[canvas.length - 1].getBoundingClientRect().top;
                Cursor.x /= Game.scale;
                Cursor.y /= Game.scale;
            });
            canvas[canvas.length - 1].addEventListener("mousemove", function(e) {
                Cursor.x = e.clientX - canvas[canvas.length - 1].getBoundingClientRect().left;
                Cursor.y = e.clientY - canvas[canvas.length - 1].getBoundingClientRect().top;
                Cursor.x /= Game.scale;
                Cursor.y /= Game.scale;
            });
            canvas[canvas.length - 1].addEventListener("mouseup", function(e) {
                Cursor.x = e.clientX - canvas[canvas.length - 1].getBoundingClientRect().left;
                Cursor.y = e.clientY - canvas[canvas.length - 1].getBoundingClientRect().top;
                Cursor.x /= Game.scale;
                Cursor.y /= Game.scale;
                Cursor.down = false;
                Cursor.up = true;
            });
        }
    },
    update: function() {
        this.up = false;
    }
}
var Keyboard = {
    keydown: [],
    keypress: [],

    init: function() {
        for (var i=0; i<256; i++) {
            this.keydown[i] = false;
            this.keypress[i] = false;
        }

        window.addEventListener("keydown", function(e) {
            Keyboard.keydown[e.keyCode] = true;
            Keyboard.keypress[e.keyCode] = true;
        });
        window.addEventListener("keyup", function(e) {
            Keyboard.keydown[e.keyCode] = false;
        });
    },
    update: function() {
        for (var i=0; i<this.keypress.length; i++) {
            this.keypress[i] = false;
        }
    }
}

var KeyCode = {
	f1: 1,
	f2: 2,
	f3: 3,
	f4: 4,
	f5: 5,
	f6: 6,
	f7: 7,
	f8: 8,
	f9: 9,
	f10: 10,
	f11: 11,
	f12: 12,
	enter: 13,
	backspace: 15,
	shift: 16,
	control: 17,
	alt: 18,
	pause: 19,
	capslock: 20,
	
	escape: 27,
	
	space: 32,
	pageUp: 33,
	pageDown: 34,
	end: 35,
	home: 36,
	left: 37,
	up: 38,
	right: 39,
	down: 40,
	
	printscr: 44,
	insert: 45,
	del: 46,
	
	alpha0: 48,
	alpha1: 49,
	alpha2: 50,
	alpha3: 51,
	alpha4: 52,
	alpha5: 53,
	alpha6: 54,
	alpha7: 55,
	alpha8: 56,
	alpha9: 57,
	
	a: 65,
	b: 66,
	c: 67,
	d: 68,
	e: 69,
	f: 70,
	g: 71,
	h: 72,
	i: 73,
	j: 74,
	k: 75,
	l: 76,
	m: 77,
	n: 78,
	o: 79,
	p: 80,
	q: 81,
	r: 82,
	s: 83,
	t: 84,
	u: 85,
	v: 86,
	w: 87,
	x: 88,
	y: 89,
	z: 90,
	
	context: 93,
	
	num0: 96,
	num1: 97,
	num2: 98,
	num3: 99,
	num4: 100,
	num5: 101,
	num6: 102,
	num7: 103,
	num8: 104,
	num9: 105,
	
	numAsterisk: 106,
	numPlus: 107,
	numMinus: 109,
	numDelete: 110,
	numSlash: 111,
	
	numLock: 144,
	scrollLock: 145,
	
	semicolon: 186,
	equal: 187,
	comma: 188,
	substract: 189,
	slash: 191,
	dot: 199,
	
	bracketLeft: 219,
	backslash: 220,
	bracketRight: 221,
	apostrophe: 222
};

/* MATH */
Math.toRadians = function(deg) {
	return deg * (Math.PI / 180);
};
Math.toDegrees = function(rad) {
	return (rad / Math.PI) * 180;
};
Math.radiansBetweenVectors = function(x1, y1, x2, y2) {
	var x = x2 - x1;
	var y = y2 - y1;

	theta = Math.atan2(y, x);
	if (theta < 0) {
		theta += 2 * Math.PI;
	}

	return theta;
};
Math.degreesBetweenVectors = function(x1, y1, x2, y2) {
	return Math.toDegrees(Math.radiansBetweenVectors(x1, y1, x2, y2));
};
Math.distanceBetweenVectors = function(x1, y1, x2, y2) {
	var x = x1 - x2;
	var y = y1 - y2;

	return Math.sqrt((x * x) + (y * y));
};
Math.xSpeed = function(deg) {
	return Math.cos(Math.toRadians(deg));
};
Math.ySpeed = function(deg) {
	return Math.sin(Math.toRadians(deg));
};
Math.differenceBetweenDegrees = function(degree1, degree2) {
	var dif1 = degree1 - degree2;
	var dif2 = degree2 - degree1;

	if (dif1 < 0) {
		degree1 += 360;
		dif1 = degree1 - degree2;
	}

	if (dif2 < 0) {
		degree2 += 360;
		dif2 = degree2 - degree1;
	}

	if (dif1 < dif2) {
		return dif1;
	} else {
		return dif2;
	}
};
Math.checkDifferenceBetweenDegrees = function(degree1, degree2) {
	var dif1 = degree1 - degree2;
	var dif2 = degree2 - degree1;

	if (dif1 < 0)
	{
		degree1 += 360;
		dif1 = degree1 - degree2;
	}

	if (dif2 < 0)
	{
		degree2 += 360;
		dif2 = degree2 - degree1;
	}

	if (dif1 < dif2)
	{
		return true;
	}
	else
	{
		return false;
	}

};
Math.Collision = {
	rectangle: function(x1,y1, w1, h1, x2, y2, w2, h2)	{
		if (x1 + w1 > x2 & x1 < x2 + w2 & y1 + h1 > y2 & y1 < y2 + h2) {
			return true;
		}
		return false;
	},

	circle: function(x1, y1, r1, x2, y2, r2) {
		var distance = Math.DistBetweenVec(x1, y1, x2, y2);
		var length = r1 + r2;

		if (distance < length) {
			return true;
		}
		return false;
	}
};

/* HELP FUNCTIONS */
function requestAnimFrame(callback) {
    if (window.requestAnimFrame) {
        window.requestAnimationFrame(callback);
    } else if (window.webkitRequestAnimationFrame) {
        window.webkitRequestAnimationFrame(callback);
    } else if (mozRequestAnimationFrame) {
        window.mozRequestAnimationFrame(callback);
    } else if (oRequestAnimationFrame) {
        window.oRequestAnimationFrame(callback);
    } else if (msRequestAnimationFrame) {
        window.msRequestAnimationFrame(callback);
    } else {
        window.setTimeout(callback, 1000 / 60);
    }
}
function requestFullScreen() {
	if (window.fullScreen == true || document.webkitIsFullScreen == true) {
		if (document.exitFullScreen != undefined) document.exitFullScreen();
		if (document.mozCancelFullScreen != undefined) document.mozCancelFullScreen();
		if (document.webkitCancelFullScreen != undefined) document.webkitCancelFullScreen();
	} else {
		window.setTimeout(function() {
			if (document.body.requestFullScreen != undefined) document.body.requestFullScreen();
			if (document.body.webkitRequestFullScreen != undefined) document.body.webkitRequestFullScreen();
			if (document.body.mozRequestFullScreen != undefined) document.body.mozRequestFullScreen();
		}, 100);
	}
}
function rgbToHex(r, g, b) {
    var output = "#";

    output += r.toString(16).padStart(2, "0");
    output += g.toString(16).padStart(2, "0");
    output += b.toString(16).padStart(2, "0");

    return output;
}
function rgbaToHex(r, g, b, a) {
    var output = "#";

    output += r.toString(16).padStart(2, "0");
    output += g.toString(16).padStart(2, "0");
    output += b.toString(16).padStart(2, "0");
    output += a.toString(16).padStart(2, "0");

    return output;
}