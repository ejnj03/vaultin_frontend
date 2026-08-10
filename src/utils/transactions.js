import { erc20Abi } from 'viem';
import { CHAIN_IDS_INT } from './constants'

function isNativeToken(tokenAddress) {
    return tokenAddress === "0x0000000000000000000000000000000000000000"
}

export async function get_quote(apiCall, { fromNetwork, fromToken, toNetwork, toToken, recipient, fromAmount, toAmount, urgency, preference, userData, walletCapabilities } = {}) {
    //for now: defaulting to atomic quote if possible 
    //check if atomic is possible for the corresponding chain id 
    const userAddr = userData.address
    const from_chain = CHAIN_IDS_INT[fromNetwork]
    let atomic = false // whether to batch txns (and sig)
    if (walletCapabilities?.[userAddr]?.[from_chain] && 'atomic' in walletCapabilities[userAddr][from_chain]) {
        atomic = true
    }
    //calls the api which returns how to execute transfer
    try {
        return await apiCall('txns/get-quote', {
            method: 'POST',
            service: 'payments',
            body: {
                recipient,
                fromNetwork,
                toNetwork,
                fromToken,
                toToken,
                ...(fromAmount && { fromAmount }),
                ...(toAmount && { toAmount }),
                ...(urgency && { urgency }),
                ...(preference && { preference }),
                atomic
            }
        })
    } catch (err) {
        console.log(err)
        return null
    }
}

export async function execute_quote(apiCall, quote, txnDetails, { sendTransactionAsync, writeContractAsync, switchChainAsync }, gasOverrides = {}) {
    if (quote.type == 'sameChain_sameToken') {
        await execute_sameChain_sameToken(apiCall, quote, txnDetails, { sendTransactionAsync, writeContractAsync, switchChainAsync }, gasOverrides)
    }
}


// Execute a pre-built contracts array (swap / cross-token transfers)
// contracts should already have maxFeePerGas/maxPriorityFeePerGas from augmentContracts
export async function execute_swap(apiCall, contracts, txnDetails, { swapGasParams, writeContractAsync, switchChainAsync, publicClient, sendCallsAsync }, chainId, onStageChange, atomic=true) {
    await switchChainAsync({ chainId });
    let txnHash = null
    let bundleId = null
    //if atomic is enabled
    if (atomic) {
        const totalGas = contracts.reduce((sum, c) => sum + (c.gas ? BigInt(c.gas) : 0n), 0n)
        bundleId = await sendCallsAsync({
            calls: contracts,
            ...(totalGas > 0n && { gas: totalGas }),
            ...(swapGasParams && {
                maxFeePerGas: swapGasParams.maxFeePerGas,
                maxPriorityFeePerGas: swapGasParams.maxPriorityFeePerGas,
            }),
        })
    } else {
        const needsApproval = contracts.length > 1;
        let txnHash;
        for (let i = 0; i < contracts.length; i++) {
            if (needsApproval && i === 0) onStageChange?.('waiting_approval');
            if (needsApproval && i === contracts.length - 1) onStageChange?.('confirming');
            if (!needsApproval && i === 0) onStageChange?.('confirming');

            txnHash = await writeContractAsync(contracts[i]);
            console.log('contract txn hash:', txnHash);
            // Wait for confirmation before sending the next contract call (e.g. approve before swap)
            if (i < contracts.length - 1) {
                onStageChange?.('confirming_approval');
                await publicClient.waitForTransactionReceipt({ hash: txnHash });
            }
        }
    }

    if (txnHash || bundleId) {
        const { transferReason, fromAmount, toAmount, fromNetwork, fromToken, toNetwork, toToken, recipient } = txnDetails;
        const data = await apiCall('txns/log-txn', {
            method: 'POST',
            service: 'payments',
            body: {
                ...(txnHash && { txnHash }),
                ...(bundleId && { bundleId }),
                ...(transferReason && { transferReason }),
                ...(recipient && { recipient }),
                ...(fromAmount && { fromAmount }),
                ...(toAmount && { toAmount }),
                fromNetwork,
                fromToken,
                toNetwork,
                toToken,
            }
        });
        console.log(data);
        return data;
    }
}

async function execute_sameChain_sameToken(apiCall, quote, txnDetails, { sendTransactionAsync, writeContractAsync, switchChainAsync }, gasOverrides = {}) {
    //initiates the transfer ->  calls api to store txn details once pending is set to false
    const recipient = quote.recipientAddress
    const amount = BigInt(quote.toAmount) // already in base units from API
    const { tokenAddress, chainId } = quote.metadata;

    //switch wallet to the correct chain before sending
    await switchChainAsync({ chainId });

    //check if is native token (sol or eth)
    let txnHash;

    try {
        if (isNativeToken(tokenAddress)) {
            txnHash = await sendTransactionAsync({
                to: recipient,
                value: amount,
                chainId,
                ...gasOverrides,
            })
        } else {
            //is an ERC20 token
            txnHash = await writeContractAsync({
                address: tokenAddress,
                abi: erc20Abi,
                functionName: 'transfer',
                args: [recipient, amount],
                ...gasOverrides,
            })
        }
        console.log("txn hash: ", txnHash)
    } catch (err) {
        console.log(err)
        return
    }
    const {transferReason, fromAmount, toAmount, fromNetwork, fromToken, toNetwork, toToken} = txnDetails
    //calls the api which logs the txn in the db
    const data = await apiCall('txns/log-txn', {
        method: 'POST',
        service: 'payments',
        body: {
            txnHash,
            transferReason,
            recipient,
            ...(fromAmount && { fromAmount }),
            ...(toAmount && { toAmount }),
            fromNetwork,
            fromToken,
            toNetwork,
            toToken
        }
    })
    console.log(data)
    return data
}

export async function updateStatus(apiCall, txnHash, status) {
    //checks the status of the transfer and updates db state if successful
    const data = await apiCall('txns/update-state', {
        method: 'POST',
        service: 'payments',
        body: { txnHash, status }
    })
    console.log(data)
    return data
}
