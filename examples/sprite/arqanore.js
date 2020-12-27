const canvas = document.querySelector("#game");
const ctx = canvas.getContext("webgl");

const Arqanore = {
    mobile: false,

    init: async function() {
        await this.initShaders();

        await Cursor.init();
        await Keyboard.init();
    },
    initShaders: async function() {
        await this.initShaderDefault();
        await this.initShaderTexture();
    },
    initShaderDefault: async function() {
        let vSource = "";
        let fSource = "";

        vSource += "attribute vec2 aposition;\n";
        vSource += "uniform vec2 uresolution;\n";
        vSource += "uniform vec2 urotation;\n";
        vSource += "uniform vec2 utranslation;\n";
        vSource += "\n";
        vSource += "void main() {\n";
        vSource += "vec2 rotatedPosition = vec2(aposition.x * urotation.y + aposition.y * urotation.x, aposition.y * urotation.y - aposition.x * urotation.x);\n";
        vSource += "vec2 zeroToOne = (rotatedPosition + utranslation) / uresolution;\n";
        vSource += "vec2 zeroToTwo = zeroToOne * 2.0;\n";
        vSource += "vec2 clipSpace = zeroToTwo - 1.0;\n";
        vSource += "gl_Position = vec4(clipSpace.x, -clipSpace.y, 0, 1);\n";
        vSource += "}\n";

        fSource += "precision mediump float;\n";
        fSource += "uniform vec4 ucolor;\n";
        fSource += "\n";
        fSource += "void main() {\n";
        fSource += "gl_FragColor = ucolor;\n";
        fSource += "}\n";

        Shaders.default = new Shader(vSource, fSource);
    },
    initShaderTexture: async function() {
        let vSource = "";
        let fSource = "";

        vSource += "attribute vec2 aposition;\n";
        vSource += "attribute vec2 atexcoord;\n";
        vSource += "uniform vec2 uresolution;\n";
        vSource += "uniform vec2 urotation;\n";
        vSource += "uniform vec2 utranslation;\n";
        vSource += "varying vec2 vtexcoord;\n";
        vSource += "\n";
        vSource += "void main() {\n";
        vSource += "vec2 rotatedPosition = vec2(aposition.x * urotation.y + aposition.y * urotation.x, aposition.y * urotation.y - aposition.x * urotation.x);\n";
        vSource += "vec2 zeroToOne = (rotatedPosition + utranslation) / uresolution;\n";
        vSource += "vec2 zeroToTwo = zeroToOne * 2.0;\n";
        vSource += "vec2 clipSpace = zeroToTwo - 1.0;\n";
        vSource += "\n";
        vSource += "vtexcoord = atexcoord;\n";
        vSource += "\n";
        vSource += "gl_Position = vec4(clipSpace.x, -clipSpace.y, 0, 1);\n";
        vSource += "}\n";

        fSource += "precision mediump float;\n";
        fSource += "uniform sampler2D uimage;\n";
        fSource += "uniform vec4 ucolor;\n";
        fSource += "varying vec2 vtexcoord;\n";
        fSource += "void main() {\n";
        fSource += "gl_FragColor = texture2D(uimage, vtexcoord) * ucolor;\n";
        fSource += "}";

        Shaders.texture = new Shader(vSource, fSource);
    }
}

const Shaders = {
    default: null,
    texture: null
}

const Camera = {
    render: async function() {
        ctx.enable(ctx.BLEND);
        ctx.blendFunc(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA);
        ctx.viewport(0, 0, canvas.width, canvas.height);
        ctx.clear(ctx.COLOR_BUFFER_BIT);
    }
}

/* INPUT */
const Cursor = {
    x: 0,
    y: 0,
    down: false,
    up: false,

    init: async function() {
        if (Arqanore.mobile) {
            canvas.addEventListener("touchstart", function(e) {
                Cursor.down = true;
                Cursor.x = e.changedTouches[0].clientX - canvas.getBoundingClientRect().left;
                Cursor.y = e.changedTouches[0].clientY - canvas.getBoundingClientRect().top;
            });
            canvas.addEventListener("touchmove", function(e) {
                Cursor.x = e.changedTouches[0].clientX - canvas.getBoundingClientRect().left;
                Cursor.y = e.changedTouches[0].clientY - canvas.getBoundingClientRect().top;
            });
            canvas.addEventListener("touchend", function(e) {
                Cursor.x = e.changedTouches[0].clientX - canvas.getBoundingClientRect().left;
                Cursor.y = e.changedTouches[0].clientY - canvas.getBoundingClientRect().top;
                Cursor.down = false;
                Cursor.up = true;
            });
        } else {
            canvas.addEventListener("mousedown", function(e) {
                Cursor.down = true;
                Cursor.x = e.clientX - canvas.getBoundingClientRect().left;
                Cursor.y = e.clientY - canvas.getBoundingClientRect().top;
            });
            canvas.addEventListener("mousemove", function(e) {
                Cursor.x = e.clientX - canvas.getBoundingClientRect().left;
                Cursor.y = e.clientY - canvas.getBoundingClientRect().top;
            });
            canvas.addEventListener("mouseup", function(e) {
                Cursor.x = e.clientX - canvas.getBoundingClientRect().left;
                Cursor.y = e.clientY - canvas.getBoundingClientRect().top;
                Cursor.down = false;
                Cursor.up = true;
            });
        }
    },
    update: async function() {
        this.up = false;
    }
}

const Keyboard = {
    states: [],

    keyDown: function(key) {
        for (let i=0; i<Keyboard.states.length; i++) {
            const state = Keyboard.states[i];

            if (key == "Any" && state.down) {
                return true;
            }

            if (state.key == key) {
                return state.down;
            }
        }

        return false;
    },
    keyUp: function(key) {
        for (let i=0; i<Keyboard.states.length; i++) {
            const state = Keyboard.states[i];

            if (key == "Any" && state.up) {
                return true;
            }

            if (state.key == key) {
                return state.up;
            }
        }

        return false;
    },

    init: async function() {
        this.addState(Keys.up);
        this.addState(Keys.down);
        this.addState(Keys.left);
        this.addState(Keys.right);
        this.addState(Keys.space);

        window.addEventListener("keydown", function(e) {
            for (let i=0; i<Keyboard.states.length; i++) {
                const state = Keyboard.states[i];

                if (state.key == e.key) {
                    state.down = true;
                }
            }
        });
        window.addEventListener("keyup", function(e) {
            for (let i=0; i<Keyboard.states.length; i++) {
                const state = Keyboard.states[i];

                if (state.key == e.key) {
                    state.down = false;
                    state.up = true;
                }
            }
        });
    },
    update: async function() {
        for (let i=0; i<Keyboard.states.length; i++) {
            Keyboard.states[i].up = false;
        }
    },

    addState: function(key) {
        this.states.push({
            key: key,
            down: false,
            up: false
        });
    }
}

const Keys = {
    any: "Any",
    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft" ,
    right: "ArrowRight",
    space: "Space"
}

/* MATH */
const MathHelper = {
    toRad: function(deg) {
        return deg * Math.PI / 180;
    },
    toDeg: function(rad) {
        return rad / Math.PI * 180;
    },

    radiansBetweenVectors: function(x1, y1, x2, y2) {
        const x = x2 - x1;
        const y = y2 - y1;

        theta = Math.atan2(y, x);

        if (theta < 0) {
            theta += 2 * Math.PI;
        }

        return theta;
    },
    degreesBetweenVectors: function(x1, y1, x2, y2) {
        return this.toDeg(this.radiansBetweenVectors(x1, y1, x2, y2));
    },
    distanceBetweenVectors: function(x1, y1, x2, y2) {
        const x = x1 - x2;
	    const y = y1 - y2;

	    return Math.sqrt((x * x) + (y * y));    
    }
}

 /* PHYSICS */
const Physics = {
    Collision: {
        rectangle: function(x1,y1, w1, h1, x2, y2, w2, h2)	{
            return x1 + w1 > x2 & x1 < x2 + w2 & y1 + h1 > y2 & y1 < y2 + h2;
        },
    
        circle: function(x1, y1, r1, x2, y2, r2) {
            const distance = Math.DistBetweenVec(x1, y1, x2, y2);
            const length = r1 + r2;
    
            return distance < length;
        }
    }
}

/* MISC */
const Utils = {
    rgbaToHex: function(r, g, b, a) {
        let output = "#";

        output += r.toString(16).padStart(2, "0");
        output += g.toString(16).padStart(2, "0");
        output += b.toString(16).padStart(2, "0");
        output += a.toString(16).padStart(2, "0");

        return output;
    }
}

/* ASSETS */
const AssetLoader = {
    loadTexture: function(url) {
        return new Promise(function(resolve, reject) {
            var img = new Image();
            img.src = url;
    
            img.addEventListener("load", function() {
                const texture = ctx.createTexture();
    
                ctx.bindTexture(ctx.TEXTURE_2D, texture);
                ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
                ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
                ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
                ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
                ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, this);
    
                resolve({
                    id: texture,
                    width: this.width,
                    height: this.height
                });
            });
    
            img.addEventListener("error", function(error) {
                reject(error);
            });
        });
    },

    loadSprite: function(url, framesHor, framesVert, offsetX, offsetY, scaleX, scaleY) {
        return new Promise(function(resolve, reject) {
            AssetLoader.loadTexture(url)
            .then(texture => {
                const vbuffer = ctx.createBuffer();
                const tcbuffer = ctx.createBuffer();
                const shader = Shaders.texture;

                let totalVertices = [];
                let totalTexCoords = [];

                for (frameVert=0; frameVert<framesVert; frameVert++) {
                    for (frameHor=0; frameHor<framesHor; frameHor++) {
                        const width = (texture.width * scaleX) / framesHor;
                        const height = (texture.height * scaleY) / framesVert;

                        const clipWidth = texture.width / framesHor;
                        const clipHeight = texture.height / framesVert;
                        const clipX = clipWidth * frameHor;
                        const clipY = clipHeight * frameVert;

                        const tcX = (1 / texture.width) * clipX;
                        const tcY = (1 / texture.height) * clipY;
                        const tcWidth = 1 / (texture.width / clipWidth);
                        const tcHeight = 1 / (texture.height / clipHeight);

                        const vertices = [
                            offsetX, offsetY,
                            offsetX + width, offsetY,
                            offsetX, offsetY + height,
                            offsetX + width, offsetY,
                            offsetX, offsetY + height,
                            offsetX + width, offsetY + height
                        ];

                        const texcoords = [
                            tcX, tcY,
                            tcX + tcWidth, tcY,
                            tcX, tcY + tcHeight,
                            tcX + tcWidth, tcY,
                            tcX, tcY + tcHeight,
                            tcX + tcWidth, tcY + tcHeight
                        ];

                        totalVertices = totalVertices.concat(vertices);
                        totalTexCoords = totalTexCoords.concat(texcoords);
                    }
                }

                let positionAttribLocation = ctx.getAttribLocation(shader, "aposition");
                let texcoordAttribLocation = ctx.getAttribLocation(shader, "atexcoord");

                ctx.enableVertexAttribArray(positionAttribLocation);
                ctx.enableVertexAttribArray(texcoordAttribLocation);

                ctx.bindBuffer(ctx.ARRAY_BUFFER, vbuffer);
                ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(totalVertices), ctx.STATIC_DRAW);
                ctx.vertexAttribPointer(positionAttribLocation, 2, ctx.FLOAT, false, 0, 0);

                ctx.bindBuffer(ctx.ARRAY_BUFFER, tcbuffer);
                ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(totalTexCoords), ctx.STATIC_DRAW);
                ctx.vertexAttribPointer(texcoordAttribLocation, 2, ctx.FLOAT, false, 0, 0);

                const sprite = {
                    texture: texture,
                    shader: shader,
                    vbuffer: vbuffer,
                    tcbuffer: tcbuffer,
                    framesHor: framesHor,
                    framesVert: framesVert,

                    render: function(x, y, frameHor, frameVert, angle, r, g, b, a) {
                        const frameIndex = (this.framesHor * frameVert) + frameHor;
                        const cos = Math.cos(MathHelper.toRad(angle + 90));
                        const sin = Math.sin(MathHelper.toRad(angle + 90));

                        const positionAttribLocation = ctx.getAttribLocation(shader, "aposition");
                        const texcoordAttribLocation = ctx.getAttribLocation(shader, "atexcoord");
                        const translationUniformLocation = ctx.getUniformLocation(this.shader, "utranslation");
                        const rotationUniformLocation = ctx.getUniformLocation(this.shader, "urotation");
                        const resolutionUniformLocation = ctx.getUniformLocation(this.shader, "uresolution");
                        const colorUniformLocation = ctx.getUniformLocation(this.shader, "ucolor");

                        ctx.bindBuffer(ctx.ARRAY_BUFFER, this.vbuffer);
                        ctx.vertexAttribPointer(positionAttribLocation, 2, ctx.FLOAT, false, 0, 0);
                        ctx.bindBuffer(ctx.ARRAY_BUFFER, this.tcbuffer);
                        ctx.vertexAttribPointer(texcoordAttribLocation, 2, ctx.FLOAT, false, 0, 0);

                        ctx.bindTexture(ctx.TEXTURE_2D, this.texture.id);
                        ctx.useProgram(this.shader);

                        ctx.uniform2f(translationUniformLocation, x, y);
                        ctx.uniform2f(rotationUniformLocation, cos, sin);
                        ctx.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
                        ctx.uniform4f(colorUniformLocation, r / 255.0, g / 255.0, b / 255.0, a / 255.0);    

                        ctx.drawArrays(ctx.TRIANGLES, frameIndex * 6, 6);
                        
                        ctx.useProgram(null);
                        ctx.bindTexture(ctx.TEXTURE_2D, null);
                    }
                }

                resolve(sprite);
            })
            .catch((error) => {
                reject("Unable to load texture: " + error);
            });
        });
    }
}

/* CONSTRUCTORS */
function Shader(vsource, fsource) {
    const program = ctx.createProgram();
    const vshader = ctx.createShader(ctx.VERTEX_SHADER);
    const fshader = ctx.createShader(ctx.FRAGMENT_SHADER);

    ctx.shaderSource(vshader, vsource);
    ctx.shaderSource(fshader, fsource);
    ctx.compileShader(vshader);
    ctx.compileShader(fshader);

    const status1 = ctx.getShaderParameter(vshader, ctx.COMPILE_STATUS);
    const status2 = ctx.getShaderParameter(fshader, ctx.COMPILE_STATUS);

    if (status1 == false) {
        console.error("GLSL compile error occured");
        console.error(ctx.getShaderInfoLog(vshader));
    }
    if (status2 == false) {
        console.error("GLSL compile error occured");
        console.error(ctx.getShaderInfoLog(fshader));
    }

    ctx.attachShader(program, vshader);
    ctx.attachShader(program, fshader);
    ctx.linkProgram(program);
    ctx.deleteShader(vshader);
    ctx.deleteShader(fshader);

    return program;
}

function Polygon(vertices) {
    let buffer = ctx.createBuffer();
    let shader = Shaders.default;
    let positionAttribLocation = ctx.getAttribLocation(shader, "aposition");

    ctx.enableVertexAttribArray(positionAttribLocation);
    ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer);
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(vertices), ctx.STATIC_DRAW);
    ctx.vertexAttribPointer(positionAttribLocation, 2, ctx.FLOAT, false, 0, 0);

    return {
        shader: shader,
        buffer: buffer,

        render: async function(x, y, angle, r, g, b, a) {
            const cos = Math.cos(MathHelper.toRad(angle + 90));
            const sin = Math.sin(MathHelper.toRad(angle + 90));

            const positionAttribLocation = ctx.getAttribLocation(this.shader, "aposition");
            const rotationUniformLocation = ctx.getUniformLocation(this.shader, "urotation");
            const translationUniformLocation = ctx.getUniformLocation(this.shader, "utranslation");
            const resolutionUniformLocation = ctx.getUniformLocation(this.shader, "uresolution");
            const colorUniformLocation = ctx.getUniformLocation(this.shader, "ucolor");

            ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer);
            ctx.vertexAttribPointer(positionAttribLocation, 2, ctx.FLOAT, false, 0, 0);
            ctx.bindTexture(ctx.TEXTURE_2D, null);
            ctx.useProgram(this.shader);
            ctx.uniform2f(translationUniformLocation, x, y);
            ctx.uniform2f(rotationUniformLocation, cos, sin);
            ctx.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
            ctx.uniform4f(colorUniformLocation, r / 255.0, g / 255.0, b / 255.0, a / 255.0);            
            ctx.drawArrays(ctx.TRIANGLES, 0, vertices.length / 2);
        }
    }
}