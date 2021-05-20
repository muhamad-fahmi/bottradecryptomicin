/*
DWYOR
-no slip
-no auto approve
-auto beli scam token 🤣
original script by eattheblocks
npm install ethers
node earlybuy.js
*/

const ethers = require('ethers');
const bigNumber = require('bignumber');


const addresses = {
  WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
//  BUSD: '0x55d398326f99059ff775485246999027b3197955', gabisa, pake wbnb dulu
  factory: '0xca143ce32fe78f1f7019d7d551a6402fc5350c73', //ini v1 > '0xBCfCcbde45cE874adCB698cC183deBcF17952812',
  router: '0x10ED43C718714eb63d5aA57B78B54704E256024E', //ini v1 >'0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F',0x10ED43C718714eb63d5aA57B78B54704E256024E
  recipient: '0x0E8722F90f8dF231aAD9efe87fDb020c58Fdd455' //address walletmu
};
                
const mnemonic = '00a6c4b98b5d2231ac69b376c03ea7ad5735f73f27bc6e39e669856672771f0f'; //privatekey tanpa 0
//const jumlahbeli = 0.003; //WBNB pake yg di bawah aja
// const provider = new ethers.providers.EtherscanProvider('ropsten', mi-api-key);

const provider = new ethers.providers.WebSocketProvider('wss://bsc-ws-node.nariox.org:443'); //private node lebih gud
const wallet = new ethers.Wallet(mnemonic);
const account = wallet.connect(provider);

// 0x0E8722F90f8dF231aAD9efe87fDb020c58Fdd455
// console.log(wallet);


const factory = new ethers.Contract(
  addresses.factory,
  [
    'event PairCreated(address indexed token0, address indexed token1, address pair, uint)',
    'function getPair(address tokenA, address tokenB) external view returns (address pair)'
    ],
  account
); 



const erc = new ethers.Contract(
  addresses.WBNB,
  [{"constant": true,"inputs": [{"name": "_owner","type": "address"}],"name": "balanceOf","outputs": [{"name": "balance","type": "uint256"}],"payable": false,"type": "function"}],
  account
);  

const router = new ethers.Contract(
  addresses.router,
  [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
  ],
  account
);

// console.log(router);

console.log('BOT STARTED - Semoga opit');
factory.on('PairCreated', async (token0, token1, pairAddress) => {
  // console.log(`
  // NEW PAIR DETECTED
  // =================
  // token0 = ${token0}
  // token1 = ${token1}
  // pairadress = ${pairAddress}


  // `)
  let tokenIn, tokenOut;
  if(token0 === addresses.WBNB) {
    tokenIn = token0;
    tokenOut = token1;
  }

  if(token1 == addresses.WBNB) {
    tokenIn = token1;
    tokenOut = token0;
  }

  if(typeof tokenIn === 'undefined') {
    return;
  }

  const amountIn = ethers.utils.parseUnits('0.003', 'ether'); //jumalh beli pakai WBNB
try {
  
  //const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]); 
  const getPairx = await factory.getPair(tokenIn, tokenOut); 
  const pairBNBvalue = await erc.balanceOf(getPairx); 
  var bnbne = ethers.utils.formatEther(pairBNBvalue);

  //debug
  //console.log(pairBNBvalue);
  console.log(tokenOut);
  console.log(`new token => https://bscscan.com/token/${tokenOut} - liquidity ${bnbne} BNB`);
  
  //var targettoken = '0xxxxxxxxxxxxx'; //targettoken isi targettoken kalian
  //if(tokenOut === targettoken){ //kalo pake ini hapus komen, di line 129 juga
  if(pairBNBvalue > 10000000000000000000){ //minimal liquidity 25 BNB https://eth-converter.com
  //console.log(`address LP ${getPairx} -  LIQ ${bnbne} BNB`)
  
  //const amountOutMin = amounts[1].sub(amounts[1].div(10));
  //console.log(amountOutMin)
  const tx = await router.swapExactTokensForTokens(
    amountIn,
    0,
    [tokenIn, tokenOut],
    addresses.recipient,
    Date.now() + 1000 * 60 * 10, //10m,
    {
        'gasLimit': 30000,
        'gasPrice': ethers.utils.parseUnits('5', 'gwei'),
    }
  );
  // let gasPrice = await provider.getGasPrice();
  // console.log('gas : ', gasPrice.toString())

  // let gasLimit = 21000;

  // let gas = gasPrice.mul(gasLimit);
  // console.log("gas limit : ", gas.toString());
  
  // gas = ethers.utils.formatEther(gas);

  // console.log("wallet gas : ", gas);
  console.log(`new token => https://bscscan.com/token/${tokenOut} - liquidity ${bnbne} BNB`);
  console.log('BUYING');
  
//   //HAPUS KOMEN KALO MAU AKTIFIN BUY
 const receipt = await tx.wait();
 console.log('transaction receipt!')

  console.log(`tx: https://www.bscscan.com/tx/${receipt.logs[1].transactionHash}`);
  
const tokennya = new ethers.Contract(
  tokenOut,
   ['function approve(address spender, uint256 amount) external returns (bool)'],
   account
);  
// console.log(tokennya);
const approve = await tokennya.approve(
    addresses.router, //pancakerouter
    ethers.constants.MaxUint256, //max approve
    {
        'gasLimit': 30000,
        'gasPrice': ethers.utils.parseUnits('5', 'gwei'),
    }
  );

//      //HAPUS KOMEN KALO MAU AKTIFIN APPROVE
  const approvereceipt = await approve.wait();
  console.log('approved');
  console.log(`approve tx: https://bscscan.com/tx/${approvereceipt.logs[1].transactionHash}`); //gamuncul kenapa?? w ga pro nodejs
  console.log('Nunggu token baru...');
  process.exit(); //panik mode, kasih komen biar jalan trus
    // }
  }
  
} catch(error) { 
console.log(error);
} 
});




