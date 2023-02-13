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
        const gravity = new BABYLON.Vector3(0, 0, 0);
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
        sphere.position.z = 25;
        // Create a material for the sphere
        const material = new StandardMaterial("material", scene);
        material.emissiveColor = new Color3(1, 1, 1);
        material.emissiveIntensity = 1.0;
        material.specularColor = new Color3(0, 0, 1);
        // material.diffuseTexture = new Texture("./assets/textures.png", scene);
        const glowLayer = new GlowLayer('glow', scene);
        glowLayer.addIncludedOnlyMesh(sphere);
        glowLayer.intensity = 1.0;
        glowLayer.blurKernelSize = 64;
        glowLayer.customEmissiveColorSelector = (mesh, subMesh, material, result) => {
            result.set(2, 1, 1, 1);
        };

        // Apply the material to the sphere
        sphere.material = material;

        //Setup Physics
        sphere.physicsImpostor = new BABYLON.PhysicsImpostor(sphere, BABYLON.PhysicsImpostor.SphereImpostor, {
            mass: 0,
            friction: 0,
            restitution: 0.000000001
        }, scene);
        // ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, {
        //     mass: 0,
        //     friction: 0,
        //     restitution: 0.7
        // }, scene);

        function createWallObs(){

            // Generate random x and y positions for the center of the window
            const randomX = Math.floor(Math.random() * 96 - 42);
            const randomY = Math.floor(Math.random() * 100 -6);
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

            const bottomWallHeight = startPointBot
            const bottomWallY = startPointBot / 2;

            // Create the four walls
            const leftWallOb = BABYLON.MeshBuilder.CreatePlane("leftWallOb", {width: leftWallWidth, height: 100}, scene);
            leftWallOb.position.x = leftWallX;
            leftWallOb.position.y = 50;

            const rightWallOb = BABYLON.MeshBuilder.CreatePlane("rightWallOb", {width: rightWallWidth, height: 100}, scene);
            rightWallOb.position.x = rightWallX;
            rightWallOb.position.y = 50;

            const topWallOb = BABYLON.MeshBuilder.CreatePlane("topWallOb", {width: 12, height: topWallHeight}, scene);
            topWallOb.position.x = randomX;
            topWallOb.position.y = topWallY;
            topWallOb.material = material;

            const bottomWallOb = BABYLON.MeshBuilder.CreatePlane("bottomWallOb", {width: 12, height: bottomWallHeight}, scene);
            bottomWallOb.position.x = randomX;
            bottomWallOb.position.y = bottomWallY;
            bottomWallOb.material = material;
            // Merge the four meshes into one
            const leaderWall = new BABYLON.Mesh("leaderWall", scene);
            leftWallOb.parent = leaderWall;
            rightWallOb.parent = leaderWall;
            topWallOb.parent = leaderWall;
            bottomWallOb.parent = leaderWall;
            // leaderWall.physicsImpostor = new BABYLON.PhysicsImpostor(leaderWall, BABYLON.PhysicsImpostor.BoxImpostor, {
            //     mass: 0,
            //     friction: 0,
            //     restitution: 0
            // }, scene);

            leaderWall.position.z = 100;
            startLeaderWallAnimation(leaderWall);

            return leaderWall;
        }
        var newWallOb = createWallObs();
        function startLeaderWallAnimation(newWallOb) {
            // Define the initial distance between walls and speed
            let distanceBetweenWalls = 10;
            let speed = 0.05;


            const frameRate = 3;
            const leaderWallAnimation = new BABYLON.Animation("zSlide", "position", frameRate, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
            const keyFrames = [];
            const path = [];
            const movement = 0;
            for (let z = 500; z >= movement; z -= 25) {
                path.push(new Vector3(0, 50, z));
            }
            for (let i = 0; i < path.length; i++) {
                keyFrames.push({
                    frame: i,
                    value: path[i]
                });
            }
            // Set the animation keys
            leaderWallAnimation.setKeys(keyFrames);

            // Set the animation speed ratio:
            leaderWallAnimation.speedRatio = speed;

            // Attach the animation to the leader wall
            newWallOb.animations.push(leaderWallAnimation);

            // Start the animation and increase the speed and distance between walls based on time
            setInterval(() => {
                // Increase the animation speed by 0.01
                speed += 1;
                leaderWallAnimation.speedRatio = speed;

                // Increase the distance between walls by a factor of 1.5
                distanceBetweenWalls *= 1.5;

                // Update the animation keys
                // keys[1].value = newWallOb.position.z - distanceBetweenWalls;
                // leaderWallAnimation.setKeys(path);

            }, 10000); // Run the function every 10 seconds
        }

// Call the function to start the animation

        // const newWallOb = createWallObs();
        // startLeaderWallAnimation(newWallOb);

        function makeWallandMove() {
            // Set the interval for generating walls (in milliseconds)
            const interval = 10000;

            // Set the time to run the loop for (in milliseconds)
            const totalTime = 60000;

            // Get the current time
            const startTime = Date.now();

            // Loop until the total time has elapsed
            while (Date.now() - startTime < totalTime) {
                const newWall = createWallObs();
                startLeaderWallAnimation(newWall);
                if (Date.now() % interval === 0) {
                    setTimeout(() => newWall.dispose(), 15000); // Dispose of the wall after 10 seconds
                }
            }
        }

        let isSpaceKeyPressed = false;
        let isLeftPressed = false;
        let isRightPressed = false;
        const sphereSpeed = .9;

        // const sphereSpeed = 0;
        const sphereHorizontal = 1;
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
        window.addEventListener("keydown", (event) => {
            if (event.altKey && event.shiftKey && event.ctrlKey && event.code === "KeyI") {
                if (scene.debugLayer.isVisible()) {
                    scene.debugLayer.hide();
                } else {
                    scene.debugLayer.show();
                }
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
                const physicsImpostor = sphere.physicsImpostor;
                const upwardImpulse = new BABYLON.Vector3(0, 3, 0); // Change the Y value to adjust the strength of the impulse
                physicsImpostor.applyImpulse(upwardImpulse, sphere.getAbsolutePosition());

            }
            //     sphere.position.y += sphereSpeed * 6;
            // }
            // //     else {
            // //     sphere.position.y -= sphereSpeed;
            // // }
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