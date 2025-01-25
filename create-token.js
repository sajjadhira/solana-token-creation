const {
  Connection,
  Keypair,
  clusterApiUrl,
} = require("@solana/web3.js");
const { createMint, getOrCreateAssociatedTokenAccount, mintTo } = require("@solana/spl-token");
const {
  irysStorage,
  keypairIdentity,
  Metaplex,
} = require("@metaplex-foundation/js");

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
  const mint = await createMint(
    connection,          // Solana connection
    payer,               // Payer for transaction fees
    payer.publicKey,     // Mint authority (who can mint new tokens)
    null,                // Freeze authority (optional, null disables freezing)
    decimals             // Number of decimal places
  );

  mintAddress = mint.toBase58();
  console.log(`Mint Address: ${mint.toBase58()}`);

  // Create an Associated Token Account for the payer
  // Step 3: Create an Associated Token Account for the payer
  const payerTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,         // Solana connection
    payer,              // Payer for transaction fees
    mint,               // Mint address of the token
    payer.publicKey     // Owner of the token account
  );

  console.log(`Token Account: ${payerTokenAccount.address.toBase58()}`);

  // Mint tokens to the payer's token account
  const amount = 1000000000 * 10000000; // Number of tokens to mint
    await mintTo(
    connection,          // Solana connection
    payer,               // Payer for transaction fees
    mint,                // Mint address
    payerTokenAccount.address, // Token account to receive the tokens
    payer.publicKey,     // Mint authority
    amount               // Number of tokens to mint
  );
  console.log(
    `Minted ${amount / Math.pow(10, decimals)} tokens to account ${
      payerTokenAccount.address.toBase58()
    }`
  );

  console.log("Token created successfully!");

    // Initialize Metaplex
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(payer))
    .use(irysStorage({
        address: "https://devnet.bundlr.network", // Bundlr endpoint
        providerUrl: clusterApiUrl("devnet"),    // Solana Devnet URL
        timeout: 60000,                          // Request timeout
      })); // Use Bundlr for decentralized storage

  // Define metadata for your token
  const metadata = {
    name: "CRYPTOPAIR",      // Token name
    symbol: "CRP",               // Token symbol
    uri: "https://inihub.com/metadata.json", // Link to token metadata (JSON file)
    sellerFeeBasisPoints: 0,      // Royalties (e.g., 500 = 5%)
    creators: [
      {
        address: payer.publicKey, // Creator's wallet address
        share: 100,                          // Share percentage (100% = full ownership)
      },
    ],
  };

  // Create or update metadata on-chain
  try {
    const { nft } = await metaplex.nfts().create({
      mintAddress,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
      sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
      creators: metadata.creators,
    });


    console.log(nft);

    console.log("Metadata updated successfully!");
    console.log("Token Address:", nft.mintAddress);
    console.log("Metadata URI:", nft.uri);
  } catch (error) {
    console.error("Failed to update metadata:", error);
  }


})();
