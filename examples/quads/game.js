let width = 32;
let height = 32;
let quads = [];
let shape = null;

async function init() {
    await Game.init();

    shape = new Polygon([
        -width / 2, -height / 2,
        width / 2, -height / 2,
        -width / 2, height / 2,
        width / 2, -height / 2,
        width / 2, height / 2,
        -width / 2, height / 2
    ]);
}
async function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
async function sync() {
    update();
    render();

    requestAnimationFrame(sync);
}
async function update() {
    const elCount = document.querySelector("#count");

    elCount.innerHTML = quads.length;

    for (i=0; i<quads.length; i++) {
        const quad = quads[i];

        quad.x += quad.speed;
        quad.y += quad.speed;
        quad.angle += quad.speed;
        quad.a -= 1;

        if (quad.a <= 0) {
            quads.splice(i, 1);
        }

        if (quad.x > canvas.width + width) {
            quads.splice(i, 1);
        }
        if (quad.y > canvas.height + height) {
            quads.splice(i, 1);
        }
    }
    
    if (Cursor.down) {
        addQuad(Cursor.x, Cursor.y);
    }

    Cursor.update();
    Keyboard.update();
}
async function render() {
    Camera.render();

    for (i=0; i<quads.length; i++) {
        const quad = quads[i];

        shape.render(quad.x, quad.y, quad.angle, quad.r, quad.g, quad.b, quad.a);
    }
}

async function addQuad(x, y) {
    quads[quads.length] = {
        x: x,
        y: y,
        speed: 0.5 + (Math.random() * 0.5),
        angle: Math.random() * 360,

        r: Math.random() * 255,
        g: Math.random() * 255,
        b: Math.random() * 255,
        a: 100 + (Math.random() * 155)
    }
}

window.addEventListener("load", async function() {
    await resize();
    await init();
    await sync();
});

window.addEventListener("resize", function() {
    resize();
});
