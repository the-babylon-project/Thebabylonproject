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
    MeshBuilder, TransformNode, GlowLayer
} from "@babylonjs/core";

//THIS WILL BE THE WALLOBSTACLE CLASS
export class WallObstacle {
    //this has a lightmaterial we can swap to when hit, a mseh, a scene, a position that we can use for validation,
    //and a position.

    private _scene: Scene;
    public mesh: Mesh;
    public isTouched: boolean = true;
    private _lightmtl: PBRMetallicRoughnessMaterial;
    private _light: PointLight;
    private _glowbox: GlowLayer;
    constructor(lightmtl: PBRMetallicRoughnessMaterial, mesh: Mesh, scene: Scene, position: Vector3, glowbox: GlowLayer) {
        this._scene = scene;
        this._lightmtl = lightmtl;


        //load the wall to do something with it.
        this._loadWallObstacle(mesh);
        //sets the position param.
        this.mesh.position = position;
        const light = new PointLight("wall light", this.mesh.getAbsolutePosition(), this._scene);
        light.intensity = 0;
        light.radius = 2;
        light.diffuse = new Color3(0.45, 0.56, 0.80);
        this._light = light;
        light.position = position;
    }
    public _loadWallObstacle(mesh: Mesh): void {
        this.mesh.scaling = new Vector3(1, 1, 1);
        this.mesh.isPickable = false; //so palyer goes through
    }

    public setEmissiveTexture(): void {
        //for his game he uses this to light the lantern if the player hits it.

        this.isTouched = true;
        //make a random material generator for the walls.
        //swap texture
        // Create and add a glow layer to the mesh
        this._glowbox.addIncludedOnlyMesh(this.mesh);
        this.mesh.material = this._lightmtl;
        this._light.intensity = 30;
    }
}