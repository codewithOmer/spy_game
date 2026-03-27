class Game extends Phaser.Scene {
    constructor(){ super("Game"); }

    preload(){
        this.load.image('player','https://labs.phaser.io/assets/sprites/phaser-dude.png');
        this.load.image('guard','https://labs.phaser.io/assets/sprites/robot.png');
        this.load.image('server','https://labs.phaser.io/assets/sprites/computer.png');
    }

    create(){

        // Focus fix
        this.input.keyboard.enabled = true;
        this.game.canvas.setAttribute('tabindex', '0');
        this.game.canvas.focus();
        this.input.on('pointerdown', () => this.game.canvas.focus());

        this.add.rectangle(400,300,800,600,0x1a1a1a);

        this.player = this.add.image(100,100,'player').setScale(0.5);

        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D
        });

        this.server = this.add.image(750,550,'server');

        this.suspicion = 0;
        this.bar = this.add.rectangle(100,50,200,20,0xffff00);

        // Walls
        this.walls = [
            this.add.rectangle(400,100,600,40,0x444444),
            this.add.rectangle(400,500,600,40,0x444444),
            this.add.rectangle(100,300,40,400,0x444444),
            this.add.rectangle(700,300,40,400,0x444444),
            this.add.rectangle(400,300,300,40,0x444444)
        ];

        //  HIDE SPOTS
        this.hideSpots = [
            this.add.rectangle(200,300,50,50,0x8b5a2b),
            this.add.rectangle(600,200,50,50,0x8b5a2b)
        ];

        // Guards
        this.guards = [];
        for(let i=0;i<3;i++){
            let g = this.add.image(
                Phaser.Math.Between(150,650),
                Phaser.Math.Between(150,450),
                'guard'
            ).setScale(0.5);

            g.speedX = Phaser.Math.Between(-2,2)||1;
            g.speedY = Phaser.Math.Between(-2,2)||1;

            g.vision = this.add.graphics();

            this.guards.push(g);
        }
    }

    update(){

        let prevX = this.player.x;
        let prevY = this.player.y;

        // Movement
        if(this.keys.left.isDown || this.keys.A.isDown) this.player.x -= 3;
        if(this.keys.right.isDown || this.keys.D.isDown) this.player.x += 3;
        if(this.keys.up.isDown || this.keys.W.isDown) this.player.y -= 3;
        if(this.keys.down.isDown || this.keys.S.isDown) this.player.y += 3;

        // Wall collision
        this.walls.forEach(w=>{
            let rect = new Phaser.Geom.Rectangle(
                w.x-w.width/2,
                w.y-w.height/2,
                w.width,
                w.height
            );

            if(Phaser.Geom.Intersects.RectangleToRectangle(
                this.player.getBounds(),rect
            )){
                this.player.x = prevX;
                this.player.y = prevY;
            }
        });

        // 🟫 HIDING CHECK
        let isHidden = false;
        this.hideSpots.forEach(h=>{
            let dist = Phaser.Math.Distance.Between(
                this.player.x,this.player.y,h.x,h.y
            );
            if(dist < 60) isHidden = true;
        });

        // Visual feedback
        this.player.setAlpha(isHidden ? 0.3 : 1);

        // Guards
        this.guards.forEach(g=>{

            g.vision.clear();

            let dx = this.player.x - g.x;
            let dy = this.player.y - g.y;
            let dist = Phaser.Math.Distance.Between(this.player.x,this.player.y,g.x,g.y);
            let angle = Math.atan2(dy, dx);

            // Vision cone
            g.vision.fillStyle(0xff0000, 0.08);
            g.vision.beginPath();
            g.vision.moveTo(g.x, g.y);
            g.vision.arc(g.x, g.y, 180, angle - 0.5, angle + 0.5);
            g.vision.closePath();
            g.vision.fillPath();

            // Patrol
            g.x += g.speedX;
            g.y += g.speedY;

            if(g.x<0||g.x>800) g.speedX*=-1;
            if(g.y<0||g.y>600) g.speedY*=-1;

            // Detection (ONLY if NOT hidden)
            if(dist < 180 && !isHidden){
                this.suspicion += 0.4;
            }
        });

        // Suspicion
        this.suspicion -= 0.1;
        this.suspicion = Phaser.Math.Clamp(this.suspicion,0,100);
        this.bar.width = this.suspicion * 2;

        if(this.suspicion >= 100){
            this.scene.start("GameOver");
        }

        // Reach server
        let d = Phaser.Math.Distance.Between(
            this.player.x,this.player.y,
            this.server.x,this.server.y
        );

        if(d < 50){
            this.scene.start("Hack");
        }
    }
}