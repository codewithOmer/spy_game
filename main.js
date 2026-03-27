
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
let hideSpots = [], walls = [];

GameScene.prototype.preload = function () {
    // FREE assets (online)
    this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
    this.load.image('guard', 'https://labs.phaser.io/assets/sprites/robot.png');
    this.load.image('box', 'https://labs.phaser.io/assets/sprites/crate.png');
    this.load.image('wall', 'https://labs.phaser.io/assets/sprites/block.png');
    this.load.image('server', 'https://labs.phaser.io/assets/sprites/computer.png');
};

GameScene.prototype.create = function () {

    this.cameras.main.setBackgroundColor("#111111");

    // Player
    player = this.add.image(100, 100, 'player').setScale(0.5);

    cursors = this.input.keyboard.createCursorKeys();

    // Walls
    walls = [
        this.add.image(300, 200, 'wall').setScale(2),
        this.add.image(500, 400, 'wall').setScale(2),
        this.add.image(150, 400, 'wall').setScale(2)
    ];

    // Hide spots
    hideSpots = [
        this.add.image(200, 300, 'box').setScale(0.7),
        this.add.image(600, 200, 'box').setScale(0.7)
    ];

    // Server
    this.server = this.add.image(750, 550, 'server').setScale(0.6);

    // Guards
    guards = [];
    for (let i = 0; i < 3; i++) {
        let g = this.add.image(
            Phaser.Math.Between(100, 700),
            Phaser.Math.Between(100, 500),
            'guard'
        ).setScale(0.5);

        g.speedX = Phaser.Math.Between(-2, 2) || 1;
        g.speedY = Phaser.Math.Between(-2, 2) || 1;

        g.seeCount = 0;
        g.chasing = false;

        guards.push(g);
    }

    // Suspicion bar
    bar = this.add.rectangle(100, 50, 200, 20, 0xffff00);
};

GameScene.prototype.update = function () {

    let prevX = player.x;
    let prevY = player.y;

    // Player movement
    if (cursors.left.isDown) player.x -= 3;
    if (cursors.right.isDown) player.x += 3;
    if (cursors.up.isDown) player.y -= 3;
    if (cursors.down.isDown) player.y += 3;

    // Wall collision (player)
    walls.forEach(w => {
        if (Phaser.Geom.Intersects.RectangleToRectangle(player.getBounds(), w.getBounds())) {
            player.x = prevX;
            player.y = prevY;
        }
    });

    // Hiding
    let isHidden = false;
    hideSpots.forEach(h => {
        let dist = Phaser.Math.Distance.Between(player.x, player.y, h.x, h.y);
        if (dist < 60) isHidden = true;
    });

    guards.forEach(g => {

        let prevGX = g.x;
        let prevGY = g.y;

        let dx = player.x - g.x;
        let dy = player.y - g.y;
        let dist = Phaser.Math.Distance.Between(player.x, player.y, g.x, g.y);

        let angleToPlayer = Math.atan2(dy, dx);
        let moveAngle = Math.atan2(g.speedY, g.speedX);
        let angleDiff = Phaser.Math.Angle.Wrap(angleToPlayer - moveAngle);

        let inCone = Math.abs(angleDiff) < 0.6 && dist < 180;

        if (inCone && !isHidden) {
            g.seeCount++;

            if (g.seeCount >= 5) {
                g.chasing = true;
            }

            suspicion += 0.4;
        }

        if (g.chasing) {
            let angle = Math.atan2(player.y - g.y, player.x - g.x);
            g.x += Math.cos(angle) * 2.5;
            g.y += Math.sin(angle) * 2.5;
        } else {
            g.x += g.speedX;
            g.y += g.speedY;

            if (g.x < 0 || g.x > 800) g.speedX *= -1;
            if (g.y < 0 || g.y > 600) g.speedY *= -1;
        }

        // Wall collision (guards)
        walls.forEach(w => {
            if (Phaser.Geom.Intersects.RectangleToRectangle(g.getBounds(), w.getBounds())) {
                g.x = prevGX;
                g.y = prevGY;
                g.speedX *= -1;
                g.speedY *= -1;
            }
        });
    });

    // Suspicion
    suspicion -= 0.1;
    suspicion = Phaser.Math.Clamp(suspicion, 0, 100);

    bar.width = suspicion * 2;

    if (suspicion >= 100) {
        this.scene.start("GameOverScene");
    }

    // Reach server
    let distToServer = Phaser.Math.Distance.Between(player.x, player.y, this.server.x, this.server.y);

    if (distToServer < 50) {
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