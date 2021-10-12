import {
    establishConnection,
    establishPayer,
    checkProgram,
    setStatus,
    reportStatus,
} from './status';

async function main() {
    console.log("Display solana status");

    await establishConnection();

    await establishPayer();

    await checkProgram();

    await setStatus();
    
    await reportStatus();
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
