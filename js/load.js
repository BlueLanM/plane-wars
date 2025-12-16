export function preload() {
	this.load.image("background", "assets/background.png");
	this.load.image("player", "assets/player.png");
	this.load.image("fire", "assets/fire.png");
	this.load.image("enemy", "assets/enemy.png");
	this.load.image("bonus", "assets/bonus.png");
	this.load.image("bullet", "assets/bullet.png");
	this.load.image("bossbullet", "assets/pixel.png");

	// enemy2.png是左右排列的精灵图（112x40），包含2帧
	this.load.spritesheet("enemy2", "assets/enemy2.png", {
		frameHeight: 40,
		frameWidth: 28
	});
	this.load.spritesheet("boss", "assets/boss.png", {
		frameHeight: 36,
		frameWidth: 32
	});
}

// 创建动画配置
export function createAnimations(scene) {
	scene.anims.create({
		frameRate: 10,
		frames: scene.anims.generateFrameNumbers("enemy2", { end: 1, start: 0 }),
		key: "enemy2-fly",
		repeat: -1
	});
	scene.anims.create({
		frameRate: 10,
		frames: scene.anims.generateFrameNumbers("boss", { end: 1, start: 0 }),
		key: "boss-fly",
		repeat: -1
	});
}

// 创建爆炸效果
export function createExplosion(scene, x, y) {
	// 创建闪光效果
	const sparkles = [];

	for (let i = 0; i < 8; i++) {
		const angle = (i / 8) * Math.PI * 2;
		const sparkle = scene.add.circle(x, y, 3, 0xffffff);

		sparkles.push({
			sprite: sparkle,
			velocityX: Math.cos(angle) * 150,
			velocityY: Math.sin(angle) * 150
		});
	}

	// 动画
	let elapsed = 0;
	const animationTimer = scene.time.addEvent({
		callback: () => {
			elapsed += 16;
			const delta = 16 / 1000;

			sparkles.forEach(sparkle => {
				sparkle.sprite.x += sparkle.velocityX * delta;
				sparkle.sprite.y += sparkle.velocityY * delta;

				// 淡出
				const alpha = Math.max(0, 1 - elapsed / 500);
				sparkle.sprite.setAlpha(alpha);
			});

			// 0.5秒后清理
			if (elapsed >= 500) {
				sparkles.forEach(sparkle => sparkle.sprite.destroy());
				animationTimer.remove();
			}
		},
		delay: 16,
		loop: true
	});
}