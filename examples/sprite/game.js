let sprite;
let direction = 0;
let frame = 0;
let frameTime = 0;
let x = 32;
let y = 32;

async function init() {
    await Game.init();

    sprite = await AssetLoader.loadSprite("characters.png", 16, 2, 0, 0, 3, 3);
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
    let anim = false;

    if (Keyboard.keyDown(Keys.down)) {
        y += 1;
        direction = 0;
        anim = true;
    }
    if (Keyboard.keyDown(Keys.up)) {
        y -= 1;
        direction = 1;
        anim = true;
    }
    if (Keyboard.keyDown(Keys.left)) {
        x -= 1;
        direction = 3;
        anim = true;
    }
    if (Keyboard.keyDown(Keys.right)) {
        x += 1;
        direction = 2;
        anim = true;
    }

    if (!Keyboard.keyDown(Keys.any)) {
        anim = false;
    }

    if (anim) {
        frameTime++;
    }

    if (frameTime > 16) {
        frame++;
        frameTime = 0;
    }
    if (frame > 3) {
        frame = 0;
    }

    Cursor.update();
    Keyboard.update();
}
async function render() {
    Camera.render();

    sprite.render(x, y, (direction * 4) + frame, 0, 0, 255, 255, 255, 255);
}

window.addEventListener("load", async function() {
    await resize();
    await init();
    await sync();
});

window.addEventListener("resize", function() {
    resize();
});