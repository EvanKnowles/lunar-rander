(function () {
    //noinspection BadExpressionStatementJS
    const GRAVITY = -9.8;
    const DEATH_Y = 20;
    const DEATH_X = 10;
    const DEATH_ROT = 0.174533;
    // DEATH ROT DEATH ROT! To the tune of Dethklok, of course.
    const RATE_MULTIPLIER = 300;

    const NYAN_DELAY = 10000;
    const NYAN_SPEED = 20;

    const TIME_SPAN = 90;

    const STARS = 100;

    let screenTouch = false;


    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', devOrientHandler, false);
    } else {
        alert("No  device orientationinigationg.")
    }

    let date = new Date();
    let origDate = new Date();
    let shipImage = new Image();
    let moonImage = new Image();
    let flameImage = new Image();
    let nyanImage = new Image();

    let avgHeight = 0, maxHeight = 0, minHeight = 99999999;
    let pat;
    const padded = "00";
    let days = [];
    let stars = [];

    let canvas = document.getElementById('main-canvas');
    help.resizeCanvasToDisplaySize(canvas);
    let ctx = canvas.getContext('2d');
    let floor = 2 * canvas.height / 3;

    const format = function (avgHeight) {
        return Math.floor(avgHeight * 100) / 100;
    };

    function pad(str) {
        str = "" + str;
        return padded.substring(0, padded.length - str.length) + str;
    }

    function unroll(tomorrow) {
        return unrollMore(tomorrow, 1);
    }

    function unrollMore(tomorrow, num) {
        let n = tomorrow.getTime();
        n -= 86400000 * num;
        return new Date(n);
    }

    function formatDate(theDate) {
        return theDate.getFullYear() + '-' + pad(theDate.getMonth() + 1) + '-' + pad(theDate.getDate());
    }

    function fetchRate(theDate, index) {
        const date = formatDate(theDate);
        const retrieved = +localStorage.getItem(date);
        if (retrieved) {
            days[index] = retrieved;
            return true;
        }

        let url = 'http://api.fixer.io/' + date + '?base=USD&symbols=ZAR';
        fetch(url)
            .then(res => res.json())
            .then((out) => {
                days[index] = out.rates.ZAR;
                console.log("Setting: " + date);
                // don't save current date, could change
                if (formatDate(new Date()) !== date) {
                    localStorage.setItem(date, out.rates.ZAR);
                }
            })
            .catch(err => {
                if (err.indexOf("429")) {
                    console.log(err);
                    console.log('SLOW DOWN!');
                }
            });
        return false;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    let showAt = function (s, size, x, y) {
        ctx.font = size + "px Arial";
        ctx.fillStyle = 'white';
        ctx.fillText(s, x, y);
    };

    let rightShowAt = function (s, size, x, y) {
        ctx.font = size + "px Arial";
        ctx.fillStyle = 'white';
        const textMetrics = ctx.measureText(s);

        ctx.fillText(s, x - textMetrics.width - size, y);
    };

    let centerShowAt = function (s, size, x, y) {
        ctx.font = size + "px Arial";
        ctx.fillStyle = 'white';
        const textMetrics = ctx.measureText(s);

        ctx.fillText(s, x - textMetrics.width / 2, y);
    };

    let showAllAt = function (s, size, x, y) {
        ctx.font = size + "px Arial";
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.strokeText(s, x, y);
        ctx.fillText(s, x, y);
    };


    let show = function (s, size) {
        ctx.font = size + "px Arial";
        ctx.fillStyle = 'white';
        const textMetrics = ctx.measureText(s);

        showAt(s, size, canvas.width / 2 - textMetrics.width / 2, canvas.height / 2 - size / 2);
    };

    const count = function (days) {
        let count = 0;
        for (let i of days) {
            if (i) count++;
        }
        return count;
    };

    async function loadRates() {
        show("Loading " + TIME_SPAN + " days worth of currency data (slow just this once)...", 24);

        for (var i = 0; i < TIME_SPAN; i++) {
            if (!fetchRate(date, i)) {
            await sleep(200)
                ;
            }
            canvas.width = canvas.width;

            show("Loading " + (TIME_SPAN - i) + " days worth of currency data (slow just this once)...", 24);

            date = unroll(date);
        }

        while (count(days) != TIME_SPAN) {
            canvas.width = canvas.width;
            show("Loading " + (TIME_SPAN - count(days)) + " days worth of currency data (slow just this once)...", 24);

        await sleep(100)
            ;
        }
        avgHeight = 0;
        for (let val of days) {
            minHeight = Math.min(minHeight, val);
            maxHeight = Math.max(maxHeight, val);
            avgHeight += val;
        }
        avgHeight = avgHeight / days.length;

        loadShip();
    }

    let nyan = {
        inplay: false
    };

    let makeNyan = function () {
        if (nyan.inplay) {
            return;
        }

        nyan.inplay = true;
        nyan.x = -nyanImage.width;
        nyan.y = Math.random() * floor;
    };

    //makeNyan();
    setTimeout(makeNyan, Math.random() * NYAN_DELAY);

    let ship = {
        fuel: 500,
        pos: {
            x: 50,
            y: 100
        },
        power: 30,
        spinSpeed: Math.PI / 4,
        rotate: 0,
        velocity: {x: 10, y: 20},

        spin: function (left, diff) {
            this.rotate += this.spinSpeed * left * (diff / 1000);
        },

        inc: function (diff) {
            const multiplier = (diff / 1000);

            this.velocity.y += GRAVITY * multiplier;
            this.pos.x += this.velocity.x * multiplier;
            this.pos.y -= this.velocity.y * multiplier;

            if (this.pos.x < 0) {
                this.pos.x = canvas.width;
            } else if (this.pos.x > canvas.width) {
                this.pos.x = 0;
            }
        },

        thrust: function (diff) {
            if (this.fuel < 0) {
                return;
            }
            const multiplier = (diff / 1000);
            this.fuel -= this.power * multiplier;
            this.velocity.x += this.power * Math.sin(this.rotate) * multiplier;
            this.velocity.y += this.power * Math.cos(-this.rotate) * multiplier;
        },

        vel: function () {
            const number = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
            return Math.round(number * 10) / 10;
        }
    };

    function drawShip() {
        ctx.save();
        ctx.translate(ship.pos.x, ship.pos.y);
        ctx.rotate(ship.rotate);
        if ((screenTouch || help.upPressed) && ship.fuel > 0) {
            ctx.drawImage(flameImage, -flameImage.width / 2, flameImage.height / 3, flameImage.width, flameImage.height);
        }
        ctx.drawImage(shipImage, -shipImage.width / 2, -shipImage.height / 2, shipImage.width, shipImage.height);
        ctx.restore();

        const index = Math.floor(ship.pos.x / TIME_WIDTH);
        const curr = days[index];
        showAllAt("R" + format(curr), 16, ship.pos.x + 20, ship.pos.y - shipImage.height / 2);
        showAllAt(formatDate(unrollMore(origDate, index)), 12, ship.pos.x + 20, ship.pos.y - shipImage.height / 2 + 12);
    }

    let lastTime, thisTime;

    const TIME_WIDTH = canvas.width / TIME_SPAN;

    function floorHeight(x) {
        let day = Math.floor(x / TIME_WIDTH);
        if (day < 0 || day > days.length) {
            return floor;
        }

        return floor - (days[day] - avgHeight) * RATE_MULTIPLIER;
    }

    /**
     * Basically the average between the floor on either side of the ship.
     * @param x
     * @returns {boolean}
     */
    var floorRough = function (x) {
        const rough = (Math.abs(floorHeight(x - shipImage.width / 3) - floorHeight(x)) + Math.abs(floorHeight(x + shipImage.width / 3) - floorHeight(x))) / 2;
        console.log(rough);
        
        return rough > 20;
    };

    function drawFloor() {
        ctx.fillStyle = pat;
        ctx.beginPath();
        ctx.moveTo(0, floorHeight(0));
        for (let x = 1; x < TIME_SPAN; x++) {
            ctx.lineTo(x * TIME_WIDTH, floorHeight(x * TIME_WIDTH));
        }
        ctx.lineTo((TIME_SPAN)*TIME_WIDTH, floorHeight((TIME_SPAN)*TIME_WIDTH*TIME_WIDTH));

        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();
    }

    var drawStars = function (diff) {
        ctx.fillStyle = 'white';

        ctx.lineWidth = 5;
        ctx.strokeStyle = '#ccc0';
        for (let star of stars) {
            star.x -= star.xVel * 0.1 * diff;
            if (star.x < 0) {
                star.x = canvas.width;
                star.y = Math.random() * floor;
            }
            ctx.beginPath();
            ctx.arc(star.x, star.y, (star.xVel) * 5, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.stroke();
        }
    };

    var drawNyan = function (diff) {
        if (!nyan.inplay) {
            return;
        }

        nyan.x += NYAN_SPEED * diff / 1000;
        nyan.showY = nyan.y + Math.sin(nyan.x);

        if (nyan.x > canvas.width) {
            nyan.inplay = false;
            setTimeout(makeNyan, NYAN_DELAY * Math.random());
        } else {
            ctx.drawImage(nyanImage, nyan.x, nyan.showY);
        }
    };

    function loop() {
        lastTime = thisTime || new Date().getTime();
        thisTime = new Date().getTime();
        let diff = thisTime - lastTime;

        // this clears the canvas, promise.
        canvas.width = canvas.width;

        drawStars(diff);

        drawNyan(diff);

        drawFloor();


        drawShip();
        if (help.upPressed || screenTouch) {
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

        centerShowAt("ZAR/USD for the last 90 days", 24, canvas.width / 2, 36);
        if (help.mobilecheck()) {
            centerShowAt("Tilt your phone - lock orientation?.", 24, canvas.width / 2, 60);
        }
        showAt("Fuel: " + Math.round(ship.fuel), 24, 10, 36);
        showAt("Velocity: " + ship.vel() + " m/s", 24, 10, 72);

        rightShowAt("Max exchange: R" + format(maxHeight), 24, canvas.width, 36);
        rightShowAt("Avg exchange: R" + format(avgHeight), 24, canvas.width, 72);
        rightShowAt("Min exchange: R" + format(minHeight), 24, canvas.width, 108);

        if (ship.pos.y > floorHeight(ship.pos.x) - shipImage.height / 2) {

            // falling too fast, drifting too hard or off by ~10 degrees.
            if (Math.abs(ship.velocity.y) >= DEATH_Y || Math.abs(ship.velocity.x) >= DEATH_X || Math.abs(ship.rotate) >= DEATH_ROT) {
                show("kablewwwy", 56);
            } else if (floorRough(ship.pos.x)) {
                show("oh dear... that's a mountain, you ded", 48);
            }
            else {
                show("safe yay", 56);
            }

            let nodeList = document.querySelectorAll('aside.hidden');
            nodeList[0].classList.remove('hidden');
        }
        else {
            requestAnimationFrame(loop)
        }
    }

    function getRandom(value) {
        return 2 * value - Math.random() * 4 * value;
    }

    function randomizeShip() {
        ship.fuel = 500;
        ship.pos.x = Math.random() * (canvas.width - 4*shipImage.width) + 2*shipImage.width;
        ship.pos.y = 50;
        ship.velocity.x = getRandom(2 * DEATH_X);
        ship.velocity.y = getRandom(DEATH_Y);
        ship.rotate = getRandom(2 * DEATH_ROT);
    }

    shipImage.onload = function () {
        randomizeShip();
        for (let i = 0; i < STARS; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * floor,
                xVel: Math.random()
            });
        }

        loop();
    };


    window.addEventListener('touchstart', function () {
        screenTouch = true;
    });
    window.addEventListener('touchend', function () {
        screenTouch = false;
    });

    loadRates();
    function devOrientHandler(eventData) {
        // gamma is the left-to-right tilt in degrees, where right is positive
        var tiltLR = eventData.gamma;

        // beta is the front-to-back tilt in degrees, where front is positive
        var tiltFB = eventData.beta;

        function toRadians(angle) {
            return angle * (Math.PI / 180);
        }

        if (window.innerHeight > window.innerWidth) {
            ship.rotate = toRadians(tiltLR);
        } else {
            ship.rotate = toRadians(tiltFB) / 2;
        }
    }

    flameImage.src = "img/flames.png";
    moonImage.src = "img/moon.jpg";
    nyanImage.src = "img/nyan.png";

    moonImage.onload = function () {
        pat = ctx.createPattern(moonImage, "repeat");
        ctx.fillStyle = pat;
    };

    function loadShip() {
        shipImage.src = "img/ship.png";
    }

    let button = document.querySelector('aside button');
    button.onclick = function() {
        document.querySelector('aside').classList.add('hidden');
        randomizeShip();
        thisTime = new Date().getTime();
        loop();
    };
})();