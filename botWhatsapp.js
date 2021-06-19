require('dotenv').config()
const ethers = require('ethers');
const dateTime = require('node-datetime');
const dt = dateTime.create();
const {Builder, By, Key, until} = require('selenium-webdriver');

//BOT WHATSAPP START =========================================



const fs = require('fs');
const { Client } = require('whatsapp-web.js');

const SESSION_FILE_PATH = '../session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}

const client = new Client({ puppeteer: { headless: true }, session: sessionCfg });


client.initialize();

client.on('qr', (qr) => {
    // NOTE: This event will not be fired if a session is specified.
    console.log('QR RECEIVED', qr);
});

client.on('authenticated', (session) => {
    console.log('AUTHENTICATED', session);
    sessionCfg=session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        if (err) {
            console.error(err);
        }
    });
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessfull
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', () => {
    console.log('READY');
});



client.on('message', msg => {
    // console.log('MESSAGE RECEIVED', msg);
    if (msg.body === 'help') {
      // Send a new message as a reply to the current one
      msg.reply('Command : \n 1. *!target* YourTargetToken\n 2. *!buy* ContractAddress\n 3. *!swap* TokenWillYouSwap\n 4. *!price* ContractAddress\n 5. *!trade* -t ContractAd -tp ValueTP\n');

    } if (msg.body.startsWith('!target ')) {
        const target = msg.body.split(' ')[1];
        msg.reply('Target Token Accepted\nNotification will be send after buyying process successful !!! ');
        // console.log("BOT STARTED !!!")

    // TOKEN BUY TARGET BOT-==================================
        const addresses = {
            WBNB: `${process.env.WBNB}`,
            TARGET : `${target}`,
            factory: `${process.env.FACTORY}`, 
            router: `${process.env.ROUTER}`,
            recipient: `${process.env.RECEIPENT}`
        }
        
        
        const privateKey = `${process.env.PRIVATE_KEY}`;
        const mygasPrice = ethers.utils.parseUnits(`${process.env.GWEI}`, 'gwei');
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
        //SEND INFORMATION BOT STARTED MESSAGE ======
        client.sendMessage(msg.from, `🟢 BOT STARTED !!!`);
        // END MESSAGE FUNCTION
        
        
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
                    
                    //SEND INFORMATION TOKEN TARGET FOUND MESSAGE ======
                    client.sendMessage(msg.from, `📢 *Token Target Found* !\n${addresses.TARGET}`);
                    // END MESSAGE FUNCTION




                    //APPROVE ----------------------------------------------------------------
                    const wbnb1 = new ethers.Contract(
                        addresses.WBNB,
                        [
                          'function approve(address spender, uint amount) public returns(bool)',
                        ],
                        account
                      );
                    console.log(`Before Approve`);

                    //SEND INFORMATION BEFORE APPROVE MESSAGE ======
                    client.sendMessage(msg.from, '📢 Waiting For Approving');
                    // END MESSAGE FUNCTION

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

                        //SEND INFORMATION AFTER APPROVE MESSAGE ======
                        client.sendMessage(msg.from, '📢 Approved !');
                        // END MESSAGE FUNCTION


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
                      
                      console.log(`Buying new token
                        =================
                        tokenIn: ${amountIn} ${tokenIn} (WBNB)
                        tokenOut: ${amountOutMin} ${tokenOut}
                      `);
        

                      //SEND INFORMATION BEFORE BUYYING MESSAGE ======
                      client.sendMessage(msg.from, ` 📢 Buyying Target !\n====================\n *tokenIn* : ${ethers.utils.formatEther(amountIn)} ${tokenIn} (WBNB)\n *tokenOut* : ${ethers.utils.formatEther(amountOutMin)} ${tokenOut}\n`);
                      // END MESSAGE FUNCTION


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
                      
                      //SEND INFORMATION AFTER BUYYING MESSAGE ======
                      client.sendMessage(msg.from, `📢 Token Bought Successful !\n *tx* : https://www.bscscan.com/tx/${receipt.logs[1].transactionHash}`);
                      // END MESSAGE FUNCTION

                    }
                    testtx();
        
                    
        
                }
        
        
              
            }catch(e){
                console.log(e)
            }
        });

    // TOKEN BUY TERGET END ===============================


        

    } if (msg.body.startsWith('!buy ')) {
      const token = msg.body.split(' ')[1];
      msg.reply(`Notification will be send after buyying process successful !!! `);
      // console.log("BOT STARTED !!!")

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
      //SEND INFORMATION BOT STARTED MESSAGE ======
      client.sendMessage(msg.from, `🟢 BUY BOT STARTED !!!`);
      // END MESSAGE FUNCTION
      

      //APPROVE ----------------------------------------------------------------
      const wbnb1 = new ethers.Contract(
          addresses.WBNB,
          [
            'function approve(address spender, uint amount) public returns(bool)',
          ],
          account
        );
      console.log(`Before Approve`);

      //SEND INFORMATION BEFORE APPROVE MESSAGE ======
      client.sendMessage(msg.from, '📢 Waiting For Approving');
      // END MESSAGE FUNCTION

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

          //SEND INFORMATION AFTER APPROVE MESSAGE ======
          client.sendMessage(msg.from, '📢 Approved !');
          // END MESSAGE FUNCTION


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


        //SEND INFORMATION BEFORE BUYYING MESSAGE ======
        client.sendMessage(msg.from, `📢 Buyying Target !\n ====================\n *tokenIn* : ${amountIn} ${tokenIn} (WBNB)\n *tokenOut* : ${amountOutMin} ${tokenOut}\n`);
        // END MESSAGE FUNCTION


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
        
        //SEND INFORMATION AFTER BUYYING MESSAGE ======
        client.sendMessage(msg.from, `📢 Token Bought Successful !\n *tx* : https://www.bscscan.com/tx/${receipt.logs[1].transactionHash}`);
        // END MESSAGE FUNCTION

      }
      testtx();
     

  // TOKEN BUY TERGET END ===============================


      

    } if (msg.body.startsWith('!swap ')) {
      const token = msg.body.split(' ')[1];
      msg.reply(`Notification will be send after swapping process successful !!! `);
      // console.log("BOT STARTED !!!")

  // TOKEN SWAP TARGET BOT-==================================
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
      //SEND INFORMATION BOT STARTED MESSAGE ======
      client.sendMessage(msg.from, `🟢 BUY BOT STARTED !!!`);
      // END MESSAGE FUNCTION
      
      
      //APPROVE ----------------------------------------------------------------
      const targetnya = new ethers.Contract(
          addresses.TARGET,
          [
            'function approve(address spender, uint amount) public returns(bool)',
          ],
          account
        );
      console.log(`Before Approve`);

      //SEND INFORMATION BEFORE APPROVE MESSAGE ======
      client.sendMessage(msg.from, '📢 Waiting For Approving');
      // END MESSAGE FUNCTION

      const valueToapprove = ethers.utils.parseUnits('0.7', 'ether');
      const init = async () => {
       

          const tx = await targetnya.approve(
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

          //SEND INFORMATION AFTER APPROVE MESSAGE ======
          client.sendMessage(msg.from, '📢 Approved !');
          // END MESSAGE FUNCTION


      } 

      init();
      
      //BUY ----------------------------------------------------------------
      

      const testtx = async () => {

      console.log(`after testtx`);

      let tokenIn = addresses.TARGET , tokenOut = addresses.WBNB;
      
        
        const amountIn = ethers.utils.parseUnits(`${process.env.AMMOUNT_IN}`, 'ether');
        const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
        //Our execution price will be a bit different, we need some flexbility
        const amountOutMin = amounts[1].sub(amounts[1].div(process.env.AMMOUNT_OUT_MIN));
        
        console.log(`
          Buying new token
          =================
          tokenIn: ${amountIn} ${tokenIn}
          tokenOut: ${amountOutMin} ${tokenOut} (WBNB)
        `);


        //SEND INFORMATION BEFORE BUYYING MESSAGE ======
        client.sendMessage(msg.from, `📢 Swapping To WBNB !\n ====================\n *tokenIn* : ${ethers.utils.formatEther(amountIn)} ${tokenIn}\n *tokenOut* : ${ethers.utils.formatEther(amountOutMin)} ${tokenOut} (WBNB)\n`);
        // END MESSAGE FUNCTION


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
        
        //SEND INFORMATION AFTER BUYYING MESSAGE ======
        client.sendMessage(msg.from, `📢 Token Swapped Successful !\n *tx* : https://www.bscscan.com/tx/${receipt.logs[1].transactionHash}`);
        // END MESSAGE FUNCTION

      }
      testtx();
     

  // TOKEN BUY TERGET END ===============================


      

    } if (msg.body.startsWith('!price ')) {
      const token = msg.body.split(' ')[1];

      (async function example() {
        let driver = await new Builder().forBrowser('firefox').build();
        try {
          await driver.get(`https://charts.bogged.finance/?token=${token}`);
        
          await driver.wait(until.titleContains('$')).then(async (result) => {
            // persenturun = await result.getText()
            console.log(result)
        }).catch((err) => {
            console.log(err.name)
        });
          let persennaik, persenturun
   
          await driver.wait(until.elementLocated(By.className('dark:text-error-bright')), 10000).then(async (result) => {
              persenturun = await result.getText()
              console.log(persenturun)
          }).catch((err) => {
              console.log(err.name)
          });
          
          await driver.wait(until.elementLocated(By.className('dark:text-success-bright')), 10000).then(async (result) => {
              persennaik = await result.getText()
              console.log(persennaik)
          }).catch((err) => {
              console.log(err.name)
          });

          var titles = await driver.getTitle()
          if(!persennaik){
              console.log('turun')
              msg.reply(`\n📊 *LATEST PRICE* \n\n=========================\n\n📉 Price Decreased ${persenturun}\n💵 ${titles}\n`);
          }else if(!persenturun){
              console.log('naik')
              msg.reply(`\n📊 *LATEST PRICE* \n\n=========================\n\n📈 Price Increased ${persennaik}\n💵 ${titles}\n`);
          }

         
        } finally {
          await driver.quit();
        }
      })();


    } if (msg.body.startsWith('!trade ')) {
      // command !trade -t YourInputToken -tp YourTakeProfitvalue
      const token = msg.body.split(' ')[2];
      const tp = msg.body.split(' ')[4];
      msg.reply(`TP Target Adjusted !\nToken : ${token}\nTP : ${tp}\n\n Please wait until TP value achieved ...`);
      (async function example() {
        let driver = await new Builder().forBrowser('firefox').build();
        try {
          await driver.get(`https://charts.bogged.finance/?token=${token}`);
          
   
          await driver.wait(until.elementLocated(By.className('dark:text-error-bright')), 10000).then(async (result) => {
              persenturun = await result.getText()
              console.log(persenturun)
          }).catch((err) => {
              console.log(err.name)
          });
          
          await driver.wait(until.elementLocated(By.className('dark:text-success-bright')), 10000).then(async (result) => {
              persennaik = await result.getText()
              console.log(persennaik)
          }).catch((err) => {
              console.log(err.name)
          });
          
          targetvalue = tp.slice(0, -3)

          await driver.wait(until.titleContains(targetvalue)).then(async(result) => {
           console.log(result)

            // TAKE PROFIT HERE ===================================
            msg.reply(`\n📊 *Target Has Been Achieved!* \n\n=========================\n\n📈 Price Increased ${persennaik}\n💵 ${tp}\n`);
            
            // TOKEN SWAP TP BOT-==================================
              const addresses = {
                  WBNB: `${process.env.WBNB}`,
                  TARGET : `${token}`,
                  factory: `${process.env.FACTORY}`, 
                  router: `${process.env.ROUTER}`,
                  recipient: `${process.env.RECEIPENT}`
              }
              
              
              const privateKey = `${process.env.PRIVATE_KEY}`;
              const mygasPrice = ethers.utils.parseUnits(`${process.env.GWEI}`, 'gwei');
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
              //SEND INFORMATION BOT STARTED MESSAGE ======
              client.sendMessage(msg.from, `🟢 TRADE TP BOT STARTED !!!`);
              // END MESSAGE FUNCTION
              
              
              //APPROVE ----------------------------------------------------------------
              const targetnya = new ethers.Contract(
                  addresses.TARGET,
                  [
                    'function approve(address spender, uint amount) public returns(bool)',
                  ],
                  account
                );
              console.log(`Before Approve`);

              //SEND INFORMATION BEFORE APPROVE MESSAGE ======
              client.sendMessage(msg.from, '📢 Waiting For Approving');
              // END MESSAGE FUNCTION

              const valueToapprove = ethers.utils.parseUnits('0.7', 'ether');
              const init = async () => {
              

                  const tx = await targetnya.approve(
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

                  //SEND INFORMATION AFTER APPROVE MESSAGE ======
                  client.sendMessage(msg.from, '📢 Approved !');
                  // END MESSAGE FUNCTION


              } 

              init();
              
              //BUY ----------------------------------------------------------------
              

              const testtx = async () => {

              console.log(`after testtx`);

              let tokenIn = addresses.TARGET , tokenOut = addresses.WBNB;
              
                
                const amountIn = ethers.utils.parseUnits(`${process.env.AMMOUNT_IN}`, 'ether');
                const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
                //Our execution price will be a bit different, we need some flexbility
                const amountOutMin = amounts[1].sub(amounts[1].div(process.env.AMMOUNT_OUT_MIN));
                
                console.log(`
                  Buying new token
                  =================
                  tokenIn: ${amountIn} ${tokenIn}
                  tokenOut: ${amountOutMin} ${tokenOut} (WBNB)
                `);


                //SEND INFORMATION BEFORE BUYYING MESSAGE ======
                client.sendMessage(msg.from, `📢 Swapping To WBNB !\n ====================\n *tokenIn* : ${ethers.utils.formatEther(amountIn)} ${tokenIn}\n *tokenOut* : ${ethers.utils.formatEther(amountOutMin)} ${tokenOut} (WBNB)\n`);
                // END MESSAGE FUNCTION


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
                
                //SEND INFORMATION AFTER BUYYING MESSAGE ======
                client.sendMessage(msg.from, `📢 Token Swapped Successful !\n *tx* : https://www.bscscan.com/tx/${receipt.logs[1].transactionHash}`);
                // END MESSAGE FUNCTION

              }
              testtx();
            

          // TOKEN SWAP TP END ===============================


          }).catch((err) => {
            console.log(err)
          });
 
        } finally {
          await driver.quit();
        }
      })();
     
      
    }
});







//BOT WHATSAPP END ===========================================