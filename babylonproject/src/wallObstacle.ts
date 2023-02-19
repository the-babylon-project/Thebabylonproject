import {
    Scene,
    Color3,
    Mesh,
    Vector3,
    PointLight,
    PBRMetallicRoughnessMaterial,
} from "@babylonjs/core";

//THIS WILL BE THE WALLOBSTACLE CLASS
export class WallObstacle {
    //this has a lightmaterial we can swap to when hit, a mesh, a scene, a position that we can use for validation,
    //and a position.

    private _scene: Scene;
    public mesh: Mesh;
    public isTouched: boolean = false;
    private _lightmtl: PBRMetallicRoughnessMaterial;
    private _light: PointLight;
    constructor(lightmtl: PBRMetallicRoughnessMaterial, mesh: Mesh, scene: Scene, position: Vector3) {
        this._scene = scene;
        this._lightmtl = lightmtl;
        this.mesh = mesh;


        //load the wall to do something with it.
        this._loadWallObstacle(mesh, position);
        //sets the position param.
        const light = new PointLight("wall light", this.mesh.getAbsolutePosition(), this._scene);
        light.intensity = 4;
        light.radius = 2;
        light.diffuse = new Color3(0.16, 0.90, 0.80);
        this._light = light;
    }
    public _loadWallObstacle(mesh: Mesh, position: Vector3): void {
        this.mesh.scaling = new Vector3(1, 1, 1);
        this.mesh.isPickable = false; //so player goes through
        this.mesh.setAbsolutePosition(position)

    }

    public setEmissiveTexture(): void {
        //for his game he uses this to light the lantern if the player hits it.

        this.isTouched = true;
        //swap texture
        this.mesh.material = this._lightmtl;
        this._light.intensity = 30;
    }
}