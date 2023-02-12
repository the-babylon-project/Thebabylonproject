import React, {useRef, useEffect} from 'react';
import {
    Color3,
    Engine,
    FreeCamera, GlowLayer,
    HemisphericLight,
    Mesh,
    MeshBuilder,
    Scene, SceneLoader, StandardMaterial, Texture,
    Vector3
} from '@babylonjs/core';
// import * as GUI from "@babylonjs/gui";
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import 'babylonjs-loaders';
window.CANNON = require( 'cannon' );

const mystyle = {
    height: "100%",
    width: "100%"
}
//TODO: investigate time requirements for modeling
//TODO: pull apart necessary functions and implement xmachina for state event processing.
//TODO: et al.
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
        const light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        const ground = MeshBuilder.CreateGround("ground", {width: 100, height: 10000}, scene);
        ground.position.z = 4900;
        // todo:
        // ground.absolutePosition;
        const gravity = new BABYLON.Vector3(0, 0, 1);
        scene.enablePhysics(gravity, new BABYLON.CannonJSPlugin(true, 10));
        // const box = MeshBuilder.CreateBox("track", {
        //     height: 100,
        //     width: 100,
        //     depth: 10000,
        //     sideOrientation: Mesh.BACKSIDE
        // }, scene);
        // box.position.y = 50;
        // box.position.z = 4900;
        // Create the left wall
        const leftWall = BABYLON.MeshBuilder.CreateBox("leftWall", {width: 1, height: 100, depth: 10000}, scene);
        leftWall.position.x = -50;
        leftWall.position.y = 50;
        leftWall.physicsImpostor = new BABYLON.PhysicsImpostor(
            leftWall,
            BABYLON.PhysicsImpostor.BoxImpostor,
            {mass: 0, restitution: 0},
            scene
        );

// Create the right wall
        const rightWall = BABYLON.MeshBuilder.CreateBox("rightWall", {width: 1, height: 100, depth: 10000}, scene);
        rightWall.position.x = 50;
        rightWall.position.y = 50;
        rightWall.physicsImpostor = new BABYLON.PhysicsImpostor(
            rightWall,
            BABYLON.PhysicsImpostor.BoxImpostor,
            {mass: 0, restitution: 0},
            scene
        );
        // Create the ceiling
        const ceiling = BABYLON.MeshBuilder.CreateBox("ceiling", {width: 100, height: 1, depth: 10000}, scene);
        ceiling.position.y = 100;
        ceiling.physicsImpostor = new BABYLON.PhysicsImpostor(
            ceiling,
            BABYLON.PhysicsImpostor.BoxImpostor,
            {mass: 0, restitution: 0},
            scene
        );

        camera.position = new BABYLON.Vector3(0, 25, -75)

        const sphere = new MeshBuilder.CreateSphere("player", {segments: 32, diameter: 2}, scene);

        // Create a material for the sphere
        const material = new StandardMaterial("material", scene);
        material.emissiveColor = new Color3(1, 1, 1);
        material.emissiveIntensity = 1.0;
        material.specularColor = new Color3(0, 0, 0);
        // material.diffuseTexture = new Texture("./assets/textures.png", scene);
        const glowLayer = new GlowLayer('glow', scene);
        glowLayer.addIncludedOnlyMesh(sphere);
        glowLayer.intensity = 1.0;
        glowLayer.blurKernelSize = 64;
        glowLayer.customEmissiveColorSelector = (mesh, subMesh, material, result) => {
            result.set(1, 1, 1, 1);
        };

        // Apply the material to the sphere
        sphere.material = material;

        //Setup Physics
        sphere.physicsImpostor = new BABYLON.PhysicsImpostor(sphere, BABYLON.PhysicsImpostor.SphereImpostor, {
            mass: 1,
            friction: 1,
            restitution: 0.000000001
        }, scene);
        // ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, {
        //     mass: 0,
        //     friction: 0,
        //     restitution: 0.7
        // }, scene);

        function generateObstacles(scene) {
            const obstacles = [];

            // Set up obstacle options
            const obstacleOptions = [
                {
                    type: 'vertical',
                    width: 5,
                    height: 50,
                    depth: 5,
                },
                {
                    type: 'horizontal',
                    width: 50,
                    height: 5,
                    depth: 5,
                },
                {
                    type: 'diagonal',
                    width: 50,
                    height: 50,
                    depth: 5,
                },
                {
                    type: 'square',
                    width: 50,
                    height: 50,
                    depth: 5,
                },
            ];

            // Generate obstacles with windows
            let lastObstacleZ = -50;
            while (lastObstacleZ < 10000) {
                // Choose a random obstacle type and position
                const obstacle = obstacleOptions[Math.floor(Math.random() * obstacleOptions.length)];
                const position = new BABYLON.Vector3(
                    (Math.random() - 0.5) * 90,  // Random X position
                    Math.random() * 50 + 25,    // Random Y position
                    lastObstacleZ + 100 + Math.random() * 20,  // Spacing between obstacles
                );

                // Create obstacle mesh
                const obstacleMesh = BABYLON.MeshBuilder.CreateBox(
                    `obstacle-${lastObstacleZ}`,
                    obstacle,
                    scene,
                );
                obstacleMesh.position.copyFrom(position);

                // Create window if required
                if (Math.random() < 0.5) {
                    const windowWidth = Math.random() * obstacle.width * 0.8;
                    const windowHeight = Math.random() * obstacle.height * 0.8;
                    const windowDepth = 0.1;
                    const windowPosition = new BABYLON.Vector3(
                        (Math.random() - 0.5) * (obstacle.width - windowWidth),
                        (Math.random() - 0.5) * (obstacle.height - windowHeight),
                        obstacle.depth / 2,
                    );
                    const windowMesh = BABYLON.MeshBuilder.CreateBox(
                        `window-${lastObstacleZ}`,
                        {
                            width: windowWidth,
                            height: windowHeight,
                            depth: windowDepth,
                        },
                        scene,
                    );
                    // Set window physics properties
                    windowMesh.physicsImpostor = new BABYLON.PhysicsImpostor(
                        windowMesh,
                        BABYLON.PhysicsImpostor.BoxImpostor,
                        {mass: 0, restitution: 0},
                        scene,
                    );
                    // Set obstacle physics properties
                    obstacleMesh.physicsImpostor = new BABYLON.PhysicsImpostor(
                        obstacleMesh,
                        BABYLON.PhysicsImpostor.BoxImpostor,
                        {mass: 0, restitution: 0},
                        scene,
                    );
                    windowMesh.position.copyFrom(position.add(windowPosition));
                    windowMesh.parent = obstacleMesh;



                    // // Set material for window
                    // const windowMaterial = new BABYLON.StandardMaterial(`window-material-${lastObstacleZ}`, scene);
                    // windowMaterial.diffuseColor = BABYLON.Color3.Black();
                    // windowMaterial.emissiveColor = BABYLON.Color3.Yellow();
                    // windowMaterial.alpha = 0.5;
                    // windowMesh.material = windowMaterial;
                }
            }
            return obstacles;
        }
        generateObstacles(scene);


        let isSpaceKeyPressed = false;
        let isLeftPressed = false;
        let isRightPressed = false;
        const sphereSpeed = .9;
        const sphereHorizontal = 0.45;
        // Add keyboard event listeners
        window.addEventListener("keydown", (event) => {
            if (event.code === "Space") {
                isSpaceKeyPressed = true;
            }
            if (event.code === "a" || event.code === "ArrowLeft") {
                isLeftPressed = true;
            }
            if (event.code === "d" || event.code === "ArrowRight") {
                isRightPressed = true;
            }
        });

        window.addEventListener("keyup", (event) => {
            if (event.code === "Space") {
                isSpaceKeyPressed = false;
            }
            if (event.code === "ArrowLeft") {
                isLeftPressed = false;
            }
            if (event.code === "68" || event.code === "ArrowRight") {
                isRightPressed = false;
            }
        });

// Render loop
        engine.runRenderLoop(() => {
            const cameraPosition = new BABYLON.Vector3(
                sphere.position.x,
                sphere.position.y + 5,
                sphere.position.z - 15
            );
            camera.position = BABYLON.Vector3.Lerp(camera.position, cameraPosition, 0.01);

            const lookDirection = sphere.position.subtract(camera.position);
            lookDirection.normalize();
            const angleY = Math.atan2(lookDirection.x, lookDirection.z);
            const angleX = -1 * Math.atan2(lookDirection.y, Math.sqrt(lookDirection.x * lookDirection.x + lookDirection.z * lookDirection.z));
            const maxRotation = 30 * Math.PI / 180;
            camera.rotation.y = BABYLON.Scalar.Lerp(
                camera.rotation.y,
                Math.min(Math.max(angleY, -maxRotation), maxRotation),
                0.01
            );
            camera.rotation.x = BABYLON.Scalar.Lerp(
                camera.rotation.x,
                Math.min(Math.max(angleX, -maxRotation), maxRotation),
                0.10
            );
            if (camera.position.x < -25) {
                camera.position.x = -25;
            } else if (camera.position.x > 25) {
                camera.position.x = 25;
            }


            if (isSpaceKeyPressed) {
                sphere.position.y += sphereSpeed/1.5;
            } else {
                sphere.position.y -= sphereSpeed;
            }
            if (isLeftPressed) {
                sphere.position.x -= sphereHorizontal;
            }
            if (isRightPressed) {
                sphere.position.x += sphereHorizontal;
            }
        });
        engine.runRenderLoop(() => {
            scene.render();
        });

        return () => {
            engine.dispose();
        };
    }, []);

    return (
        <canvas ref={canvasRef} style={mystyle}/>
    );
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