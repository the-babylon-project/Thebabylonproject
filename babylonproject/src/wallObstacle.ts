import {
    Scene,
    Color3,
    Mesh,
    Vector3,
    PointLight,
    Texture,
    Color4,
    ParticleSystem,
    AnimationGroup,
    PBRMetallicRoughnessMaterial,
    MeshBuilder, TransformNode
} from "@babylonjs/core";

//THIS WILL BE THE WALLOBSTACLE CLASS
export class WallObstacle {
    //HERE HE SETS UP SCENE, ADDS MESH TO LATERN, MATERIAL, ANIMATION
    //WE CAN PUT OUR FUNCTION TO GENERATE ALL OF OUR WALLOBS HERE.
    public _scene: Scene;

    public mesh: Mesh;
    public isTouched: boolean = false;
    private _currentZ: number;
    // private _wallmtl: PBRMetallicRoughnessMaterial;
    // //posibly change _light to _glow
    // private _light: PointLight;

    //Lantern animations
    // private _spinAnim: AnimationGroup;

    //Particle System
    private _stars: ParticleSystem;

    constructor(wallmtl: PBRMetallicRoughnessMaterial, mesh: Mesh, scene: Scene, position: Vector3) {
        this._scene = scene;
        // UNDECIDED ON MATS
        // this._wallmtl = wallmtl;

        //load the lantern mesh
        //THIS LOADS A SINGLE LANTERN. I WANT TO LOAD 10000 Z'S WORTH
        this._loadWallObstacle(mesh, position);

        //load particle system
        // this._loadStars();

        //set animations
        // this._spinAnim = animationGroups;

        //create light source for the lanterns
        // const light = new PointLight("lantern light", this.mesh.getAbsolutePosition(), this._scene);
        // light.intensity = 0;
        // light.radius = 2;
        // light.diffuse = new Color3(0.45, 0.56, 0.80);
        // this._light = light;
        // //only allow light to affect meshes near it
        // this._findNearestMeshes(light);
    }

    //THIS DOESN'T CREATE LANTERN IT ONLY LOADS IT.
    //IDK IF WHAT EXACTLY I REPLACE THIS WITH. PROBABLY JUST LOAD A SINGLE WALL AND SET THE SCALING, AND ABSOLUTE POSITION
    //AND ISPICKABLE?
    //This isn't going to work. The wall is random based on variables. You can't load a random object to be able to do
    //something with it.
    //if you needed this to run you can iterate over each wall in the WallObject Array and Load it with this.
    public _loadWallObstacle(mesh: Mesh, position: Vector3): void {
        //REMEMBER, OUR WALL OBJECT IS ACTUALLY 4 WALLS SO WE WILL SET A PARENT TO IT, AND PROBABLY A BOX TO MAKE THE
        //BOX PICKABLE, AND THE REST NOT.
        this.mesh.scaling = new Vector3(1, 1, 1);
        this.mesh.setAbsolutePosition(position);
        this.mesh.isPickable = false;
    }
    static createWallOb(_scene: Scene): (Mesh) {
        // Loop through and create the four walls with increasing Z positions
        // Create the parent mesh that will hold all the walls
        const wallDad = new Mesh("wallDad", _scene);

        // Generate random x and y positions for the center of the window
        const randomX = Math.floor(Math.random() * 96 - 42);
        const randomY = Math.floor(Math.random() * 100 - 6);
        const startPointLeft = randomX - 6;
        const startPointRight = randomX + 6;
        const startPointTop = randomY + 6;
        const startPointBot = randomY - 6;
        // Calculate the positions and dimensions of the four walls
        const leftWallWidth = Math.abs(-50 - startPointLeft);
        const leftWallX = Math.round(-50 + (leftWallWidth / 2));

        const rightWallWidth = Math.abs(50 - startPointRight);
        const rightWallX = 50 - (rightWallWidth / 2);

        const topWallHeight = 100 - startPointTop;
        const topWallY = 100 - (topWallHeight / 2);

        const bottomWallHeight = startPointBot;
        const bottomWallY = startPointBot / 2;

        // Create the four walls for this iteration
        const leftWallOb = MeshBuilder.CreatePlane("leftWallOb", {width: leftWallWidth, height: 100}, _scene);
        leftWallOb.position = new Vector3(leftWallX, 50, 0);

        const rightWallOb = MeshBuilder.CreatePlane("rightWallOb", {width: rightWallWidth, height: 100}, _scene);
        rightWallOb.position = new Vector3(rightWallX, 50, 0);

        const topWallOb = MeshBuilder.CreatePlane("topWallOb", {width: 12, height: topWallHeight}, _scene);
        topWallOb.position = new Vector3(randomX, topWallY, 0);

        const bottomWallOb = MeshBuilder.CreatePlane("bottomWallOb", {width: 12, height: bottomWallHeight}, _scene);
        bottomWallOb.position = new Vector3(randomX, bottomWallY, 0);

        // Create the box obstacle
        const boxOb = MeshBuilder.CreateBox("boxOb", {size: 6}, _scene);
        boxOb.position = new Vector3(randomX, randomY, 0);

        // Set wall pickability
        leftWallOb.isPickable = false;
        rightWallOb.isPickable = false;
        topWallOb.isPickable = false;
        bottomWallOb.isPickable = false;
        boxOb.isPickable = true;

        // Add the walls to the parent mesh
        leftWallOb.parent = wallDad;
        rightWallOb.parent = wallDad;
        topWallOb.parent = wallDad;
        bottomWallOb.parent = wallDad;
        boxOb.parent = wallDad
        boxOb.isVisible = false;

        return boxOb;
    }
    //THIS BEGINS ANIMATION OR CAN ALSO ADDS MATERIAL FROM WALLMTL, THE ANIMATIONS WERE FOR TEXTURES.
    // public setEmissiveTexture(): void {
    //     this.isLit = true;
    //
    //     //play animation and particle system
    //     // this._spinAnim.play();
    //     // this._stars.start();
    //     //swap texture
    //     this.mesh.material = this._wallmtl;
    //     this._light.intensity = 30;
    // }

    //when the light is created, only include the meshes specified
    //I BELIEVE THESE ARE SUBMESHES FROM THE ENVSETTING.GLB, CONFIRMED.
    // private _findNearestMeshes(light: PointLight): void {
    //     if(this.mesh.name.includes("14") || this.mesh.name.includes("15")) {
    //         light.includedOnlyMeshes.push(this._scene.getMeshByName("festivalPlatform1"));
    //     } else if(this.mesh.name.includes("16") || this.mesh.name.includes("17")) {
    //         light.includedOnlyMeshes.push(this._scene.getMeshByName("festivalPlatform2"));
    //     } else if (this.mesh.name.includes("18") || this.mesh.name.includes("19")) {
    //         light.includedOnlyMeshes.push(this._scene.getMeshByName("festivalPlatform3"));
    //     } else if (this.mesh.name.includes("20") || this.mesh.name.includes("21")) {
    //         light.includedOnlyMeshes.push(this._scene.getMeshByName("festivalPlatform4"));
    //     }
    //     //grab the corresponding transform node that holds all of the meshes affected by this lantern's light
    //     this._scene.getTransformNodeByName(this.mesh.name + "lights").getChildMeshes().forEach(m => {
    //        light.includedOnlyMeshes.push(m);
    //     })
    // }

    // private _loadStars(): void {
    //     const particleSystem = new ParticleSystem("stars", 1000, this._scene);
    //
    //     particleSystem.particleTexture = new Texture("textures/solidStar.png", this._scene);
    //     particleSystem.emitter = new Vector3(this.mesh.position.x, this.mesh.position.y + 1.5, this.mesh.position.z);
    //     particleSystem.createPointEmitter(new Vector3(0.6, 1, 0), new Vector3(0, 1, 0));
    //     particleSystem.color1 = new Color4(1, 1, 1);
    //     particleSystem.color2 = new Color4(1, 1, 1);
    //     particleSystem.colorDead = new Color4(1, 1, 1, 1);
    //     particleSystem.emitRate = 12;
    //     particleSystem.minEmitPower = 14;
    //     particleSystem.maxEmitPower = 14;
    //     particleSystem.addStartSizeGradient(0, 2);
    //     particleSystem.addStartSizeGradient(1, 0.8);
    //     particleSystem.minAngularSpeed = 0;
    //     particleSystem.maxAngularSpeed = 2;
    //     particleSystem.addDragGradient(0, 0.7, 0.7);
    //     particleSystem.targetStopDuration = .25;
    //
    //     this._stars = particleSystem;
    // }
}