var canvas = document.getElementById("game");
var gl = canvas.getContext("webgl");

var vbuffer = gl.createBuffer();
var tcbuffer = gl.createBuffer();

var Game = {
    scale: 1,
    mobile: false,

    Window: {
        scaleX: 1,
        scaleY: 1,
        ratio: 1,

        resize: function(maxwidth, maxheight) {
            this.scaleX = maxwidth / canvas.width;
            this.scaleY = maxheight / canvas.height;
            this.ratio = Math.min(this.scaleX, this.scaleY);
            
            canvas.style.width = canvas.width * this.ratio + "px";
            canvas.style.height = canvas.height * this.ratio + "px";
        },
        center() {
            canvas.style.position = "absolute";
            canvas.style.top = "0px";
            canvas.style.left = (window.innerWidth / 2) - (parseInt(canvas.style.width) / 2) + "px";
        },
    },

    init: function() {

        //Init shaders
        var vsource = "attribute vec2 aposition;";
        vsource += "attribute vec2 atexcoord;";
        vsource += "varying vec2 vtexcoord;";
        vsource += "uniform vec2 uresolution;";
        vsource += "uniform vec2 urotation;";
        vsource += "uniform vec2 utranslation;";
        vsource += "uniform vec2 uscale;";
        vsource += "void main() {";
        vsource += "vec2 rotatedPosition = vec2(aposition.x * urotation.y + aposition.y * urotation.x, aposition.y * urotation.y - aposition.x * urotation.x);";
        vsource += "vec2 position = (rotatedPosition + utranslation) * uscale;"
        vsource += "vec2 zeroToOne = position / uresolution;";
        vsource += "vec2 zeroToTwo = zeroToOne * 2.0;";
        vsource += "vec2 clipSpace = zeroToTwo - 1.0;";
        vsource += "vtexcoord = atexcoord;";
        vsource += "gl_Position = vec4(clipSpace.x, -clipSpace.y, 0, 1);";
        vsource += "}";

        var fsource = "precision mediump float;";
        fsource += "varying vec2 vtexcoord;";
        fsource += "uniform vec4 ucolor;"
        fsource += "uniform sampler2D uimage;"
        fsource += "void main() {";
        fsource += "vec4 finalcolor = ucolor;";
        fsource += "finalcolor += texture2D(uimage, vtexcoord);";
        fsource += "gl_FragColor = finalcolor;";
        fsource += "}";

        Shaders.default = new Shader(vsource, fsource);

        //Init controls 
        Cursor.init();
        Keyboard.init();
    },
}

/* GRAPHICS */
var Shaders = {
    default: null,
}

function Camera() {
    return {
        viewport: {
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height,
        },
        clearcolor: {
            r: 1,
            g: 1,
            b: 1,
            a: 1,
        },

        render: function() {
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            gl.viewport(this.viewport.x, this.viewport.y, this.viewport.width, this.viewport.height);
            gl.clearColor(this.clearcolor.r, this.clearcolor.g, this.clearcolor.b, this.clearcolor.a);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
    }
}

function Shader(vsource, fsource) {
    var program = gl.createProgram();
    var vshader = gl.createShader(gl.VERTEX_SHADER);
    var fshader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vshader, vsource);
    gl.shaderSource(fshader, fsource);
    gl.compileShader(vshader);
    gl.compileShader(fshader);

    var status1 = gl.getShaderParameter(vshader, gl.COMPILE_STATUS);
    var status2 = gl.getShaderParameter(fshader, gl.COMPILE_STATUS);

    if (status1 == false) {
        console.log(gl.getShaderInfoLog(vshader));
    }
    if (status2 == false) {
        console.log(gl.getShaderInfoLog(fshader));
    }

    gl.attachShader(program, vshader);
    gl.attachShader(program, fshader);
    gl.linkProgram(program);

    gl.deleteShader(vshader);
    gl.deleteShader(fshader);

    return program;
}

function Font(size, family, r, g, b, a) {
    var positionAttribLocation = gl.getAttribLocation(Shaders.default, "aposition");
    var texcoordAttribLocation = gl.getAttribLocation(Shaders.default, "atexcoord");
    var resolutionUniformLocation = gl.getUniformLocation(Shaders.default, "uresolution");
    
    var glyphcanvas = document.createElement("canvas");
    var glyphctx = glyphcanvas.getContext("2d");
    var glyphwidths = [];

    glyphcanvas.width = 1024;
    glyphcanvas.height = 1024;

    for (var x=0; x<16; x++) {
        for (var y=0; y<16; y++){
            var index = x + (y * 16);

            glyphctx.font = size + "pt " + family;
            glyphctx.fillStyle = "rgba(" + r*255 + "," + g*255 + "," + b*255 + "," + a + ")";
            glyphctx.fillText(String.fromCharCode(index), (x * 64) + size, (y * 64) + size * 1.5);

            glyphwidths[index] = glyphctx.measureText(String.fromCharCode(index)).width;
        }
    }

    var glyphs = new Sprite(glyphcanvas.toDataURL());
    glyphs.glyphwidths = glyphwidths;
    glyphs.fontsize = size;
    glyphs.fontfamily = family;

    return {
        glyphs: glyphs,

        measureText: function(text) {
            var width = 0;

            for (var i=0; i<text.length; i++) {
                width += this.glyphs.glyphwidths[text.charCodeAt(i)];
            }

            return {
                width: width / Game.scale,
            }
        }
    }
}
function Sprite(path) {
    var img = new Image();
    img.src = path;
    img.onload = function() {
        this.texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this);
    }

    return img;
}

function drawText(font, text, x, y) {
    for (var i=0; i<text.length; i++) {
        var charcode = text.charCodeAt(i);
        var vert = Math.floor(charcode / 16);
        var hor = ((charcode / 16) - vert) * 16;

        drawSprite(font.glyphs, hor, vert, 64, 64, x, y, 64 / Game.scale, 64 / Game.scale, 0, 0, 0);

        x += font.glyphs.glyphwidths[charcode] / Game.scale;
    }
}
function drawSprite(sprite, framehor, framevert, framewidth, frameheight, x, y, width, height, angle, offx, offy) {
    var sin = Math.sin(Math.toRadians(angle + 90));
    var cos = Math.cos(Math.toRadians(angle + 90));
    var tcx = (1 / (sprite.width / framewidth)) * framehor;
    var tcy = (1 / (sprite.height / frameheight)) * framevert;
    var difx = 1 / (sprite.width / framewidth);
    var dify = 1 / (sprite.height / frameheight);
    var vertices = [offx, offy, offx + width, offy, offx, offy + height, offx + width, offy, offx, offy + height, offx + width, offy + height];
    var texcoords = [tcx, tcy, tcx + difx, tcy, tcx, tcy + dify, tcx + difx, tcy, tcx, tcy + dify, tcx + difx, tcy + dify];

    gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, tcbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

    gl.bindTexture(gl.TEXTURE_2D, sprite.texture);
    gl.useProgram(Shaders.default);

    var positionAttribLocation = gl.getAttribLocation(Shaders.default, "aposition");
    var translationUniformLocation = gl.getUniformLocation(Shaders.default, "utranslation");
    var scaleUniformLocation = gl.getUniformLocation(Shaders.default, "uscale");
    var rotationUniformLocation = gl.getUniformLocation(Shaders.default, "urotation");
    var scaleUniformLocation = gl.getUniformLocation(Shaders.default, "uscale");
    var texcoordAttribLocation = gl.getAttribLocation(Shaders.default, "atexcoord");
    var resolutionUniformLocation = gl.getUniformLocation(Shaders.default, "uresolution");
    var colorUniformLocation = gl.getUniformLocation(Shaders.default, "ucolor");

    gl.enableVertexAttribArray(positionAttribLocation);
    gl.enableVertexAttribArray(texcoordAttribLocation);

    gl.uniform2f(translationUniformLocation, x, y);
    gl.uniform2f(rotationUniformLocation, cos, sin);
    gl.uniform2f(scaleUniformLocation, Game.scale, Game.scale);
    gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
    gl.uniform4f(colorUniformLocation, 0, 0, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
    gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, tcbuffer);
    gl.vertexAttribPointer(texcoordAttribLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}
function drawRectangle(x, y, width, height, angle, offx, offy, r, g, b, a) {
    var sin = Math.sin(Math.toRadians(angle + 90));
    var cos = Math.cos(Math.toRadians(angle + 90));
    var vertices = [offx, offy, offx + width, offy, offx, offy + height, offx + width, offy, offx, offy + height, offx + width, offy + height];

    gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.useProgram(Shaders.default);

    var positionAttribLocation = gl.getAttribLocation(Shaders.default, "aposition");
    var rotationUniformLocation = gl.getUniformLocation(Shaders.default, "urotation");
    var scaleUniformLocation = gl.getUniformLocation(Shaders.default, "uscale");
    var translationUniformLocation = gl.getUniformLocation(Shaders.default, "utranslation");
    var resolutionUniformLocation = gl.getUniformLocation(Shaders.default, "uresolution");
    var colorUniformLocation = gl.getUniformLocation(Shaders.default, "ucolor");

    gl.enableVertexAttribArray(positionAttribLocation);

    gl.uniform2f(translationUniformLocation, x, y);
    gl.uniform2f(rotationUniformLocation, cos, sin);
    gl.uniform2f(scaleUniformLocation, Game.scale, Game.scale);
    gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
    gl.uniform4f(colorUniformLocation, r, g, b, a);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
    gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}
function drawCircle(x, y, radius, sangle, eangle, offx, offy, r, g, b, a) {
    var vertices = [];

    //Generate the circle
    for (var i=sangle; i<eangle; i++) {
        var newx0 = Math.cos((i + 0) / 180 * Math.PI) * radius;
        var newy0 = Math.sin((i + 0) / 180 * Math.PI) * radius;
        var newx1 = Math.cos((i + 1) / 180 * Math.PI) * radius;
        var newy1 = Math.sin((i + 1) / 180 * Math.PI) * radius;

        vertices.push(newx0);
        vertices.push(newy0);
        vertices.push(0);
        vertices.push(0);
        vertices.push(newx1);
        vertices.push(newy1);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.useProgram(Shaders.default);

    var positionAttribLocation = gl.getAttribLocation(Shaders.default, "aposition");
    var rotationUniformLocation = gl.getUniformLocation(Shaders.default, "urotation");
    var scaleUniformLocation = gl.getUniformLocation(Shaders.default, "uscale");
    var translationUniformLocation = gl.getUniformLocation(Shaders.default, "utranslation");
    var resolutionUniformLocation = gl.getUniformLocation(Shaders.default, "uresolution");
    var colorUniformLocation = gl.getUniformLocation(Shaders.default, "ucolor");

    gl.enableVertexAttribArray(positionAttribLocation);

    gl.uniform2f(translationUniformLocation, x, y);
    gl.uniform2f(rotationUniformLocation, 0, 1);
    gl.uniform2f(scaleUniformLocation, Game.scale, Game.scale);
    gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
    gl.uniform4f(colorUniformLocation, r, g, b, a);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
    gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
}
function drawPolygon(vertices, x, y, angle, r, g, b, a) {
    var cos = Math.cos(Math.toRadians(angle + 90));
    var sin = Math.sin(Math.toRadians(angle + 90));

    var positionAttribLocation = gl.getAttribLocation(Shaders.default, "aposition");
    var rotationUniformLocation = gl.getUniformLocation(Shaders.default, "urotation");
    var scaleUniformLocation = gl.getUniformLocation(Shaders.default, "uscale");
    var translationUniformLocation = gl.getUniformLocation(Shaders.default, "utranslation");
    var resolutionUniformLocation = gl.getUniformLocation(Shaders.default, "uresolution");
    var colorUniformLocation = gl.getUniformLocation(Shaders.default, "ucolor");

    gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.useProgram(Shaders.default);

    gl.enableVertexAttribArray(positionAttribLocation);

    gl.uniform2f(translationUniformLocation, x, y);
    gl.uniform2f(rotationUniformLocation, cos, sin);
    gl.uniform2f(scaleUniformLocation, Game.scale, Game.scale);
    gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
    gl.uniform4f(colorUniformLocation, r, g, b, a);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
    gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
}

/* INPUT */
var Cursor = {
    x: 0,
    y: 0,
    down: false,
    up: false,

    init: function() {
        if (Game.mobile) {
            canvas.addEventListener("touchstart", function(e) {
                Cursor.down = true;
                Cursor.x = e.changedTouches[0].clientX - canvas.getBoundingClientRect().left;
                Cursor.y = e.changedTouches[0].clientY - canvas.getBoundingClientRect().top;
                Cursor.x /= Game.Window.ratio;
                Cursor.y /= Game.Window.ratio;
                Cursor.x /= Game.scale;
                Cursor.y /= Game.scale;
            });
            canvas.addEventListener("touchmove", function(e) {
                Cursor.x = e.changedTouches[0].clientX - canvas.getBoundingClientRect().left;
                Cursor.y = e.changedTouches[0].clientY - canvas.getBoundingClientRect().top;
                Cursor.x /= Game.Window.ratio;
                Cursor.y /= Game.Window.ratio;
                Cursor.x /= Game.scale;
                Cursor.y /= Game.scale;
            });
            canvas.addEventListener("touchend", function(e) {
                Cursor.x = e.changedTouches[0].clientX - canvas.getBoundingClientRect().left;
                Cursor.y = e.changedTouches[0].clientY - canvas.getBoundingClientRect().top;
                Cursor.x /= Game.Window.ratio;
                Cursor.y /= Game.Window.ratio;
                Cursor.x /= Game.scale;
                Cursor.y /= Game.scale;
                Cursor.down = false;
                Cursor.up = true;
            });
        } else {
            canvas.addEventListener("mousedown", function(e) {
                Cursor.down = true;
                Cursor.x = e.clientX - canvas.getBoundingClientRect().left;
                Cursor.y = e.clientY - canvas.getBoundingClientRect().top;
                Cursor.x /= Game.Window.ratio;
                Cursor.y /= Game.Window.ratio;
                Cursor.x /= Game.scale;
                Cursor.y /= Game.scale;
            });
            canvas.addEventListener("mousemove", function(e) {
                Cursor.x = e.clientX - canvas.getBoundingClientRect().left;
                Cursor.y = e.clientY - canvas.getBoundingClientRect().top;
                Cursor.x /= Game.Window.ratio;
                Cursor.y /= Game.Window.ratio;
                Cursor.x /= Game.scale;
                Cursor.y /= Game.scale;
            });
            canvas.addEventListener("mouseup", function(e) {
                Cursor.x = e.clientX - canvas.getBoundingClientRect().left;
                Cursor.y = e.clientY - canvas.getBoundingClientRect().top;
                Cursor.x /= Game.Window.ratio;
                Cursor.y /= Game.Window.ratio;
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

    init: function() {
        for (var i=0; i<256; i++) {
            this.keydown[i] = false;
        }
    },
    update: function() {
        for (var i=0; i<this.keydown.length; i++) {
            this.keydown[i] = false;
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