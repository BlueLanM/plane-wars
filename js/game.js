import { preload, createAnimations, createExplosion } from "./load.js";
import {
	createPlayer,
	createFireGroup,
	playerMove,
	cleanUpFires,
	playerHitAnimation,
	activateTripleShot,
	deactivateTripleShot
} from "./player.js";
import {
	createEnemyGroup,
	startEnemySpawner,
	cleanUpEnemies,
	spawnBoss,
	updateEnemySwing,
	createBossBulletGroup,
	bossShoots,
	updateBossBullets,
	cleanUpBossBullets
} from "./enemy.js";

const config = {
	backgroundColor: "#000000ff",
	height: 500,
	physics: {
		arcade: {
			debug: false,
			gravity: { x: 0 } // 重力
		},
		default: "arcade"
	},
	scene: {
		create,
		preload,
		update
	},
	type: Phaser.AUTO,
	width: 300
};

const game = new Phaser.Game(config);

let gameStarted = false;
let cursors;
let background;
let player;
let fires;
let bossBullets; // Boss子弹组
let enemies;
let bonuses; // bonus道具组
let bullets; // bullet道具组
let scoreText;
let healthText;
let powerUpText; // 分裂子弹倒计时文本
let score = 0;
let health = 3;
let gameOver = false;
let gameOverText;
let tripleShotEndTime = 0; // 分裂子弹结束时间
let enemiesKilled = 0; // 已消灭的敌人数量
let bossSpawned = false; // boss是否已经出现
let currentBoss = null; // 当前的boss对象
let bossShootTimer = null; // Boss射击计时器

function create() {
	// 创建背景图
	background = this.add.image(150, 250, "background");

	// 创建动画
	createAnimations(this);

	// 创建键盘监听
	cursors = this.input.keyboard.createCursorKeys();
}

function gameStart() {
	// 移除背景图,显示蓝色背景
	if (background) {
		background.destroy();
	}
	score = 0;
	scoreText = this.add.text(16, 16, "分数: 0", {
		fill: "#FFF",
		fontSize: "16px",
		fontStyle: "bold"
	});

	healthText = this.add.text(225, 16, "生命: 3", {
		fill: "#FFF",
		fontSize: "16px",
		fontStyle: "bold"
	});

	powerUpText = this.add.text(225, 40, "", {
		fill: "#FFD700",
		fontSize: "14px",
		fontStyle: "bold"
	});

	// 创建子弹组
	fires = createFireGroup(this);

	// 创建玩家飞机
	player = createPlayer(this);

	// 创建敌人组
	enemies = createEnemyGroup(this);

	// 创建bonus组
	bonuses = this.physics.add.group();

	// 创建bullet道具组
	bullets = this.physics.add.group();

	// 创建Boss子弹组
	bossBullets = createBossBulletGroup(this);

	// 开始生成敌人
	startEnemySpawner(this, enemies);

	// 添加碰撞检测：子弹 敌人
	this.physics.add.overlap(fires, enemies, hitEnemy, null, this);
	this.physics.add.overlap(player, enemies, hitPlayer, null, this);
	this.physics.add.overlap(player, bonuses, collectBonus, null, this);
	this.physics.add.overlap(player, bullets, collectBullet, null, this);
	this.physics.add.overlap(player, bossBullets, hitPlayerByBossBullet, null, this);
}

// 子弹击中敌人的回调函数
function hitEnemy(fire, enemy) {
	// 销毁子弹
	fire.destroy();

	// 检查是否是boss
	if (enemy.texture.key === "boss") {
		// Boss的处理
		let bossHealth = enemy.getData("health") || 60;
		bossHealth -= 1;
		enemy.setData("health", bossHealth);

		// 创建小型击中效果
		const hitFlash = this.add.circle(enemy.x, enemy.y, 15, 0xff0000, 0.6);
		this.tweens.add({
			alpha: 0,
			duration: 200,
			onComplete: () => {
				hitFlash.destroy();
			},
			scale: 1.5,
			targets: hitFlash
		});

		// 显示剩余血量
		const healthDisplay = enemy.getData("healthDisplay");
		if (healthDisplay) {
			healthDisplay.setText("Boss血量: " + bossHealth);
		}

		// Boss被消灭
		if (bossHealth <= 0) {
			// 创建爆炸效果
			createExplosion(this, enemy.x, enemy.y);

			// 销毁血量显示
			if (healthDisplay) {
				healthDisplay.destroy();
			}

			// 大量掉落道具
			for (let i = 0; i < 5; i++) {
				const offsetX = Phaser.Math.Between(-30, 30);
				const offsetY = Phaser.Math.Between(-30, 30);
				if (Math.random() < 0.5) {
					spawnBonus(this, enemy.x + offsetX, enemy.y + offsetY);
				} else {
					spawnBullet(this, enemy.x + offsetX, enemy.y + offsetY);
				}
			}

			// 停止Boss射击
			if (bossShootTimer) {
				bossShootTimer.remove();
				bossShootTimer = null;
			}

			// 销毁boss
			enemy.destroy();
			currentBoss = null;
			bossSpawned = false;

			// 增加大量分数
			score += 500;
			scoreText.setText("分数: " + score);

			// 显示击败boss提示
			const bossDefeatedText = this.add.text(75, 200, "Boss被击败!", {
				fill: "#FFD700",
				fontSize: "24px",
				fontStyle: "bold"
			});
			this.time.delayedCall(2000, () => {
				bossDefeatedText.destroy();
			});
		}
	} else {
		// 普通敌人的处理
		// 创建爆炸效果
		createExplosion(this, enemy.x, enemy.y);

		// 随机掉落道具
		const random = Math.random();
		if (random < 0.25) {
			spawnBonus(this, enemy.x, enemy.y);
		} else if (random < 0.30) {
			spawnBullet(this, enemy.x, enemy.y);
		}

		// 销毁敌人
		enemy.destroy();

		// 增加已消灭敌人计数
		enemiesKilled += 1;

		// 增加分数
		score += 10;
		scoreText.setText("分数: " + score);

		// 检查是否应该生成boss，击败25个敌人后生成boss
		if (enemiesKilled >= 25 && !bossSpawned) {
			bossSpawned = true;
			currentBoss = spawnBoss(this, enemies);

			// 开始Boss射击计时器
			startBossShooting(this);
		}
	}
}

function hitPlayer(player, enemy) {
	// 销毁敌人
	enemy.destroy();

	// 创建爆炸效果
	createExplosion(this, enemy.x, enemy.y);

	// 播放被撞击动画
	playerHitAnimation(this, player);

	health -= 1;
	healthText.setText("生命: " + health);

	if (health <= 0) {
		console.log("游戏结束");
		this.physics.pause();
		gameOver = true;
		gameOverText = this.add.text(100, 150, " Game Over\n\n\n按下F5重新开始", { fill: "#fff", fontSize: "16px" });
	}
}

// Boss子弹击中玩家
function hitPlayerByBossBullet(player, bullet) {
	// 销毁子弹
	bullet.destroy();

	// 播放被撞击动画
	playerHitAnimation(this, player);

	// 扣一滴血
	health -= 1;
	healthText.setText("生命: " + health);

	if (health <= 0) {
		console.log("游戏结束");
		this.physics.pause();
		gameOver = true;
		gameOverText = this.add.text(100, 150, " Game Over\n\n\n按下F5重新开始", { fill: "#fff", fontSize: "16px" });
	}
}

// 开始Boss射击
function startBossShooting(scene) {
	// Boss每隔1-2秒发射子弹
	bossShootTimer = scene.time.addEvent({
		callback: () => {
			if (currentBoss && currentBoss.active) {
				bossShoots(scene, currentBoss, bossBullets);
			}
		},
		delay: Phaser.Math.Between(1000, 2000),
		loop: true
	});
}

function spawnBonus(scene, x, y) {
	const bonus = bonuses.create(x, y, "bonus");
	bonus.setScale(0.6);
	bonus.setVelocityY(100); // 缓慢下落

	// 添加旋转动画
	scene.tweens.add({
		angle: 360,
		duration: 2000,
		repeat: -1,
		targets: bonus
	});
}

// 收集bonus的回调函数
function collectBonus(player, bonus) {
	// 销毁bonus
	bonus.destroy();

	// 增加分数
	score += 10;
	scoreText.setText("分数: " + score);

	// 播放收集特效（闪光）
	const flash = this.add.circle(bonus.x, bonus.y, 20, 0xffff00, 0.8);
	this.tweens.add({
		alpha: 0,
		duration: 300,
		onComplete: () => {
			flash.destroy();
		},
		scale: 2,
		targets: flash
	});
}

// 生成bullet道具
function spawnBullet(scene, x, y) {
	const bullet = bullets.create(x, y, "bullet");
	bullet.setScale(0.6);
	bullet.setVelocityY(80); // 缓慢下落

	// 添加摇摆数据
	bullet.setData("swingOffset", 0);
	bullet.setData("swingSpeed", 2);
}

// 收集bullet的回调函数
function collectBullet(player, bullet) {
	// 销毁bullet
	bullet.destroy();

	// 激活分裂子弹，持续10秒
	activateTripleShot();
	tripleShotEndTime = this.time.now + 10000; // 10秒后

	// 播放收集特效（蓝色闪光）
	const flash = this.add.circle(bullet.x, bullet.y, 20, 0x00ffff, 0.8);
	this.tweens.add({
		alpha: 0,
		duration: 300,
		onComplete: () => {
			flash.destroy();
		},
		scale: 2,
		targets: flash
	});
}

// 清理飞出屏幕的bonus
function cleanUpBonuses() {
	bonuses.children.entries.forEach(bonus => {
		if (bonus.y > 550) {
			bonus.destroy();
		}
	});
}

// 清理飞出屏幕的bullet
function cleanUpBullets() {
	bullets.children.entries.forEach(bullet => {
		if (bullet.y > 550) {
			bullet.destroy();
		}
	});
}

// 更新bullet道具的摇摆效果
function updateBulletSwing() {
	bullets.children.entries.forEach(bullet => {
		const offset = bullet.getData("swingOffset") || 0;
		const speed = bullet.getData("swingSpeed") || 2;

		// 使用正弦波创建摇摆效果
		const newOffset = offset + speed;
		bullet.setData("swingOffset", newOffset);

		// 计算横向偏移
		const swingX = Math.sin(newOffset * 0.1) * 30;

		// 更新速度以实现摇摆
		bullet.setVelocityX(swingX * 2);
	});
}

// 更新分裂子弹倒计时
function updatePowerUpTimer(scene) {
	if (tripleShotEndTime > 0) {
		const remainingTime = Math.max(0, Math.ceil((tripleShotEndTime - scene.time.now) / 1000));

		if (remainingTime > 0) {
			powerUpText.setText("分裂弹: " + remainingTime + "s");
		} else {
			powerUpText.setText("");
			tripleShotEndTime = 0;
			deactivateTripleShot();
		}
	}
}

function update() {
	if (!gameStarted) {
		// 游戏未开始,检测上键
		if (cursors.up.isDown) {
			gameStarted = true;
			console.log("游戏开始");
			gameStart.call(this);
		}
	} else {
		// 玩家移动和射击
		playerMove(player, cursors, this, fires);

		// 清理飞出屏幕的子弹
		cleanUpFires(fires);

		// 清理飞出屏幕的敌人
		cleanUpEnemies(enemies);

		// 清理飞出屏幕的bonus
		cleanUpBonuses();

		// 清理飞出屏幕的bullet
		cleanUpBullets();

		// 更新bullet摇摆效果
		updateBulletSwing();

		// 更新敌人(Boss)摇摆效果
		updateEnemySwing(enemies);

		// 更新Boss子弹（墙面反弹）
		updateBossBullets(bossBullets, 300);

		// 清理Boss子弹
		cleanUpBossBullets(bossBullets);

		// 更新Boss血量显示位置
		if (currentBoss && currentBoss.active) {
			const healthDisplay = currentBoss.getData("healthDisplay");
			if (healthDisplay) {
				healthDisplay.setPosition(currentBoss.x, currentBoss.y - 30);
			}
		}

		// 更新分裂子弹倒计时
		updatePowerUpTimer(this);
	}
}