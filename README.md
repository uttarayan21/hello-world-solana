## Hello World Solana

Simple hello world program for the solana blockchain

This gets number of public_repos in a github account and stores it to the solana blockchain.

Contains the on-chain rust program and the typescript client program.

Needs 
- rust
- solana (`sh -c "$(curl -sSfL https://release.solana.com/v1.8.0/install)"`)
- node
- yarn/npm

Change the `setStatus(<username>)` in src/client/main.ts

To run it.

```bash
solana config set --url localhost
solana-keygen new
solana-test-validator

cd hello-world-solana

yarn install
yarn run build
yarn run deploy
yarn run start
```
