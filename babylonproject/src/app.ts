import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";

import {
    Engine,
    Scene,
    Vector3,
    Mesh,
    Color3,
    Color4,
    GlowLayer,
    PointLight,
    FreeCamera,
    PostProcess,
    Effect,
    Matrix,
    MeshBuilder,
    Quaternion,
    EngineFactory,
    StandardMaterial, HemisphericLight
} from "@babylonjs/core";
import { PlayerInput } from "./inputController";
import { PlayerSphere } from "./characterController";
import { Hud } from "./ui";
import { AdvancedDynamicTexture, StackPanel, Button, TextBlock, Rectangle, Control, Image } from "@babylonjs/gui";
import { Environment } from "./environment";

enum State{

    START,//includes reg/login, lobby,
    PREGAME, //previously CUTSCENE includes: _matchfound/_ready conditions to goto GAME
    GAME,
    OVER} //previously LOSE, includes frontend:rematch/find match/return to lobby; Backend: update objects etc.

class App {
    // General Entire Application
    private _scene: Scene;
    private _canvas: HTMLCanvasElement;
    private _engine: Engine;
    public assets;
    private _input: PlayerInput;
    private _player: PlayerSphere;
    private _ui: Hud;
    private _environment;
//     //Sounds
//     // public sfx: Sound;
//     public game: Sound;
//     public end: Sound;
    private _state: number = 0;
    private _gamescene: Scene;
    private _preGamescene: Scene;
    private _transition: boolean = false;
//
    constructor() {
        this._canvas = this._createCanvas();

        // initialize babylon scene and engine
        this._init();
    }
//
    private async _init(): Promise<void> {
        this._engine = (await EngineFactory.CreateAsync(this._canvas, undefined)) as Engine;
        this._scene = new Scene(this._engine);

        //**for development: make inspector visible/invisible
        window.addEventListener("keydown", (ev) => {
            //Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (this._scene.debugLayer.isVisible()) {
                    this._scene.debugLayer.hide();
                } else {
                    this._scene.debugLayer.show();
                }
            }
        });
        await this._main();
    }
//
    private async _main(): Promise<void> {
        //state switching
        await this._goToStart();

        // Register a render loop to repeatedly render the scene
        this._engine.runRenderLoop(() => {
            switch (this._state) {
                case State.START:
                    this._scene.render();
                    break;
                case State.PREGAME:
                    this._scene.render();
                    break;
                case State.GAME:
                    if (!this._player.win) {
                        this._goToLose();
                        this._ui.stopTimer();
                    }
                    if (this._ui.quit) {
                        this._goToStart();
                        this._ui.quit = false;
                    }
                    this._scene.render();
                    break;
                case State.OVER:
                    this._scene.render();
                    break;
                default: break;
            }
        });
        //resize if the screen is resized/rotated
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
    }

    private _createCanvas(): HTMLCanvasElement {

        //Commented out for development
        document.documentElement.style["overflow"] = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.documentElement.style.width = "100%";
        document.documentElement.style.height = "100%";
        document.documentElement.style.margin = "0";
        document.documentElement.style.padding = "0";
        document.body.style.overflow = "hidden";
        document.body.style.width = "100%";
        document.body.style.height = "100%";
        document.body.style.margin = "0";
        document.body.style.padding = "0";

        //create the canvas html element and attach it to the webpage
        this._canvas = document.createElement("canvas");
        this._canvas.style.width = "100%";
        this._canvas.style.height = "100%";
        this._canvas.id = "gameCanvas";
        document.body.appendChild(this._canvas);

        return this._canvas;
    }

    private async _goToStart() {
        this._engine.displayLoadingUI(); //make sure to wait for start to load

        //--SCENE SETUP--
        //dont detect any inputs from this ui while the game is loading
        this._scene.detachControl();
        let scene = new Scene(this._engine);
        scene.clearColor = new Color4(0, 0, 0, 1);
        //creates and positions a free camera
        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        camera.setTarget(Vector3.Zero()); //targets the camera to scene origin
        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), this._scene);
        var sphere: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, this._scene);

        //--SOUNDS--

        //--GUI--
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 720;

        // background image
        const imageRect = new Rectangle("titleContainer");
        imageRect.width = 0.8;
        imageRect.thickness = 0;
        guiMenu.addControl(imageRect);

        const startBtn = Button.CreateSimpleButton("start", "START");
        startBtn.fontFamily = "Viga";
        startBtn.width = 0.2
        startBtn.height = "40px";
        startBtn.color = "white";
        startBtn.top = "-14px";
        startBtn.thickness = 0;
        startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        imageRect.addControl(startBtn);
        const preGameBtn = Button.CreateSimpleButton("pregame", "PREGAME");
        preGameBtn.fontFamily = "Viga";
        preGameBtn.width = 0.2
        preGameBtn.height = "40px";
        preGameBtn.color = "white";
        preGameBtn.top = "-14px";
        preGameBtn.thickness = 0;
        preGameBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        imageRect.addControl(preGameBtn);
        const gameBtn = Button.CreateSimpleButton("game", "GAME");
        gameBtn.fontFamily = "Viga";
        gameBtn.width = 0.2
        gameBtn.height = "40px";
        gameBtn.color = "white";
        gameBtn.top = "-14px";
        gameBtn.thickness = 0;
        gameBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        imageRect.addControl(gameBtn);
        const overBtn = Button.CreateSimpleButton("over", "OVER");
        overBtn.fontFamily = "Viga";
        overBtn.width = 0.2
        overBtn.height = "40px";
        overBtn.color = "white";
        overBtn.top = "-14px";
        overBtn.thickness = 0;
        overBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        imageRect.addControl(overBtn);

        //set up transition effect : modified version of https://www.babylonjs-playground.com/#2FGYE8#0
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

        let fadeLevel = 1.0;
        this._transition = false;
        scene.registerBeforeRender(() => {
            if (this._transition) {
                fadeLevel -= .05;
                if(fadeLevel <= 0){
                    this._goToPreGame();
                    this._transition = false;
                }
            }
        })

        //this handles interactions with the start button attached to the scene
        startBtn.onPointerDownObservable.add(() => {
            //fade screen
            const postProcess = new PostProcess("Fade", "fade", ["fadeLevel"], null, 1.0, camera);
            postProcess.onApply = (effect) => {
                effect.setFloat("fadeLevel", fadeLevel);
            };
            this._transition = true;
            this._state = State.START;

            scene.detachControl(); //observables disabled
        });
        preGameBtn.onPointerDownObservable.add(() => {
            this._transition = true;
            this._state = State.PREGAME;

            scene.detachControl(); //observables disabled
        });
        gameBtn.onPointerDownObservable.add(() => {
            this._transition = true;
            this._state = State.GAME;

            scene.detachControl(); //observables disabled
        });
        overBtn.onPointerDownObservable.add(() => {
            //fade screen
            const postProcess = new PostProcess("Fade", "fade", ["fadeLevel"], null, 1.0, camera);
            postProcess.onApply = (effect) => {
                effect.setFloat("fadeLevel", fadeLevel);
            };
            this._transition = true;
            this._state = State.OVER;

            scene.detachControl(); //observables disabled
        });

        //--SCENE FINISHED LOADING--
        await scene.whenReadyAsync();
        this._engine.hideLoadingUI(); //when the scene is ready, hide loading
        //lastly set the current state to the start state and set the scene to the start scene
        this._scene.dispose();
        this._scene = scene;
        this._state = State.START;
    }
    private async _goToPreGame() {
        this._engine.displayLoadingUI();
        //--SETUP SCENE--
        //dont detect any inputs from this ui while the game is loading
        this._scene.detachControl();
        this._preGamescene = new Scene(this._engine);
        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), this._preGamescene);
        camera.setTarget(Vector3.Zero());
        this._preGamescene.clearColor = new Color4(0, 0, 0, 1);
        //--WHEN SCENE IS FINISHED LOADING--
        await this._preGamescene.whenReadyAsync();
        this._scene.dispose();
        this._state = State.PREGAME;
        this._scene = this._preGamescene;

        //--START LOADING AND SETTING UP THE GAME DURING THIS SCENE--
        var finishedLoading = false;
        await this._setUpGame().then(res =>{
            finishedLoading = true;
            this._goToGame();

        });
    }
    private async _setUpGame() { //async
        //--CREATE SCENE--
        let scene = new Scene(this._engine);
        this._gamescene = scene;

        //--SOUNDS--
        // this._loadSounds(scene);

        //--CREATE ENVIRONMENT--
        const environment = new Environment(scene);
        this._environment = environment;
        //Load environment and character assets
        await this._environment.load(); //environment
        await this._loadCharacterAssets(scene); //character
    }


    private async _goToGame(): Promise<void> {

        //--SETUP SCENE--
        this._scene.detachControl();
        let scene = this._gamescene;

        //--GUI--
        const ui = new Hud(scene);
        this._ui = ui;
        //dont detect any inputs from this ui while the game is loading
        scene.detachControl();

        //IBL (image based lighting) - to give scene an ambient light
        // const envHdri = CubeTexture.CreateFromPrefilteredData("textures/envtext.env", scene);
        // envHdri.name = "env";
        // envHdri.gammaSpace = false;
        // scene.environmentTexture = envHdri;
        // scene.environmentIntensity = 0.04;

        //--INPUT--
        this._input = new PlayerInput(scene, this._ui); //detect keyboard/mobile inputs

        //Initializes the game's loop
        await this._initializeGameAsync(scene); //handles scene related updates & setting up meshes in scene

        //--WHEN SCENE FINISHED LOADING--
        await scene.whenReadyAsync();

        //Actions to complete once the game loop is setup
        //This 'outer' is our character.
        scene.getMeshByName("outer").position = scene.getMeshByName("sphere").getAbsolutePosition(); //move the player to the start position
        this._ui.startTimer();

        //get rid of start scene, switch to gamescene and change states
        this._scene.dispose();
        this._state = State.GAME;
        this._scene = scene;
        this._engine.hideLoadingUI();
        //the game is ready, attach control back
        this._scene.attachControl();

        //--SOUNDS--
    }
//
    private _showWin(): void {

        this._player.onRun.clear();

        const winUI = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        winUI.idealHeight = 720;

        const rect = new Rectangle();
        rect.thickness = 0;
        rect.background = "black";
        rect.alpha = 0.4;
        rect.width = 0.4;
        winUI.addControl(rect);

        const mainMenu = Button.CreateSimpleButton("mainmenu", "RETURN");
        mainMenu.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        mainMenu.fontFamily = "Viga";
        mainMenu.width = 0.2
        mainMenu.height = "40px";
        mainMenu.color = "white";
        winUI.addControl(mainMenu);

        mainMenu.onPointerDownObservable.add(() => {
            //mainMenu callbacks

            this._ui.transition = true;
            this._ui.quitSfx.play();
        })
    }

    private async _goToLose(): Promise<void> {
        this._engine.displayLoadingUI();

        //--SCENE SETUP--
        this._scene.detachControl();
        let scene = new Scene(this._engine);
        scene.clearColor = new Color4(0, 0, 0, 1);
        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        camera.setTarget(Vector3.Zero());

        //--SOUNDS--

        //--GUI--
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 720;

        const panel = new StackPanel();
        guiMenu.addControl(panel);

        const mainBtn = Button.CreateSimpleButton("mainmenu", "MAIN MENU");
        mainBtn.width = 0.2;
        mainBtn.height = "40px";
        mainBtn.color = "white";
        panel.addControl(mainBtn);

        //set up transition effect : modified version of https://www.babylonjs-playground.com/#2FGYE8#0
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

        let fadeLevel = 1.0;
        this._transition = false;
        scene.registerBeforeRender(() => {
            if (this._transition) {
                fadeLevel -= .05;
                if(fadeLevel <= 0){
                    //goToLose is a trail to goToStart
                    this._goToStart();
                    this._transition = false;
                }
            }
        })

        //this handles interactions with the start button attached to the scene
        mainBtn.onPointerUpObservable.add(() => {
            //todo: add fade transition & selection sfx
            scene.detachControl();
            guiMenu.dispose();

            this._transition = true;
            // sfx.play();

        });

        //--SCENE FINISHED LOADING--
        await scene.whenReadyAsync();
        this._engine.hideLoadingUI(); //when the scene is ready, hide loading
        //lastly set the current state to the lose state and set the scene to the lose scene
        this._scene.dispose();
        this._scene = scene;
        this._state = State.OVER;
    }
//
    //load the character model
    private async _loadCharacterAssets(scene): Promise<any> {

        async function loadCharacter() {
            //collision mesh
            const outer = MeshBuilder.CreateBox("outer", { width: 2, depth: 1, height: 3 }, scene);
            outer.isVisible = false;
            outer.isPickable = false;
            outer.checkCollisions = true;

            //move origin of box collider to the bottom of the mesh (to match player mesh)
            outer.bakeTransformIntoVertices(Matrix.Translation(0, 1.5, 0))
            //for collisions
            outer.ellipsoid = new Vector3(1, 1.5, 1);
            outer.ellipsoidOffset = new Vector3(0, 1.5, 0);

            outer.rotationQuaternion = new Quaternion(0, 1, 0, 0); // rotate the player mesh 180 since we want to see the back of the player

            //--IMPORTING MESH--
            const playerSphere =  MeshBuilder.CreateSphere("playerSphere", {segments: 32, diameter: 3}, scene);
            const material = new StandardMaterial("material", scene);
            material.emissiveColor = new Color3(1, .67, .44);
            material.specularColor = new Color3(0, 0, 1);
            // material.diffuseTexture = new Texture("./assets/textures.png", scene);
            const glowLayer = new GlowLayer('glow', scene);
            glowLayer.addIncludedOnlyMesh(playerSphere);
            glowLayer.intensity = 1.0;
            glowLayer.blurKernelSize = 64;
            glowLayer.customEmissiveColorSelector = (playerSphere, subMesh, material, result) => {
                result.set(2, 1, 1, 1);
            };
            playerSphere.parent = outer;
            playerSphere.isPickable = false;

                //return the mesh and animations
                return {
                    mesh: outer as Mesh,
                }
        }

        return loadCharacter().then(assets => {
            this.assets = assets;
        });
    }
//
//     //init game
    private async _initializeGameAsync(scene): Promise<void> {

        //temp light for entire scene
        const lightTemp = new HemisphericLight('lightTemp', new Vector3(0,1,0), this._scene)

        // scene.ambientColor = new Color3(0.34509803921568627, 0.5568627450980392, 0.8352941176470589);
        // scene.clearColor = new Color4(0.01568627450980392, 0.01568627450980392, 0.20392156862745098);

        // const shadowLight = new PointLight("sparklight", new Vector3(0, 0, 0), scene);
        // shadowLight.diffuse = new Color3(0.08627450980392157, 0.10980392156862745, 0.15294117647058825);
        // shadowLight.intensity = 35;
        // shadowLight.radius = 1;
        // const shadowGenerator = new ShadowGenerator(1024, shadowLight);
        // shadowGenerator.darkness = 0.4;

        //Create the player
        this._player = new PlayerSphere(this.assets, scene, this._input);
        lightTemp.parent = this._player;

        const camera = this._player.activatePlayerCamera();
        //TODO: need to ensure activate player camera is attaching to player.
        //set up collision chekcs
        this._environment.checkBoxObs(this._player);

        //--Transition post process--
        scene.registerBeforeRender(() => {
            if (this._ui.transition) {
                this._ui.fadeLevel -= .05;

                //once the fade transition has complete, switch scenes
                if(this._ui.fadeLevel <= 0) {
                    this._ui.quit = true;
                    this._ui.transition = false;
                }
            }
        })

        //--GAME LOOP--
        scene.onBeforeRenderObservable.add(() => {

            //--This is where we set up checks for win/lose.

            if (!this._ui.gamePaused) {
                this._ui.updateHud();
            }
        })
        //I can take this out in wallobs or here.
        //TODO: **NOTE**  glow layer was added here in tutorial foreach lantern. it may need to be done during rendering.--
        // const gl = new GlowLayer("glow", scene);
        // gl.intensity = 0.4;
        // this._environment._boxObs.forEach(box => {
        //     gl.addIncludedOnlyMesh(box.mesh);
        // });
    }
}
new App();