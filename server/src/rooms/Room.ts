import { Room, Client } from "colyseus";
import { RoomState } from "./schema/RoomState";

export class FFRoom extends Room<RoomState> {

  onCreate (options: any) {
    this.setState(new RoomState());

    this.onMessage("type", (client, message) => {
      //
      // handle "type" message
      //
    });

  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
