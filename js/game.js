const config = {
	// backgroundColor: "#87CEEB",
	height: 600,
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
	width: 800
};

const game = new Phaser.Game(config);

let platforms;
let player;
let obstacles;
let cursors;
let isJumping = false;
let gameOver = false;
let score = 0;
let scoreText;
let playerGraphics; // 玩家方块图形
let groundSpeed = 300; // 地面移动速度
let obstacleTimer; // 障碍物生成计时器
let nextObstacleDelay = 1500; // 下一个障碍物的延迟时间

function create() {
	this.add.image(400, 300, "sky");
	createGround.call(this);
	createPlayer.call(this);
	createObstacles.call(this);
	createControls.call(this);

	// 显示分数
	scoreText = this.add.text(16, 16, "分数: 0", {
		fill: "#000",
		fontFamily: "Arial",
		fontSize: "28px",
		fontStyle: "bold"
	});

	// 添加提示文字
	// this.add.text(16, 50, "点击/空格/↑ 跳跃", {
	// 	fill: "#333",
	// 	fontFamily: "Arial",
	// 	fontSize: "18px"
	// });

	// 添加鼠标点击跳跃
	this.input.on("pointerdown", () => {
		jump();
	});
}

function createGround() {
	platforms = this.physics.add.staticGroup();
	platforms.create(400, 568, "ground").setScale(2).refreshBody();
}

// 创建玩家 - 几何冲刺风格的方块
function createPlayer() {
	// 创建方块玩家图形
	const graphics = this.add.graphics();

	// 绘制方块
	graphics.fillStyle(0x00D9FF, 1);
	graphics.fillRect(0, 0, 40, 40);

	// 添加边框
	graphics.lineStyle(3, 0x0088CC, 1);
	graphics.strokeRect(0, 0, 40, 40);

	// 生成纹理
	graphics.generateTexture("playerCube", 40, 40);
	graphics.destroy();

	// 创建玩家精灵
	player = this.physics.add.sprite(150, 450, "playerCube");
	player.setBounce(0);
	player.setCollideWorldBounds(true);
	player.body.setSize(38, 38);

	// 增加玩家和地面的碰撞器
	this.physics.add.collider(player, platforms);
}

// 创建障碍物组
function createObstacles() {
	obstacles = this.physics.add.group();

	// 添加碰撞检测
	this.physics.add.overlap(player, obstacles, hitObstacle, null, this);

	// 开始生成障碍物
	scheduleNextObstacle.call(this);
}

// 下一个障碍物的生成
function scheduleNextObstacle() {
	if (gameOver) return;

	// 随机延迟时间: 800ms - 2500ms
	nextObstacleDelay = Phaser.Math.Between(800, 2500);

	// 根据分数调整难度,减少最小延迟
	if (score > 100) {
		nextObstacleDelay = Phaser.Math.Between(600, 2000);
	}
	if (score > 200) {
		nextObstacleDelay = Phaser.Math.Between(500, 1800);
	}

	obstacleTimer = this.time.delayedCall(nextObstacleDelay, () => {
		spawnObstacle.call(this);
		scheduleNextObstacle.call(this);
	}, [], this);
}

/* eslint-disable */
// 生成障碍物
function spawnObstacle() {
	if (gameOver) return;

	// 随机选择障碍物类型
	const obstacleType = Phaser.Math.Between(1, 4);
	let obstacle;

	// 创建图形对象
	const graphics = this.add.graphics();
	const textureName = "obstacle_" + Date.now() + "_" + obstacleType;

	switch (obstacleType) {
		case 1: // 三角形
			graphics.fillStyle(0xFF0000, 1);
			graphics.lineStyle(2, 0x990000, 1);
			graphics.beginPath();
			graphics.moveTo(20, 0);
			graphics.lineTo(40, 50);
			graphics.lineTo(0, 50);
			graphics.closePath();
			graphics.fillPath();
			graphics.strokePath();
			graphics.generateTexture(textureName, 40, 50);
			obstacle = obstacles.create(850, 512, textureName);
			break;

		case 2: // 方块障碍物
			graphics.fillStyle(0xFF6600, 1);
			graphics.lineStyle(3, 0xCC4400, 1);
			graphics.fillRect(0, 0, 35, 35);
			graphics.strokeRect(0, 0, 35, 35);
			graphics.generateTexture(textureName, 35, 35);
			obstacle = obstacles.create(850, 519, textureName);
			break;

		case 3: // 双尖刺
			graphics.fillStyle(0xFF0066, 1);
			graphics.lineStyle(2, 0xCC0044, 1);
			// 第一个尖刺
			graphics.beginPath();
			graphics.moveTo(15, 0);
			graphics.lineTo(30, 50);
			graphics.lineTo(0, 50);
			graphics.closePath();
			graphics.fillPath();
			graphics.strokePath();
			// 第二个尖刺
			graphics.beginPath();
			graphics.moveTo(45, 0);
			graphics.lineTo(60, 50);
			graphics.lineTo(30, 50);
			graphics.closePath();
			graphics.fillPath();
			graphics.strokePath();
			graphics.generateTexture(textureName, 60, 50);
			obstacle = obstacles.create(850, 512, textureName);
			break;

		case 4: // 高柱子
			graphics.fillStyle(0xFFFF00, 1);
			graphics.lineStyle(3, 0xCCCC00, 1);
			graphics.fillRect(0, 0, 25, 70);
			graphics.strokeRect(0, 0, 25, 70);
			graphics.lineStyle(2, 0xFFFFFF, 0.3);
			for (let i = 10; i < 70; i += 15) {
				graphics.beginPath();
				graphics.moveTo(0, i);
				graphics.lineTo(25, i);
				graphics.strokePath();
			}
			graphics.generateTexture(textureName, 25, 70);
			obstacle = obstacles.create(850, 501, textureName);
			break;
	}

	graphics.destroy(); // 销毁临时图形对象

	// 设置障碍物物理属性
	obstacle.setVelocityX(-groundSpeed);
	obstacle.setImmovable(true);
	obstacle.body.allowGravity = false;
}

// 碰撞处理
function hitObstacle(player, obstacle) {
	if (gameOver) return;
	
	this.physics.pause();
	gameOver = true;

	// 停止旋转并对齐角度
	const finalAngle = Math.round(player.angle / 90) * 90;
	
	// 创建消散效果
	createShatterEffect.call(this, player.x, player.y, finalAngle);
	
	// 隐藏原始玩家
	player.setVisible(false);

	// 延迟显示游戏结束文字，让消散效果先播放
	this.time.delayedCall(500, () => {
		this.add.text(400, 240, "Game Over!", {
			fill: "#FF0000",
			fontFamily: "Arial",
			fontSize: "72px",
			fontStyle: "bold"
		}).setOrigin(0.5);

		this.add.text(400, 310, "最终分数: " + score, {
			fill: "#FFFFFF",
			fontFamily: "Arial",
			fontSize: "36px"
		}).setOrigin(0.5);

		this.add.text(400, 360, "按F5重新开始", {
			fill: "#FFFF00",
			fontFamily: "Arial",
			fontSize: "24px"
		}).setOrigin(0.5);
	});
}

// 创建方块消散效果
function createShatterEffect(x, y, angle) {
	// 创建小方块碎片的纹理
	const fragmentGraphics = this.add.graphics();
	fragmentGraphics.fillStyle(0x00D9FF, 1);
	fragmentGraphics.fillRect(0, 0, 10, 10);
	fragmentGraphics.lineStyle(1, 0x0088CC, 1);
	fragmentGraphics.strokeRect(0, 0, 10, 10);
	fragmentGraphics.generateTexture("fragment", 10, 10);
	fragmentGraphics.destroy();
	
	// 创建多个碎片 (4x4 网格)
	const fragments = [];
	
	for (let i = 0; i < 4; i++) {
		for (let j = 0; j < 4; j++) {
			// 计算碎片的初始位置（相对于方块中心）
			const offsetX = (i - 1.5) * 10;
			const offsetY = (j - 1.5) * 10;
			
			// 创建碎片
			const fragment = this.add.sprite(x + offsetX, y + offsetY, "fragment");
			fragment.angle = angle;
			
			// 随机速度和方向 - 向外爆炸
			const speedX = (i - 1.5) * 80 + Phaser.Math.Between(-50, 50);
			const speedY = (j - 1.5) * 80 + Phaser.Math.Between(-200, -50);
			const rotationSpeed = Phaser.Math.Between(-15, 15);
			
			fragments.push({
				sprite: fragment,
				velocityX: speedX,
				velocityY: speedY,
				rotationSpeed: rotationSpeed,
				gravity: 1000
			});
		}
	}
	
	// 动画更新
	let elapsed = 0;
	const animationTimer = this.time.addEvent({
		delay: 16, // 约60fps
		callback: () => {
			elapsed += 16;
			const delta = 16 / 1000; // 转换为秒
			
			fragments.forEach(frag => {
				// 更新位置
				frag.sprite.x += frag.velocityX * delta;
				frag.sprite.y += frag.velocityY * delta;
				
				// 更新速度（重力）
				frag.velocityY += frag.gravity * delta;
				
				// 旋转
				frag.sprite.angle += frag.rotationSpeed;
				
				// 淡出效果
				const alpha = Math.max(0, 1 - elapsed / 1000);
				frag.sprite.setAlpha(alpha);
			});
			
			// 1秒后停止动画并清理
			if (elapsed >= 1000) {
				fragments.forEach(frag => frag.sprite.destroy());
				animationTimer.remove();
			}
		},
		loop: true
	});
}

// 创建控制
function createControls() {
	cursors = this.input.keyboard.createCursorKeys();

	// 添加空格键跳跃
	this.input.keyboard.on("keydown-SPACE", () => {
		jump();
	});

	// 添加上箭头跳跃
	this.input.keyboard.on("keydown-UP", () => {
		jump();
	});
}

// 跳跃函数
function jump() {
	if (gameOver) return;

	// 检查玩家是否在地面上
	if (player.body.touching.down) {
		player.setVelocityY(-700); // 更高的跳跃
		isJumping = true;
	}
}

function preload() {
	this.load.image("sky", "assets/sky.png");
	this.load.image("ground", "assets/platform.png");
}

function update() {
	if (gameOver) return;

	// 玩家翻滚动画
	if (!player.body.touching.down) {
		player.angle += 8; // 旋转速度
	} else {
		// 着地时对齐角度到最近的90度倍数
		const targetAngle = Math.round(player.angle / 90) * 90;
		if (player.angle !== targetAngle) {
			player.angle = Phaser.Math.Linear(player.angle, targetAngle, 0.3);
		}
		isJumping = false;
	}

	// 清理超出屏幕的障碍物
	obstacles.children.entries.forEach(obstacle => {
		if (obstacle.x < -100) {
			// 检查这个障碍物是否已经被计分
			if (!obstacle.scored) {
				obstacle.scored = true; // 标记为已计分
				// 增加分数
				score += 10;
				scoreText.setText("分数: " + score);

				// 逐渐增加难度
				if (score % 50 === 0 && groundSpeed < 500) {
					groundSpeed += 20;
				}
			}
			obstacle.destroy();
		}
	});
}