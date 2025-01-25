const {
  Connection,
  Keypair,
  clusterApiUrl,
} = require("@solana/web3.js");
const { Token, TOKEN_PROGRAM_ID } = require("@solana/spl-token");

(async () => {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // Generate a Keypair for the payer
  const payerNew = Keypair.generate();
  let payer;

// store the payer information in a file
const fs = require("fs");


// check if the file not exist
if (!fs.existsSync("payer.json")) {

    
const data = {
    payer: {
        publicKey: payerNew.publicKey.toBase58(),
        secretKey: [...payerNew.secretKey],
    },
};

fs.writeFileSync("payer.json", JSON.stringify(data, null, 2));
payer = payerNew;
} else {
// get the payer information from the file
const payerData = JSON.parse(fs.readFileSync("payer.json", "utf-8"));
payer = Keypair.fromSecretKey(Uint8Array.from(payerData.payer.secretKey));
}


console.log("Payer Address: ", payer.publicKey.toBase58());
console.log("Payer Balance: ", await connection.getBalance(payer.publicKey));


let payerBalance = await connection.getBalance(payer.publicKey);


if (payerBalance < 2 * 1e9) {

  // Airdrop SOL to the payer account
  console.log("Airdropping SOL to payer wallet...");
  const airdropSignature = await connection.requestAirdrop(
    payer.publicKey,
    2 * 1e9 // 2 SOL
);
await connection.confirmTransaction(airdropSignature);
  console.log(`Payer Address: ${payer.publicKey.toBase58()}`);
  
console.log("Payer Balance: ", await connection.getBalance(payer.publicKey));
}


  // Create a new Mint
  const decimals = 9;
  const mint = await Token.createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    decimals,
    TOKEN_PROGRAM_ID
  );
  console.log(`Mint Address: ${mint.publicKey.toBase58()}`);

  // Create an Associated Token Account for the payer
  const payerTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
    payer.publicKey
  );
  console.log(`Token Account: ${payerTokenAccount.address.toBase58()}`);

  // Mint tokens to the payer's token account
  const amount = 1e6; // Number of tokens to mint
  await mint.mintTo(payerTokenAccount.address, payer.publicKey, [], amount);
  console.log(
    `Minted ${amount / Math.pow(10, decimals)} tokens to account ${
      payerTokenAccount.address.toBase58()
    }`
  );

  console.log("Token created successfully!");
})();
