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
    this.load.image('door', 'assets/door.png');
    this.load.image('button', 'assets/button.png');
}

function create() {
    // 1. Create Environment
    this.platforms = this.physics.add.staticGroup();

    // Ground
    this.platforms.create(400, 568, 'door').setScale(30, 1).setTint(0x00aa00).refreshBody();

    // Ledges
    this.platforms.create(600, 400, 'door').setScale(5, 0.5).setTint(0x00aa00).refreshBody();
    this.platforms.create(50, 250, 'door').setScale(3, 0.5).setTint(0x00aa00).refreshBody();
    this.platforms.create(750, 220, 'door').setScale(3, 0.5).setTint(0x00aa00).refreshBody();

    // Objects
    this.door = this.physics.add.sprite(700, 330, 'door');
    this.button = this.physics.add.sprite(400, 530, 'button');

    this.physics.add.collider(this.door, this.platforms);
    this.physics.add.collider(this.button, this.platforms);

    // 2. Create Players (Local Co-op)
    // Player 1 (Red)
    this.player1 = this.physics.add.sprite(100, 450, 'player');
    this.player1.setTint(0xff0000);
    this.player1.setBounce(0.2);
    this.player1.setCollideWorldBounds(true);
    this.physics.add.collider(this.player1, this.platforms);

    // Player 2 (Blue)
    this.player2 = this.physics.add.sprite(200, 450, 'player');
    this.player2.setTint(0x0000ff);
    this.player2.setBounce(0.2);
    this.player2.setCollideWorldBounds(true);
    this.physics.add.collider(this.player2, this.platforms);

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
    // Check if EITHER player is hitting the button
    if (this.physics.overlap(this.player1, this.button) || this.physics.overlap(this.player2, this.button)) {
        this.door.setAlpha(0.3); // Open the door
    } else {
        this.door.setAlpha(1); // Close the door (optional, or keep it open)
    }
}
