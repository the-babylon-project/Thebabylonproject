
import { Schema, type } from '@colyseus/schema';
import { Client } from 'colyseus';

export class PlayerState extends Schema {
  @type('string') id: string = 'ID';
	@type('string') username: string = '';

	// Player Position
	@type('number') xPos: number = 0.0;
	@type('number') yPos: number = 0.5;
	@type('number') positionTimestamp: number = 0.0;

	// Player Direction
	@type('number') xDir: number = 0.0;
	@type('number') yDir: number = 0.5;
  
	private _client: Client;

	constructor(client: Client, ...args: any[]) {
		super(args);
		this._client = client;
	}

	public disconnect() {
		this._client.leave();
	}

	public setPosition(position: number[], positionTimestamp: number) {
		this.xPos = position[0];
		this.yPos = position[1];

		this.positionTimestamp = positionTimestamp;
	}

	public setDirection(direction: number[]) {
		this.xDir = direction[0];
		this.yDir = direction[1];
	}
}