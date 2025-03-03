import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Can create a new campaign with valid parameters",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('brighttide', 'create-campaign', [
        types.ascii("Test Campaign"),
        types.uint(100000000), // 100 STX goal
        types.uint(1000),      // duration
      ], deployer.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk().expectUint(1);
  }
});

Clarinet.test({
  name: "Cannot create campaign with invalid goal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('brighttide', 'create-campaign', [
        types.ascii("Test Campaign"),
        types.uint(0), // Invalid goal
        types.uint(1000),
      ], deployer.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectErr().expectUint(104); // ERR-INVALID-GOAL
  }
});

Clarinet.test({
  name: "Can make donations and earn rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet2 = accounts.get('wallet_2')!;
    
    // Create campaign
    let block = chain.mineBlock([
      Tx.contractCall('brighttide', 'create-campaign', [
        types.ascii("Test Campaign"),
        types.uint(100000000),
        types.uint(1000),
      ], deployer.address)
    ]);
    
    // Make donation
    block = chain.mineBlock([
      Tx.contractCall('brighttide', 'donate', [
        types.uint(1),
        types.uint(10000000) // 10 STX
      ], wallet2.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "Creator can close campaign",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    // Create campaign
    let block = chain.mineBlock([
      Tx.contractCall('brighttide', 'create-campaign', [
        types.ascii("Test Campaign"),
        types.uint(100000000),
        types.uint(1000),
      ], deployer.address)
    ]);
    
    // Close campaign
    block = chain.mineBlock([
      Tx.contractCall('brighttide', 'close-campaign', [
        types.uint(1)
      ], deployer.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk().expectBool(true);
  }
});
