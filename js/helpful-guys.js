let help = (function () {
    let that = {};

    // thanks https://stackoverflow.com/questions/4938346/canvas-width-and-height-in-html5
    that.resizeCanvasToDisplaySize = function (canvas) {
        // look up the size the canvas is being displayed
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        // If its resolution does not match change it
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            return true;
        }

        return false;
    };

    let keyPressed = function (value) {
        return function (event) {
            switch (event.keyCode) {
                case 37:
                    that.leftPressed = value;
                    break;
                case 39:
                    that.rightPressed = value;
                    break;
                case 38:
                    that.upPressed = value;
            }
        }
    };

    that.upPressed = false;
    that.leftPressed = false;
    that.rightPressed = false;

    document.addEventListener('keydown', keyPressed(true));
    document.addEventListener('keyup', keyPressed(false));

    return that;
})();