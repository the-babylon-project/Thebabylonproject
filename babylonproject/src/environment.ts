import {
    Scene,
    TransformNode,
    SceneLoader,
    PBRMetallicRoughnessMaterial, Mesh, MeshBuilder, StandardMaterial, GlowLayer, Texture, Color3,
} from "@babylonjs/core";

import {WallObstacle} from "./wallObstacle";
import { PlayerSphere } from "./characterController";

export class Environment {
    private _scene: Scene;

    //Meshes
    private _wallObs: Array<WallObstacle>;
    private _lightmtl: PBRMetallicRoughnessMaterial; // emissive texture



    constructor(scene: Scene) {
        this._scene = scene;
        this._wallObs = [];
        const lightmtl = new PBRMetallicRoughnessMaterial("boxOb mesh light", this._scene);
        //change values and texture
        // lightmtl.emissiveTexture = new Texture("/textures/litLantern.png", this._scene, true, false);
        lightmtl.emissiveColor = new Color3(0.8784313725490196, 0.7568627450980392, 0.6235294117647059);
        this._lightmtl = lightmtl;
    }
    public async load() {
        //load course
        const assets = await this._loadAssets();

        // this is loading the whole scene, iterating through the elements and doing check collision and shadow setters.
        // the purpose of brining in load assets is to add collisons and shadows, and make ispickable or not on every part.
        assets.allMeshes.forEach(m => {
            m.receiveShadows = true;
            m.checkCollisions = true;
            if (m.name.includes("ground")) {
                m.checkCollisions = true;
                m.isPickable = true;
            }
            if (m.name == "leftWall" || m.name == "rightWall" || m.name == "ceiling") {
                //dont check for collisions, dont allow for raycasting
                m.checkCollisions = false;
                m.isPickable = true;
            }
            //areas that will use box collisions
            if (m.name.includes("boxWallOb")) {
                m.checkCollisions = true;
                m.isPickable = false;
            }
        });
        return assets;
    }
    //Load all necessary meshes for the environment
    public async _loadAssets() {
        //TODO: pick out the parent 'Mesh' of these, when we call this in load, it will iterate through each parent mesh
        // and add the params receive shadoes, is pickable, and checkCollisions..
        //load track
        const wallObHolder = new TransformNode("wallObHolder", this._scene);

        const result = await SceneLoader.ImportMeshAsync(null, "./models/", "envSetting_50+10.glb", this._scene);
        let env = result.meshes[0]; //gets total env
        let allMeshes = env.getChildMeshes();
        let wallParents = env.getChildMeshes(false, mesh => mesh.name.startsWith("wallsParent"));
        wallParents.forEach(wallParent => {
            // Get the box child
            let boxChild = wallParent.getChildMeshes(true, mesh => mesh.name.startsWith("boxOb"))[0] as Mesh;

            // Apply a glow effect to the box child
            let glowLayer = new GlowLayer("glow", this._scene);
            //TODO: customize glow
            glowLayer.intensity = 1.0;
            glowLayer.addIncludedOnlyMesh(boxChild);
            boxChild.isVisible = false;

            // Iterate through the wall children
            let wallChildren = wallParent.getChildMeshes(true, mesh => mesh.name.includes("Wall"));
            wallChildren.forEach(wallChild => {
                // TODO: do something for each wall.
                // wallChild.checkCollisions = true;
                wallChild.isVisible = true;
            });
            wallParent.setParent(wallObHolder);
            let newWallOb = new WallObstacle(this._lightmtl, boxChild, this._scene, wallParent.getChildTransformNodes(true).find(m => m.name === "boxOb").getAbsolutePosition(), glowLayer);
            this._wallObs.push(newWallOb);
        });

        return {
            //return the track and the wall obstacles as meshes.
            env: env,
            allMeshes: allMeshes,
            wallObstacles: this._wallObs,
        }
    }//--deprecated--
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



    //THIS IS CALLED IN characterController TO CHECK
    //WE DO HAVE AN ISTOUCHED VARIABLE WE CAN USE FOR CHECLS.
    public checkWallObs(player: PlayerSphere)
    {
        //THIS IS JUST THE BASIC METHOD OF LIGHTING LANTERNS FOR HIM, I CAN'T FIND AN EQUIVALENT
        // BUT IT COULD BE USED FOR THE CHECKING OF PLAYER AND BOXOB INTERSECTIONS UNLESS THAT WILL BE
        // DONE ELSEWHERE.
        //You can give a glow to the boxOb if wanted.
        //This lights up latern if touched.
        // if (!this._wallObs[0].isTouched) {
        //     this._wallObs[0].setEmissiveTexture();
        // }
        // this._wallObs.forEach(wallObParent => {
        // player.mesh.actionManager.registerAction(
        //     new ExecuteCodeAction(
        //     {
        // trigger: ActionManager.OnIntersectionEnterTrigger,
        // parameter: lantern.mesh
        // },
        // () => {
        //if the lantern is not lit, light it up & reset sparkler timer
        // if (!lantern.isTouched && player.sparkLit) {
        //     player.lanternsLit += 1;
        //     lantern.setEmissiveTexture();
        //     player.sparkReset = true;
        //     player.sparkLit = true;
        //
        //     //SFX
        //     player.lightSfx.play();
        // }
        //if the lantern is lit already, reset the sparkler timer
        // else if (lantern.isLit) {
        //     player.sparkReset = true;
        //     player.sparkLit = true;
        //
        //     //SFX
        //     player.sparkResetSfx.play();
        // }
        // }
        // )
        //      );
        //  });
    }
}