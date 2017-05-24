
(function () {
    const GRAVITY = -9.8;
    const FLOOR = 260;
    const DEATH_Y = 20;
    const DEATH_X = 10;
    const DEATH_ROT = 0.174533;
    const TIME_SPAN = 90;

    // DEATH ROT DEATH ROT! To the tune of Dethklok, of course.

    let date = new Date();

    const padded = "00";

    function pad(str) {
        str = "" + str;
        return padded.substring(0, padded.length - str.length) + str;
    }

    function unroll(tomorrow) {
        return new Date(tomorrow.setDate(tomorrow.getDate() - 1));
    }

    function fetchRate(theDate, index) {
        let url = 'http://api.fixer.io/' + theDate.getFullYear() + '-' + pad(theDate.getMonth()) + '-' + pad(theDate.getDate()) + '?base=USD&symbols=ZAR';
        console.log(url);
        fetch(url)
            .then(res => res.json())
            .then((out) => {
                days[index] = out.rates.ZAR;
                console.log('Checkout this exchange: ', out.rates.ZAR);
            })
            .catch(err => {
                if (err.indexOf("429")) {
                    console.log(err);
                    console.log('SLOW DOWN!');
                }
            });
    }

    let days = [];

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    var count = function (days) {
        let count = 0;
        for (let i of days) {
            if (i) count++;
        }
        return count;
    };

    async function loadRates() {
        for (var i = 0; i < TIME_SPAN; i++) {
            fetchRate(date, i);
            await sleep(200);
            console.log(i/TIME_SPAN);
            date = unroll(date);
        }

        while (count(days) != TIME_SPAN) {
           await sleep(100);
        }
        console.log(days);
        loadShip();

    }

    loadRates();
    let canvas = document.getElementById('main-canvas');
    help.resizeCanvasToDisplaySize(canvas);
    let ctx = canvas.getContext('2d');

    let shipImage = new Image();

    let showAt = function (s, size, x, y) {
        ctx.font = size + "px Arial";

        ctx.fillText(s, x, y);
    };

    let show = function (s, size) {
        ctx.font = size + "px Arial";
        var textMetrics = ctx.measureText(s);

        showAt(s, size, canvas.width / 2 - textMetrics.width / 2, canvas.height / 2 - size / 2);
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
            return Math.round(number * 10) / 10;
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

    const TIME_WIDTH = canvas.width / TIME_SPAN;
    function floorHeight(x) {
        let day = Math.floor(x / TIME_WIDTH);
        return days[day]*20 + FLOOR;
    }

    var floorRough = function (x) {
        return Math.abs(floorHeight(x - 5) - floorHeight(x + 5)) > 5;
    };

    function loop() {
        lastTime = thisTime || new Date().getTime();
        thisTime = new Date().getTime();
        let diff = thisTime - lastTime;

        // this clears the canvas, promise.
        canvas.width = canvas.width;

        ctx.beginPath();
        ctx.moveTo(0, floorHeight(0));
        for (let x = 0; x < canvas.width; x++) {
            ctx.lineTo(x, floorHeight(x));
        }
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
        showAt("Velocity: " + ship.vel() + " m/s", 24, 10, 72);

        if (ship.pos.y > floorHeight(ship.pos.x) - shipImage.height / 2) {

            // falling too fast, drifting too hard or off by ~10 degrees.
            if (Math.abs(ship.velocity.y) >= DEATH_Y || Math.abs(ship.velocity.x) >= DEATH_X || Math.abs(ship.rotate) >= DEATH_ROT) {
                show("kablewwwy", 56);
            } else if (floorRough(ship.pos.x)) {
                show("safe yay... except for the mountain, you ded", 48);
            }
            else {
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
        ship.velocity.x = getRandom(2 * DEATH_X);
        ship.velocity.y = getRandom(2 * DEATH_Y);
        ship.rotate = getRandom(2 * DEATH_ROT);

        loop();
    };
    function loadShip() {
        shipImage.src = "img/ship.png";
    }
})();