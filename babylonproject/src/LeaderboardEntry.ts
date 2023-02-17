import { ObjectStorageClient} from 'oci-objectstorage';
import * as oci from 'oci-sdk';
import {Region } from 'oci-common';
import {common, ConfigFileAuthenticationDetailsProvider} from "oci-sdk";
import { createReadStream, statSync } from "fs";
import { NodeFSBlob } from "oci-objectstorage";
import * as os from 'oci-objectstorage';
import * as st from 'node:stream'

export interface LeaderboardEntry {
    playerId: string;
    playername: string;
    playerwins: number;
    playerlosses: number;
    playerdraws: number;
    playerwinrate: number;
    playerrank: number;
}

export class LeaderboardEntryImpl implements LeaderboardEntry {
    playerId: string;
    playername: string;
    playerwins: number;
    playerlosses: number;
    playerdraws: number;
    playerwinrate: number;
    playerrank: number;
    private readonly _objectStorageClient: ObjectStorageClient;
    private readonly _bucket: string;
    private readonly _namespace: string;
    private readonly _fileLocation: string

    constructor(entry: LeaderboardEntry) {
        this.playerId = entry.playerId;
        this.playername = entry.playername;
        this.playerwins = entry.playerwins;
        this.playerlosses = entry.playerlosses;
        this.playerdraws = entry.playerdraws;
        this.playerwinrate = entry.playerwinrate;
        this.playerrank = entry.playerrank;
    }
    private _getConfig(): (ConfigFileAuthenticationDetailsProvider) {

        const configurationFilePath = "oci-infra/os_config.txt";
        const configProfile = "DEFAULT";
        const provider: oci.ConfigFileAuthenticationDetailsProvider = new common.ConfigFileAuthenticationDetailsProvider(
            configurationFilePath,
            configProfile
        );
        return provider;
    }

    async updateLeaderboard(entry: LeaderboardEntry, playerDidWin: boolean, playerDidLose: boolean, playerDidDraw: boolean): Promise<LeaderboardEntry[]> {
        const provider = this._getConfig();
        const client = new os.ObjectStorageClient({ authenticationDetailsProvider: provider });
        const request: os.requests.GetObjectRequest = {
            namespaceName: this._namespace,
            bucketName: this._bucket,
            objectName: 'leaderboard.json',
        };
        let leaderboard: LeaderboardEntry[] = [];
        try {
            const response = await client.getObject(request);
            const objectData = response.value.toString();
            leaderboard = JSON.parse(objectData!) as LeaderboardEntry[];
        } catch (error) {
            console.error(`Error fetching leaderboard: ${error}`);
            throw error;
        }
        // Find the player's entry in the leaderboard
        const playerEntry = leaderboard.find((e) => e.playerId === entry.playerId);
        if (playerEntry) {
            // Update the player's stats
            if (playerDidWin) {
                playerEntry.playerwins++;
            }
            if (playerDidLose) {
                playerEntry.playerlosses++;
            }
            if (playerDidDraw) {
                playerEntry.playerdraws++;
            }
            playerEntry.playerwinrate = this._getWinRate();
            leaderboard.push(playerEntry);
            leaderboard = LeaderboardEntryImpl.sortLeaderboard(leaderboard);
        } else {
            // Add a new entry for the player
            const newEntry = new LeaderboardEntryImpl({
                playerId: entry.playerId,
                playername: entry.playername,
                playerwins: 0,
                playerlosses: 0,
                playerdraws: 0,
                playerwinrate: undefined,
                playerrank: 1
            });
            if (playerDidWin) {
                newEntry.playerwins++;
            }
            if (playerDidLose) {
                newEntry.playerlosses++;
            }
            if (playerDidDraw) {
                newEntry.playerdraws++;
            }
            newEntry.playerwinrate = newEntry._getWinRate();
            leaderboard.push(newEntry);
            leaderboard = LeaderboardEntryImpl.sortLeaderboard(leaderboard);
        }

        // Store the updated leaderboard in object storage
        const putObjectRequest: os.requests.PutObjectRequest = {
            namespaceName: this._namespace,
            bucketName: this._bucket,
            putObjectBody: JSON.stringify(leaderboard),
            objectName: 'leaderboard.json',
        };
        try {
            const response = await client.putObject(putObjectRequest);
            console.log(`Leaderboard updated: ${JSON.stringify(leaderboard)}`);
        } catch (error) {
            console.error(`Error updating leaderboard: ${error}`);
            throw error;
        }

        // Return the updated leaderboard
        return leaderboard;
    }

    private _checkNewRank(playerEntry: LeaderboardEntry) {
        if (playerEntry.playerwins >= playerEntry.playerrank * 10) {
            playerEntry.playerrank++;
        }
    }
    private _getWinRate(): number {
        const totalMatches = this.playerwins + this.playerlosses + this.playerdraws;
        if (totalMatches === 0) {
            return 0;
        }
        return (this.playerwins / totalMatches) * 100;
    }

    static sortLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
        return;
        // Sort the leaderboard entries by player wins and return the sorted array
    }
    private _streamToString(stream: st.Readable) {
        let output = "";
        stream.on("data", function (data) {
            output += data.toString();
        });
        stream.on("end", function () {
            return output;
        });
    }
}
