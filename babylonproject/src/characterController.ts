import {
    Scene,
    Vector3,
    Ray,
    TransformNode,
    Mesh,
    UniversalCamera,
    ExecuteCodeAction,
    ActionManager,
    Observable,
    Scalar,
    Quaternion,
} from "@babylonjs/core";
import { PlayerInput } from "./inputController";

//TODO: we have no reason to detect if player is 'grounded'
export class PlayerSphere extends TransformNode {
    public camera: UniversalCamera;
    public scene: Scene;
    private _input: PlayerInput;
    public mesh: Mesh; //outer collisionbox of Player
    // Sphere
    private _camRoot: TransformNode;
    private _yTilt: TransformNode;
//movement vars
    private _deltaTime: number = 0;
    private _h: number;
    private _v: number; // holds y axis
    private _moveDirection: Vector3 = new Vector3();
    private _inputAmt: number;
    //grav, ground detect, climbing
    private _gravity: Vector3 = new Vector3();
    private _climbing: boolean;
    private _forwardMotion: Vector3 = new Vector3(); //may have to change to Vector 3 to establish z variable.
    //constants
    PLAYER_SPEED

    private static readonly PLAYER_SPEED: number = 2;
    private static readonly CLIMB_FORCE: number = 1;//this will be set to a maximum, so we will climb until max is hit
    private static readonly MAX_CLIMB_FORCE: number = 4
    private static readonly GRAVITY: number = -1; //this can be set to our constant downward motion
    private static readonly MAX_GRAVITY: number = -4
    private static readonly FORWARD: number = .7;

    //Player
    // Sphere variables
    public win: boolean = true; //whether the game is won
    public lose: boolean = false; //if we hit the wall.
    public boxObHit: boolean = true;
    //misc sounds
    // private _resetSfx: Sound;
    // private _movingSfx: Sound;
    // private _climbingSfx: Sound;

    //observables
    public onRun = new Observable();

    //player stats
    public playerId: string;
    public playername: string;
    public playerwins: number;
    public playerlosses: number;
    public playerdraws: number;
    public playerwinrate: number;
    public playerrank: number;

    constructor(assets, scene: Scene, input?: PlayerInput) {
        super("PlayerSphere", scene);
        this.scene = scene;

        //set up sounds
        // this._loadSounds(this.scene);
        //camera
        this._setupPlayerCamera();
        this.mesh = assets.mesh;
        this.mesh.parent = this;


        //--COLLISIONS CONSTRUCTOR--
        this.mesh.actionManager = new ActionManager(this.scene);
        this.mesh.actionManager.registerAction( //we need to create a trigger and a param. this would have to be modifyied
            // to account for the z position of the player. for boxOb in boxObs...for boxOb.z == currentZ if boxOb not boxObHit, lose.
            new ExecuteCodeAction(
                {
                    trigger: ActionManager.OnIntersectionEnterTrigger,
                    parameter: this.scene.getMeshByName("boxOb")
                },
                () => {
                    if (!this.boxObHit) {
                        //Could do the box ob checks here maybe and instead of WIN we have LOSS.
                        this.lose = true;
                    }
                }
            )
        );
        this.mesh.actionManager.registerAction(
            new ExecuteCodeAction({
                    trigger: ActionManager.OnIntersectionEnterTrigger,
                    parameter: this.scene.getMeshByName("ground")
                },
                () => {
                    this.lose = true;
                }
            )
        );
        //--SOUNDS--
        //observable for when to play the walking sfx
        // this.onRun.add((play) => {
        //     if (play && !this._movingSfx.isPlaying) {
        //         this._movingSfx.play();
        //     } else if (!play && this._movingSfx.isPlaying) {
        //         this._movingSfx.stop();
        //         this._movingSfx.isPlaying = false;
        //     }
        // })
        this._input = input;
    }


    //--BOX OBSTACLE DETECTION--
    //this will be used to detect the box obstacle in front of the player to do 1) confirm they went through, 2)
    // cause an effect when the box is hit..
    private _boxObRaycast(): Vector3 {

        //defined which type of meshes should be pickable
        let predicate = function (mesh) {
            return mesh.isPickable && mesh.isEnabled() && mesh.name === 'boxOb';
        }


        let raycastOrigin = this.mesh.position.clone();//might need to y+.5 to center.
        let ray = new Ray(raycastOrigin, Vector3.Forward(), 3);

        console.log("scene", this.scene, "this.mesh", this.mesh)

        let pick = this.scene.pickWithRay(ray, predicate);
        pick.originMesh = this.mesh;
        console.log("before pick hit: (pick)", pick)

        if (pick.hit) { //we could maybe stop gravity right in front of box.
            console.log("test pick.hit true")
            return pick.pickedPoint;
            // TODO: will be used to say, ok if box is in front of us, bring the camera around and behind us very quick.
            //todo: like alpha, beta == 0.normalize(). camera z+++;
        }
    }

    private _boxObIntersects(): boolean {

        if (this._boxObRaycast() == this.mesh.position) {
            return true;
        }
    }
    //
    private _updateMotion(): void {
        this._deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;

        //apply downward and forward motion
        this._forwardMotion = this._gravity.addInPlace(Vector3.Forward().scale(this._deltaTime + PlayerSphere.FORWARD))
        this._gravity = this._gravity.addInPlace(Vector3.Up().scale(this._deltaTime * PlayerSphere.GRAVITY));
        // console.log('grav log', this._gravity)
        //limit the max forward motion
        if (this._forwardMotion.z > PlayerSphere.FORWARD) {
            this._forwardMotion.z = PlayerSphere.FORWARD;
        }

        //limit the speed of gravity to the negative of the jump power
        if (this._gravity.y < -PlayerSphere.CLIMB_FORCE) {
            this._gravity.y = -PlayerSphere.CLIMB_FORCE;
        }
        //space key detection
        if (this._input.spaceKeyDown) {
            this._climbing = true;
        } else{
            this._climbing = false;
        }
        // update our movement to account for climbing
        if (this._climbing) {
            this._gravity.y = PlayerSphere.CLIMB_FORCE;
        } else{
            this._gravity.y = PlayerSphere.GRAVITY;
        }
        this.mesh.moveWithCollisions(this._moveDirection.addInPlace(this._gravity));
        //this could be used for boundary enforcement
    }

    private _updateFromControls(): void {
        // Sphere controls to climb, and to left and right.
        this._deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;

        this._moveDirection = Vector3.Zero();
        this._h = this._input.horizontal; //right, x
        this._v = this._input.vertical; //up, y

        //--MOVEMENTS BASED ON CAMERA (as it rotates)--
        let up = this._camRoot.up; //changed from fwd to up
        let right = this._camRoot.right;
        let correctedVertical = up.scaleInPlace(this._v);
        let correctedHorizontal = right.scaleInPlace(this._h);

        //movement based off of camera's view
        let move = correctedHorizontal.addInPlace(correctedVertical);

        //clear y so that the character doesnt fly up, normalize for next step, taking into account whether we've DASHED or not
        this._moveDirection = new Vector3((move).normalize().x, 0, 0);

        //clamp the input value so that diagonal movement isn't twice as fast
        let inputMag = Math.abs(this._h) + Math.abs(this._v);
        if (inputMag < 0) {
            this._inputAmt = 0;
        } else if (inputMag > 1) {
            this._inputAmt = 1;
        } else {
            this._inputAmt = inputMag;
        }


        // climb feature
        if (this._input.spaceKeyDown && this._gravity.y < PlayerSphere.MAX_CLIMB_FORCE ) {
            // Increase climb force
            this._gravity.y += this._deltaTime * PlayerSphere.MAX_CLIMB_FORCE * 2;
            this._climbing = true;
        } else {
            // Fall feature
            if (this._gravity.y > PlayerSphere.MAX_GRAVITY) {
                // Increase gravity
                this._gravity.y += this._deltaTime * PlayerSphere.MAX_GRAVITY * 2;
                this._climbing = false;
            } else {
                // Max gravity reached
                this._gravity.y = PlayerSphere.MAX_GRAVITY;
                this._climbing = false;
            }
        }


    //final movement that takes into consideration the inputs
        if (!this._climbing){
            this._moveDirection = this._moveDirection.scaleInPlace(this._inputAmt * PlayerSphere.PLAYER_SPEED);
        } else {
            this._moveDirection = this._moveDirection.scaleInPlace(this._inputAmt * PlayerSphere.CLIMB_FORCE);
        }

        //might not need
        let input = new Vector3(this._input.horizontalAxis, this._input.verticalAxis, 0); //along which axis is the direction
        if (input.length() == 0) {//if there's no input detected, prevent rotation and keep PlayerSphere in same rotation
            return;
        }
        //rotation based on input & the camera angle
        let angle = Math.atan2(this._input.horizontalAxis, this._input.verticalAxis);
        angle += this._camRoot.rotation.y;
        let targ = Quaternion.FromEulerAngles(0, angle, 0);
        this.mesh.rotationQuaternion = Quaternion.Slerp(this.mesh.rotationQuaternion, targ, 10 * this._deltaTime);
    }
    //--GAME UPDATES--
    private _beforeRenderUpdate(): void {
        this._boxObIntersects();
        this._updateFromControls();
        this._updateMotion();
    }

    activatePlayerCamera(): UniversalCamera {
        this.scene.registerBeforeRender(() => {
            this._beforeRenderUpdate();
            this._updateCamera();
        });
        return this.camera;
    }

    private _updateCamera(): void {
        this._camRoot.setAbsolutePosition(new Vector3(
            this.mesh.position.x,
            this.mesh.position.y + 5,
            this.mesh.position.z - 15
        ));
        this.camera.position = Vector3.Lerp(this.camera.position, this._camRoot.position, 0.01);
        const sphere = this.mesh;
        const lookDirection = sphere.position.subtract(this.camera.position);
        lookDirection.normalize();
        const angleY = Math.atan2(lookDirection.x, lookDirection.z);
        const angleX = -1 * Math.atan2(lookDirection.y, Math.sqrt(lookDirection.x * lookDirection.x + lookDirection.z * lookDirection.z));
        const maxRotation = 30 * Math.PI / 180;
        this.camera.rotation.y = Scalar.Lerp(
            this.camera.rotation.y,
            Math.min(Math.max(angleY, -maxRotation), maxRotation),
            0.01
        );
        this.camera.rotation.x = Scalar.Lerp(
            this.camera.rotation.x,
            Math.min(Math.max(angleX, -maxRotation), maxRotation),
            0.10
        );
    }

    private _setupPlayerCamera(): UniversalCamera {
        this._camRoot = new TransformNode("root");

        //our actual camera that's pointing at our root's position
        this.camera = new UniversalCamera("playerCamera", new Vector3(0, 5, -7), this.scene);
        this.camera.fov = 1.35;

        this.camera.speed = 25;
        this.camera.inertia = 5;

        this.scene.activeCamera = this.camera;
        return this.camera;
    }
}

    // private _loadSounds(scene: Scene): void {
    //     //load sounds
    // }