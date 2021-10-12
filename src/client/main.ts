import {
    establishConnection,
    establishPayer,
    checkProgram,
    setStatus,

} from './status';

async function main() {
    console.log("Display solana status");

    // await establishConnection();

    // await establishPayer();


  // await checkProgram();

  await setStatus();
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
