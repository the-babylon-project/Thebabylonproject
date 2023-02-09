import React, { useRef, useEffect } from 'react';
import {Engine, FreeCamera, HemisphericLight, Mesh, MeshBuilder, Scene, Vector3} from '@babylonjs/core';
import * as GUI from "@babylonjs/gui";
import * as BABYLON from '@babylonjs/core'

const mystyle = {
    height: "100%",
    width: "100%"
}
const Splash = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        // Create the Babylon.js engine and scene
        const engine = new Engine(canvasRef.current, true);
        const scene = new Scene(engine);
        //Camera
        //todo: make arc rotation camera with boundaries
        const camera = new FreeCamera("camera1", new Vector3(0, 5, -20), scene);
        // This targets the camera to scene origin
        camera.setTarget(Vector3.Zero());
        // This attaches the camera to the canvas
        camera.attachControl(canvasRef.current, true);

        //Light
        const light = new HemisphericLight("light1", new Vector3(0,1,0), scene);
        light.intensity = 0.7;

        const ground = MeshBuilder.CreateGround("ground", { width: 100, height: 10000 },  scene);
        ground.position.z = 4900;
        // todo:
        // ground.absolutePosition;

        const box = MeshBuilder.CreateBox("track", { height: 100, width: 100, depth: 10000, sideOrientation: Mesh.BACKSIDE }, scene);
        box.position.y = 50;
        box.position.z = 4900;

        const sphere = MeshBuilder.CreateSphere("player", { diameter: 2, segments: 32 }, scene);
        sphere.position = new Vector3(0, 0, -50);
        const plane = MeshBuilder.CreatePlane("motionPlane", { width: 100, height: 100}, scene);
        plane.position.z = 100;
        plane.position.y = 50;
        plane.isVisible = false;

        // Create an animation for the plane
        const frameRate = 1;
        const zSlide = new BABYLON.Animation("zSlide", "position", frameRate, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
        const keyFrames = [];
        const path = [];
        const movement = 10000;
        for (let z = 0; z <= movement; z += 100) {
            path.push(new Vector3(0, 50, z));
        }
        for (let i = 0; i < path.length; i++) {
            keyFrames.push({
                frame: i,
                value: path[i]
            });
        }
        zSlide.setKeys(keyFrames);
        plane.animations.push(zSlide);
        scene.beginAnimation(plane, 0, path.length - 1, true);

        //Set player as camera parent
        camera.parent = sphere;

        //Make motionPlane the player's daddy
        sphere.parent = plane;

        // Render the scene
        engine.runRenderLoop(() => {
            scene.render();
        });
    }, []);

    return <canvas ref={canvasRef} style={mystyle} />;
};

export default Splash;

// Create a GUI
// const gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("ui1", true, scene);

// const button = GUI.Button.CreateSimpleButton("but", "Login");
// button.width = "150px";
// button.height = "40px";
// button.color = "white";
// button.background = "green";
// button.onPointerUpObservable.add(() => {
//     console.log("Login button clicked");
// });
// gui.addControl(button);