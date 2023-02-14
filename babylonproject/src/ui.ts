import { TextBlock, StackPanel, AdvancedDynamicTexture, Image, Button, Rectangle, Control, Grid } from "@babylonjs/gui";
import { Scene, Sound, ParticleSystem, PostProcess, Effect, SceneSerializer } from "@babylonjs/core";

export class Hud {
    //TODO: Make screens on babylon.js GUI editor
    private _scene: Scene;

    //Game Timer
    //MAY OR MAY NOT NEED BUT I THINK WE WILL, THIS IS ACTUAL TIME
    public time: number; //keep track to signal end game REAL TIME
    private _prevTime: number = 0;
    private _clockTime: TextBlock = null; //GAME TIMER
    private _startTime: number;
    private _stopTimer: boolean;
    private _sString = "00";
    private _mString = 11;
    // private _lanternCnt: TextBlock;

    //Pause toggle
    //THIS MAY BE NEEDED FOR TRANSITION INTO AND OUT OF GAME.
    public gamePaused: boolean;

    //Quit game
    //If app closes or players presses quit.
    public quit: boolean;
    public transition: boolean = false;

    //UI Elements
    //INPUT ALL OF OUR ELEMENTS HERE TO CREATE FUNCTIONALITY.
    public pauseBtn: Button;
    public fadeLevel: number;
    private _playerUI;
    private _pauseMenu;
    private _controls;


    //Sounds
    //PROBABLY WANT TO HAVE A MUTE.
    public quitSfx: Sound;
    private _sfx: Sound;
    private _pause: Sound;
    private _sparkWarningSfx: Sound;

    constructor(scene: Scene) {

        this._scene = scene;
        //TODO: WE CAN USE THIS PAUSE BTN FOR TESTING.
        const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this._playerUI = playerUI;
        this._playerUI.idealHeight = 720;
        const pauseBtn = Button.CreateImageOnlyButton("pauseBtn", "./sprites/pauseBtn.png");
        pauseBtn.width = "48px";
        pauseBtn.height = "86px";
        pauseBtn.thickness = 0;
        pauseBtn.verticalAlignment = 0;
        pauseBtn.horizontalAlignment = 1;
        pauseBtn.top = "-16px";
        playerUI.addControl(pauseBtn);
        pauseBtn.zIndex = 10;
        this.pauseBtn = pauseBtn;
        //when the button is down, make pause menu visable and add control to it
        pauseBtn.onPointerDownObservable.add(() => {
            this._pauseMenu.isVisible = true;
            playerUI.addControl(this._pauseMenu);
            this.pauseBtn.isHitTestVisible = false;
        });

        //could implement tiny hint menu but really who needs it...

        //THESE MENUS HE IS LOADING HERE ARE MADE BELOW.
        this._createPauseMenu();
        this._createControlsMenu();
        this._loadSounds(scene);

    }
    public updateHud(): void {
        //THIS LOOKS LIKE IN GAME HUD UPDATE TO TRACK FROM WHEN THE GAME STARTS TO GET THE CURRENT SECONDS
        //STOP TIMER IS BOOL
        if (!this._stopTimer && this._startTime != null) {
            let curTime = Math.floor((new Date().getTime() - this._startTime) / 1000) + this._prevTime; // divide by 1000 to get seconds

            this.time = curTime; //keeps track of the total time elapsed in seconds
            this._clockTime.text = this._formatTime(curTime);
        }
    }
    //---- Game Timer ----
    public startTimer(): void {
        this._startTime = new Date().getTime();
        this._stopTimer = false;
    }
    public stopTimer(): void {
        this._stopTimer = true;
    }
    private _formatTime(time: number): string {

        return "";
    }

    //---- Pause Menu Popup ----
    private _createPauseMenu(): void {
        //WE COULD PROBABLY USE THIS SORT OF FUNCTIONALITY AS A LOBBY MENU..I.E. A STATE WHERE THE GAME IS NOT GOING
        this.gamePaused = false;

        const pauseMenu = new Rectangle();
        pauseMenu.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        pauseMenu.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        pauseMenu.height = 0.8;
        pauseMenu.width = 0.5;
        pauseMenu.thickness = 0;
        pauseMenu.isVisible = false;
        //stack panel for the buttons
        const stackPanel = new StackPanel();
        stackPanel.width = .83;
        pauseMenu.addControl(stackPanel);

        const resumeBtn = Button.CreateSimpleButton("resume", "RESUME");
        resumeBtn.width = 0.18;
        resumeBtn.height = "44px";
        resumeBtn.color = "white";
        resumeBtn.fontFamily = "Viga";
        resumeBtn.paddingBottom = "14px";
        resumeBtn.cornerRadius = 14;
        resumeBtn.fontSize = "12px";
        resumeBtn.textBlock.resizeToFit = true;
        resumeBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        resumeBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        stackPanel.addControl(resumeBtn);

        this._pauseMenu = pauseMenu;

        //when the button is down, make menu invisible and remove control of the menu
        resumeBtn.onPointerDownObservable.add(() => {
            //THIS COULD POSSIBLY BE TO FIND MATCH
            this._pauseMenu.isVisible = false;
            this._playerUI.removeControl(pauseMenu);
            this.pauseBtn.isHitTestVisible = true;

            //game unpaused, our time is now reset
            this.gamePaused = false;
            this._startTime = new Date().getTime();
        });

        const quitBtn = Button.CreateSimpleButton("quit", "QUIT");
        quitBtn.width = 0.18;
        quitBtn.height = "44px";
        quitBtn.color = "white";
        quitBtn.fontFamily = "Viga";
        quitBtn.paddingBottom = "12px";
        quitBtn.cornerRadius = 14;
        quitBtn.fontSize = "12px";
        resumeBtn.textBlock.resizeToFit = true;
        quitBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        quitBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        stackPanel.addControl(quitBtn);

        //set up transition effect
        Effect.RegisterShader("fade",
            "precision highp float;" +
            "varying vec2 vUV;" +
            "uniform sampler2D textureSampler; " +
            "uniform float fadeLevel; " +
            "void main(void){" +
            "vec4 baseColor = texture2D(textureSampler, vUV) * fadeLevel;" +
            "baseColor.a = 1.0;" +
            "gl_FragColor = baseColor;" +
            "}");
        this.fadeLevel = 1.0;

        quitBtn.onPointerDownObservable.add(() => {
            const postProcess = new PostProcess("Fade", "fade", ["fadeLevel"], null, 1.0, this._scene.getCameraByName("cam"));
            postProcess.onApply = (effect) => {
                effect.setFloat("fadeLevel", this.fadeLevel);
            };
            this.transition = true;

            //--SOUNDS--
            this.quitSfx.play();
            if(this._pause.isPlaying){
                this._pause.stop();
            }
        })
    }


    private _createControlsMenu(): void {

    }

    //THIS COULD BE NORMAL SOUNDS FOR BUTTONS PRESSED OR LOADING.
    private _loadSounds(scene: Scene): void {
    }
}