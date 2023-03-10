import Arena from "@colyseus/arena";
import { monitor } from "@colyseus/monitor";

import { FFRoom } from "./rooms/Room";

export default Arena({
    getId: () => "Foo Flighters Server",

    initializeGameServer: (gameServer) => {
        gameServer.define('ff_room', FFRoom);

    },

    initializeExpress: (app) => {
        app.get("/", (req, res) => {
            res.send("Ready to foo flight!");
        });

        // TODO protect this route with Password
        app.use("/colyseus", monitor());
    },

    beforeListen: () => {
    }
});