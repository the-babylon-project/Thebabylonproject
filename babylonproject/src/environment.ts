import {
    Scene,
    TransformNode,
    SceneLoader,
    PBRMetallicRoughnessMaterial,
} from "@babylonjs/core";

import {WallObstacle} from "./wallObstacle";
import { PlayerSphere } from "./characterController";

export class Environment {
    private _scene: Scene;

    //Meshes
    private _wallObs: Array<WallObstacle>;
    //I can get the position of every boxOb here. When the sphere hits it, we're
    //
    private _lightmtl: PBRMetallicRoughnessMaterial; // emissive texture for when lanterns are lit
    private _currentZ: number;


    constructor(scene: Scene) {
        this._scene = scene;
        this._wallObs = [];

        //create emissive material for when lantern is lit
        const lightmtl = new PBRMetallicRoughnessMaterial("light material", this._scene);
        this._lightmtl = lightmtl;
    }
    public async load() {

        const assets = await this._loadAssets();

        assets.allMeshes.forEach(m => {
            m.receiveShadows = true;
            m.checkCollisions = true;

            if (m.name == "leftWall" || m.name == "rightWall" || m.name == "ceiling") {
                //dont check for collisions, dont allow for raycasting
                m.checkCollisions = false;
                m.isPickable = false;
            }
            //areas that will use box collisions
            if (m.name.includes("boxWallOb")) {
                m.checkCollisions = true;
                m.isPickable = false;
            }
        });
    }
    //Load all necessary meshes for the environment
    public async _loadAssets() {
        //loads game environment
        // Can create track in playground and export to glb, import from that file.
        const result = await SceneLoader.ImportMeshAsync(null, "./models/", "track.glb", this._scene);

        let env = result.meshes[0];
        let trackMeshes = env.getChildMeshes();
        //THIS LOADS A SINGLE LANTERN MESH.
        //WE CAN PROBABLY LOAD ALL OF THE WALLOBSTACLE MESHES HERE WITH AN ASYNC FUNCTION, WHICH WILL MAKE FOR A PRESET COURSE.
        //TODO: Rework...IDK if we even need it created there.
        const res = await WallObstacle.createWallOb(this._scene);

        //extract the actual lantern mesh from the root of the mesh that's imported, dispose of the root
        //what he's doing originally is lantern = resultOfLoadLantern[0].GetChildren()[0];
        //so it loads all, gets all but parent, which is not needed i guess?
        let wallObDad = res.parent;
        let wallOb = wallObDad.getChildMeshes();
        wallObDad = null;
        res.dispose();

        return {
            env: env,
            allMeshes: trackMeshes,
            // animationGroups: animGroup
        }
    }
    private async _createWallCourse(assets){
        //This takes in createWallOb and iterates it with determinations.
        const wallObHolder = new TransformNode("wallObHolder", this._scene);
        //MODIFY THIS TO ACCOMPLISH SETTING STAGE
        for (let i = 0; i < 10; i++) {
            //ITERATE EVERY WALL CREATION
            let wallObInstance = WallObstacle.createWallOb(this._scene); //bring in loadWallOb

            wallObInstance.isVisible = true;
            wallObInstance.setParent(wallObHolder);

            //TODO:this should be put into it's own function to make all the walls. it should then go into _loadAssets()
            let newWallOb = new WallObstacle(this._lightmtl, wallObInstance, this._scene, assets.env.getChildTransformNodes(false).find(m => m.name === "wallOb " + i).getAbsolutePosition());

            this._wallObs.push(newWallOb);
        }
        //probably dispose after push
        return this._wallObs;
    }
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