import React, {useRef, useEffect, useState} from 'react';
import {
    Engine,
    FreeCamera,
    HemisphericLight,
    Mesh,
    MeshBuilder,
    Scene,
    Vector3
} from '@babylonjs/core';
// import * as GUI from "@babylonjs/gui";
import * as BABYLON from '@babylonjs/core';
import 'babylonjs-loaders';
window.CANNON = require( 'cannon' );

//TODO: Set space bar dynamic to reverse gravity...can probably set gravity vector as variable
//and throw it in an events function. Have to test this with parent functionality.
//TODO: set left and right mechanics.
//TODO: set ground collision mechanics. (playerCrashed event)
//TODO: add an object to track and set collision.
//TODO: pull apart necessary functions and implement xmachina for state event processing.
//TODO: et al.

const mystyle = {
    height: "100%",
    width: "100%"
}
function useEngine() {
    const canvasRef = useRef(null);
    const [scene, setScene] = useState(null);

    useEffect(() => {
        const engine = new Engine(canvasRef.current, true);
        const newScene = new Scene(engine);
        setScene(newScene);
        engine.runRenderLoop(() => {
            newScene.render();
        });

        return () => {
            engine.dispose();
            newScene.dispose();
        };
    }, []);

    return [canvasRef, scene];
};

const Splash = () => {
    const [canvasRef, scene] = useEngine();

    useEffect(() => {
        if (scene) {
            // Create the Babylon.js engine and scene
            // const engine = new Engine(canvasRef.current, true);
            // const scene = new Scene(engine);
            //Camera
            //todo: make arc rotation camera with boundaries
            const camera = new FreeCamera("camera1", new Vector3(0, 5, -20), scene);
            // This targets the camera to scene origin
            camera.setTarget(Vector3.Zero());
            // This attaches the camera to the canvas
            camera.attachControl(canvasRef.current, true);

            //Light
            const light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
            light.intensity = 0.7;

            const ground = MeshBuilder.CreateGround("ground", {width: 100, height: 10000}, scene);
            ground.position.z = 4900;
            // todo:
            // ground.absolutePosition;

            const box = MeshBuilder.CreateBox("track", {
                height: 100,
                width: 100,
                depth: 10000,
                sideOrientation: Mesh.BACKSIDE
            }, scene);
            box.position.y = 50;
            box.position.z = 4900;

            //create sphere representing player.
            const sphere = MeshBuilder.CreateSphere("player", {diameter: 2, segments: 32}, scene);
            sphere.position = new Vector3(0, 0, -50);

            //create motionPlane
            const motionPlane = new BABYLON.Mesh("motionPlane", scene);
            motionPlane.position.z = 100;
            motionPlane.position.y = 50;
            // motionPlane.isVisible = false;

            // Create an animation for the plane
            const frameRate = 1;
            const zSlide = new BABYLON.Animation("zSlide", "position", frameRate, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
            const keyFrames = [];
            const path = [];
            const movement = 10000;

            for (let z = 0; z <= movement; z += 100) {
                path.push(new BABYLON.Vector3(0, 50, z));
            }


            for (let i = 0; i < path.length; i++) {
                keyFrames.push({
                    frame: i,
                    value: path[i]
                });
            }

            zSlide.setKeys(keyFrames);
            motionPlane.animations.push(zSlide);

            scene.beginAnimation(motionPlane, 0, path.length - 1, true);

            sphere.position = new BABYLON.Vector3(0, 25, -50);

            camera.parent = sphere;
            camera.position = new BABYLON.Vector3(0, 25, -75)


            //Setup Physics
            const gravity = new BABYLON.Vector3(0, -30, 0);
            // const ammo = new AmmoJSPlugin(true);
            // Add the AmmoJSPlugin to the scene
            scene.enablePhysics(gravity, new BABYLON.CannonJSPlugin(true, 10));
            sphere.physicsImpostor = new BABYLON.PhysicsImpostor(sphere, BABYLON.PhysicsImpostor.BoxImpostor, {
                mass: 1,
                restitution: 0.7
            }, scene);
            ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, {
                mass: 0,
                friction: 0,
                restitution: 0.7
            }, scene);
            //Set sphere parent here (after setting imposters) or it won't work.
            sphere.parent = motionPlane;
        }
        ;
        //
        //     engine.runRenderLoop(() => {
        //         scene.render();
        //     });
        //
        //     return () => {
        //         engine.dispose();
        //     };
        // }, []);
        return (
            <canvas ref={canvasRef} style={mystyle}/>
        );
    });
}
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