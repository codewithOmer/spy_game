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
    this.add.text(300, 200, "SPY HEIST", { fontSize: "40px", color: "#ffffff" });

    let startBtn = this.add.text(330, 300, "START", { fontSize: "30px", backgroundColor: "#00ff00" })
        .setInteractive();

    startBtn.on("pointerdown", () => {
        this.scene.start("GameScene");
    });
};

// ---------------- GAME ----------------
function GameScene() {
    Phaser.Scene.call(this, { key: 'GameScene' });
}
GameScene.prototype = Object.create(Phaser.Scene.prototype);

let player, cursors, guard, suspicion = 0, bar;

GameScene.prototype.create = function () {

    // Player
    player = this.add.rectangle(100, 100, 30, 30, 0x00ff00);

    // Guard
    guard = this.add.rectangle(400, 300, 30, 30, 0xff0000);

    // Controls
    cursors = this.input.keyboard.createCursorKeys();

    // Suspicion Bar
    bar = this.add.rectangle(100, 50, 200, 20, 0xff0000);
};

GameScene.prototype.update = function () {

    // Movement
    if (cursors.left.isDown) player.x -= 3;
    if (cursors.right.isDown) player.x += 3;
    if (cursors.up.isDown) player.y -= 3;
    if (cursors.down.isDown) player.y += 3;

    // Guard simple movement
    guard.x += Math.sin(this.time.now / 500) * 2;

    // Detection (distance check)
    let dist = Phaser.Math.Distance.Between(player.x, player.y, guard.x, guard.y);

    if (dist < 150) {
        suspicion += 0.5;
    } else {
        suspicion -= 0.2;
    }

    suspicion = Phaser.Math.Clamp(suspicion, 0, 100);

    // Update bar
    bar.width = suspicion * 2;

    // Game Over
    if (suspicion >= 100) {
        this.scene.start("GameOverScene");
    }

    // Reach server → Hack scene
    if (player.x > 700 && player.y > 500) {
        this.scene.start("HackScene");
    }
};

// ---------------- HACK ----------------
function HackScene() {
    Phaser.Scene.call(this, { key: 'HackScene' });
}
HackScene.prototype = Object.create(Phaser.Scene.prototype);

HackScene.prototype.create = function () {

    this.add.rectangle(400, 300, 600, 400, 0x000000, 0.8);

    this.add.text(250, 200, "HACKING...", { fontSize: "32px", color: "#ffffff" });

    let btn = this.add.text(300, 300, "CLICK TO WIN", {
        fontSize: "28px",
        backgroundColor: "#00ff00"
    }).setInteractive();

    btn.on("pointerdown", () => {
        this.add.text(300, 400, "SUCCESS!", { fontSize: "30px", color: "#00ff00" });

        this.time.delayedCall(1500, () => {
            this.scene.start("MenuScene");
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