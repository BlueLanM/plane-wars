/* eslint-disable indent */
let enemyGroup = null;

// 创建敌人组
export function createEnemyGroup(scene) {
	enemyGroup = scene.physics.add.group();
	return enemyGroup;
}

// 创建单个敌人
export function createEnemy(scene, enemyType = "enemy") {
	// 随机X位置
	const randomX = Phaser.Math.Between(30, 270);

	let enemy;
	switch (enemyType) {
		case "enemy":
			enemy = enemyGroup.create(randomX, -50, "enemy");
			enemy.setScale(0.8);
			enemy.setVelocityY(300); // 向下移动
			break;
		case "enemy2":
			enemy = enemyGroup.create(randomX, -50, "enemy2");
			enemy.setScale(0.8);
			enemy.setVelocityY(350); // 速度更快
			// 播放飞行动画
			enemy.anims.play("enemy2-fly", true);
			break;
	}
	return enemy;
}

// 清理飞出屏幕的敌人
export function cleanUpEnemies(enemyGroup) {
	if (!enemyGroup) return;

	enemyGroup.children.entries.forEach(enemy => {
		if (enemy.y > 550) { // 飞出屏幕底部
			enemy.destroy();
		}
	});
}

// 开始生成敌人
export function startEnemySpawner(scene, enemyGroup) {
	scene.time.addEvent({
		callback: () => {
			// 随机选择敌人类型 (只生成普通敌人)
			const enemyTypes = ["enemy", "enemy2"];
			const randomIndex = Phaser.Math.Between(0, 1);
			const type = enemyTypes[randomIndex];

			createEnemy(scene, type);

			// 设置下一次生成的时间（随机间隔）
			const nextDelay = Phaser.Math.Between(500, 1200);
			scene.time.delayedCall(nextDelay, () => {
				startEnemySpawner(scene, enemyGroup);
			});
		},
		delay: Phaser.Math.Between(500, 1200),
		loop: false
	});
}

// 创建Boss子弹组
export function createBossBulletGroup(scene) {
	const bossBulletGroup = scene.physics.add.group();
	return bossBulletGroup;
}

// Boss发射子弹
export function bossShoots(scene, boss, bossBulletGroup) {
	if (!boss || !boss.active) return;

	// 随机角度（向下的范围：-60度到60度，0度是正下方）
	const randomAngle = Phaser.Math.Between(-60, 60);
	const angleInRadians = Phaser.Math.DegToRad(randomAngle + 90); // +90是因为Phaser的0度指向右侧

	// 创建子弹
	const bullet = bossBulletGroup.create(boss.x, boss.y, "bossbullet");
	bullet.setScale(0.8);
	bullet.setTint(0xff0000); // 红色子弹，区别于玩家子弹

	// 设置子弹速度（根据角度）
	const speed = 200;
	bullet.setVelocity(
		Math.cos(angleInRadians) * speed,
		Math.sin(angleInRadians) * speed
	);

	// 标记为boss子弹
	bullet.setData("isBossBullet", true);
}

// 更新Boss子弹（墙面反弹）
export function updateBossBullets(bossBulletGroup, worldWidth) {
	if (!bossBulletGroup) return;

	bossBulletGroup.children.entries.forEach(bullet => {
		// 检测左右墙面碰撞
		if (bullet.x <= 10 && bullet.body.velocity.x < 0) {
			// 碰到左墙，反弹
			bullet.setVelocityX(-bullet.body.velocity.x);
		} else if (bullet.x >= worldWidth - 10 && bullet.body.velocity.x > 0) {
			// 碰到右墙，反弹
			bullet.setVelocityX(-bullet.body.velocity.x);
		}
	});
}

// 清理飞出屏幕的Boss子弹
export function cleanUpBossBullets(bossBulletGroup) {
	if (!bossBulletGroup) return;

	bossBulletGroup.children.entries.forEach(bullet => {
		if (bullet.y > 550 || bullet.y < -50) {
			bullet.destroy();
		}
	});
}

// 生成Boss
export function spawnBoss(scene, enemies) {
	// 在屏幕中上方创建boss
	const boss = enemies.create(150, 100, "boss");
	boss.setScale(1.5); // Boss更大
	boss.setVelocity(0, 0); // Boss不移动
	boss.body.setImmovable(true); // 设置为不可移动

	// 设置Boss生命值
	boss.setData("health", 60);

	// 播放飞行动画
	boss.anims.play("boss-fly", true);

	// 添加左右摇摆效果数据（增大移动幅度）
	boss.setData("swingOffset", 100);
	boss.setData("swingSpeed", 2.5); // 增大速度

	// 创建Boss血量显示文本
	const healthDisplay = scene.add.text(150, 80, "Boss血量: 60", {
		fill: "#FF0000",
		fontSize: "14px",
		fontStyle: "bold"
	});
	healthDisplay.setOrigin(0.5, 0.5);

	// 将血量显示文本保存到boss数据中
	boss.setData("healthDisplay", healthDisplay);

	// 显示Boss出现提示
	const bossWarningText = scene.add.text(150, 250, "Boss出现!", {
		fill: "#FF0000",
		fontSize: "32px",
		fontStyle: "bold"
	});
	bossWarningText.setOrigin(0.5, 0.5);

	// 闪烁效果
	scene.tweens.add({
		alpha: 0,
		duration: 500,
		repeat: 3,
		targets: bossWarningText,
		yoyo: true
	});

	scene.time.delayedCall(2000, () => {
		bossWarningText.destroy();
	});

	return boss;
}

// Boss的摇摆效果
export function updateEnemySwing(enemies) {
	if (!enemies) return;

	enemies.children.entries.forEach(enemy => {
		// 只对boss应用摇摆效果
		if (enemy.texture.key === "boss") {
			const offset = enemy.getData("swingOffset") || 0;
			const speed = enemy.getData("swingSpeed") || 2;

			const newOffset = offset + speed;
			enemy.setData("swingOffset", newOffset);

			// 计算横向偏移（增大幅度）
			const swingX = Math.sin(newOffset * 0.02) * 80; // 增大摇摆幅度到80

			// 更新速度以实现摇摆
			enemy.setVelocityX(swingX * 3); // 增大速度倍数
		}
	});
}