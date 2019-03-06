/* GLOBAL VARIABLES */


/* GENERAL */
function main() {
    

    requestAnimationFrame(main);
}
function init() {
    Game.init();
}
function resize() {
    Game.Window.resize(window.innerWidth, window.innerHeight);
    Game.Window.center();
}

/* EVENTS */
window.addEventListener("load", function() {
    init();
    resize();
    main();
});
window.addEventListener("resize", function() {
    resize();
});