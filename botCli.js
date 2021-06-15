const ethers = require('ethers');
const dateTime = require('node-datetime');
const dt = dateTime.create();
const readline = require("readline");


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


rl.question("Token Target ? ", function(target) {
      const addresses = {
          WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',

          TARGET : `${target}`,

          factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73', 
          router: '0x10ed43c718714eb63d5aa57b78b54704e256024e',
          recipient: '0x0E8722F90f8dF231aAD9efe87fDb020c58Fdd455'
      }


      const privateKey = 'Your Privete Key';
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
      const erc = new ethers.Contract(
          addresses.WBNB,
          [{"constant": true,"inputs": [{"name": "_owner","type": "address"}],"name": "balanceOf","outputs": [{"name": "balance","type": "uint256"}],"payable": false,"type": "function"}],
          account
        );  

        const factory = new ethers.Contract(
          addresses.factory,
          [
            'event PairCreated(address indexed token0, address indexed token1, address pair, uint)',
            'function getPair(address tokenA, address tokenB) external view returns (address pair)'
            ],
          account
        ); 

      console.log("BOT STARTED !!!")


      factory.on('PairCreated', async (token0, token1, pairAddress) => {
          var date = await dt.format('d-m-Y');
          var time 
          time = await dt.format('H:M:S');
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
          
            
          try {
              const getPairx = await factory.getPair(tokenIn, tokenOut); 
              const pairBNBvalue = await erc.balanceOf(getPairx);   
              var bnbne = ethers.utils.formatEther(pairBNBvalue);
              console.log(`new token => https://bscscan.com/token/${tokenOut} - liquidity ${bnbne} BNB`);
            
              if(tokenOut === addresses.TARGET){
                  console.log('\n\n=========================================================')
                  console.log('=> TOKEN ', addresses.TARGET, ' -> FOUND')
                  console.log('(', date, '-', time, `) new token => https://bscscan.com/token/${tokenOut} - liquidity ${bnbne} BNB`);
                  console.log('=========================================================\n\n')
                  
                  
                  //APPROVE ----------------------------------------------------------------
                  const wbnb1 = new ethers.Contract(
                      addresses.WBNB,
                      [
                        'function approve(address spender, uint amount) public returns(bool)',
                      ],
                      account
                    );
                  console.log(`Before Approve`);
                  const valueToapprove = ethers.utils.parseUnits('0.005', 'ether');
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
                  
                  //BUY ----------------------------------------------------------------

                  const testtx = async () => {
                  console.log(`after testtx`);

                  let tokenIn = addresses.WBNB , tokenOut = addresses.TARGET;
                  
                  
                    const amountIn = ethers.utils.parseUnits('0.001', 'ether');
                    const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
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
                    const receipt = await tx.wait(); 
                    console.log('Transaction receipt');
                    console.log(receipt);
                  }
                  testtx();



              }


            
          }catch(e){
              console.log(e)
          }
      });
    rl.close();
});


