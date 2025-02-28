import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Can create a new campaign",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('brighttide', 'create-campaign', [
        types.ascii("Test Campaign"),
        types.uint(100000000), // 100 STX goal
        types.uint(1000),      // duration
        types.principal(wallet1.address)
      ], deployer.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk().expectUint(1);
    
    // Verify campaign details
    let response = chain.callReadOnlyFn(
      'brighttide',
      'get-campaign',
      [types.uint(1)],
      deployer.address
    );
    
    let campaign = response.result.expectOk().expectSome();
    assertEquals(campaign.name, "Test Campaign");
    assertEquals(campaign.goal, "u100000000");
    assertEquals(campaign.creator, wallet1.address);
  }
});

Clarinet.test({
  name: "Can make donations and earn rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;
    
    // Create campaign
    let block = chain.mineBlock([
      Tx.contractCall('brighttide', 'create-campaign', [
        types.ascii("Test Campaign"),
        types.uint(100000000),
        types.uint(1000),
        types.principal(wallet1.address)
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
    
    // Check rewards
    let response = chain.callReadOnlyFn(
      'brighttide',
      'get-donor-rewards',
      [types.uint(1), types.principal(wallet2.address)],
      wallet2.address
    );
    
    let rewards = response.result.expectOk().expectSome();
    assertEquals(rewards['total-donated'], "u10000000");
    assertEquals(rewards['reward-level'], "u2"); // Silver level
  }
});

Clarinet.test({
  name: "Cannot donate to non-existent campaign",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('brighttide', 'donate', [
        types.uint(999),
        types.uint(10000000)
      ], wallet1.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectErr().expectUint(102); // ERR-CAMPAIGN-NOT-FOUND
  }
});
