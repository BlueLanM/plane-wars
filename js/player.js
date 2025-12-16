let player = null;
let fires = null;
let lastFireTime = 0;
let isRecoiling = false; // 是否正在后座力中
let isHit = false; // 是否正在被撞击中
let tripleShotActive = false; // 是否激活分裂子弹
const FIRE_COOLDOWN = 200; // 发射冷却时间(毫秒)
const RECOIL_DISTANCE = 5; // 后座力距离
const RECOIL_DURATION = 50; // 后座力持续时间(毫秒)

// 创建玩家飞机
export function createPlayer(scene) {
	player = scene.physics.add.sprite(150, 460, "player");
	player.setScale(0.8);

	// 启用世界边界碰撞
	player.setCollideWorldBounds(true);

	console.log("飞机已渲染");
	return player;
}

// 创建子弹组
export function createFireGroup(scene) {
	fires = scene.physics.add.group();
	return fires;
}

// 创建单个子弹
export function createFire(scene, playerSprite, fireGroup) {
	const currentTime = scene.time.now;

	// 检查冷却时间
	if (currentTime - lastFireTime < FIRE_COOLDOWN) {
		return;
	}

	if (tripleShotActive) {
		// 分裂子弹
		// 中间
		const fire1 = fireGroup.create(playerSprite.x, playerSprite.y - 20, "fire");
		fire1.setScale(0.8);
		fire1.setVelocityY(-400);

		// 左侧
		const fire2 = fireGroup.create(playerSprite.x - 20, playerSprite.y - 10, "fire");
		fire2.setScale(0.8);
		fire2.setVelocityY(-400);
		fire2.setVelocityX(-50);

		// 右侧
		const fire3 = fireGroup.create(playerSprite.x + 20, playerSprite.y - 10, "fire");
		fire3.setScale(0.8);
		fire3.setVelocityY(-400);
		fire3.setVelocityX(50);
	} else {
		// 单发子弹
		const fire = fireGroup.create(playerSprite.x, playerSprite.y - 20, "fire");
		fire.setScale(0.8);
		fire.setVelocityY(-400);
	}

	// 更新发射时间
	lastFireTime = currentTime;

	// 添加后座力效果
	addRecoilEffect(scene, playerSprite);
}

// 添加后座力效果
function addRecoilEffect(scene, playerSprite) {
	// 如果正在后座力中，不重复添加
	if (isRecoiling) {
		return;
	}

	isRecoiling = true;
	const originalY = playerSprite.y;

	// 向下移动（后座力）
	scene.tweens.add({
		duration: RECOIL_DURATION,
		ease: "Quad.easeOut",
		onComplete: () => {
			// 回弹到原位
			scene.tweens.add({
				duration: RECOIL_DURATION,
				ease: "Quad.easeOut",
				onComplete: () => {
					isRecoiling = false;
				},
				targets: playerSprite,
				y: originalY
			});
		},
		targets: playerSprite,
		y: originalY + RECOIL_DISTANCE
	});
}

// 玩家移动控制
export function playerMove(playerSprite, cursors, scene, fireGroup) {
	// 使用物理引擎的速度控制
	if (cursors.left.isDown) {
		playerSprite.setVelocityX(-400);
	} else if (cursors.right.isDown) {
		playerSprite.setVelocityX(400);
	} else {
		playerSprite.setVelocityX(0);
	}

	// 上键射击
	if (cursors.up.isDown) {
		createFire(scene, playerSprite, fireGroup);
	}
}

// 清理飞出屏幕的子弹
export function cleanUpFires(fireGroup) {
	fireGroup.children.entries.forEach(fire => {
		if (fire.y < -50) {
			fire.destroy();
		}
	});
}

// 玩家被撞击的动画效果
export function playerHitAnimation(scene, playerSprite) {
	// 如果正在播放被撞击动画，不重复添加
	if (isHit) {
		return;
	}

	isHit = true;
	const originalX = playerSprite.x;
	let blinkCount = 0;

	// 抖动效果
	scene.tweens.add({
		duration: 50,
		onComplete: () => {
			playerSprite.x = originalX;
		},
		repeat: 3,
		targets: playerSprite,
		x: originalX - 5,
		yoyo: true
	});

	// 闪烁效果（红色染色）
	scene.time.addEvent({
		callback: () => {
			blinkCount++;
			if (blinkCount % 2 === 1) {
				playerSprite.setTint(0xff0000); // 红色
			} else {
				playerSprite.clearTint();
			}
		},
		callbackScope: scene,
		delay: 100,
		repeat: 5
	});

	// 动画结束后恢复状态
	scene.time.delayedCall(600, () => {
		playerSprite.clearTint();
		isHit = false;
	});
}

// 激活分裂子弹
export function activateTripleShot() {
	tripleShotActive = true;
}

// 停用分裂子弹
export function deactivateTripleShot() {
	tripleShotActive = false;
}

// 获取分裂子弹状态
export function isTripleShotActive() {
	return tripleShotActive;
}