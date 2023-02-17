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
    FramingBehavior,
    ArcRotateCamera,
    Scalar,
    Quaternion,
    FreeCamera,
    CannonJSPlugin,
    PhysicsImpostor,
    FollowCamera,
    ArcFollowCamera
} from "@babylonjs/core";
import { PlayerInput } from "./inputController";
window.CANNON = require( 'cannon' );


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
    private _grounded: boolean;
    private _climbing: boolean;
    private _forwardMotion: Vector3 = new Vector3(); //may have to change to Vector 3 to establish z variable.
    //constants
    PLAYER_SPEED

    private static readonly PLAYER_SPEED: number = .9;
    private static readonly CLIMB_FORCE: number = 1; //this will be set to a maximum, so we will climb until max is hit
    private static readonly GRAVITY: number = -2.8; //this can be set to our constant downward motion
    private static readonly FORWARD: number = 1;
    private static readonly DOWN_TILT: Vector3 = new Vector3(0.8290313946973066, 0, 0);
    private static readonly ORIGINAL_TILT: Vector3 = new Vector3(0.5934119456780721, 0, 0);

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
        this._loadSounds(this.scene);
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
        // THIS IS ANOTHER ACTION BEING REGISTERED, I.E. ANOTHER CONDITION WHICH CAN CAUSE A LOSS FOR US, WHICH IS
        // LEAVING PLAYZONE.
        // if Player
        // Sphere falls through "world", reset the position to the last safe grounded position
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

    //--GROUND DETECTION--
    //RAYCASTING IS THE MAIN WAY OF DETECTING THE GROUND BENEATH Player
    // Sphere...POSSIBLE WINDOW IN FRONT OF SPHERE.
    //THIS IS A BIG ONE AND MAY SOLVE OUR OBSTACLE PROBLEM
    //SET RAYCAST DIRECTLY IN FRONT OF SPHERE. MAYBE WE CAN CUSTOMIZE RAY SIZE LIKE 4X4.
    //Send raycast to the floor to detect if there are any hits with meshes below the character
    private _floorRaycast(offsetx: number, offsetz: number, raycastlen: number): Vector3 {
        //position the raycast from bottom center of mesh
        let raycastFloorPos = new Vector3(this.mesh.position.x + offsetx, this.mesh.position.y + 0.5, this.mesh.position.z + offsetz);
        let ray = new Ray(raycastFloorPos, Vector3.Up().scale(-1), raycastlen);

        //defined which type of meshes should be pickable
        let predicate = function (mesh) {
            return mesh.isPickable && mesh.isEnabled();
        }

        let raycast2 = new Vector3(this.mesh.position.x, this.mesh.position.y + 0.5, this.mesh.position.z - .25);
        let ray2 = new Ray(raycast2, Vector3.Forward().scale(1), 1.5);


        let pick = this.scene.pickWithRay(ray, predicate);
        let pick2 = this.scene.pickWithRay(ray2, predicate);

        if (pick.hit) { //we could maybe stop gravity right in front of box.
            return pick.pickedPoint;
        } else if (pick2.hit) {
            return pick2.pickedPoint;
        } else { //not grounded
            return Vector3.Zero();
        }
    }
    private _checkBoxOb(): boolean{

        let predicate = function (mesh) {
            return mesh.isPickable && mesh.isEnabled();
        }

        let raycast = new Vector3(this.mesh.position.x, this.mesh.position.y + 0.5, this.mesh.position.z + .25);
        let ray = new Ray(raycast, Vector3.Up().scale(-1), 1.5);
        let pick = this.scene.pickWithRay(ray, predicate);

        let raycast2 = new Vector3(this.mesh.position.x, this.mesh.position.y + 0.5, this.mesh.position.z - .25);
        let ray2 = new Ray(raycast2, Vector3.Forward().scale(1), 1.5);
        let pick2 = this.scene.pickWithRay(ray2, predicate);

        if (pick.hit && !pick.getNormal().equals(Vector3.Up())) {
            return true;

        }if (pick2.hit && !pick2.getNormal().equals(Vector3.Forward())) {
            if(pick2.pickedMesh.name.includes("boxOb")) {
                return true;
            }
        }
    }
    private _isGrounded(): boolean {//these two things could be used to detect if sphere is climbing to determine if gravity should be applied,
        //doing this could enable us to begin our downward falling reaction to be gradual after the climb and not constant.
        if (this._floorRaycast(0, 0, .6).equals(Vector3.Zero())) {
            return false;
        } else {
            return true;
        }
    }
    //
    private _updateGroundDetection(): void {
        this._deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;
        this._gravity = this._gravity.addInPlace(Vector3.Up().scale(this._deltaTime * PlayerSphere.GRAVITY));
        this._grounded = false;
        // if not grounded

        if (!this._isGrounded()) {
            //if the body isnt grounded, check if it's on a slope and was either falling or walking onto it
            if (this._gravity.y <= 0 && this._checkBoxOb()) {
                console.log("ping")
                this._forwardMotion.z = 0;
                this._gravity.y = 0;
                this._grounded = true;
            } else {
                //keep applying gravity
                this._forwardMotion = this._gravity.addInPlace(Vector3.Forward().scale(this._deltaTime + PlayerSphere.FORWARD))
                this._gravity = this._gravity.addInPlace(Vector3.Up().scale(this._deltaTime * PlayerSphere.GRAVITY));
                console.log('grav log', this._gravity)
                this._grounded = false;
            }
        }
        //limit the max forward motion
        if (this._forwardMotion.z > PlayerSphere.FORWARD) {
            this._forwardMotion.z = PlayerSphere.FORWARD;
        }

        //limit the speed of gravity to the negative of the jump power
        if (this._gravity.y < -PlayerSphere.CLIMB_FORCE) {
            this._gravity.y = -PlayerSphere.CLIMB_FORCE;
        }

        if (this._gravity.y < 0 && this._climbing) {
            this._climbing = true;
        }

        //update our movement to account for climbing
        this.mesh.moveWithCollisions(this._moveDirection.addInPlace(this._gravity));
        if (this._climbing) {
            this._gravity.y = 0;
            this._climbing = false;
        }
        //space key detection
        if (this._input.spaceKeyDown) {
            this._gravity.y = PlayerSphere.CLIMB_FORCE;
        }
    }

    private _updateFromControls(): void {
        //we're going to set up all the Player
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
        //final movement that takes into consideration the inputs
        this._moveDirection = this._moveDirection.scaleInPlace(this._inputAmt * PlayerSphere.PLAYER_SPEED);

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

    // private _hasBoxHit(): boolean { //dont think i need ray cast but what i can do with this instead of checking all
    //     // collisions is do a has box hit to detect our box and do something with it like:
    //     //light it up, set it's as a position check for win/lose or something
    //     // if (this._floorRaycast(0, 0, 99).equals(Vector3.Zero())) {
    //     //     return false;
    //     // } else {
    //     //     return true;
    //     // }
    // }
    //--GAME UPDATES--
    private _beforeRenderUpdate(): void {
        this._updateFromControls();
        this._updateGroundDetection();
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
        this.camera.fov = 2;

        this.camera.speed = 25;
        this.camera.inertia = 5;

        this.scene.activeCamera = this.camera;
        return this.camera;
    }
    private _loadSounds(scene: Scene): void {
        //load sounds
    }
}