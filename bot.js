const ethers = require('ethers');

const addresses = {
    WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    // BUSD: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
    TARGET : '0x983513Ecea8F6D832EDf461A567fa46C38F05D3B',
    factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73', 
    router: '0x10ed43c718714eb63d5aa57b78b54704e256024e',
    recipient: '0x4F2200C7E437F92A2bbB03A5c867b379B72F87B0'
  }


const privateKey = '00a6c4b98b5d2231ac69b376c03ea7ad5735f73f27bc6e39e669856672771f0f';
const mygasPrice = ethers.utils.parseUnits('5', 'gwei');
const provider = new ethers.providers.WebSocketProvider('wss://bsc-ws-node.nariox.org:443');
const wallet = new ethers.Wallet(privateKey);
const account = wallet.connect(provider);

const router = new ethers.Contract(
  addresses.router,
  [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
  ],
  account
);

const wbnb1 = new ethers.Contract(
    addresses.WBNB,
    [
      'function approve(address spender, uint amount) public returns(bool)',
    ],
    account
  );
  
  console.log(`Before Approve`);
  const valueToapprove = ethers.utils.parseUnits('0.01', 'ether');
  const init = async () => {
    const tx = await wbnb1.approve(
      router.address, 
      valueToapprove,
      {
          gasPrice: mygasPrice,
          gasLimit: 210000
      }
    );
    console.log(`After Approve`);
    const receipt = await tx.wait(); 
    console.log('Transaction receipt');
    console.log(receipt);
  } 

  init();
  
  const testtx = async () => {
  console.log(`after testtx`);

  let tokenIn = addresses.WBNB , tokenOut = addresses.TARGET;

  const amountIn = ethers.utils.parseUnits('0.005', 'ether');
  const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
  //Our execution price will be a bit different, we need some flexbility
  const amountOutMin = amounts[1].sub(amounts[1].div(10));

  console.log(`
    Buying new token
    =================
    tokenIn: ${amountIn} ${tokenIn} (WBNB)
    tokenOut: ${amountOutMin} ${tokenOut}
  `);

  const tx = await router.swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    [tokenIn, tokenOut],
    addresses.recipient,
    Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
    {
        gasPrice: mygasPrice,
        gasLimit: 210000
    }
  );
  console.log(`line 115`);
  const receipt = await tx.wait(); 
  console.log('Transaction receipt');
  console.log(receipt);
}
testtx();