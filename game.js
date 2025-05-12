// --- グローバル設定のようなもの ---
const GAME_WIDTH = 450;
const GAME_HEIGHT = 800;
const ASSETS_PATH = 'assets/'; // ベースパスは残すが、画像指定時にフォルダ名を入れない

const CONFIG = {
    NUM_JAKO: 100,
    NUM_TAKO: 4,    // タコの数 (収集対象)
    NUM_KAI: 3,     // 貝の数 (1種類のみ)

    IMG_JAKO: 'jako',
    IMG_TAKO: 'tako', // ゲーム内表示用タコ
    IMG_KAI: 'kai',   // ゲーム内表示用貝

    SCALE_JAKO: 0.6,
    SCALE_TAKO: 0.65,
    SCALE_KAI: 0.6,   // 貝のスケール

    SCORE_TAKO: 15,  // タコ発見時の基本スコア
    SCORE_KAI: 25,   // 貝発見時のスコア
    
    GAME_DURATION_SECONDS: 90,

    SORT_AREA_HEIGHT: 80,
    TEXT_STYLE: { fontSize: '22px', fill: '#fff', stroke: '#000', strokeThickness: 4 },
    TARGET_INFO_STYLE: { fontSize: '35px', fill: '#fff', stroke: '#000', strokeThickness: 2, align: 'center' },
    RESULT_TEXT_STYLE: { fontSize: '30px', fill: '#fff', stroke: '#000', strokeThickness: 5, align: 'center' },
    POPUP_TEXT_STYLE: { fontSize: '40px', fill: '#333', align: 'center', wordWrap: { width: GAME_WIDTH * 0.6 } },

    // --- タコの収集アイテムデータ (貝はここから削除) ---
    TAKO_COLLECTIBLES: [
        { id: 'tako_common_1', name: '普通のタコ', imageKey: 'collect_tako_1', description: 'よく見かける一般的なタコ。美味しい。' },
        { id: 'tako_striped', name: 'シマシマだこ', imageKey: 'collect_tako_2', description: '体に綺麗な縞模様があるタコ。少し珍しい。' },
        { id: 'tako_small', name: 'チビだこ', imageKey: 'collect_tako_3', description: 'とても小さいが元気なタコ。すばしっこい。' },
        { id: 'tako_ink', name: 'スミはきだこ', imageKey: 'collect_tako_4', description: '驚くとすぐに墨を吐いて逃げる。' },

 { id: 'tako_2', name: 'スミ', imageKey: 'collect_tako_4', description: '驚くとすぐに墨を吐いて逃げる。' },
        { id: 'tako_ink3', name: 'スミだこ', imageKey: 'collect_tako_4', description: '驚くとすぐに墨を吐いて逃げる。' },
        { id: 'tako_ink4', name: 'はきだこ', imageKey: 'collect_tako_4', description: '驚くとすぐに墨を吐いて逃げる。' },
        { id: 'tako_ink5', name: 'スミルミナス', imageKey: 'collect_tako_4', description: '驚くとすぐに墨を吐いて逃げる。' },
        { id: 'tako_ink6', name: 'スミはつかは', imageKey: 'collect_tako_4', description: '驚くとすぐに墨を吐いて逃げる。' },
       




        { id: 'tako_king', name: 'タコキング', imageKey: 'collect_tako_king', description: '風格ただよう、タコの中の王様（自称）。' },
        // 必要ならさらにタコの種類を追加
    ],
    // ポップアップで使用するタコ画像キー (貝のキーは削除)
    // 画像ファイルは assets/ 直下に配置
    COLLECTIBLE_IMAGE_KEYS: {
        'collect_tako_1': 'collect_tako_A.png', // 例: assets/collect_tako_A.png
        'collect_tako_2': 'collect_tako_B.png',
        'collect_tako_3': 'collect_tako_C.png',
        'collect_tako_4': 'collect_tako_D.png',
 'collect_tako_5': 'collect_tako_E.png', 
 'collect_tako_6': 'collect_tako_F.png', 
 'collect_tako_7': 'collect_tako_G.png', 
 'collect_tako_8': 'collect_tako_H.png', 
 'collect_tako_9': 'collect_tako_I.png', 


        'collect_tako_king': 'collect_tako_king.png',
    }
};

let gameInstance;

// --- シーン定義 ---

class PreloadScene extends Phaser.Scene {
    constructor() { super({ key: 'PreloadScene' }); }
    preload() {
        // アセットパスの基準は設定しないか、ルート('')にする
        // this.load.setBaseURL(ASSETS_PATH); // 不要または this.load.setBaseURL('');

        let progressBar = this.add.graphics();
        let progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(GAME_WIDTH / 2 - 160, GAME_HEIGHT / 2 - 25, 320, 50);
        let loadingText = this.make.text({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 - 50, text: '読み込み中...', style: { fontSize: '20px', fill: '#ffffff' } }).setOrigin(0.5, 0.5);
        let percentText = this.make.text({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2, text: '0%', style: { fontSize: '18px', fill: '#ffffff' } }).setOrigin(0.5, 0.5);
        this.load.on('progress', (value) => {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear(); progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2 - 15, 300 * value, 30);
        });
        this.load.on('complete', () => {
            progressBar.destroy(); progressBox.destroy(); loadingText.destroy(); percentText.destroy();
        });

        // 画像の読み込み (assets/ 直下を想定)
        this.load.image(CONFIG.IMG_JAKO, ASSETS_PATH + 'jako.png');
        this.load.image(CONFIG.IMG_TAKO, ASSETS_PATH + 'tako.png');
        this.load.image(CONFIG.IMG_KAI, ASSETS_PATH + 'kai.png');

        // 収集アイテム用タコ画像の読み込み
        for (const key in CONFIG.COLLECTIBLE_IMAGE_KEYS) {
            this.load.image(key, ASSETS_PATH + CONFIG.COLLECTIBLE_IMAGE_KEYS[key]);
        }
        // UI用画像
        this.load.image('popup_bg', ASSETS_PATH + 'popup_background.png');
        this.load.image('game_bg', ASSETS_PATH + 'background_topdown.jpg');
    }
    create() { this.scene.start('StartScene'); }
}

class StartScene extends Phaser.Scene {
    constructor() { super({ key: 'StartScene' }); }
    create() {
        this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'game_bg').setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(-1);
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3, 'どうして\nガチャは蒼いのか', { ...CONFIG.RESULT_TEXT_STYLE, fontSize: '48px'}).setOrigin(0.5);
        const startButton = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 'ゲームスタート', CONFIG.RESULT_TEXT_STYLE)
            .setOrigin(0.5).setPadding(20).setStyle({ backgroundColor: '#1e6091', fill: '#ffffff'}).setInteractive({ useHandCursor: true });
        startButton.on('pointerdown', () => {
            this.scene.stop('StartScene');
            this.scene.launch('GameUIScene');
            this.scene.start('GameScene');
        });
         this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, '石をスワイプして\nレアをタップ！', { ...CONFIG.TARGET_INFO_STYLE, fontSize:'16px', align:'center'}).setOrigin(0.5);
    }
}

class GameUIScene extends Phaser.Scene {
    constructor() { super({ key: 'GameUIScene', active: false }); }
    create() {
        this.scoreText = this.add.text(20, 20, `スコア: 0`, CONFIG.TEXT_STYLE).setDepth(100);
        this.timerText = this.add.text(GAME_WIDTH - 20, 20, `時間: ${CONFIG.GAME_DURATION_SECONDS}`, CONFIG.TEXT_STYLE).setOrigin(1, 0).setDepth(100);
        this.targetInfoText = this.add.text(GAME_WIDTH / 2, 60, `タコ:0 / 貝:0`, CONFIG.TARGET_INFO_STYLE).setOrigin(0.5,0).setDepth(100);
        const gameScene = this.scene.get('GameScene');
        gameScene.events.on('updateScore', (newScore) => { this.scoreText.setText(`スコア: ${newScore}`); }, this);
        gameScene.events.on('updateTimer', (newTimeLeft) => { this.timerText.setText(`時間: ${newTimeLeft}`); }, this);
        gameScene.events.on('updateTargetInfo', (takoLeft, kaiLeft) => { this.targetInfoText.setText(`タコ:${takoLeft} / 貝:${kaiLeft}`); }, this);
        gameScene.events.on('showCollectiblePopup', this.showPopup, this); // タコ用ポップアップ
        gameScene.events.on('gameOverUI', this.showGameOverUI, this);
    }

    // showPopup はタコ専用に変更
    showPopup(takoCollectibleItem) {
        if (this.popupContainer && this.popupContainer.active) { this.popupContainer.destroy(); }
        this.popupContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(200);
        const popupBG = this.add.image(0, 0, 'popup_bg').setScale(0.8);
        const itemImage = this.add.image(0, -GAME_HEIGHT * 0.08, takoCollectibleItem.imageKey).setScale(0.7); // imageKeyは収集アイテムデータから
        const itemNameText = this.add.text(0, GAME_HEIGHT * 0.05, takoCollectibleItem.name, { ...CONFIG.POPUP_TEXT_STYLE, fontSize: '24px', fill: '#1a508b' }).setOrigin(0.5);
        const itemDescText = this.add.text(0, GAME_HEIGHT * 0.12, takoCollectibleItem.description, CONFIG.POPUP_TEXT_STYLE).setOrigin(0.5);
        const foundText = this.add.text(0, -GAME_HEIGHT * 0.18, `「${takoCollectibleItem.name}」を発見！`, { ...CONFIG.POPUP_TEXT_STYLE, fontSize: '22px', fill: '#006400' }).setOrigin(0.5);
        const closeButton = this.add.text(0, GAME_HEIGHT * 0.2, '[ 閉じる ]', { ...CONFIG.TEXT_STYLE, fontSize: '22px', fill: '#d32f2f' }).setOrigin(0.5).setPadding(10).setInteractive({ useHandCursor: true });
        this.popupContainer.add([popupBG, itemImage, itemNameText, itemDescText, foundText, closeButton]);
        const gameScene = this.scene.get('GameScene');
        if(gameScene) gameScene.isPopupOpen = true;
        closeButton.on('pointerdown', () => {
            this.popupContainer.destroy(); this.popupContainer = null;
            if(gameScene) gameScene.isPopupOpen = false;
        });
    }
    showGameOverUI(message, finalScore) {
        this.add.graphics({ fillStyle: { color: 0x000000, alpha: 0.7 } }).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT).setDepth(199);
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, message, CONFIG.RESULT_TEXT_STYLE).setOrigin(0.5).setDepth(200);
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `最終スコア: ${finalScore}`, CONFIG.RESULT_TEXT_STYLE).setOrigin(0.5).setDepth(200);
        const restartButton = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, 'タイトルへ', CONFIG.RESULT_TEXT_STYLE).setOrigin(0.5).setPadding(15).setStyle({ backgroundColor: '#1e6091', fill: '#ffffff'}).setInteractive({ useHandCursor: true }).setDepth(200);
        restartButton.on('pointerdown', () => {
            this.scene.stop('GameScene'); this.scene.stop('GameUIScene');
            this.scene.start('StartScene');
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    init() {
        this.score = 0;
        this.timeLeft = CONFIG.GAME_DURATION_SECONDS;
        this.targets = [];
        this.totalTargetsToFind = 0;
        this.targetsFoundCount = 0;
        this.timerEvent = null;
        this.isPopupOpen = false;
        this.isGameOver = false;
        // タコ用の収集アイテムリストを準備
        this.availableTakoCollectibles = [...CONFIG.TAKO_COLLECTIBLES];
        Phaser.Utils.Array.Shuffle(this.availableTakoCollectibles);
        this.draggingObject = null;
    }

    create() {
        this.init();
        this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'game_bg').setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(-1);
        this.matter.world.setGravity(0, 0);
        this.matter.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT - CONFIG.SORT_AREA_HEIGHT, 32, true, true, false, true);

        const sortAreaY = GAME_HEIGHT - CONFIG.SORT_AREA_HEIGHT;
        this.add.rectangle(0, sortAreaY, GAME_WIDTH, CONFIG.SORT_AREA_HEIGHT, 0x000000, 0.3).setOrigin(0,0).setDepth(1);
        this.add.text(GAME_WIDTH / 2, sortAreaY + CONFIG.SORT_AREA_HEIGHT / 2, '▼ ここにドラッグ ▼', {...CONFIG.TEXT_STYLE, fontSize: '20px', fill: '#444'}).setOrigin(0.5).setDepth(2);
        this.sortAreaSensor = this.matter.add.rectangle(GAME_WIDTH / 2, sortAreaY + CONFIG.SORT_AREA_HEIGHT / 2, GAME_WIDTH, CONFIG.SORT_AREA_HEIGHT, { isSensor: true, isStatic: true, label: 'sortArea' });
        
        this.events.emit('updateScore', this.score);
        this.events.emit('updateTimer', this.timeLeft);

        this.createTargets();
        this.createJakoOverTargets();
        this.updateTargetInfoText();

       this.input.on('dragstart', (pointer, gameObject) => {
            if (this.isPopupOpen || this.isGameOver || !gameObject.body) return;
            if (gameObject.getData('type') === CONFIG.IMG_JAKO) {
                this.draggingObject = gameObject;
                gameObject.setDepth(50);
                // ドラッグ開始時にじゃこを少し「持ち上げる」ような効果（物理的にではなく、見た目や挙動で）
                // 例えば、一時的に摩擦や空気抵抗をさらに下げるなど
                if (gameObject.body) { // bodyがあることを確認
                    // gameObject.setFrictionAir(0.005); // ドラッグ中は空気抵抗を極小に
                }
            }
        });
         this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (this.isPopupOpen || this.isGameOver || !this.draggingObject || this.draggingObject !== gameObject || !gameObject.body) return;
            if (gameObject.getData('type') === CONFIG.IMG_JAKO) {
                // 力の大きさを調整 (以前より少し弱く、または質量に対する比率で調整)
                const forceMagnitude = 0.0025 * gameObject.body.mass; // ★調整ポイント
                const angle = Phaser.Math.Angle.Between(gameObject.x, gameObject.y, dragX, dragY);
                // 力を加える対象が gameObject.body であることを確認
                if (gameObject.body) {
                    this.matter.applyForce(gameObject.body, { x: Math.cos(angle) * forceMagnitude, y: Math.sin(angle) * forceMagnitude });
                    // 角速度の抑制は継続
                    gameObject.setAngularVelocity(gameObject.body.angularVelocity * 0.85); // ★調整ポイント
                }
            }
        });

        this.input.on('dragend', (pointer, gameObject, dropped) => {
            if (this.isPopupOpen || this.isGameOver || !this.draggingObject || this.draggingObject !== gameObject || !gameObject.body) return;
            if (gameObject.getData('type') === CONFIG.IMG_JAKO) {
                gameObject.setDepth(gameObject.getData('initialDepth') || 10);
                this.draggingObject = null;
                // ドラッグ終了時は速度と角速度をリセットし、空気抵抗を元に戻す
                if (gameObject.body) { // bodyがあることを確認
                    gameObject.setVelocity(0,0);
                    gameObject.setAngularVelocity(0);
                    // gameObject.setFrictionAir(0.03); // 元の空気抵抗値に戻す ★createJakoOverTargetsと合わせる
                }

                if (gameObject.y + gameObject.displayHeight / 2 > GAME_HEIGHT - CONFIG.SORT_AREA_HEIGHT) {
                    this.sortJako(gameObject);
                }
            }
        });


        this.timerEvent = this.time.addEvent({ delay: 1000, callback: this.updateTimer, callbackScope: this, loop: true });
    }
    
    getTakoCollectible() {
        if (this.availableTakoCollectibles.length > 0) {
            // シャッフル済みなので先頭から取り出す
            return this.availableTakoCollectibles.pop();
        }
        // もし全て使い切ったら、CONFIGからランダムに選ぶ（重複許容）
        return Phaser.Utils.Array.GetRandom(CONFIG.TAKO_COLLECTIBLES);
    }

    createTargets() {
        this.targets = [];
        let currentTotalTargets = 0;
        const placementArea = { x: GAME_WIDTH / 2, y: (GAME_HEIGHT - CONFIG.SORT_AREA_HEIGHT) / 2, width: GAME_WIDTH * 0.6, height: (GAME_HEIGHT - CONFIG.SORT_AREA_HEIGHT) * 0.5 };

        // タコを配置 (収集要素あり)
        for (let i = 0; i < CONFIG.NUM_TAKO; i++) {
            let x, y, tooClose, attempts = 0;
            do {
                tooClose = false; x = Phaser.Math.Between(placementArea.x - placementArea.width/2, placementArea.x + placementArea.width/2);
                y = Phaser.Math.Between(placementArea.y - placementArea.height/2, placementArea.y + placementArea.height/2);
                for(const t of this.targets) { if (Phaser.Math.Distance.Between(x,y, t.x, t.y) < 50) { tooClose = true; break; } }
                attempts++;
            } while (tooClose && attempts < 10);

            const takoCollectibleData = this.getTakoCollectible();
            const target = this.matter.add.image(x, y, CONFIG.IMG_TAKO)
                .setScale(CONFIG.SCALE_TAKO).setCircle(18 * CONFIG.SCALE_TAKO)
                .setStatic(true).setSensor(false).setCollisionCategory(1).setCollidesWith([1]).setDepth(3);
            target.setData({ type: CONFIG.IMG_TAKO, baseType: 'tako', collectible: takoCollectibleData, found: false });
            target.setInteractive({ useHandCursor: true });
            target.on('pointerdown', () => { if (!this.isPopupOpen && !this.isGameOver) this.onTargetClicked(target); });
            this.targets.push(target); currentTotalTargets++;
        }

        // 貝を配置 (1種類、収集要素なし)
        for (let i = 0; i < CONFIG.NUM_KAI; i++) {
            let x, y, tooClose, attempts = 0;
            do {
                tooClose = false; x = Phaser.Math.Between(placementArea.x - placementArea.width/2, placementArea.x + placementArea.width/2);
                y = Phaser.Math.Between(placementArea.y - placementArea.height/2, placementArea.y + placementArea.height/2);
                for(const t of this.targets) { if (Phaser.Math.Distance.Between(x,y, t.x, t.y) < 50) { tooClose = true; break; } }
                attempts++;
            } while (tooClose && attempts < 10);

            const target = this.matter.add.image(x, y, CONFIG.IMG_KAI)
                .setScale(CONFIG.SCALE_KAI).setCircle(17 * CONFIG.SCALE_KAI)
                .setStatic(true).setSensor(false).setCollisionCategory(1).setCollidesWith([1]).setDepth(3);
            target.setData({ type: CONFIG.IMG_KAI, baseType: 'kai', found: false }); // collectibleなし
            target.setInteractive({ useHandCursor: true });
            target.on('pointerdown', () => { if (!this.isPopupOpen && !this.isGameOver) this.onTargetClicked(target); });
            this.targets.push(target); currentTotalTargets++;
        }
        this.totalTargetsToFind = currentTotalTargets;
    }

     createJakoOverTargets() {
        const jakoSpawnArea = { minX: 50, maxX: GAME_WIDTH - 50, minY: 50, maxY: GAME_HEIGHT - CONFIG.SORT_AREA_HEIGHT - 50 };
        for (let i = 0; i < CONFIG.NUM_JAKO; i++) {
            let x, y;
            if (this.targets.length > 0 && Math.random() < 0.7) {
                const randomTarget = Phaser.Utils.Array.GetRandom(this.targets);
                x = randomTarget.x + Phaser.Math.Between(-35, 35); y = randomTarget.y + Phaser.Math.Between(-35, 35); // 少し範囲を狭める
            } else {
                x = Phaser.Math.Between(jakoSpawnArea.minX, jakoSpawnArea.maxX); y = Phaser.Math.Between(jakoSpawnArea.minY, jakoSpawnArea.maxY);
            }
            x = Phaser.Math.Clamp(x, 30, GAME_WIDTH - 30); y = Phaser.Math.Clamp(y, 30, GAME_HEIGHT - CONFIG.SORT_AREA_HEIGHT - 30);

            const jako = this.matter.add.image(x, y, CONFIG.IMG_JAKO)
                .setScale(CONFIG.SCALE_JAKO)
                .setRectangle(35 * CONFIG.SCALE_JAKO, 20 * CONFIG.SCALE_JAKO)
                .setBounce(0.04)      // ★弾性をさらに低く (あまり跳ねないように)
                .setFriction(0.1)    // ★摩擦を大幅に低く (滑りやすく)
                .setFrictionAir(0.02) // ★空気抵抗も少し低く (動きやすく)
                .setDensity(0.001)   // ★密度を少し低く (軽く)
                .setAngle(Phaser.Math.Between(-180, 180))
                .setCollisionCategory(1).setCollidesWith([1])
                .setDepth(10 + Math.random() * 5);
            jako.setData({ type: CONFIG.IMG_JAKO, sorted: false, initialDepth: jako.depth });
            jako.setInteractive({ draggable: true, useHandCursor: true });
        }
    }


    onTargetClicked(target) {
        if (target.getData('found') || this.isPopupOpen || this.isGameOver) return;
        target.setData('found', true); this.targetsFoundCount++;
        let scoreEarned = 0;
        const baseType = target.getData('baseType');

        if (baseType === 'tako') {
            scoreEarned = CONFIG.SCORE_TAKO;
            const takoCollectibleData = target.getData('collectible');
            if (takoCollectibleData) { // タコの場合のみポップアップ
                this.isPopupOpen = true;
                this.events.emit('showCollectiblePopup', takoCollectibleData);
            }
        } else if (baseType === 'kai') {
            scoreEarned = CONFIG.SCORE_KAI;
            // 貝の場合はポップアップなし
        }
        this.score += scoreEarned; this.events.emit('updateScore', this.score);
        this.updateTargetInfoText();
        
        target.setTint(0x33dd33);
        this.tweens.add({ targets: target, alpha: 0.5, duration: 200 });
        if (this.targetsFoundCount >= this.totalTargetsToFind) this.gameOver("コンプリート！");
    }

    sortJako(jako) {
        if (jako.getData('sorted') || !jako.body) return;
        jako.setData('sorted', true);
        this.tweens.add({ targets: jako, alpha: 0, scale: jako.scale * 0.3, duration: 250, ease: 'Quad.easeIn',
            onComplete: () => { if (jako.body) this.matter.world.remove(jako.body, true); jako.destroy(); }
        });
    }

    updateTimer() {
        if (this.isPopupOpen || this.isGameOver) return;
        if (this.timeLeft > 0) {
            this.timeLeft--; this.events.emit('updateTimer', this.timeLeft);
        } else if (this.timeLeft <= 0 && !this.isGameOver) {
            this.gameOver("時間切れ！");
        }
    }
    
    updateTargetInfoText() {
        let takoLeft = 0, kaiLeft = 0;
        this.targets.forEach(target => {
            if (!target.getData('found')) {
                if (target.getData('baseType') === 'tako') takoLeft++;
                else if (target.getData('baseType') === 'kai') kaiLeft++;
            }
        });
        this.events.emit('updateTargetInfo', takoLeft, kaiLeft);
    }

    gameOver(message) {
        if (this.isGameOver) return; this.isGameOver = true;
        if (this.timerEvent) this.timerEvent.remove(false);
        this.matter.world.pause();
        this.events.emit('gameOverUI', message, this.score);
    }

    update(time, delta) { /* 必要なら */ }
}

const phaserConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: {
        default: 'matter',
        matter: { debug: false, gravity: { x: 0, y: 0 }, enableSleeping: true }
    },
    scene: [PreloadScene, StartScene, GameScene, GameUIScene]
};

window.onload = () => { gameInstance = new Phaser.Game(phaserConfig); };