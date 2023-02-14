import { Scene, ActionManager, ExecuteCodeAction, Observer, Scalar } from '@babylonjs/core';
import { Hud } from './ui';

export class PlayerInput {

    public inputMap: any;
    private _scene: Scene;
    public horizontal: number = 0;
    public vertical: number = 0;
    public horizontalAxis: number = 0;
    public verticalAxis: number = 0;

    //jumping and dashing
    public spaceKeyDown: boolean = false;
    private _ui: Hud;

    constructor(scene: Scene, ui: Hud) {

        this._scene = scene;
        this._ui = ui;

        this._scene.actionManager = new ActionManager(this._scene);

        this.inputMap = {};
        this._scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));
        this._scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));

        //add to the scene an observable that calls updateFromKeyboard before rendering
        scene.onBeforeRenderObservable.add(() => {
            this._updateFromKeyboard();
        });
    }

    // Keyboard controls & Mobile controls
    //handles what is done when keys are pressed or if on mobile, when buttons are pressed
    private _updateFromKeyboard(): void {

        //left - right movement
        if ((this.inputMap["ArrowLeft"]) && !this._ui.gamePaused) {
            //THE END NUMBER MAY NEED TO BE INCREASED FOR SPEED
            this.horizontal = Scalar.Lerp(this.horizontal, -10, 0.2);
            this.horizontalAxis = -1;

        } else if ((this.inputMap["ArrowRight"]) && !this._ui.gamePaused) {
            this.horizontal = Scalar.Lerp(this.horizontal, 10, 0.2);
            this.horizontalAxis = 1;
        }
        else {
            this.horizontal = 0;
            this.horizontalAxis = 0;
        }
        //WE WILL HAVE TO USE OUR MOTION FUNCTIONALITY FOR SPACEPRESSED
        if ((this.inputMap[" "]) && !this._ui.gamePaused) {
            this.spaceKeyDown = true;
        } else {
            this.spaceKeyDown = false;
        }
    }
}