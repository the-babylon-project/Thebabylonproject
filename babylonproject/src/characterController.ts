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
    ShadowGenerator,
    FramingBehavior, ArcRotateCamera
} from "@babylonjs/core";
import { PlayerInput } from "./inputController";

export class PlayerSphere extends TransformNode {
    public camera: UniversalCamera;
    public scene: Scene;
    private _input: PlayerInput;
    public mesh: Mesh; //outer collisionbox of player
    private _camRoot: TransformNode;
    private _deltaTime: number = 0;
    private _h: number;
    private _v: number;
    private _moveDirection: Vector3 = new Vector3();
    private _inputAmt: number;
    private _gravity: Vector3 = new Vector3();
    private _grounded: boolean;
    private _climbing: boolean;

    //player variables
    public win: boolean = false; //whether the game is won
    public lose: boolean = false; //if we hit the wall.
    public targetHit: boolean = true;
    //misc sounds
    // private _resetSfx: Sound;
    // private _movingSfx: Sound;
    // private _climbingSfx: Sound;

    //observables
    public onRun = new Observable();

    constructor(assets, scene: Scene, shadowGenerator: ShadowGenerator, input?: PlayerInput) {
        super("player", scene);
        this.scene = scene;

        //set up sounds
        this._loadSounds(this.scene);
        //camera
        this._setupPlayerCamera();
        this.mesh = assets.mesh;
        this.mesh.parent = this;


        //--COLLISIONS CONSTRUCTOR--
        //ACTION MANAGER IS CALLING CHECKLANTERNS FROM ENVIRONMENTS
        //THIS EXECUTES A TRIGGER IF SOMETHING HAPPENS. WE CAN USE THIS TO EXECUTE A LOSS...THE LOSS WILL BE SENT TO
        // EVENT SERVER AND AN EVENT TRIGGER COULD BE IF OTHER PLAYER LOST, TRIGGER WIN.
        this.mesh.actionManager = new ActionManager(this.scene);
        //ONE THE CALL IS REGISTERED, WE SET ACTIONS FOR EVENTS THAT LEAD TO TRIGGERS. IN THE FUNCTION WE HAVE A THIS.WIN
        // PARAMETER WHICH WILL CAUSE THE TRIGGER, BASICALLY WE WATCH FOR A COLLISION, AND TRIGGER IF COLLISION.
        this.mesh.actionManager.registerAction(
            new ExecuteCodeAction(
                {
                    trigger: ActionManager.OnIntersectionEnterTrigger,
                    parameter: this.scene.getMeshByName("destination")
                },
                () => {
                    if (!this.targetHit) {
                        //Could do the box ob checks here maybe and instead of WIN we have LOSS.
                        this.lose = true;
                    }
                }
            )
        );
        //THIS IS ANOTHER ACTION BEING REGISTERED, I.E. ANOTHER CONDITION WHICH CAN CAUSE A LOSS FOR US, WHICH IS
        // LEAVING PLAYZONE.
        //if player falls through "world", reset the position to the last safe grounded position
        this.mesh.actionManager.registerAction(
            new ExecuteCodeAction({
                    trigger: ActionManager.OnIntersectionEnterTrigger,
                    parameter: this.scene.getMeshByName("ground")
                }, //this says if player falls through ground, I'm going to put walls and ceiling also.
                () => {
                    this.lose = true;
                }
            )
        );
        new ExecuteCodeAction({
            trigger: ActionManager.OnIntersectionEnterTrigger,
            parameter: this.scene.getMeshByName("ceiling")
        }, () => {
            this.lose = true;
        }),

            new ExecuteCodeAction({
                trigger: ActionManager.OnIntersectionEnterTrigger,
                parameter: this.scene.getMeshByName("leftWall")
            }, () => {
                this.lose = true;
            }),

            new ExecuteCodeAction({
                trigger: ActionManager.OnIntersectionEnterTrigger,
                parameter: this.scene.getMeshByName("rightWall")
            }, () => {
                this.lose = true;
            });
        //THIS IS ANOTHER PLAYER DEFINED ACTION TRIGGER FOR SOUNDS, THIS COULD BE FOR MOVEMENT.
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
        shadowGenerator.addShadowCaster(assets.mesh);

        this._input = input;
    }
    //--GROUND DETECTION--
    //RAYCASTING IS THE MAIN WAY OF DETECTING THE GROUND BENEATH PLAYER...POSSIBLE WINDOW IN FRONT OF SPHERE.
    //THIS IS A BIG ONE AND MAY SOLVE OUR OBSTACLE PROBLEM
    //SET RAYCAST DIRECTLY IN FRONT OF SPHERE. MAYBE WE CAN CUSTOMIZE RAY SIZE LIKE 4X4.
    //Send raycast to the floor to detect if there are any hits with meshes below the character
    private _boxObRaycast(offsetx: number, offsetz: number, raycastlen: number): Vector3 {

        let raycastBoxOb = new Vector3(this.mesh.position.x, this.mesh.position.y + 0.5, this.mesh.position.z);
        let ray = new Ray(raycastBoxOb, Vector3.Forward(), raycastlen);//this should be length to next wall if able to get

        //defined which type of meshes should be pickable
        //COMMENT FROM TUTORIAL: Then, we want to define what can be picked by our raycast.
        // This was important to have since I created custom collision meshes for the parts of the environment
        // that had more complex geometry.
        // These meshes are invisible, but should still be pickable.
        // We start checking whether our raycast has hit anything by using pickWithRay.
        //WE MAY BE ABLE TO MAKE THE WINDOW A BOX MESH TO MAKE IT PICKABLE.
        //IF THE RAY HITS, IT RETURNS THE VECTOR3 OF THE HIT OBJECT, ELSE RETURNS NOTHING.
        let predicate = function (mesh) {
            return mesh.isPickable && mesh.isEnabled();
        }

        let pick = this.scene.pickWithRay(ray, predicate);

        if (pick.hit) { //grounded
            //this will be the point that is logged that must be intersected.
            return pick.pickedPoint;
        } else { //not grounded
            return Vector3.Zero();
        }
    }
    private _hasBoxHit(): boolean {
        if (this._boxObRaycast(0, 0, 99).equals(Vector3.Zero())) {
            return false;
        } else {
            return true;
        }
    }

    //https://www.babylonjs-playground.com/#FUK3S#8
    //https://www.html5gamedevs.com/topic/7709-scenepick-a-mesh-that-is-enabled-but-not-visible/
    //check whether a mesh is sloping based on the normal
    //WE WONT HAVE ANY COLLISION MESHES THAT ARE INVISIBLE UNLESS WE CREATE A BOX AROUND OUR PLAY FIELD TO DETECT COLLISION
    // IF PLAYER LEFT PLAY ZONE, RATHER THAN CHECKING COORDINATES, JUST DO IT WITH COLLISION LIKE EVERYTHING ELSE.

    //I could possibly just make this updateBoundsDetection.
    private _updateBoundsDetection(): void {

        return;
    }

    //--GAME UPDATES--
    private _beforeRenderUpdate(): void {
        //this._updateBoundsDetection();
    }

    public activatePlayerCamera(): UniversalCamera {
        this.scene.registerBeforeRender(() => {

            this._beforeRenderUpdate();
            this._updateCamera();

        })
        return this.camera;
    }

    //--CAMERA--
    private _updateCamera(): void {
        //THIS IS THE SETUP AND NOT THE ACTUAL COMPLICATED CAMERA CONTROL. IT CENTERS FOR LOADING/UNLOADING PROBABLY
        //FOR GUI/SCENE CHANGE PURPOSES.
        //This should definitely move close to sphere and center for when it goes through a wall

        //trigger areas for rotating camera view
        if (this.mesh.intersectsMesh(this.scene.getMeshByName("boxObTrigger"))) {
            if (this._input.horizontalAxis > 0) { //rotates to the right
                this._camRoot.rotation = Vector3.Lerp(this._camRoot.rotation, new Vector3(this._camRoot.rotation.x, Math.PI / 2, this._camRoot.rotation.z), 0.4);
            } else if (this._input.horizontalAxis < 0) { //rotates to the left
                this._camRoot.rotation = Vector3.Lerp(this._camRoot.rotation, new Vector3(this._camRoot.rotation.x, Math.PI, this._camRoot.rotation.z), 0.4);
            }
        }

        //update camera postion up/down movement
        let centerPlayer = this.mesh.position.y + 2;
        this._camRoot.position = Vector3.Lerp(this._camRoot.position, new Vector3(this.mesh.position.x, centerPlayer, this.mesh.position.z), 0.4);
    }

    private _setupPlayerCamera(): ArcRotateCamera {
        const camera = new ArcRotateCamera('playerCamera', 0, Math.PI / 2, 15, new Vector3(0, 0, 0), this.scene);

        // Set camera limits
        const maxDistance = 50;
        const minDistance = 10;
        const maxRotation = Math.PI / 6;
        const minRotation = -maxRotation;

        // Make camera smooth
        const framingBehavior = new FramingBehavior();
        framingBehavior.radiusScale = 20;
        framingBehavior.positionScale = 20;
        framingBehavior.elevationReturnTime = -1;
        framingBehavior.zoomStopsAnimation = true;
        framingBehavior.framingTime = 0;
        camera.addBehavior(framingBehavior);

        // Limit camera distance
        camera.lowerRadiusLimit = minDistance;
        camera.upperRadiusLimit = maxDistance;

        // TODO: Limit camera rotation


        // Update camera position and rotation
        this.scene.onBeforeRenderObservable.add(() => {
            // Set camera position
            const spherePosition = this.mesh.position.clone();
            if (spherePosition.x < -35) {
                spherePosition.x = -35;
            } else if (spherePosition.x > 35) {
                spherePosition.x = 35;
            }
            if (spherePosition.y > 80) {
                spherePosition.y = 80;
            }
            camera.target = spherePosition;

            // Set camera rotation
            const lookDirection = this.mesh.position.subtract(camera.position);
            lookDirection.normalize();
            const angleY = Math.atan2(lookDirection.x, lookDirection.z);
            const angleX = -Math.atan2(lookDirection.y, Math.sqrt(lookDirection.x * lookDirection.x + lookDirection.z * lookDirection.z));
            camera.alpha = angleY;
            camera.beta = angleX;
        });

        return camera;
    }


    private _loadSounds(scene: Scene): void {
        //EVERYTHING COMING FROM SOUND FOLDER
        // this._climbingSfx = new Sound("jumping", "./sounds/187024__lloydevans09__jump2.wav", scene, function () {
        // }, {
        //     volume: 0.25
        // });
        // this._movingSfx = new Sound("walking", "./sounds/Concrete 2.wav", scene, function () {
        // }, {
        //     loop: true,
        //     volume: 0.20,
        //     playbackRate: 0.6
        // });
        // this._resetSfx = new Sound("reset", "./sounds/Retro Magic Protection 25.wav", scene, function () {
        // }, {
        //     volume: 0.25
        // });
    }
}