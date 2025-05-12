// --- グローバル設定のようなもの ---
const GAME_WIDTH = 450;  // スマホ縦画面想定の基準幅
const GAME_HEIGHT = 800; // スマホ縦画面想定の基準高さ

const ASSETS_PATH = 'assets/'; // アセットのベースパス

const CONFIG = {
    NUM_JAKO: 80,
    NUM_TAKO: 4,
    CHANCE_KAI: 0.5, // 貝が出現する確率
    NUM_KAI_IF_APPEAR: 1,

    // 画像のキー名 (preloadで使う)
    IMG_JAKO: 'jako',
    IMG_TAKO: 'tako',
    IMG_KAI: 'kai',

    // アイテムの物理的な大きさや見た目のスケール
    SCALE_JAKO: 0.6,
    SCALE_TAKO: 0.7,
    SCALE_KAI: 0.65,

    // ターゲット発見時のスコア
    SCORE_TAKO: 10,
    SCORE_KAI: 50,
    SCORE_JAKO_SORTED: 1, // じゃこを選別したときのスコア (オプション)

    GAME_DURATION_SECONDS: 60,

    SORT_AREA_HEIGHT: 100, // 画面下部の選別エリアの高さ
    TEXT_STYLE: { fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 4 },
    TARGET_INFO_STYLE: { fontSize: '18px', fill: '#fff', stroke: '#000', strokeThickness: 2, align: 'center' },
    RESULT_TEXT_STYLE: { fontSize: '32px', fill: '#fff', stroke: '#000', strokeThickness: 5, align: 'center' },
};

let gameInstance; // Phaserのゲームインスタンスを保持

// --- シーン定義 ---

class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        this.load.setBaseURL(ASSETS_PATH); // 画像パスの基準を設定

        // ローディング表示
        let progressBar = this.add.graphics();
        let progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(GAME_WIDTH / 2 - 160, GAME_HEIGHT / 2 - 25, 320, 50);

        let loadingText = this.make.text({
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT / 2 - 50,
            text: '読み込み中...',
            style: { fontSize: '20px', fill: '#ffffff' }
        });
        loadingText.setOrigin(0.5, 0.5);

        let percentText = this.make.text({
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT / 2,
            text: '0%',
            style: { fontSize: '18px', fill: '#ffffff' }
        });
        percentText.setOrigin(0.5, 0.5);

        this.load.on('progress', function (value) {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        // 画像の読み込み
        this.load.image(CONFIG.IMG_JAKO, 'img/jako.png');
        this.load.image(CONFIG.IMG_TAKO, 'img/tako.png');
        this.load.image(CONFIG.IMG_KAI, 'img/kai.png');
        // 必要なら背景画像などもここで
        // this.load.image('background', 'img/background.png');
    }

    create() {
        this.scene.start('StartScene'); // 読み込み完了後、スタートシーンへ
    }
}

class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#5c8391'); // 背景色

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3, '選り分けゲーム', { ...CONFIG.RESULT_TEXT_STYLE, fontSize: '48px'})
            .setOrigin(0.5);

        const startButton = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 'ゲームスタート', CONFIG.RESULT_TEXT_STYLE)
            .setOrigin(0.5)
            .setPadding(20)
            .setStyle({ backgroundColor: '#1e6091', fill: '#ffffff'})
            .setInteractive({ useHandCursor: true });

        startButton.on('pointerdown', () => {
            this.scene.stop('StartScene');
            this.scene.start('GameScene');
        });

         this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, 'じゃこを下のエリアにスワイプ！\nタコや貝をタップ！', { ...CONFIG.TARGET_INFO_STYLE, fontSize:'16px', align:'center'})
            .setOrigin(0.5);
    }
}


class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.score = 0;
        this.timeLeft = CONFIG.GAME_DURATION_SECONDS;
        this.jakoGroup = null; // じゃこを管理するMatterのコンポジットまたはPhaserグループ
        this.targets = [];     // タコや貝のオブジェクトを保持
        this.totalTargetsToFind = 0;
        this.targetsFound = 0;
        this.timerEvent = null;
    }

    initGameVariables() {
        this.score = 0;
        this.timeLeft = CONFIG.GAME_DURATION_SECONDS;
        this.targets = [];
        this.totalTargetsToFind = 0;
        this.targetsFound = 0;
        if (this.timerEvent) {
            this.timerEvent.remove(false); // 前のタイマーを止める
        }
    }

    create() {
        this.initGameVariables();
        this.cameras.main.setBackgroundColor('#87b4c7'); // ゲーム中の背景色

        // --- UI要素の表示 (シーンの上部に表示) ---
        this.scoreText = this.add.text(20, 20, `スコア: ${this.score}`, CONFIG.TEXT_STYLE).setScrollFactor(0).setDepth(100);
        this.timerText = this.add.text(GAME_WIDTH - 20, 20, `時間: ${this.timeLeft}`, CONFIG.TEXT_STYLE).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
        this.targetInfoText = this.add.text(GAME_WIDTH / 2, 60, `タコ:0 / 貝:0`, CONFIG.TARGET_INFO_STYLE).setOrigin(0.5,0).setScrollFactor(0).setDepth(100);


        // --- 物理ワールド設定 ---
        // Matter.jsのワールド境界 (選別エリアより上のみ物理演算が働くように)
        this.matter.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT - CONFIG.SORT_AREA_HEIGHT, 32, true, true, false, true);
        // this.matter.world.setGravity(0, 0.8); // Y軸に少し重力

        // --- 選別エリアの描画 (物理的なセンサーも兼ねる) ---
        const sortAreaY = GAME_HEIGHT - CONFIG.SORT_AREA_HEIGHT;
        this.add.rectangle(0, sortAreaY, GAME_WIDTH, CONFIG.SORT_AREA_HEIGHT, 0x000000, 0.3)
            .setOrigin(0,0)
            .setDepth(1); // じゃこの下に表示
        this.add.text(GAME_WIDTH / 2, sortAreaY + CONFIG.SORT_AREA_HEIGHT / 2, '▼ ここにドラッグ ▼', {...CONFIG.TEXT_STYLE, fontSize: '20px', fill: '#444'})
            .setOrigin(0.5)
            .setDepth(2);

        // 選別エリアのセンサーボディ (Matter.js)
        this.sortAreaSensor = this.matter.add.rectangle(
            GAME_WIDTH / 2,
            sortAreaY + CONFIG.SORT_AREA_HEIGHT / 2,
            GAME_WIDTH,
            CONFIG.SORT_AREA_HEIGHT,
            {
                isSensor: true,
                isStatic: true,
                label: 'sortArea'
            }
        );

        // --- オブジェクトの生成 ---
        this.createTargets();
        this.createJako();
        this.updateTargetInfoText(); // 初期表示

        // --- 入力設定 (ドラッグ) ---
        this.input.on('dragstart', (pointer, gameObject) => {
            if (gameObject.getData('type') === CONFIG.IMG_JAKO) {
                gameObject.setCollisionCategory(0); // ドラッグ中は他のものと衝突しない (オプション)
                gameObject.setDepth(50); // ドラッグ中は最前面
            }
        });

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (gameObject.getData('type') === CONFIG.IMG_JAKO) {
                gameObject.setPosition(dragX, dragY);
            }
        });

        this.input.on('dragend', (pointer, gameObject, dropped) => {
            if (gameObject.getData('type') === CONFIG.IMG_JAKO) {
                gameObject.setCollisionCategory(1); // 衝突を元に戻す
                gameObject.setDepth(10);          // 描画順を戻す
                // 速度が残っている場合があるのでリセット
                gameObject.setVelocity(0,0);
                gameObject.setAngularVelocity(0);

                // 選別エリアに入ったかチェック (手動)
                // Matterの衝突検知でも良いが、ドラッグ終了時の方がシンプルかも
                if (gameObject.y > GAME_HEIGHT - CONFIG.SORT_AREA_HEIGHT - (gameObject.displayHeight/2)) {
                    this.sortJako(gameObject);
                }
            }
        });

        // --- 衝突検知設定 (Matter.js) ---
        // 今回はドラッグ終了時の手動判定で代用するが、本格的にはこちら
        /*
        this.matter.world.on('collisionstart', (event, bodyA, bodyB) => {
            const checkCollisionWithSortArea = (objBody, areaBody) => {
                if (areaBody.label === 'sortArea' && objBody.gameObject) {
                    const go = objBody.gameObject;
                    if (go.getData('type') === CONFIG.IMG_JAKO && !go.getData('sorted')) {
                        // this.sortJako(go); // ここで呼ぶとドラッグ中にも反応しすぎる可能性
                    }
                }
            };
            checkCollisionWithSortArea(bodyA, bodyB);
            checkCollisionWithSortArea(bodyB, bodyA);
        });
        */

        // --- ゲームタイマー開始 ---
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    createTargets() {
        this.targets = [];
        let currentTotalTargets = 0;

        // タコを配置
        for (let i = 0; i < CONFIG.NUM_TAKO; i++) {
            const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
            const y = Phaser.Math.Between(100, GAME_HEIGHT - CONFIG.SORT_AREA_HEIGHT - 150); // じゃこが上に乗るスペース
            const tako = this.matter.add.image(x, y, CONFIG.IMG_TAKO)
                .setScale(CONFIG.SCALE_TAKO)
                .setCircle(18 * CONFIG.SCALE_TAKO) // ボディ形状を調整
                .setBounce(0.2)
                .setFriction(0.7)
                .setDepth(5) // じゃこより少し奥
                .setStatic(true); // ターゲットは動かないようにする

            tako.setData('type', CONFIG.IMG_TAKO);
            tako.setData('found', false);
            tako.setInteractive({ useHandCursor: true });
            tako.on('pointerdown', () => this.onTargetClicked(tako));
            this.targets.push(tako);
            currentTotalTargets++;
        }

        // 貝を確率で配置
        if (Math.random() < CONFIG.CHANCE_KAI) {
            for (let i = 0; i < CONFIG.NUM_KAI_IF_APPEAR; i++) {
                const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
                const y = Phaser.Math.Between(100, GAME_HEIGHT - CONFIG.SORT_AREA_HEIGHT - 150);
                const kai = this.matter.add.image(x, y, CONFIG.IMG_KAI)
                    .setScale(CONFIG.SCALE_KAI)
                    .setCircle(16 * CONFIG.SCALE_KAI)
                    .setBounce(0.2)
                    .setFriction(0.7)
                    .setDepth(5)
                    .setStatic(true);

                kai.setData('type', CONFIG.IMG_KAI);
                kai.setData('found', false);
                kai.setInteractive({ useHandCursor: true });
                kai.on('pointerdown', () => this.onTargetClicked(kai));
                this.targets.push(kai);
                currentTotalTargets++;
            }
        }
        this.totalTargetsToFind = currentTotalTargets;
    }

    createJako() {
        // ターゲットの上にじゃこをばらまく
        for (let i = 0; i < CONFIG.NUM_JAKO; i++) {
            // X座標は広めに、Y座標は画面上半分〜中央あたりに初期配置
            const x = Phaser.Math.Between(30, GAME_WIDTH - 30);
            const y = Phaser.Math.Between(80, (GAME_HEIGHT - CONFIG.SORT_AREA_HEIGHT) * 0.6);

            const jako = this.matter.add.image(x, y, CONFIG.IMG_JAKO)
                .setScale(CONFIG.SCALE_JAKO)
                // ボディ形状を画像の見た目に合わせる (楕円や複数の矩形を組み合わせるのもアリ)
                // 簡単のため、少し小さめの矩形
                .setRectangle(35 * CONFIG.SCALE_JAKO, 18 * CONFIG.SCALE_JAKO)
                .setBounce(0.1)
                .setFriction(0.6)     // 摩擦
                .setDensity(0.001)    // 軽い方が扱いやすい
                .setAngle(Phaser.Math.Between(-45, 45)) // 初期角度
                .setDepth(10);        // ターゲットより手前

            jako.setData('type', CONFIG.IMG_JAKO);
            jako.setData('sorted', false);
            jako.setInteractive({ draggable: true, useHandCursor: true }); // ドラッグ可能に
        }
    }

    onTargetClicked(target) {
        if (target.getData('found')) return; // 発見済み

        target.setData('found', true);
        this.targetsFound++;

        if (target.getData('type') === CONFIG.IMG_TAKO) {
            this.score += CONFIG.SCORE_TAKO;
        } else if (target.getData('type') === CONFIG.IMG_KAI) {
            this.score += CONFIG.SCORE_KAI;
        }
        this.scoreText.setText(`スコア: ${this.score}`);
        this.updateTargetInfoText();

        // 発見エフェクト
        target.setTint(0x33ff33); // 緑色に
        this.tweens.add({
            targets: target,
            scale: target.scale * 1.3,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                 target.clearTint();
                 target.setAlpha(0.6); // 少し半透明にして発見済みを示す
            }
        });

        if (this.targetsFound >= this.totalTargetsToFind) {
            this.gameOver("コンプリート！");
        }
    }

    sortJako(jako) {
        if (jako.getData('sorted')) return;

        jako.setData('sorted', true);
        this.score += CONFIG.SCORE_JAKO_SORTED; // じゃこ選別スコア
        this.scoreText.setText(`スコア: ${this.score}`);

        // じゃこを消すアニメーション
        this.tweens.add({
            targets: jako,
            alpha: 0,
            scale: jako.scale * 0.5,
            angle: jako.angle + Phaser.Math.Between(-90, 90),
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.matter.world.remove(jako); // Matterワールドから削除
                jako.destroy();                 // Phaserオブジェクトを破棄
            }
        });
    }


    updateTimer() {
        if (this.timeLeft > 0) {
            this.timeLeft--;
            this.timerText.setText(`時間: ${this.timeLeft}`);
        } else {
            this.gameOver("時間切れ！");
        }
    }
    
    updateTargetInfoText() {
        let takoLeft = 0;
        let kaiLeft = 0;
        this.targets.forEach(target => {
            if (!target.getData('found')) {
                if (target.getData('type') === CONFIG.IMG_TAKO) takoLeft++;
                else if (target.getData('type') === CONFIG.IMG_KAI) kaiLeft++;
            }
        });
        this.targetInfoText.setText(`タコ:${takoLeft} / 貝:${kaiLeft}`);
    }


    gameOver(message) {
        if (this.timerEvent) {
            this.timerEvent.remove(false);
        }
        this.matter.world.pause(); // 物理演算を停止
        this.input.enabled = false; // 入力を無効化

        // 結果表示用のオーバーレイ
        const graphics = this.add.graphics({ fillStyle: { color: 0x000000, alpha: 0.7 } })
            .fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
            .setDepth(199)
            .setScrollFactor(0);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, message, CONFIG.RESULT_TEXT_STYLE)
            .setOrigin(0.5).setDepth(200).setScrollFactor(0);
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `最終スコア: ${this.score}`, CONFIG.RESULT_TEXT_STYLE)
            .setOrigin(0.5).setDepth(200).setScrollFactor(0);

        const restartButton = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, 'もう一度遊ぶ', CONFIG.RESULT_TEXT_STYLE)
            .setOrigin(0.5)
            .setPadding(15)
            .setStyle({ backgroundColor: '#1e6091', fill: '#ffffff'})
            .setInteractive({ useHandCursor: true })
            .setDepth(200)
            .setScrollFactor(0);

        restartButton.on('pointerdown', () => {
            this.input.enabled = true;
            this.matter.world.resume();
            // GameSceneを再起動するのではなく、StartSceneに戻ってからGameSceneを起動する方がクリーン
            this.scene.stop('GameScene');
            this.scene.start('StartScene'); 
        });
    }

    update(time, delta) {
        // 毎フレームの処理 (必要に応じて)
    }
}


// --- Phaserゲーム設定 ---
const phaserConfig = {
    type: Phaser.AUTO, // WebGLを優先、ダメならCanvas
    parent: 'game-container', // HTML内の描画先divのID
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    scale: {
        mode: Phaser.Scale.FIT, // アスペクト比を保ってコンテナにフィット
        autoCenter: Phaser.Scale.CENTER_BOTH // 中央揃え
    },
    physics: {
        default: 'matter',
        matter: {
            debug: false, // trueにすると物理ボディの枠線などが見える
            gravity: { y: 0.3 }, // 少しだけ重力をかけて自然に落ちるように
            enableSleeping: true // 静止したオブジェクトの計算をスキップしてパフォーマンス向上
        }
    },
    scene: [PreloadScene, StartScene, GameScene] // シーンの登録
};

// ゲーム開始
window.onload = () => {
    gameInstance = new Phaser.Game(phaserConfig);
};
