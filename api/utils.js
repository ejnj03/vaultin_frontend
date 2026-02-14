export function categorizeAddress(nameTag) {
  const tag = nameTag.toLowerCase()
  
  // Governance
  if (tag.includes('governor')) {
    return { category: 'GOVERNANCE', subcategory: 'Governor'}
  }
  if (tag.includes('owner')) {
    return { category: 'GOVERNANCE', subcategory: 'Owner' }
  }
  if (tag.includes('registry')) {
    return { category: 'GOVERNANCE', subcategory: 'Registry' }
  }
  
  // Treasury
  if (tag.includes('multisig')) {
    return { category: 'TREASURY', subcategory: 'MultiSig' }
  }
  if (tag.includes('vesting')) {
    return { category: 'TREASURY', subcategory: 'Vesting' }
  }
  
  // Development
  if (tag.includes('deployer')) {
    return { category: 'DEVELOPMENT', subcategory: 'Deployer' }
  }
  if (tag.includes('dev utils')) {
    return { category: 'DEVELOPMENT', subcategory: 'Dev Utils' }
  }
  
  // Token
  if (tag.includes('staking')) {
    return { category: 'TOKEN', subcategory: 'Staking' }
  }
  if (tag.includes('vault')) {
    return { category: 'TOKEN', subcategory: 'Vault' }
  }
  if (tag.includes('token') && !tag.includes('transfer')) {
    return { category: 'TOKEN', subcategory: 'Token' }
  }
  
  // Usage - subdivided
  if (tag.includes('exchange')) {
    return { category: 'USAGE', subcategory: 'Exchange' }
  }
  if (tag.includes('bridge')) {
    return { category: 'USAGE', subcategory: 'Bridge' }
  }
  if (tag.includes('transformer')) {
    return { category: 'USAGE', subcategory: 'Transformer' }
  }
  if (tag.includes('forwarder')) {
    return { category: 'USAGE', subcategory: 'Forwarder' }
  }
  if (tag.includes('proxy')) {
    return { category: 'USAGE', subcategory: 'Proxy' }
  }
  if (tag.includes('validator')) {
    return { category: 'USAGE', subcategory: 'Validator' }
  }
  
  // Legacy
  if (tag.includes('old')) {
    return { category: 'LEGACY', subcategory: 'Deprecated' }
  }
  
  return { category: 'OTHER', subcategory: '' }
}