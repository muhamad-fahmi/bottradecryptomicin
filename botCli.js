require('dotenv').config()
const ethers = require('ethers');
const dateTime = require('node-datetime');
const dt = dateTime.create();
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\nCHOOSE MENU : \n (1) EARLY BUY TARGET \n (2) SWAP TOKEN');

rl.question("\nChoose ? ", function(menu) {
  if(menu == 1){
    

    rl.question("\nToken Target ? ", function(target) {
      //START PROGRAM TARGET 


        const addresses = {
            WBNB: `${process.env.WBNB}`,
            TARGET : `${target}`,
            factory: `${process.env.FACTORY}`, 
            router: `${process.env.ROUTER}`,
            recipient: `${process.env.RECEIPENT}`
        }
        
        
        const privateKey = `${process.env.PRIVATE_KEY}`;
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
                // GET TOKEN DETAIL
                const daiAddress = `${tokenOut}`;
                const daiAbi = [
                  // Some details about the token
                  "function name() view returns (string)",
                  "function symbol() view returns (string)",
                  // Get the account balance
                  "function balanceOf(address) view returns (uint)",
                  // Send some of your tokens to someone else
                  "function transfer(address to, uint amount)",
                  // An event triggered whenever anyone transfers to someone else
                  "event Transfer(address indexed from, address indexed to, uint amount)"
                ];

                const daiContract = new ethers.Contract(daiAddress, daiAbi, provider);
                var name = await daiContract.name()
                var symbol = await daiContract.symbol()
                
                var balanceTokenout = await daiContract.balanceOf(tokenOut)

                console.log(`new token => https://bscscan.com/token/${tokenOut} | ${name} | ${symbol} - liquidity ${bnbne} BNB `);

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
                            gasPrice: ethers.utils.parseUnits(`${process.env.GWEI_APPROVE}`, 'gwei'),
                            gasLimit: process.env.GAS_LIMIT_APPROVE
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
                      //Our execution price will be a bit different, we need some flexbility
                      const amountOutMin = amounts[1].sub(amounts[1].div(process.env.AMMOUNT_OUT_MIN));
        
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
                          gasPrice: ethers.utils.parseUnits(`${process.env.GWEI_SWAP}`, 'gwei'),
                          gasLimit: process.env.GAS_LIMIT_SWAP
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


      //END PROGRAM TARGET 

      rl.close();
    });
    

  }else if(menu == 2){
    
    rl.question("\nToken Address ? ", function(token) {
      
       // TOKEN BUY TARGET BOT-==================================
        const addresses = {
            WBNB: `${process.env.WBNB}`,
            TARGET : `${token}`,
            factory: `${process.env.FACTORY}`, 
            router: `${process.env.ROUTER}`,
            recipient: `${process.env.RECEIPENT}`
        }
        
        
        const privateKey = `${process.env.PRIVATE_KEY}`;
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
      
        console.log("BUY BOT STARTED !!!")
        
        

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
              gasPrice: ethers.utils.parseUnits(`${process.env.GWEI_APPROVE}`, 'gwei'),
              gasLimit: process.env.GAS_LIMIT_APPROVE
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
        
        
          const amountIn = ethers.utils.parseUnits(`${process.env.AMMOUNT_IN}`, 'ether');
          const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
          //Our execution price will be a bit different, we need some flexbility
          const amountOutMin = amounts[1].sub(amounts[1].div(process.env.AMMOUNT_OUT_MIN));
          
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
              gasPrice: ethers.utils.parseUnits(`${process.env.GWEI_SWAP}`, 'gwei'),
              gasLimit: process.env.GAS_LIMIT_SWAP
            }
          );
          const receipt = await tx.wait(); 
          console.log('Transaction receipt');
          console.log(receipt);
          
        }
        testtx();
      

    // TOKEN BUY TERGET END ===============================

      rl.close();
    });
    

  }else{
    console.log('COMMAND IS INVALID !')
    process.exit(1);
  }
  

  
  
  
});



