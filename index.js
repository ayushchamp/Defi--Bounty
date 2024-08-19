import { ethers } from "ethers";
import FACTORY_ABI from "./abis/factory.json" assert { type: "json" };
import SWAP_ROUTER_ABI from "./abis/swaprouter.json" assert { type: "json" };
import POOL_ABI from "./abis/pool.json" assert { type: "json" };
import TOKEN_IN_ABI from "./abis/token.json" assert { type: "json" };
import LENDING_POOL_ABI from "./abis/lendingpool.json" assert { type: "json" };
import dotenv from "dotenv";

dotenv.config();

const POOL_FACTORY_CONTRACT_ADDRESS = "0x0227628f3F023bb0B980b67D528571c95c6DaC1c";
const SWAP_ROUTER_CONTRACT_ADDRESS = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";
const LENDING_POOL_ADDRESS = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const factoryContract = new ethers.Contract(
  POOL_FACTORY_CONTRACT_ADDRESS,
  FACTORY_ABI,
  provider
);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const lendingPool = new ethers.Contract(
  LENDING_POOL_ADDRESS,
  LENDING_POOL_ABI,
  signer
);

// Part A - Input Token Configuration
const USDC = {
  chainId: 11155111,
  address: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
  decimals: 6,
  symbol: "USDC",
  name: "USD//C",
  isToken: true,
  isNative: true,
  wrapped: false,
};

const LINK = {
  chainId: 11155111,
  address: "0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5",
  decimals: 18,
  symbol: "LINK",
  name: "Chainlink",
  isToken: true,
  isNative: true,
  wrapped: false,
};

// Helper function
async function getTokenBalance(tokenAddress, wallet) {
  const tokenContract = new ethers.Contract(tokenAddress, TOKEN_IN_ABI, wallet);
  const balance = await tokenContract.balanceOf(wallet.address);
  return ethers.formatUnits(balance, LINK.decimals);
}

// Part B - Write Approve Token Function
async function approveToken(tokenAddress, tokenABI, amount, wallet) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, wallet);
    const approveAmount = ethers.parseUnits(amount.toString(), USDC.decimals);
    const approveTransaction = await tokenContract.approve.populateTransaction(
      SWAP_ROUTER_CONTRACT_ADDRESS,
      approveAmount
    );
    const transactionResponse = await wallet.sendTransaction(
      approveTransaction
    );
    console.log(`-------------------------------`);
    console.log(`Sending Approval Transaction...`);
    console.log(`-------------------------------`);
    console.log(`Transaction Sent: ${transactionResponse.hash}`);
    console.log(`-------------------------------`);
    const receipt = await transactionResponse.wait();
    console.log(
      `Approval Transaction Confirmed! https://sepolia.etherscan.io/tx/${receipt.hash}`
    );
  } catch (error) {
    console.error("An error occurred during token approval:", error);
    throw new Error("Token approval failed");
  }
}

// Part C - Write Get Pool Info Function
async function getPoolInfo(factoryContract, tokenIn, tokenOut) {
  const poolAddress = await factoryContract.getPool(
    tokenIn.address,
    tokenOut.address,
    3000
  );
  if (!poolAddress) {
    throw new Error("Failed to get pool address");
  }
  const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);
  const [token0, token1, fee] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
  ]);
  return { poolContract, token0, token1, fee };
}

// Part D - Write Prepare Swap Params Function
async function prepareSwapParams(poolContract, signer, amountIn) {
  return {
    tokenIn: USDC.address,
    tokenOut: LINK.address,
    fee: await poolContract.fee(),
    recipient: signer.address,
    amountIn: amountIn,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  };
}

// Part E - Write Execute Swap Function
async function executeSwap(swapRouter, params, signer) {
  const linkBalanceBefore = await getTokenBalance(LINK.address, signer);

  // Execute the swap
  const transaction = await swapRouter.exactInputSingle.populateTransaction(
    params
  );
  const transactionResponse = await signer.sendTransaction(transaction);
  console.log(`-------------------------------`);
  console.log(`Transaction Sent: ${transactionResponse.hash}`);
  console.log(`-------------------------------`);

  // Wait for the transaction to be confirmed
  const receipt = await transactionResponse.wait();
  console.log(
    `Transaction Confirmed: https://sepolia.etherscan.io/tx/${receipt.hash}`
  );
  console.log(`-------------------------------`);
  const linkBalanceAfter = await getTokenBalance(LINK.address, signer);
  const swappedAmount = linkBalanceAfter - linkBalanceBefore;
  console.log(`Swapped LINK Amount: ${swappedAmount}`);

  return swappedAmount;
}

async function authorizeLendingPool(tokenAddress, amount, wallet) {
  const tokenContract = new ethers.Contract(tokenAddress, TOKEN_IN_ABI, wallet);
  const approveAmount = ethers.parseUnits(amount.toString(), LINK.decimals);
  console.log(`Approving Lending Pool for ${approveAmount} LINK...`);
  const approveTransaction = await tokenContract.approve.populateTransaction(
    LENDING_POOL_ADDRESS,
    approveAmount
  );

  // Send the approval transaction
  const transactionResponse = await wallet.sendTransaction(approveTransaction);
  // Wait for the transaction to be confirmed
  await transactionResponse.wait();
  console.log("LINK approved for Aave lending.");
}

async function supplyToAave(lendingPool, amount, tokenAddress, wallet) {
  const approveAmount = ethers.parseUnits(amount.toString(), LINK.decimals);
  const tx = await lendingPool.supply(
    tokenAddress,
    approveAmount,
    wallet.address,
    0,
    {
      gasLimit: 900000,
    }
  );
  await tx.wait();
  console.log(`Supply successful https://sepolia.etherscan.io/tx/${tx.hash}`);
}

// Part F - Write Main Function
async function main(swapAmount) {
  const inputAmount = swapAmount;
  const amountIn = ethers.parseUnits(inputAmount.toString(), USDC.decimals);

  try {
    await approveToken(USDC.address, TOKEN_IN_ABI, inputAmount, signer);
    const { poolContract } = await getPoolInfo(factoryContract, USDC, LINK);
    const params = await prepareSwapParams(poolContract, signer, amountIn);
    const swapRouter = new ethers.Contract(
      SWAP_ROUTER_CONTRACT_ADDRESS,
      SWAP_ROUTER_ABI,
      signer
    );
    const swappedAmount = await executeSwap(swapRouter, params, signer);
    await authorizeLendingPool(LINK.address, swappedAmount, signer);
    await supplyToAave(lendingPool, swappedAmount, LINK.address, signer);
  } catch (error) {
    console.error("An error occurred:", error.message);
  }
}

// Enter Swap Amount Below
main(1);
