import { Room, Client } from "colyseus";
import { PlayerState } from "./schema/PlayerState";
import { RoomState } from "./schema/RoomState";

export class FFRoom extends Room<RoomState> {
  maxClients = 2;

  onCreate (options: any) {
    console.log("Foo Flighters Room created.");
    this.setState(new RoomState());

    this.onMessage("type", (client, message) => {
      this.onMessage("updatePosition", (client, data) => {
        console.log("update received -> ");
        console.debug(JSON.stringify(data));
        const player = this.state.players.get(client.sessionId);
        player.xPos = data["x"];
        player.yPos = data['y'];
    });
    });

  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    
    const player = new PlayerState(client);
    const FLOOR_SIZE = 500;
    player.xPos = -(FLOOR_SIZE/2) + (Math.random() * FLOOR_SIZE);
    player.yPos = -1;

    // place player in the map of players by its sessionId
    // (client.sessionId is unique per connection!)
    this.state.players.set(client.sessionId, player);

    console.log("new player =>", player.toJSON());
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
