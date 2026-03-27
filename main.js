

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [MenuScene, GameScene, HackScene, GameOverScene]
};

const game = new Phaser.Game(config);

// ---------------- MENU ----------------
function MenuScene() {
    Phaser.Scene.call(this, { key: 'MenuScene' });
}
MenuScene.prototype = Object.create(Phaser.Scene.prototype);

MenuScene.prototype.create = function () {
    this.add.text(280, 200, "SPY HEIST", { fontSize: "40px", color: "#ffffff" });

    let startBtn = this.add.text(330, 300, "START", {
        fontSize: "30px",
        backgroundColor: "#00ff00"
    }).setInteractive();

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
let hideSpots = [];

GameScene.prototype.create = function () {

    // Player
    player = this.add.rectangle(100, 100, 30, 30, 0x00ff00);

    cursors = this.input.keyboard.createCursorKeys();

    // Create hiding objects
    hideSpots = [
        this.add.rectangle(200, 200, 60, 60, 0x888888),
        this.add.rectangle(500, 300, 60, 60, 0x888888)
    ];

    // Guards
    guards = [];
    for (let i = 0; i < 3; i++) {
        let g = this.add.rectangle(
            Phaser.Math.Between(100, 700),
            Phaser.Math.Between(100, 500),
            30, 30, 0xff0000
        );

        g.speedX = Phaser.Math.Between(-2, 2) || 1;
        g.speedY = Phaser.Math.Between(-2, 2) || 1;

        g.angleDir = Phaser.Math.FloatBetween(0, Math.PI * 2);

        guards.push(g);
    }

    // Suspicion Bar
    bar = this.add.rectangle(100, 50, 200, 20, 0xff0000);
};

GameScene.prototype.update = function () {

    // Movement
    if (cursors.left.isDown) player.x -= 3;
    if (cursors.right.isDown) player.x += 3;
    if (cursors.up.isDown) player.y -= 3;
    if (cursors.down.isDown) player.y += 3;

    // Check hiding
    let isHidden = false;
    hideSpots.forEach(h => {
        let dist = Phaser.Math.Distance.Between(player.x, player.y, h.x, h.y);
        if (dist < 50) isHidden = true;
    });

    guards.forEach(g => {

        // Movement
        g.x += g.speedX;
        g.y += g.speedY;

        if (g.x < 0 || g.x > 800) g.speedX *= -1;
        if (g.y < 0 || g.y > 600) g.speedY *= -1;

        // Random change
        if (Phaser.Math.Between(0, 100) < 2) {
            g.speedX = Phaser.Math.Between(-2, 2) || 1;
            g.speedY = Phaser.Math.Between(-2, 2) || 1;
        }

        // Direction (for vision)
        let dir = Math.atan2(g.speedY, g.speedX);

        // Vision cone check
        let dx = player.x - g.x;
        let dy = player.y - g.y;
        let angleToPlayer = Math.atan2(dy, dx);

        let angleDiff = Phaser.Math.Angle.Wrap(angleToPlayer - dir);

        let dist = Phaser.Math.Distance.Between(player.x, player.y, g.x, g.y);

        let inCone = Math.abs(angleDiff) < 0.7 && dist < 180;

        if (inCone && !isHidden) {
            suspicion += 0.5;
        }
    });

    // Reduce suspicion
    suspicion -= 0.1;
    suspicion = Phaser.Math.Clamp(suspicion, 0, 100);

    bar.width = suspicion * 2;

    if (suspicion >= 100) {
        this.scene.start("GameOverScene");
    }

    // Reach server zone
    if (player.x > 700 && player.y > 500) {
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

    this.add.rectangle(400, 300, 600, 400, 0x000000, 0.9);
    this.add.text(250, 120, "HACK THE SYSTEM", { fontSize: "28px", color: "#ffffff" });

    sequence = [];
    playerInput = [];

    // Generate sequence
    for (let i = 0; i < 3; i++) {
        sequence.push(Phaser.Math.Between(0, 2));
    }

    // Buttons
    buttons = [];

    for (let i = 0; i < 3; i++) {
        let btn = this.add.rectangle(250 + i * 120, 300, 80, 80, 0x00ff00)
            .setInteractive();

        btn.id = i;

        btn.on("pointerdown", () => {
            playerInput.push(btn.id);

            if (playerInput[playerInput.length - 1] !== sequence[playerInput.length - 1]) {
                this.scene.start("GameOverScene");
            }

            if (playerInput.length === sequence.length) {
                this.add.text(280, 450, "HACK SUCCESS!", { fontSize: "28px", color: "#00ff00" });

                this.time.delayedCall(1500, () => {
                    this.scene.start("MenuScene");
                });
            }
        });

        buttons.push(btn);
    }

    // Show sequence briefly
    this.time.delayedCall(500, () => {
        sequence.forEach((val, index) => {
            this.time.delayedCall(index * 600, () => {
                buttons[val].setFillStyle(0xffff00);
                this.time.delayedCall(300, () => {
                    buttons[val].setFillStyle(0x00ff00);
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

    this.add.text(300, 250, "CAUGHT!", { fontSize: "40px", color: "#ff0000" });

    let restart = this.add.text(320, 320, "RESTART", {
        fontSize: "30px",
        backgroundColor: "#ffffff",
        color: "#000"
    }).setInteractive();

    restart.on("pointerdown", () => {
        suspicion = 0;
        this.scene.start("GameScene");
    });
};