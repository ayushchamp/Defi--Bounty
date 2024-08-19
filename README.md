# Bounty - Write a DeFi Script

## Project Overview
This script demonstrates how to interact with Uniswap & Aave protocol. The script first swaps USDC for LINK on Uniswap, then supplies the LINK tokens to Aave to earn interest.

### Key Functionalities:

1. **Token Swap via Uniswap**: The script performs a token exchange from USDC to LINK using Uniswap's decentralized exchange.
2. **Deposit into Aave**: Post-swap, the LINK tokens are supplied to the Aave protocol to start earning yield.

## Workflow Diagram

Below is a simplified flowchart depicting the steps taken by the script, from token swap to depositing into Aave:
![bvsub](https://github.com/user-attachments/assets/53b4047c-57af-41ad-b4dd-fce40afe6cf1)

### Detailed Process:

1. **Setup and Initialization**:
   - Environment variables are loaded using `dotenv`.
   - Essential contract addresses and token details are defined.
   - A provider and signer are initialized for interaction with the blockchain.
   - Contract instances for the relevant Uniswap and Aave protocols are created.

2. **Token Approval**:
   - The script first authorizes the Uniswap router contract to spend USDC tokens on behalf of the user.
   - Function: `approveToken(tokenAddress, tokenABI, amount, wallet)`

3. **Pool Discovery**:
   - It then identifies the appropriate pool on Uniswap for the USDC-LINK trading pair.
   - Function: `getPoolInfo(factoryContract, tokenIn, tokenOut)`

4. **Swap Parameter Preparation**:
   - The script prepares the necessary parameters for conducting the token swap.
   - Function: `prepareSwapParams(poolContract, signer, amountIn)`

5. **Executing the Swap**:
   - The script performs the actual token swap on Uniswap.
   - Function: `executeSwap(swapRouter, params, signer)`

6. **Lending Pool Approval**:
   - Post-swap, the script approves the Aave lending pool contract to manage the LINK tokens.
   - Function: `authorizeLendingPool(tokenAddress, amount, wallet)`

7. **Depositing to Aave**:
   - Finally, the swapped LINK tokens are deposited into Aave to start earning interest.
   - Function: `supplyToAave(lendingPool, amount, tokenAddress, wallet)`

8. **Executing the Main Script**:
   - The main function coordinates the process, starting from token swap to deposit.
   - Function: `main(swapAmount)`

## Expected Terminal Output

Upon successful execution, the final output should look similar to this:
![image](https://github.com/user-attachments/assets/2459b662-dad4-45a6-9925-e734b4a75873)

## Conclusion

This script serves as an example of how to integrate and automate interactions between Uniswap and Aave, enabling you to perform token swaps and start earning yield with minimal effort. Feel free to adapt the script to explore additional DeFi protocols and customize its functionality for your specific needs.

## How to Use

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/YourUsername/DeFi-Integration-Script.git
   ```

2. **Install Required Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env` file in the root directory and add your environment variables:
   ```bash
    RPC_URL="sepolia rpc url from infura"
    PRIVATE_KEY="wallet private key"
   ```

4. **Run the Script**:
   ```bash
   node index.js
   ```
