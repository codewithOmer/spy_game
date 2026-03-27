


const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    audio: { disableWebAudio: false },
    scene: [MenuScene, GameScene, HackScene, GameOverScene]
};

const game = new Phaser.Game(config);

// ---------------- MENU ----------------
function MenuScene() {
    Phaser.Scene.call(this, { key: 'MenuScene' });
}
MenuScene.prototype = Object.create(Phaser.Scene.prototype);

MenuScene.prototype.create = function () {
    this.cameras.main.setBackgroundColor("#000022");

    this.add.text(260, 200, "SPY HEIST", { fontSize: "42px", color: "#00ffff" });

    let startBtn = this.add.text(330, 300, "START", {
        fontSize: "30px",
        backgroundColor: "#00ffcc",
        color: "#000"
    }).setPadding(10).setInteractive();

    startBtn.on("pointerdown", () => {
        this.scene.start("GameScene");
    });
};

// ---------------- GAME ----------------
function GameScene() {
    Phaser.Scene.call(this, { key: 'GameScene' });
}
GameScene.prototype = Object.create(Phaser.Scene.prototype);

let player, cursors, guards = [], suspicion = 0, bar;
let hideSpots = [], alarmSound, alarmTriggered = false;

GameScene.prototype.create = function () {

    this.cameras.main.setBackgroundColor("#111111");

    // Player (cyan)
    player = this.add.rectangle(100, 100, 30, 30, 0x00ffff);

    cursors = this.input.keyboard.createCursorKeys();

    // Hide spots (gray crates)
    hideSpots = [
        this.add.rectangle(200, 200, 70, 70, 0x666666),
        this.add.rectangle(500, 350, 70, 70, 0x666666)
    ];

    // Server zone (goal)
    this.add.rectangle(750, 550, 80, 80, 0x0000ff);
    this.add.text(690, 520, "SERVER", { fontSize: "14px", color: "#ffffff" });

    // Guards
    guards = [];
    for (let i = 0; i < 3; i++) {
        let g = this.add.rectangle(
            Phaser.Math.Between(100, 700),
            Phaser.Math.Between(100, 500),
            30, 30, 0xff4444
        );

        g.speedX = Phaser.Math.Between(-2, 2) || 1;
        g.speedY = Phaser.Math.Between(-2, 2) || 1;
        g.chasing = false;

        guards.push(g);
    }

    // Suspicion bar (yellow → red feel)
    bar = this.add.rectangle(100, 50, 200, 20, 0xffff00);

    // Alarm sound (free online)
    this.load.audio('alarm', 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
    this.load.start();

    this.load.on('complete', () => {
        alarmSound = this.sound.add('alarm', { loop: true, volume: 0.3 });
    });
};

GameScene.prototype.update = function () {

    // Player movement
    if (cursors.left.isDown) player.x -= 3;
    if (cursors.right.isDown) player.x += 3;
    if (cursors.up.isDown) player.y -= 3;
    if (cursors.down.isDown) player.y += 3;

    // Check hiding
    let isHidden = false;
    hideSpots.forEach(h => {
        let dist = Phaser.Math.Distance.Between(player.x, player.y, h.x, h.y);
        if (dist < 60) isHidden = true;
    });

    guards.forEach(g => {

        let dx = player.x - g.x;
        let dy = player.y - g.y;
        let dist = Phaser.Math.Distance.Between(player.x, player.y, g.x, g.y);

        let angleToPlayer = Math.atan2(dy, dx);
        let moveAngle = Math.atan2(g.speedY, g.speedX);
        let angleDiff = Phaser.Math.Angle.Wrap(angleToPlayer - moveAngle);

        let inCone = Math.abs(angleDiff) < 0.6 && dist < 180;

        // DETECTION
        if (inCone && !isHidden) {
            suspicion += 0.6;
            g.chasing = true;
        }

        // CHASING BEHAVIOR
        if (g.chasing) {
            let angle = Math.atan2(player.y - g.y, player.x - g.x);
            g.x += Math.cos(angle) * 2.5;
            g.y += Math.sin(angle) * 2.5;
        } else {
            // Normal random movement
            g.x += g.speedX;
            g.y += g.speedY;

            if (g.x < 0 || g.x > 800) g.speedX *= -1;
            if (g.y < 0 || g.y > 600) g.speedY *= -1;

            if (Phaser.Math.Between(0, 100) < 2) {
                g.speedX = Phaser.Math.Between(-2, 2) || 1;
                g.speedY = Phaser.Math.Between(-2, 2) || 1;
            }
        }
    });

    // Suspicion decay
    suspicion -= 0.1;
    suspicion = Phaser.Math.Clamp(suspicion, 0, 100);

    // Change bar color dynamically
    if (suspicion < 40) bar.fillColor = 0xffff00;
    else if (suspicion < 80) bar.fillColor = 0xff8800;
    else bar.fillColor = 0xff0000;

    bar.width = suspicion * 2;

    // Alarm trigger
    if (suspicion > 60 && !alarmTriggered && alarmSound) {
        alarmSound.play();
        alarmTriggered = true;
    }

    if (suspicion < 40 && alarmTriggered && alarmSound) {
        alarmSound.stop();
        alarmTriggered = false;
    }

    // Game over
    if (suspicion >= 100) {
        if (alarmSound) alarmSound.stop();
        this.scene.start("GameOverScene");
    }

    // Reach server
    if (player.x > 700 && player.y > 500) {
        if (alarmSound) alarmSound.stop();
        this.scene.start("HackScene");
    }
};

// ---------------- HACK ----------------
function HackScene() {
    Phaser.Scene.call(this, { key: 'HackScene' });
}
HackScene.prototype = Object.create(Phaser.Scene.prototype);

let sequence = [], playerInput = [], buttons = [];

HackScene.prototype.create = function () {

    this.cameras.main.setBackgroundColor("#001111");

    this.add.text(240, 100, "HACK TERMINAL", { fontSize: "30px", color: "#00ffff" });

    sequence = [];
    playerInput = [];

    for (let i = 0; i < 4; i++) {
        sequence.push(Phaser.Math.Between(0, 2));
    }

    buttons = [];

    for (let i = 0; i < 3; i++) {
        let btn = this.add.rectangle(250 + i * 120, 300, 90, 90, 0x00ffcc)
            .setStrokeStyle(3, 0xffffff)
            .setInteractive();

        btn.id = i;

        btn.on("pointerdown", () => {
            playerInput.push(btn.id);

            if (playerInput[playerInput.length - 1] !== sequence[playerInput.length - 1]) {
                this.scene.start("GameOverScene");
            }

            if (playerInput.length === sequence.length) {
                this.add.text(260, 450, "ACCESS GRANTED", {
                    fontSize: "28px",
                    color: "#00ff00"
                });

                this.time.delayedCall(1500, () => {
                    this.scene.start("MenuScene");
                });
            }
        });

        buttons.push(btn);
    }

    // Show sequence
    this.time.delayedCall(500, () => {
        sequence.forEach((val, index) => {
            this.time.delayedCall(index * 600, () => {
                buttons[val].setFillStyle(0xffff00);
                this.time.delayedCall(300, () => {
                    buttons[val].setFillStyle(0x00ffcc);
                });
            });
        });
    });
};

// ---------------- GAME OVER ----------------
function GameOverScene() {
    Phaser.Scene.call(this, { key: 'GameOverScene' });
}
GameOverScene.prototype = Object.create(Phaser.Scene.prototype);

GameOverScene.prototype.create = function () {

    this.cameras.main.setBackgroundColor("#220000");

    this.add.text(300, 250, "CAUGHT!", { fontSize: "40px", color: "#ff0000" });

    let restart = this.add.text(320, 320, "RESTART", {
        fontSize: "30px",
        backgroundColor: "#ffffff",
        color: "#000"
    }).setPadding(10).setInteractive();

    restart.on("pointerdown", () => {
        suspicion = 0;
        this.scene.start("GameScene");
    });
};