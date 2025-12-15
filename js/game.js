const config = {
	// backgroundColor: "#87CEEB",
	height: 1000,
	physics: {
		arcade: {
			debug: false,
			gravity: { y: 1500 }
		},
		default: "arcade"
	},
	scene: {
		create,
		preload,
		update
	},
	type: Phaser.AUTO,
	width: 600
};

const game = new Phaser.Game(config);

function create() {
	this.add.image(300, 500, "background");
}

function preload() {
	this.load.image("background", "assets/bg.png");
}

function update() {
	this.input.keyboard.on("keydown-SPACE", () => {
		// jump();
	});
}