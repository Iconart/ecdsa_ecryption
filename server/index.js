const secp = require('ethereum-cryptography/secp256k1');
const { keccak256 } = require("ethereum-cryptography/keccak");
const { utf8ToBytes } = require("ethereum-cryptography/utils");
const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "0a04e01cf932a512a6a20fe1792f72932e681af98c21c91b6e443770c55ee118": 100,
  "024285a71e2b90376882e5aba1acda72dd4b1fa1e1b3de4ac07f86f27c8c367aac": 50,
  "03a28ec779c49453e39029f6098f0d38164fee2f1ab5d14f2f6f33180d5b8f92e6": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  // TODO; get a signature  from the client-side application
  // recover the public address for the signature
  const { sender, recipient, amount, signature } = req.body;

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } 
  try {
    const recoveredAddress = recoverAddress(sender, amount, signature);
    if (recoveredAddress.toLowerCase() !== sender.toLowerCase()) {
      res.status(400).send({message: "Invalid signature!"});
      return;
    }

    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({balance: balances[sender] });
  }
  catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({message: "Internal Server Error"});
  }
});

function recoverAddress(sender, amount, signature ){
  const messageHash = keccak256(utf8ToBytes(sender + amount));
  const publicKey = secp.secp256k1.recoverPublicKey(
    messageHash,
    signature,
    recoverybit
  );
  return publicKey;

}

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
