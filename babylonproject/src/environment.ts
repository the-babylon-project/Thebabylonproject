import {
    Scene,
    TransformNode,
    SceneLoader,
    PBRMetallicRoughnessMaterial,
    Mesh,
    Color3,
    ActionManager,
    ExecuteCodeAction,
    Node,
    PBRMaterial,
    Color4,
    StandardMaterial,
    ReflectionProbe,
    Vector3,
    MultiMaterial,
    Texture,
    BaseTexture, Material, MeshBuilder, AbstractMesh, CubeTexture,
} from "@babylonjs/core";
import {SkyMaterial} from "@babylonjs/materials";
import "@babylonjs/procedural-textures";



import {WallObstacle} from "./wallObstacle";
import { PlayerSphere } from "./characterController";
import {CloudProceduralTexture} from "@babylonjs/procedural-textures";

export class Environment {
    private _scene: Scene;
    private _ground: Mesh;
    private _ceiling: Mesh;
    private _leftWall: Mesh;
    private _rightWall: Mesh;
    private _currentZ: number;

    //Meshes
    private _boxObs: Array<WallObstacle>; //this will be used to _checkBoxObs with action manager
    private _lightmtl: PBRMetallicRoughnessMaterial;
    private _destinations: Array<TransformNode>

    constructor(scene: Scene) {
        this._scene = scene;
        this._boxObs = [];
        this._destinations = [];
        const lightmtl = new PBRMetallicRoughnessMaterial("boxOb mesh light", this._scene);
        lightmtl.emissiveColor = new Color3(0.8784313725490196, 0.7568627450980392, 0.6235294117647059);
        lightmtl.metallic = 6;
        this._lightmtl = lightmtl;
        this._currentZ = 150;
    }
    public async load() {
        const assets = await this._loadAssets();

        let ceiling;
        let rightWall;
        let leftWall;
        let ground;
        assets.allMeshes.forEach(tom => {
            if (tom.name.includes("right")){
                tom.checkCollisions = true;
                rightWall = tom;
            } else if(tom.name.includes("left")) {
                tom.checkCollisions = true;
                tom.isPickable = false;
                leftWall = tom;
            } else if(tom.name.includes("ceiling")){
                tom.checkCollisions = true;
                tom.isPickable = false;
                ceiling = tom;
            } else if (tom.name === "ground"){
                tom.checkCollisions = true;
                tom.isPickable = false;
                ground = tom;
            }
        })
        const boxObMaterial = new StandardMaterial("boxObMaterial", this._scene);
        const boxObHolder = new TransformNode("boxObHolder", this._scene);

        boxObMaterial.diffuseTexture = new Texture("./textures/transparent.png", this._scene);
        boxObMaterial.opacityTexture = boxObMaterial.diffuseTexture;
        boxObMaterial.alpha = 0.75; // set the transparency of the material

        assets.result.forEach(m => {
            if (m.name.includes("WallOb")) {
                m.checkCollisions = true;
                m.isPickable = false;
            }
            if (m.name === ("boxOb")) {
                m.checkCollisions = false;
                m.isVisible = true;
                m.isPickable = true;
                m.material = boxObMaterial;
                m.setParent(boxObHolder);
                let newWallOb = new WallObstacle(this._lightmtl, m , this._scene, m.getAbsolutePosition());
                this._boxObs.push(newWallOb);
            }
        });
        const groundMaterial = new PBRMaterial("groundMaterial", this._scene);
        const probe = new ReflectionProbe("skyProbe", 512, this._scene);
        const randoMat = this._createRandomSky(this._scene);
        probe.attachToMesh(ground);

        groundMaterial.metallic = 1;
        groundMaterial.roughness = 1;
        groundMaterial.albedoColor = new Color3(Math.random(), 0.8, 0.87);
        // groundMaterial.microSurface = 1.0;
        groundMaterial.useRoughnessFromMetallicTextureAlpha = false;
        groundMaterial.useRoughnessFromMetallicTextureGreen = true;
        groundMaterial.useMetallnessFromMetallicTextureBlue = true;
        groundMaterial.reflectionTexture = CubeTexture.CreateFromPrefilteredData("/textures/3d.dds", this._scene);
        groundMaterial.metallicTexture = groundMaterial.reflectionTexture;

        leftWall.material = randoMat;
        this._leftWall = leftWall;
        rightWall.material = randoMat;
        this._rightWall = rightWall;
        ceiling.material = randoMat;
        this._ceiling = ceiling;
        ground.material = groundMaterial;

        this._ground = ground;
    }

    //Load all necessary meshes for the environment
    public async _loadAssets() {
        //TODO: pick out the parent 'Mesh' of these, when we call this in load, it will iterate through each parent mesh
        // and add the params receive shadows, is pickable, and checkCollisions..

        const trackOnly = await SceneLoader.ImportMeshAsync(null, "./models/", "track_only.glb", this._scene);
        const result = await this._createRandomCourse();
        let env = trackOnly.meshes[0]; //gets total env
        let allMeshes = env.getChildMeshes(false); //this doesn't include 'parent wall'.
        // let boxChildren = allMeshes.filter((mesh) => mesh.name === "boxOb");
        return {
            //return the track and the wall obstacles as meshes.
            env: env,
            allMeshes: allMeshes,
            result: result,
        }
    }
    private wallStyleOne(scene: Scene, currentZ: number): Mesh[] {
        currentZ = this._currentZ;
        let meshReturn: Mesh[] = [];
        // creates up and down only walls
        // Generate random x and y positions for the center of the window
        const randomX = Math.floor(Math.random() * 89) - 44;
        const startPointLeft = randomX - 6;
        const startPointRight = randomX + 6;

        //add currentZ increase functionality
        // Calculate the positions and dimensions of the four walls
        const leftWallWidth = Math.abs(-50 - startPointLeft);
        const leftWallX = Math.round(-50 + (leftWallWidth / 2));

        const rightWallWidth = Math.abs(50 - startPointRight);
        const rightWallX = 50 - (rightWallWidth / 2);

        // Create the four walls for this iteration
        const leftWallOb = MeshBuilder.CreateBox("leftWallOb", { width: leftWallWidth, height: 100, depth: 10  }, scene);
        let absPosLeft = new Vector3(leftWallX, 100, currentZ);
        leftWallOb.setAbsolutePosition(absPosLeft);

        const rightWallOb = MeshBuilder.CreateBox("rightWallOb", { width: rightWallWidth, height: 100, depth: 10  }, scene);
        let absPosRight = new Vector3(rightWallX, 100, currentZ);
        rightWallOb.setAbsolutePosition(absPosRight);

        const boxOb = MeshBuilder.CreatePlane('boxOb', {width: 12, height: 100}, scene)
        let absPosBox = new Vector3(randomX, 100, currentZ)
        boxOb.setAbsolutePosition(absPosBox);

        meshReturn.push(leftWallOb, rightWallOb, boxOb);
        return meshReturn;
    }
    private wallStyleTwo(scene : Scene, currentZ: number): Mesh[] {
        currentZ = this._currentZ;
        let meshReturn: Mesh[] = [];
        // creates top and bottom walls only
        // Generate random x and y positions for the center of the window
        const randomX = Math.floor(Math.random() * 89) - 44;
        const randomY = Math.floor(Math.random() * 85) + 58;

        const startPointTop = randomY + 6;
        const startPointBot = randomY - 6;

        const topWallHeight = 150 - startPointTop;
        const topWallY = 150 - (topWallHeight / 2);

        const bottomWallHeight = startPointBot - 50 ;
        const bottomWallY = 25 + (startPointBot / 2);

        const topWallOb = MeshBuilder.CreateBox("topWallOb", { width: 100, height: topWallHeight, depth: 10  }, scene);
        let absPosTop = new Vector3(0, topWallY, currentZ);
        topWallOb.setAbsolutePosition(absPosTop);

        const bottomWallOb = MeshBuilder.CreateBox("bottomWallOb", { width: 100, height: bottomWallHeight, depth: 10  }, scene);
        let absPosBot = new Vector3(0, bottomWallY, currentZ);
        bottomWallOb.setAbsolutePosition(absPosBot);

        const boxOb = MeshBuilder.CreatePlane("boxOb", { height: 12, width: 100}, scene);
        let absPosBox = new Vector3(0, randomY, currentZ)
        boxOb.setAbsolutePosition(absPosBox);

        meshReturn.push(topWallOb, bottomWallOb, boxOb);
        return meshReturn;
    }
    private async _createRandomCourse(): Promise<Mesh[]> {

        const meshes: Mesh[] = [];
        //MODIFY THIS TO ACCOMPLISH SETTING STAGE
        let distanceZ = this._currentZ;
        let newDistanceZ;
        let tempZ;
        while (this._currentZ < 15500) {
            newDistanceZ = distanceZ;
            const randomEvenOdd = Math.floor(Math.random() *100);
            if (randomEvenOdd % 2 == 0){
                let meshReturn = this.wallStyleOne(this._scene, this._currentZ)
                meshReturn.forEach(m => {
                    meshes.push(m);
                });

            }else{
                let meshReturn = this.wallStyleTwo(this._scene, this._currentZ)
                meshReturn.forEach(m => {
                    meshes.push(m);
                });
            }
            //increases distance by 10 every 1000 as sphere speeds up
            this._currentZ += newDistanceZ;
            if (tempZ >= 1000) {
                distanceZ += 10;
                tempZ = 0;
            } else {
                tempZ += newDistanceZ;
            }
        }
        return meshes;
    }
    private _createRandomSky(scene) {
        // Create SkyMaterial with random settings
        const skyMaterial = new SkyMaterial("skyMaterial", scene);
        skyMaterial.backFaceCulling = false;
        skyMaterial.inclination = Math.random() * 0.5 + 0.3;
        skyMaterial.azimuth = Math.random() * 0.2;
        skyMaterial.turbidity = Math.random() * 20 + 40;
        skyMaterial.rayleigh = Math.random() * 5 + 1;
        skyMaterial.mieCoefficient = Math.random() * 0.01 + 0.001;
        skyMaterial.mieDirectionalG = Math.random() * 0.2 + 0.7;
        skyMaterial.luminance = Math.random() * 0.4 + 0.4;
        skyMaterial.useSunPosition = true;
        skyMaterial.sunPosition = new Vector3(Math.random() * 100, Math.random() * 100, Math.random() * 100);
        skyMaterial.alpha = 1;

        // Create CloudProceduralTexture with random settings
        const cloudTexture = new CloudProceduralTexture("cloudTexture", 256, scene);
        cloudTexture.amplitude = Math.random() * 3;
        cloudTexture.numOctaves = Math.random() * 10;
        cloudTexture.skyColor = new Color4(Math.random(), Math.random(), Math.random(), Math.random());
        cloudTexture.cloudColor = new Color4(Math.random(), Math.random(), Math.random(), Math.random());
        const cloudMaterial = new StandardMaterial("cloudMaterial", scene);
        cloudMaterial.alpha = 1;
        cloudMaterial.useAlphaFromDiffuseTexture = true;
        cloudMaterial.alpha = 0.5;

        const multiMaterial = new MultiMaterial("multiMaterial", scene);
        multiMaterial.subMaterials.push(skyMaterial);
        multiMaterial.subMaterials.push(cloudMaterial);
        return multiMaterial;
    }
    public checkBoxObs(player: PlayerSphere) {

        if (!this._boxObs[0].isTouched) {
            this._boxObs[0].setEmissiveTexture();
        }
        this._boxObs.forEach(boxOb => {
            player.mesh.actionManager.registerAction(
                new ExecuteCodeAction(
                    {
                        trigger: ActionManager.OnIntersectionEnterTrigger,
                        parameter: boxOb.mesh
                    },
                    () => {

                        if (!boxOb.isTouched) {
                            boxOb.setEmissiveTexture();
                            boxOb.isTouched = true;
                        }
                        // if the lantern is lit already, reset the sparkler timer
                        else if (boxOb.isTouched) {
                            // player.sparkReset = true;
                            // player.sparkLit = true;
                        }
                    }
                )
            );
        });
    }
}


    //--deprecated--
    // private async _modifyWallObs(){
    //     //this is substituting for his adding animations to lanterns, we will add glow layers to boxOb.
    //     //TODO: implement material for each obstacle wall and add glow
    //
    //     //This takes in createWallOb and iterates it with determinations.
    //     const wallObHolder = new TransformNode("wallObHolder", this._scene);
    //
    //     let wallObWhole = await SceneLoader.ImportMeshAsync(null, './models/', 'wallOb_40+10.glb');
    //
    //     // Get the "wallparent" nodes
    //     let wallParents = wallObWhole.meshes.filter(mesh => mesh.name.startsWith("wallsParent"));
    //     //This includes ['wallParent + positionZ'(undefined mesh), leftWallOb, rightWallOb, topWallOb, botWallOb]
    //
    //     // Iterate through each "wallparent" node
    //     wallParents.forEach(wallParent => {
    //         // Get the box child
    //         let boxChild = wallParent.getChildMeshes(true, mesh => mesh.name.startsWith("boxOb"))[0] as Mesh;
    //
    //         // Apply a glow effect to the box child
    //         let glowLayer = new GlowLayer("glow", this._scene);
    //         //TODO: customize glow
    //         glowLayer.intensity = 1.0;
    //         glowLayer.addIncludedOnlyMesh(boxChild);
    //         boxChild.isVisible = false;
    //
    //         // Iterate through the wall children
    //         let wallChildren = wallParent.getChildMeshes(true, mesh => mesh.name.includes("Wall"));
    //         wallChildren.forEach(wallChild => {
    //             // TODO: do something for each wall.
    //             // wallChild.checkCollisions = true;
    //             wallChild.isVisible = true;
    //         });
    //         wallParent.setParent(wallObHolder);
    //         let newWallOb = new WallObstacle(this._lightmtl, boxChild, this._scene, wallParent.getChildTransformNodes(true).find(m => m.name === "boxOb").getAbsolutePosition(), glowLayer);
    //         this._wallObs.push(newWallOb);
    //     });
    //     //probably dispose after push
    //     return this._wallObs;
    // }
    // --USED IN PLAYGROUND TO CREATE OBSTACLES, KEPT FOR REFERENCE--
    // async createWallObs(scene: Scene, material: StandardMaterial): Promise<Mesh> {
    //     // Create the parent mesh that will hold all the walls
    //     // Create the parent mesh that will hold all the walls
    //     const wallsParent = new Mesh("wallsParent" +" " + currentZ, scene);
    //
    //     // Generate random x and y positions for the center of the window
    //     const randomX = Math.floor(Math.random() * 88) - 44;
    //     const randomY = Math.floor(Math.random() * 88) + 6;
    //
    //     const startPointLeft = randomX - 6;
    //     const startPointRight = randomX + 6;
    //     const startPointTop = randomY + 6;
    //     const startPointBot = randomY - 6;
    //
    //     // Calculate the positions and dimensions of the four walls
    //     const leftWallWidth = Math.abs(-50 - startPointLeft);
    //     const leftWallX = Math.round(-50 + (leftWallWidth / 2));
    //
    //     const rightWallWidth = Math.abs(50 - startPointRight);
    //     const rightWallX = 50 - (rightWallWidth / 2);
    //
    //     const topWallHeight = 100 - startPointTop;
    //     const topWallY = 100 - (topWallHeight / 2);
    //
    //     const bottomWallHeight = startPointBot;
    //     const bottomWallY = startPointBot / 2;
    //
    //     // Create the four walls for this iteration
    //     const leftWallOb = MeshBuilder.CreatePlane("leftWallOb", { width: leftWallWidth, height: 100 }, scene);
    //     leftWallOb.position.x = leftWallX;
    //     leftWallOb.position.y = 50;
    //     leftWallOb.position.z = currentZ;
    //
    //     const rightWallOb = MeshBuilder.CreatePlane("rightWallOb", { width: rightWallWidth, height: 100 }, scene);
    //     rightWallOb.position.x = rightWallX;
    //     rightWallOb.position.y = 50;
    //     rightWallOb.position.z = currentZ;
    //
    //     const topWallOb = MeshBuilder.CreatePlane("topWallOb", { width: 12, height: topWallHeight }, scene);
    //     topWallOb.position.x = randomX;
    //     topWallOb.position.y = topWallY;
    //     topWallOb.position.z = currentZ;
    //
    //     const bottomWallOb = MeshBuilder.CreatePlane("bottomWallOb", { width: 12, height: bottomWallHeight }, scene);
    //     bottomWallOb.position.x = randomX;
    //     bottomWallOb.position.y = bottomWallY;
    //     bottomWallOb.position.z = currentZ;
    //
    //     const boxOb = MeshBuilder.CreateBox("boxOb", { size: 6 }, scene);
    //     boxOb.position.x = randomX;
    //     boxOb.position.y = randomY;
    //     boxOb.position.z = currentZ;
    //
    //
    //     // Set wall pickability
    //     leftWallOb.isPickable = false;
    //     rightWallOb.isPickable = false;
    //     topWallOb.isPickable = false;
    //     bottomWallOb.isPickable = false;
    //
    //
    //     // Add the walls to the parent mesh
    //     leftWallOb.parent = wallsParent;
    //     rightWallOb.parent = wallsParent;
    //     topWallOb.parent = wallsParent;
    //     bottomWallOb.parent = wallsParent;
    //     boxOb.parent = wallsParent;
    //
    //
    //     return wallsParent;
    //
    // }
    // --CREATED IN PLAYGROUND, KEPT FOR REFERENCE--
    // function createWallCourse(scene) {
    //     let distanceZ = 100;
    //     let currentZ = 100;
    //     let newDistanceZ = 0;
    //     let tempZ = 0;
    //     while (currentZ < 10000) {
    //         console.log('temp, new, dis, cur', tempZ, newDistanceZ, distanceZ, currentZ)
    //         newDistanceZ = distanceZ;
    //         createWallObs(scene, currentZ);
    //         currentZ = currentZ + newDistanceZ;
    //         if (tempZ >= 500) {
    //             distanceZ += 5;
    //             tempZ = 0;
    //         } else {
    //             tempZ += newDistanceZ;
    //         }
    //     }
    //
    // }