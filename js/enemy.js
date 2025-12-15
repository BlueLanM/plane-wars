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
	// 每隔 1-3 秒生成一个敌人
	scene.time.addEvent({
		callback: () => {
			// 随机选择敌人类型（0或1，对应enemy或enemy2）
			const enemyTypes = ["enemy", "enemy2"];
			const randomIndex = Phaser.Math.Between(0, 1);
			const type = enemyTypes[randomIndex];

			createEnemy(scene, type);

			// 设置下一次生成的时间（随机间隔）
			const nextDelay = Phaser.Math.Between(200, 700);
			scene.time.delayedCall(nextDelay, () => {
				startEnemySpawner(scene, enemyGroup);
			});
		},
		delay: Phaser.Math.Between(200, 700),
		loop: false
	});
}