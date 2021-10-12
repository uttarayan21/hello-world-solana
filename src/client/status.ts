import {
    Keypair,
    Connection,
    PublicKey,
    LAMPORTS_PER_SOL,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction,
} from '@solana/web3.js';

import axios from 'axios';
import fs from 'mz/fs';
import path from 'path';
import * as borsh from 'borsh';

import {getPayer, getRpcUrl, createKeypairFromFile} from './utils';


let connection: Connection;

let payer: Keypair;

let programId: PublicKey;

let statusPubkey: PublicKey;

const PROGRAM_PATH = path.resolve(__dirname, '../../dist/program')

const PROGRAM_SO_PATH = path.join(PROGRAM_PATH, 'hellosolana.so')

const PROGRAM_KEYPAIR_PATH = path.join(PROGRAM_PATH, 'hellosolana-keypair.json')


class StatusAccount {
     repos = 0;
     constructor(fields: {repos:number} | undefined = undefined) {
         if (fields) {
             this.repos = fields.repos
         }
     }

}

const StatusSchema = new Map([
    [StatusAccount, {kind: 'struct', fields: [['repos', 'u32']]}],
]);

const STATUS_SIZE = borsh.serialize(StatusSchema, new StatusAccount(),).length;


export async function establishConnection(): Promise<void> {
    const rpcUrl = await getRpcUrl();
    connection = new Connection(rpcUrl, 'confirmed');
    const version = await connection.getVersion();
    console.log('Connection to cluster established:', rpcUrl, version);
}

export async function establishPayer(): Promise<void> {
  let fees = 0;
  if (!payer) {
    const {feeCalculator} = await connection.getRecentBlockhash();

    // Calculate the cost to fund the greeter account
    fees += await connection.getMinimumBalanceForRentExemption(STATUS_SIZE);

    // Calculate the cost of sending transactions
    fees += feeCalculator.lamportsPerSignature * 100; // wag

    payer = await getPayer();
  }

  let lamports = await connection.getBalance(payer.publicKey);
  if (lamports < fees) {
    // If current balance is not enough to pay for fees, request an airdrop
    const sig = await connection.requestAirdrop(
      payer.publicKey,
      fees - lamports,
    );
    await connection.confirmTransaction(sig);
    lamports = await connection.getBalance(payer.publicKey);
  }

  console.log(
    'Using account',
    payer.publicKey.toBase58(),
    'containing',
    lamports / LAMPORTS_PER_SOL,
    'SOL to pay for fees',
  );
}

export async function checkProgram(): Promise<void> {
    try {
        const programKeypair = await createKeypairFromFile(PROGRAM_KEYPAIR_PATH);
        programId = programKeypair.publicKey;
    } catch(err) {
        const errorMessage = (err as Error).message;
        throw new Error(`Failed to read program keypair at '${PROGRAM_KEYPAIR_PATH}' due to error: ${errorMessage}. Program may need to be deployed with \`yarn run deploy\``,);
    }

    const programInfo = await connection.getAccountInfo(programId);
    if (programInfo === null) {
        if (fs.existsSync(PROGRAM_SO_PATH)) {
            throw new Error(
                'Program needs to be deployed with `yarn run deploy`',
            );
        } else {
            throw new Error(
                'Program needs to be built and deployed with `yarn run build` and `yarn run deploy`',
            );
        }
    } else if(!programInfo.executable) {
        throw new Error('Program is not executable');
    }
    console.log(`Using program ${programId.toBase58()}`);

    const GREETING_SEED = 'hello';
    statusPubkey = await PublicKey.createWithSeed(
    payer.publicKey,
    GREETING_SEED,
    programId,
    );

    // Check if the greeting account has already been created
    const statusAccount = await connection.getAccountInfo(statusPubkey);
    if (statusAccount === null) {
        console.log(
          'Creating account',
          statusPubkey.toBase58(),
          'to store your github public repos',
        );
        const lamports = await connection.getMinimumBalanceForRentExemption(
          STATUS_SIZE,
        );

        const transaction = new Transaction().add(
          SystemProgram.createAccountWithSeed({
            fromPubkey: payer.publicKey,
            basePubkey: payer.publicKey,
            seed: GREETING_SEED,
            newAccountPubkey: statusPubkey,
            lamports,
            space: STATUS_SIZE,
            programId,
          }),
        );
        await sendAndConfirmTransaction(connection, transaction, [payer]);
    }
}


export async function setStatus(): Promise<void> {
    const url: string = 'https://api.github.com/users/uttarayan21';
    let response;
    try {
        response = await axios.get<any>(url);
    } catch (exception) {
        throw new Error(`ERROR received from ${url}: ${exception}\n`);
    }
    let public_repos = response.data.public_repos;

    const instruction = new TransactionInstruction({
        keys: [
            {
                pubkey: statusPubkey,
                isSigner: false,
                isWritable: true,
            }
        ],
        programId,
        data: Buffer.from(longToByteArray(public_repos)),
    });
    console.log(longToByteArray(public_repos));
    await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [payer],
    );

}


function longToByteArray(long: number) {
    var byteArray = [0, 0, 0, 0];

    for ( var index = 0; index < byteArray.length; index ++ ) {
        var byte = long & 0xff;
        byteArray [ index ] = byte;
        long = (long - byte) / 256 ;
    }

    return byteArray;
};
