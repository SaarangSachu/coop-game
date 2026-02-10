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
    this.load.json('level1', 'levels/level1.json');
    this.load.json('level2', 'levels/level2.json');
    this.load.json('level3', 'levels/level3.json');
    this.load.json('level4', 'levels/level4.json');
    this.load.json('level5', 'levels/level5.json');
    this.load.json('level6', 'levels/level6.json');
}

function create(data) {
    // Determine current level (default to 1)
    this.currentLevel = data.level || 1;
    const levelData = this.cache.json.get('level' + this.currentLevel);

    // 1. Setup World Bounds & Camera
    this.physics.world.setBounds(0, 0, levelData.bounds.width, levelData.bounds.height);
    this.cameras.main.setBounds(0, 0, levelData.bounds.width, levelData.bounds.height);

    // 2. Create Static Logic Groups
    this.platforms = this.physics.add.staticGroup();
    this.hazards = this.physics.add.staticGroup();

    // 3. Build Level from JSON
    // Platforms
    levelData.platforms.forEach(p => {
        let plat = this.platforms.create(p.x, p.y, p.key);
        plat.setScale(p.scaleX, p.scaleY);
        plat.setTint(parseInt(p.tint));
        plat.refreshBody();
    });

    // Hazards
    if (levelData.hazards) {
        levelData.hazards.forEach(h => {
            let hazard = this.hazards.create(h.x, h.y, h.type);
            hazard.setScale(h.scaleX, h.scaleY);
            hazard.refreshBody();
        });
    }

    // Doors & Buttons (Interactive Objects)
    this.doors = this.physics.add.group({ allowGravity: false, immovable: true });
    this.buttons = this.physics.add.group({ allowGravity: false, immovable: true });

    // Store door references for buttons to find
    this.doorMap = {};

    if (levelData.doors) {
        levelData.doors.forEach(d => {
            let door = this.doors.create(d.x, d.y, d.key);
            door.setScale(d.scaleX, d.scaleY);
            door.setImmovable(true);
            door.doorId = d.id;
            // Custom properties
            door.doorType = d.type || 'standard';
            door.doorColor = d.color || null;

            this.doorMap[d.id] = door;
        });
    }

    if (levelData.buttons) {
        levelData.buttons.forEach(b => {
            let btn = this.buttons.create(b.x, b.y, b.key);
            btn.targetId = b.target; // Store target door ID
            btn.logic = b.logic || 'simple'; // logic type
        });
    }

    // Collisions for Non-Players
    this.physics.add.collider(this.doors, this.platforms);
    this.physics.add.collider(this.buttons, this.platforms);

    // 4. Create Players
    this.player1 = this.physics.add.sprite(levelData.spawn.p1.x, levelData.spawn.p1.y, 'player');
    this.player1.setTint(0xff0000);
    this.player1.setBounce(0.2);
    this.player1.setCollideWorldBounds(true);
    // Tag players with color for logic
    this.player1.myColor = '0xff0000';

    this.player2 = this.physics.add.sprite(levelData.spawn.p2.x, levelData.spawn.p2.y, 'player');
    this.player2.setTint(0x0000ff);
    this.player2.setBounce(0.2);
    this.player2.setCollideWorldBounds(true);
    this.player2.myColor = '0x0000ff';

    // Player Collisions
    this.physics.add.collider(this.player1, this.platforms);
    this.physics.add.collider(this.player2, this.platforms);

    // Custom Collider for Doors (Color Logic)
    const doorProcessCallback = (player, door) => {
        if (door.doorType === 'color') {
            // If player color matches door color, PASS THROUGH (return false)
            // Wait, usually matching color means you can pass? Or interaction?
            // "only interact with the player of the matching tint" -> implying they collide?
            // "Barriers... create specific collision groups that only interact with"
            // Usually in games: Red Player passes Red Door? Or Red Player BLOCKED by Red Door?
            // Let's assume: Red Door blocks Blue Player, Red Player passes. (Pass through matching)
            if (player.myColor === door.doorColor) {
                return false; // No collision (pass through)
            }
        }
        return true; // Collide normally
    };

    this.physics.add.collider(this.player1, this.doors, null, doorProcessCallback, this);
    this.physics.add.collider(this.player2, this.doors, null, doorProcessCallback, this);

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // Pre-calculate map of DoorID -> [Buttons] for AND logic
    this.doorButtonMap = {};
    this.buttons.children.entries.forEach(btn => {
        if (btn.logic === 'and' && btn.targetId) {
            if (!this.doorButtonMap[btn.targetId]) this.doorButtonMap[btn.targetId] = [];
            this.doorButtonMap[btn.targetId].push(btn);
        }
    });

    this.gameOver = false;

    // Camera Follow (Midpoint Logic will be in update)
    // For now, center on P1 initially
    // this.cameras.main.startFollow(this.player1); // Disabled in favor of midpoint logic
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

    // 1. Hazard Logic (Unified)
    // We can just check overlap with the 'hazards' group
    if (this.physics.overlap(this.player1, this.hazards)) {
        respawn(this.player1, 100, 450);
    }
    if (this.physics.overlap(this.player2, this.hazards)) {
        respawn(this.player2, 200, 450);
    }

    // 2. Button Logic (Complex)
    // Reset all 'hold' or 'and' logic states each frame (simplified approach)
    // For 'AND' logic, we need to know if ALL buttons targeting a door are pressed.

    let activeButtons = new Set();
    const players = [this.player1, this.player2];

    // Check which buttons are currently pressed
    this.physics.overlap(players, this.buttons, (player, btn) => {
        activeButtons.add(btn);

        // Simple One-Shot (Once pressed, stays open) - Existing logic
        if (btn.logic === 'simple' && btn.targetId && this.doorMap[btn.targetId]) {
            let targetDoor = this.doorMap[btn.targetId];
            if (targetDoor.active) { // Only tween if not already disabled
                this.tweens.add({
                    targets: targetDoor,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        targetDoor.disableBody(true, true);
                    }
                });
            }
        }
    });

    // Handle 'AND' and 'HOLD' logic
    // We iterate through all doors to check their specific validation
    this.buttons.children.entries.forEach(btn => {
        if (btn.logic === 'hold' && btn.targetId && this.doorMap[btn.targetId]) {
            let targetDoor = this.doorMap[btn.targetId];
            if (activeButtons.has(btn)) {
                // Button pressed: Open door
                targetDoor.setAlpha(0.2);
                targetDoor.body.checkCollision.none = true;
            } else {
                // Button released: Close door
                targetDoor.setAlpha(1);
                targetDoor.body.checkCollision.none = false;
            }
        }
    });

    // Check AND gates
    for (let doorId in this.doorButtonMap) {
        let requiredButtons = this.doorButtonMap[doorId];
        let allPressed = requiredButtons.every(btn => activeButtons.has(btn));
        let targetDoor = this.doorMap[doorId];

        if (targetDoor) {
            if (allPressed) {
                targetDoor.setAlpha(0.2);
                targetDoor.body.checkCollision.none = true;
            } else {
                targetDoor.setAlpha(1);
                targetDoor.body.checkCollision.none = false;
            }
        }
    }

    // 3. Win Condition (Reach far right of World Bounds)
    // Assuming rightmost edge is the win.
    const levelWidth = this.physics.world.bounds.width;
    if (!this.gameOver && (this.player1.x > levelWidth - 50 || this.player2.x > levelWidth - 50)) {
        this.gameOver = true;

        // Display Win Text
        const winText = this.add.text(levelWidth / 2, 300, 'LEVEL COMPLETE!', {
            fontSize: '64px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        });
        winText.setOrigin(0.5);

        this.physics.pause();
        this.time.delayedCall(3000, () => {
            const nextLevel = this.currentLevel + 1;
            if (this.cache.json.exists('level' + nextLevel)) {
                this.scene.restart({ level: nextLevel });
            } else {
                // Game Over / Victory
                winText.setText('GAME COMPLETE!');
                winText.setFill('#00ff00');
            }
            this.gameOver = false;
        });
    }
    // 4. Camera Follow (Dynamic Midpoint)
    // Calculate the midpoint between the two players
    const midX = (this.player1.x + this.player2.x) / 2;
    const midY = (this.player1.y + this.player2.y) / 2;

    // Smoothly interpolate the camera position to the midpoint
    // Lerp factor of 0.05 for smooth movement
    this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, midX - 400, 0.05); // 400 is half width
    this.cameras.main.scrollY = Phaser.Math.Linear(this.cameras.main.scrollY, midY - 300, 0.05); // 300 is half height

    // Clamp camera to bounds (Manual clamp if needed, but setBounds usually handles it.
    // However, direct scroll manipulation might bypass automatic following bounds check if not careful,
    // but setBounds limits what is rendered/seen.)
}

function respawn(player, x, y) {
    player.setPosition(x, y);
    player.body.setVelocity(0, 0);
}
