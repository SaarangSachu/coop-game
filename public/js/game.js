const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    backgroundColor: '#5c94fc', // Sky blue background
    input: { gamepad: true },
    physics: {
        default: 'arcade',
        arcade: { debug: false, gravity: { y: 300 } } // Enable gravity for Mario style
    },
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);

function preload() {
    this.load.image('player', 'assets/player.png');
    this.load.image('door', 'assets/door.png'); // Keeping generic door for ground/platforms if needed, or replace
    this.load.image('button', 'assets/button.png');
    this.load.image('lava', 'assets/lava.png');
    this.load.image('water', 'assets/water.png');
    this.load.image('door_red', 'assets/door_red.png');
    this.load.image('door_blue', 'assets/door_blue.png');
}

function create() {
    // 1. Create Environment
    this.platforms = this.physics.add.staticGroup();

    // --- FLOORS & WALLS ---
    // Main Ground Floor
    this.platforms.create(400, 580, 'door').setScale(30, 1.5).setTint(0x654321).refreshBody();

    // Left Wall (Keeps players in bounds)
    this.platforms.create(0, 300, 'door').setScale(1, 20).setTint(0x654321).refreshBody();

    // Right Wall
    this.platforms.create(800, 300, 'door').setScale(1, 20).setTint(0x654321).refreshBody();

    // --- PLATFORMS ---
    // 1. Low hop (Center)
    this.platforms.create(400, 480, 'door').setScale(4, 0.5).setTint(0x00aa00).refreshBody();

    // 2. Mid-left ledge
    this.platforms.create(200, 380, 'door').setScale(4, 0.5).setTint(0x00aa00).refreshBody();

    // 3. High-left ledge (The Button Perch)
    this.platforms.create(100, 250, 'door').setScale(5, 0.5).setTint(0x00aa00).refreshBody();

    // 4. The "Bridge" to the Door (Right side)
    this.platforms.create(650, 400, 'door').setScale(8, 0.5).setTint(0x00aa00).refreshBody();

    // --- INTERACTIVE OBJECTS ---
    // The Goal Door (Blocks the path on the right bridge)
    // We place it at x=600 so you have to walk past it to "win"
    // Platform is at y=400. Door needs to be on top of it.
    this.door = this.physics.add.sprite(552, 193, 'door');
    this.door.setScale(2, 6); // Make it a tall wall/barrier
    this.door.setImmovable(true);
    this.door.body.allowGravity = false;

    this.door = this.physics.add.sprite(552, 193, 'door');

    // The Button (Placed high up on the left ledge)
    this.button = this.physics.add.sprite(100, 210, 'button');
    this.button.body.allowGravity = false;

    // Physics Colliders
    this.physics.add.collider(this.door, this.platforms);
    this.physics.add.collider(this.button, this.platforms);

    // 2. Create Players (Local Co-op)
    // Player 1 (Red)
    this.player1 = this.physics.add.sprite(100, 450, 'player');
    this.player1.setTint(0xff0000);
    this.player1.setBounce(0.2);
    this.player1.setCollideWorldBounds(true);
    this.physics.add.collider(this.player1, this.platforms);
    this.physics.add.collider(this.player1, this.door);

    // Player 2 (Blue)
    this.player2 = this.physics.add.sprite(200, 450, 'player');
    this.player2.setTint(0x0000ff);
    this.player2.setBounce(0.2);
    this.player2.setCollideWorldBounds(true);
    this.physics.add.collider(this.player2, this.platforms);
    this.physics.add.collider(this.player2, this.door);

    // 3. Controls
    // Player 1: Arrow Keys
    this.cursors = this.input.keyboard.createCursorKeys();

    // Player 2: WASD Keys
    this.keys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.gameOver = false;
}

function update() {
    const speed = 160;
    const jumpStrength = -330;

    // --- PLAYER 1 CONTROLS (Arrows / Gamepad 0) ---
    let p1moved = false;
    this.player1.body.setVelocityX(0);

    // Keyboard (Arrows)
    if (this.cursors.left.isDown) {
        this.player1.body.setVelocityX(-speed);
        this.player1.flipX = true;
        p1moved = true;
    } else if (this.cursors.right.isDown) {
        this.player1.body.setVelocityX(speed);
        this.player1.flipX = false;
        p1moved = true;
    }

    if (this.cursors.up.isDown && this.player1.body.touching.down) {
        this.player1.body.setVelocityY(jumpStrength);
    }

    // Gamepad 0
    const pad1 = this.input.gamepad.getPad(0);
    if (pad1 && pad1.connected) {
        const threshold = 0.1;
        if (pad1.leftStick.x < -threshold) {
            this.player1.body.setVelocityX(-speed);
            this.player1.flipX = true;
        } else if (pad1.leftStick.x > threshold) {
            this.player1.body.setVelocityX(speed);
            this.player1.flipX = false;
        }
        if (pad1.A && pad1.A.isDown && this.player1.body.touching.down) {
            this.player1.body.setVelocityY(jumpStrength);
        }
    }


    // --- PLAYER 2 CONTROLS (WASD / Gamepad 1) ---
    this.player2.body.setVelocityX(0);

    // Keyboard (WASD)
    if (this.keys.left.isDown) {
        this.player2.body.setVelocityX(-speed);
        this.player2.flipX = true;
    } else if (this.keys.right.isDown) {
        this.player2.body.setVelocityX(speed);
        this.player2.flipX = false;
    }

    if (this.keys.up.isDown && this.player2.body.touching.down) {
        this.player2.body.setVelocityY(jumpStrength);
    }

    // Gamepad 1
    const pad2 = this.input.gamepad.getPad(1);
    if (pad2 && pad2.connected) {
        const threshold = 0.1;
        if (pad2.leftStick.x < -threshold) {
            this.player2.body.setVelocityX(-speed);
            this.player2.flipX = true;
        } else if (pad2.leftStick.x > threshold) {
            this.player2.body.setVelocityX(speed);
            this.player2.flipX = false;
        }
        if (pad2.A && pad2.A.isDown && this.player2.body.touching.down) {
            this.player2.body.setVelocityY(jumpStrength);
        }
    }

    // --- INTERACTION ---

    // Button Logic (Opens Door)
    if (this.physics.overlap(this.player1, this.button) || this.physics.overlap(this.player2, this.button)) {
        this.tweens.add({
            targets: this.door,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                this.door.disableBody(true, true);
            }
        });
    }

    // Win Condition (Reach far right)
    if (!this.gameOver && (this.player1.x > 750 || this.player2.x > 750)) {
        this.gameOver = true;

        // Display Win Text
        const winText = this.add.text(400, 300, 'LEVEL COMPLETE!', {
            fontSize: '64px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        });
        winText.setOrigin(0.5);

        // Stop physics check (optional, but good for safety)
        this.physics.pause();

        // Restart level after 3 seconds
        this.time.delayedCall(3000, () => {
            this.scene.restart();
            this.gameOver = false;
        });
    }
}

function respawn(player, x, y) {
    player.setPosition(x, y);
    player.body.setVelocity(0, 0);
}
