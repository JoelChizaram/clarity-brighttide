# BrightTide: Community Project Fundraising Platform

A decentralized fundraising platform built on Stacks that enables community projects to raise funds with gamified donor rewards.

## Features
- Create fundraising campaigns for community projects
- Make donations to campaigns using STX tokens
- Earn donor rewards based on contribution levels
- Track campaign progress and milestones
- View donor leaderboards and achievements

## Setup and Installation
1. Clone the repository
2. Install Clarinet (if not already installed)
3. Run `clarinet check` to verify contracts
4. Run `clarinet test` to run the test suite

## Usage Examples
```clarity
;; Create a new campaign
(contract-call? .brighttide create-campaign 
  "Clean City Parks" 
  u100000000 
  u1000 
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)

;; Make a donation
(contract-call? .brighttide donate 
  u1 ;; campaign ID
  u50000000) ;; amount in STX
  
;; Check donor rewards
(contract-call? .brighttide get-donor-rewards 
  u1  ;; campaign ID
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM) ;; donor address
```

## Dependencies
- Clarity language
- Clarinet for testing and deployment
