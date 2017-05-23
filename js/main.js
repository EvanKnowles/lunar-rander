
(function () {
    const GRAVITY = -9.8;
    const FLOOR = 260;
    const DEATH_Y = 20;
    const DEATH_X = 10;
    const DEATH_ROT = 0.174533;
    // DEATH ROT DEATH ROT! To the tune of Dethklok, of course.

    let canvas = document.getElementById('main-canvas');
    help.resizeCanvasToDisplaySize(canvas);
    let ctx = canvas.getContext('2d');

    let shipImage = new Image();

    let showAt = function (s, size, x, y) {
        ctx.font = size + "px Arial";

        ctx.fillText(s,x,y);
    };

    let show = function (s, size) {
        ctx.font = size + "px Arial";
        var textMetrics = ctx.measureText(s);

        showAt(s,size, canvas.width/2-textMetrics.width/2,canvas.height/2-size/2);
    };


    let ship = {
        fuel: 500,
        pos: {
            x: 50,
            y: 100
        },
        power: 20,
        spinSpeed: Math.PI / 4,
        rotate: 0,
        velocity: {x: 10, y: 20},

        spin: function (left, diff) {
            this.rotate += this.spinSpeed * left * (diff / 1000);
        },

        inc: function (diff) {
            var multiplier = (diff / 1000);

            this.velocity.y += GRAVITY * multiplier;
            this.pos.x += this.velocity.x * multiplier;
            this.pos.y -= this.velocity.y * multiplier;
        },

        thrust: function (diff) {
            if (this.fuel < 0) {
                return;
            }
            var multiplier = (diff / 1000);
            this.fuel -= this.power * multiplier;
            this.velocity.x += this.power * Math.sin(this.rotate) * multiplier;
            this.velocity.y += this.power * Math.cos(-this.rotate) * multiplier;
        },

        vel: function () {
            var number = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
            return Math.round(number*10)/10;
        }
    };

    function drawShip() {
        ctx.save();
        ctx.translate(ship.pos.x, ship.pos.y);
        ctx.rotate(ship.rotate);
        ctx.drawImage(shipImage, -shipImage.width / 2, -shipImage.height / 2, shipImage.width, shipImage.height);
        ctx.restore();
    }

    let lastTime, thisTime;

    function loop() {
        lastTime = thisTime || new Date().getTime();
        thisTime = new Date().getTime();
        let diff = thisTime - lastTime;

        // this clears the canvas, promise.
        canvas.width = canvas.width;

        ctx.beginPath();
        ctx.moveTo(0,FLOOR);
        ctx.lineTo(canvas.width,FLOOR);
        ctx.stroke();

        drawShip();
        if (help.upPressed) {
            ship.thrust(diff);
        }
        if (help.leftPressed) {
            ship.spin(-1, diff);
        }
        if (help.rightPressed) {
            ship.spin(1, diff);
        }
        // perhaps we should tear the ship in two if left and right are pressed?
        // or just blame the media?

        ship.inc(diff);

        showAt("Fuel: " + Math.round(ship.fuel), 24, 10, 36);
        showAt("Velocity: " + ship.vel() +" m/s", 24, 10, 72);

        if (ship.pos.y > FLOOR - shipImage.height/2) {
            console.log(ship.velocity);
            console.log(ship.rotate);

            // falling too fast, drifting too hard or off by ~10 degrees.
            if (Math.abs(ship.velocity.y) >= DEATH_Y || Math.abs(ship.velocity.x) >= DEATH_X || Math.abs(ship.rotate) >= DEATH_ROT) {
                show("kablewwwy", 56);
            } else {
                show("safe yay", 56);
            }
        }
        else {
            requestAnimationFrame(loop)
        }
    }

    function getRandom(value) {
        return 2 * value - Math.random() * 4 * value;
    }

    shipImage.onload = function () {
        ship.velocity.x = getRandom(DEATH_X);
        ship.velocity.y = getRandom(DEATH_Y);
        ship.rotate = getRandom(DEATH_ROT);
        loop();
    };
    shipImage.src = "img/ship.png";
})();