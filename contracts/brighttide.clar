;; BrightTide - Community Project Fundraising Platform

;; Constants
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INVALID-AMOUNT (err u101))
(define-constant ERR-CAMPAIGN-NOT-FOUND (err u102))
(define-constant ERR-CAMPAIGN-EXPIRED (err u103))
(define-constant ERR-INVALID-GOAL (err u104))
(define-constant ERR-INVALID-DURATION (err u105))

;; Data Variables
(define-data-var next-campaign-id uint u1)

;; Data Maps
(define-map Campaigns
  { campaign-id: uint }
  {
    name: (string-ascii 100),
    goal: uint,
    deadline: uint,
    creator: principal,
    raised: uint,
    active: bool
  }
)

(define-map DonorRewards
  { campaign-id: uint, donor: principal }
  {
    total-donated: uint,
    reward-level: uint,
    achievements: (list 10 uint)
  }
)

;; Public Functions

;; Create a new fundraising campaign
(define-public (create-campaign (name (string-ascii 100)) (goal uint) (duration uint))
  (let 
    (
      (campaign-id (var-get next-campaign-id))
      (deadline (+ block-height duration))
    )
    ;; Validate inputs
    (asserts! (> goal u0) (err ERR-INVALID-GOAL))
    (asserts! (> duration u0) (err ERR-INVALID-DURATION))
    
    (map-set Campaigns
      { campaign-id: campaign-id }
      {
        name: name,
        goal: goal,
        deadline: deadline,
        creator: tx-sender,
        raised: u0,
        active: true
      }
    )
    (var-set next-campaign-id (+ campaign-id u1))
    (ok campaign-id)
  )
)

;; Make a donation to a campaign
(define-public (donate (campaign-id uint) (amount uint))
  (let
    (
      (campaign (unwrap! (map-get? Campaigns {campaign-id: campaign-id}) ERR-CAMPAIGN-NOT-FOUND))
      (current-rewards (default-to 
        { total-donated: u0, reward-level: u0, achievements: (list) }
        (map-get? DonorRewards {campaign-id: campaign-id, donor: tx-sender})))
    )
    (asserts! (get active campaign) ERR-CAMPAIGN-EXPIRED)
    (asserts! (>= amount u1000000) ERR-INVALID-AMOUNT)
    (asserts! (<= block-height (get deadline campaign)) ERR-CAMPAIGN-EXPIRED)
    
    ;; Transfer STX from sender
    (try! (stx-transfer? amount tx-sender (get creator campaign)))
    
    ;; Update campaign totals
    (map-set Campaigns
      {campaign-id: campaign-id}
      (merge campaign 
        {
          raised: (+ (get raised campaign) amount),
          active: (and (get active campaign) (<= block-height (get deadline campaign)))
        }
      )
    )
    
    ;; Update donor rewards
    (map-set DonorRewards
      {campaign-id: campaign-id, donor: tx-sender}
      (merge current-rewards 
        {
          total-donated: (+ (get total-donated current-rewards) amount),
          reward-level: (calculate-reward-level (+ (get total-donated current-rewards) amount))
        }
      )
    )
    
    (ok true)
  )
)

;; Close a campaign (only creator can call)
(define-public (close-campaign (campaign-id uint))
  (let ((campaign (unwrap! (map-get? Campaigns {campaign-id: campaign-id}) ERR-CAMPAIGN-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get creator campaign)) ERR-NOT-AUTHORIZED)
    (map-set Campaigns
      {campaign-id: campaign-id}
      (merge campaign {active: false})
    )
    (ok true)
  )
)

;; Read-only Functions

;; Get campaign details
(define-read-only (get-campaign (campaign-id uint))
  (ok (map-get? Campaigns {campaign-id: campaign-id}))
)

;; Get donor rewards
(define-read-only (get-donor-rewards (campaign-id uint) (donor principal))
  (ok (map-get? DonorRewards {campaign-id: campaign-id, donor: donor}))
)

;; Check if campaign is active
(define-read-only (is-campaign-active (campaign-id uint))
  (match (map-get? Campaigns {campaign-id: campaign-id})
    campaign (ok (and (get active campaign) (<= block-height (get deadline campaign))))
    (err ERR-CAMPAIGN-NOT-FOUND)
  )
)

;; Private Functions

;; Calculate reward level based on donation amount
(define-private (calculate-reward-level (amount uint))
  (cond
    (>= amount u1000000000) u4 ;; Diamond (1000 STX)
    (>= amount u100000000) u3  ;; Gold (100 STX)
    (>= amount u10000000) u2   ;; Silver (10 STX)
    (>= amount u1000000) u1    ;; Bronze (1 STX)
    true u0
  )
)
