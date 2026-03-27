window.onload = function () {

//////////////////// CONFIG ////////////////////
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [MenuScene, GameScene, HackScene, WinScene, GameOverScene]
};

//////////////////// MENU ////////////////////
class MenuScene extends Phaser.Scene {
    constructor() { super("MenuScene"); }

    create() {
        this.cameras.main.setBackgroundColor("#000022");

        this.add.text(250, 180, "SPY HEIST", {
            fontSize: "48px",
            color: "#00ffff",
            fontFamily: "monospace"
        });

        let btn = this.add.text(330, 300, "START", {
            fontSize: "28px",
            backgroundColor: "#00ffcc",
            color: "#000"
        }).setPadding(10).setInteractive();

        btn.on("pointerover", () => btn.setScale(1.1));
        btn.on("pointerout", () => btn.setScale(1));

        btn.on("pointerdown", () => this.scene.start("GameScene"));
    }
}

//////////////////// GAME ////////////////////
class GameScene extends Phaser.Scene {
    constructor() { super("GameScene"); }

    preload() {
        this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
        this.load.image('guard', 'https://labs.phaser.io/assets/sprites/robot.png');
        this.load.image('server', 'https://labs.phaser.io/assets/sprites/computer.png');
    }

    create() {
        // Floor
        this.add.rectangle(400, 300, 800, 600, 0x1a1a1a);

        this.player = this.add.image(100, 100, 'player').setScale(0.5);
        this.cursors = this.input.keyboard.createCursorKeys();

        this.suspicion = 0;
        this.bar = this.add.rectangle(100, 50, 200, 20, 0xffff00);

        // WALLS (structured layout)
        this.walls = [
            this.add.rectangle(400, 100, 600, 40, 0x444444),
            this.add.rectangle(400, 500, 600, 40, 0x444444),
            this.add.rectangle(100, 300, 40, 400, 0x444444),
            this.add.rectangle(700, 300, 40, 400, 0x444444),
            this.add.rectangle(400, 300, 300, 40, 0x444444)
        ];

        // Hide spots
        this.hideSpots = [
            this.add.rectangle(200, 300, 50, 50, 0x8b5a2b),
            this.add.rectangle(600, 200, 50, 50, 0x8b5a2b)
        ];

        this.server = this.add.image(750, 550, 'server');

        this.guards = [];

        for (let i = 0; i < 3; i++) {
            let g = this.add.image(
                Phaser.Math.Between(150, 650),
                Phaser.Math.Between(150, 450),
                'guard'
            ).setScale(0.5);

            g.state = "patrol";
            g.speedX = Phaser.Math.Between(-2, 2) || 1;
            g.speedY = Phaser.Math.Between(-2, 2) || 1;
            g.seeCount = 0;

            g.vision = this.add.graphics();

            this.guards.push(g);
        }
    }

    update() {
        let prevX = this.player.x;
        let prevY = this.player.y;

        // Movement
        if (this.cursors.left.isDown) this.player.x -= 3;
        if (this.cursors.right.isDown) this.player.x += 3;
        if (this.cursors.up.isDown) this.player.y -= 3;
        if (this.cursors.down.isDown) this.player.y += 3;

        // Wall collision
        this.walls.forEach(w => {
            let rect = new Phaser.Geom.Rectangle(
                w.x - w.width/2,
                w.y - w.height/2,
                w.width,
                w.height
            );

            if (Phaser.Geom.Intersects.RectangleToRectangle(
                this.player.getBounds(),
                rect
            )) {
                this.player.x = prevX;
                this.player.y = prevY;
            }
        });

        // Hiding
        let isHidden = false;
        this.hideSpots.forEach(h => {
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, h.x, h.y) < 60) {
                isHidden = true;
            }
        });

        // Guards AI
        this.guards.forEach(g => {
            g.vision.clear();

            let dx = this.player.x - g.x;
            let dy = this.player.y - g.y;
            let dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, g.x, g.y);
            let angle = Math.atan2(dy, dx);

            // Vision cone
            g.vision.fillStyle(0xff0000, 0.08);
            g.vision.beginPath();
            g.vision.moveTo(g.x, g.y);
            g.vision.arc(g.x, g.y, 180, angle - 0.5, angle + 0.5);
            g.vision.closePath();
            g.vision.fillPath();

            if (dist < 180 && !isHidden) {
                g.seeCount++;

                if (g.seeCount > 3) g.state = "alert";
                if (g.seeCount > 6) g.state = "chase";

                this.suspicion += 0.5;
            }

            if (g.state === "patrol") {
                g.x += g.speedX;
                g.y += g.speedY;
            }

            if (g.state === "alert") {
                g.x += dx * 0.01;
                g.y += dy * 0.01;
            }

            if (g.state === "chase") {
                g.x += Math.cos(angle) * 2.5;
                g.y += Math.sin(angle) * 2.5;
            }

            if (g.x < 0 || g.x > 800) g.speedX *= -1;
            if (g.y < 0 || g.y > 600) g.speedY *= -1;
        });

        // Suspicion system
        this.suspicion -= 0.1;
        this.suspicion = Phaser.Math.Clamp(this.suspicion, 0, 100);
        this.bar.width = this.suspicion * 2;

        if (this.suspicion >= 100) {
            this.scene.start("GameOverScene");
        }

        // Reach server
        if (Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.server.x, this.server.y
        ) < 50) {
            this.scene.start("HackScene");
        }
    }
}

//////////////////// HACK ////////////////////
class HackScene extends Phaser.Scene {
    constructor() { super("HackScene"); }

    create() {
        this.cameras.main.setBackgroundColor("#001111");

        this.add.text(240, 100, "HACK TERMINAL", {
            fontSize: "30px",
            color: "#00ffff"
        });

        this.sequence = [];
        this.inputSeq = [];

        for (let i = 0; i < 4; i++) {
            this.sequence.push(Phaser.Math.Between(0, 2));
        }

        for (let i = 0; i < 3; i++) {
            let btn = this.add.rectangle(250 + i * 120, 300, 90, 90, 0x00ffcc)
                .setInteractive();

            btn.id = i;

            btn.on("pointerdown", () => {
                this.inputSeq.push(btn.id);

                if (this.inputSeq[this.inputSeq.length - 1] !== this.sequence[this.inputSeq.length - 1]) {
                    this.scene.start("GameOverScene");
                }

                if (this.inputSeq.length === this.sequence.length) {
                    this.scene.start("WinScene");
                }
            });
        }

        this.time.delayedCall(6000, () => {
            this.scene.start("GameOverScene");
        });
    }
}

//////////////////// WIN ////////////////////
class WinScene extends Phaser.Scene {
    constructor() { super("WinScene"); }

    create() {
        this.cameras.main.setBackgroundColor("#002200");

        this.add.text(240, 250, "MISSION COMPLETE", {
            fontSize: "36px",
            color: "#00ff00"
        });

        let btn = this.add.text(320, 320, "MENU", {
            fontSize: "28px",
            backgroundColor: "#fff",
            color: "#000"
        }).setPadding(10).setInteractive();

        btn.on("pointerdown", () => this.scene.start("MenuScene"));
    }
}

//////////////////// GAME OVER ////////////////////
class GameOverScene extends Phaser.Scene {
    constructor() { super("GameOverScene"); }

    create() {
        this.cameras.main.setBackgroundColor("#220000");

        this.add.text(300, 250, "CAUGHT!", {
            fontSize: "40px",
            color: "#ff0000"
        });

        let btn = this.add.text(320, 320, "RESTART", {
            fontSize: "28px",
            backgroundColor: "#fff",
            color: "#000"
        }).setPadding(10).setInteractive();

        btn.on("pointerdown", () => this.scene.start("GameScene"));
    }
}

//////////////////// START ////////////////////
new Phaser.Game(config);

};