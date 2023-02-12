import {MapSchema, Schema, type, SetSchema, defineTypes} from "@colyseus/schema"
// const schema = require('@colyseus/schema');
// const Schema = schema.Schema;
export class Player extends Schema{

}
export class MyRoomState extends Schema{

}

defineTypes(Player, {
  x: "number",
  y: "number",
  z: "number"
})

defineTypes(MyRoomState, {
  map: Player = new MapSchema()
})
// export class Player extends Schema {

//     @type("number") x: number;
//     @type("number") y: number;
//     @type("number") z: number;
// }

// export class MyRoomState extends Schema {
//   @type({ map: Player }) players = new MapSchema<Player>();
// }
