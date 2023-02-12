import {Room} from "@colyseus/core";
import {MyRoomState, Player} from "./MyRoomState.js";

export class MyRoom extends Room {
    maxClients = 2;

    onCreate(options) {
        console.log("MyRoom created!");
        this.setState(new MyRoomState());

        this.onMessage("updatePosition", (client, data) => {
            console.log("update received -> ");
            console.debug(JSON.stringify(data));
            const player = this.state.players.get(client.sessionId);
            player.x = data["x"];
            player.y = data["y"];
            player.z = data["z"];
        })
    }

    onJoin(client, options) {
        console.log(client.sessionId, "joined!")

        const player = new Player();
        const FLOOR_SIZE = 500;
        player.x = -(FLOOR_SIZE/2) + (Math.random() * FLOOR_SIZE);
        player.y = -1;
        player.z = -(FLOOR_SIZE/2) + (Math.random() * FLOOR_SIZE);

        this.state.players.set(client.sessionId, player);
        console.log("new player =>", player.toJSON());
    }

    onLeave(client, consented){
        this.state.players.delete(client.sessionId);
        console.log(client.sessionId, "left!");
    }

    onDispose(){
        console.log("room", this.roomId, "disposing...");
    }
}