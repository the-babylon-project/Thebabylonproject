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
    FramingBehavior, ArcRotateCamera, Scalar, Quaternion, FreeCamera
} from "@babylonjs/core";
import { PlayerInput } from "./inputController";

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
    private _forwardMotion: number; //may have to change to Vector 3 to establish z variable.
    //constants
    PLAYER_SPEED

    private static readonly PLAYER_SPEED: number = 0.45;
    private static readonly CLIMB_FORCE: number = 2; //this will be set to a maximum, so we will climb until max is hit
    private static readonly GRAVITY: number = -2.8; //this can be set to our constant downward motion
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
        //THIS IS ANOTHER Player
        // Sphere DEFINED ACTION TRIGGER FOR SOUNDS, THIS COULD BE FOR MOVEMENT.
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
        //LAST CONSTRUCTORS BEING INITIATED.

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

        let pick = this.scene.pickWithRay(ray, predicate);

        if (pick.hit) { //grounded
            return pick.pickedPoint;
        } else { //not grounded
            return Vector3.Zero();
        }
    }

    private _isClimbing(): boolean {//these two things could be used to detect if sphere is climbing to determine if gravity should be applied,
        //doing this could enable us to begin our downward falling reaction to be gradual after the climb and not constant.
        if (this._floorRaycast(0, 0, .6).equals(Vector3.Zero())) {
            return false;
        } else {
            return true;
        }
    }

    private _updateGroundDetection(): void {
        this._deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;
        this._gravity = this._gravity.addInPlace(Vector3.Up().scale(this._deltaTime * PlayerSphere.GRAVITY));
        this._grounded = false;
        // if not grounded
        if (!this._isClimbing()) {
            if (this._gravity.y >= 0) {
                this._gravity.y = -2.8;
                this._grounded = true;
            } else {
                this._gravity = this._gravity.addInPlace(Vector3.Up().scale(this._deltaTime * PlayerSphere.GRAVITY));
                this._grounded = false;
            }
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
        if (this._isClimbing()) {
            this._gravity.y = 0;
            this._climbing = true;
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
        if (input.length() == 0) {//if there's no input detected, prevent rotation and keep Player
            // Sphere in same rotation
            return;
        }

        //rotation based on input & the camera angle
        let angle = Math.atan2(this._input.horizontalAxis, this._input.verticalAxis);
        angle += this._camRoot.rotation.y;
        let targ = Quaternion.FromEulerAngles(0, angle, 0);
        this.mesh.rotationQuaternion = Quaternion.Slerp(this.mesh.rotationQuaternion, targ, 10 * this._deltaTime);
    }

    private _hasBoxHit(): boolean {
        if (this._floorRaycast(0, 0, 99).equals(Vector3.Zero())) {
            return false;
        } else {
            return true;
        }
    }
    //--GAME UPDATES--
    private _beforeRenderUpdate(): void {
        this._updateFromControls();
        this._updateGroundDetection();
    }

    public activatePlayerCamera(): UniversalCamera {
        this.scene.registerBeforeRender(() => {
            this._beforeRenderUpdate();
            this._updateCamera();
        });
        return this.camera;
    }

    private _updateCamera(): void {
        if (this._camRoot.position.x < -25) {
            this._camRoot.position.x = -25;
        } else if (this._camRoot.position.x > 25) {
            this._camRoot.position.x = 25;
        }
    }

    private _setupPlayerCamera(): UniversalCamera {
        // Set up camera nodes
        this._camRoot = new TransformNode("root");
        this._camRoot.position = new Vector3(0, 52, -55); //initialized at (0,0,0)
        //to face the player from behind (180 degrees)
        this._camRoot.rotation = new Vector3(0, Math.PI, 0);
        this.camera = new UniversalCamera("playerCamera", new Vector3(0, 56, -56), this.scene);
        let yTilt = new TransformNode("ytilt");
        //adjustments to camera view to point down at our player
        yTilt.rotation = PlayerSphere.ORIGINAL_TILT;
        this._yTilt = yTilt;
        yTilt.parent = this._camRoot;
        this.camera.lockedTarget = this._camRoot.position;
        this.camera.fov = 1;
        this.camera.parent = yTilt;

        // camera.parent = this._camRoot
        //
        // const lookDirection = this._camRoot.position.clone();
        // lookDirection.normalize();
        // const angleY = Math.atan2(lookDirection.x, lookDirection.z);
        // const angleX = -1 * Math.atan2(lookDirection.y, Math.sqrt(lookDirection.x * lookDirection.x + lookDirection.z * lookDirection.z));
        // const maxRotation = 30 * Math.PI / 180;
        // this._camRoot.rotation.y = Scalar.Lerp(
        //     this._camRoot.rotation.y,
        //         Math.min(Math.max(angleY, -maxRotation), maxRotation),
        //         0.01
        //     );
        // this._camRoot.rotation.x = Scalar.Lerp(
        //     this._camRoot.rotation.x,
        //         Math.min(Math.max(angleX, -maxRotation), maxRotation),
        //         0.10
        //     );
        // // this._camRoot.fov = .6;
        // this._camRoot.parent = this._yTilt;
        return this.camera;
    }

    //

        //
        // // TODO: Limit camera rotation
        //
        //
        // // Update camera position and rotation
        // this.scene.onBeforeRenderObservable.add(() => {
        //     // Set camera position
        //     const spherePosition = this.mesh.position.clone();
        //     const cameraPosition = new Vector3(
        //         spherePosition.x,
        //         spherePosition.y + 5,
        //         spherePosition.z - 15
        //     );
        //     camera.position = Vector3.Lerp(camera.position, cameraPosition, 0.01);
        //
        //     const lookDirection = spherePosition.subtract(camera.position);
        //     lookDirection.normalize();
        //     const angleY = Math.atan2(lookDirection.x, lookDirection.z);
        //     const angleX = -1 * Math.atan2(lookDirection.y, Math.sqrt(lookDirection.x * lookDirection.x + lookDirection.z * lookDirection.z));
        //     const maxRotation = 30 * Math.PI / 180;
        //     camera.rotation.y = Scalar.Lerp(
        //         camera.rotation.y,
        //         Math.min(Math.max(angleY, -maxRotation), maxRotation),
        //         0.01
        //     );
        //     camera.rotation.x = Scalar.Lerp(
        //         camera.rotation.x,
        //         Math.min(Math.max(angleX, -maxRotation), maxRotation),
        //         0.10
        //     );
        //
        // });
    // }


    private _loadSounds(scene: Scene): void {
        //load sounds
    }
}