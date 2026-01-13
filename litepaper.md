# DXN Pot — Protocol Overview (Litepaper)

**DXN Pot** is a community-driven Ethereum smart contract system designed to aggregate protocol-generated ETH fees and distribute them to DXN participants through a transparent, deterministic, and verifiable process.

The protocol emphasizes simplicity, sustainability, and alignment with long-term DXN holders.

---

## 1. Overview

DXN Pot aggregates ETH fees generated through DXN-related activity and distributes those fees periodically to participants according to predefined rules.

Rather than relying on continuous automation, the protocol is designed around **manual, community-callable actions** to minimize gas waste, reduce complexity, and maintain transparency.

---

## 2. Core Principles

- **Non-custodial**: Users retain full control of their assets at all times.
- **On-chain transparency**: All balances, distributions, and actions are verifiable on Ethereum.
- **Gas efficiency**: No unnecessary automation or background keepers.
- **Community alignment**: Fee flows benefit DXN holders and the broader ecosystem.
- **Progressive decentralization**: Simple architecture first, extensible over time.

---

## 3. Fee Accumulation

ETH fees are accumulated within the DXN Pot contract from protocol activity.

These fees are divided into:
- **Distribution Pool** — ETH eligible for distribution to participants
- **Buy & Burn Pool** — ETH reserved for DXN buy-and-burn events
- **Maintenance Allowance** — a small capped allocation for long-term protocol sustainability

No continuous withdrawals or automatic swaps occur.

---

## 4. Fee Distribution Execution

Fee distribution is triggered manually via a public function:

> **Execute Fee Distribution**

- Callable by **any address**
- Uses on-chain state only
- Requires no off-chain trust
- Deterministic outcome

This approach allows:
- ETH balances to compound naturally
- Community coordination around execution timing
- Reduced gas overhead compared to automated systems

---

## 5. Buy & Burn Mechanism

A portion of accumulated ETH fees is allocated to a **Buy & Burn Pool**.

Key characteristics:
- Buy & Burn is **manually callable**
- ETH is used to acquire DXN on-chain
- Acquired DXN is **permanently removed from circulation**

Burn destination:
- A provably inaccessible burn address (e.g. `0x000000000000000000000000000000000000dEaD`)

This mechanism reinforces supply reduction while remaining transparent and verifiable.

---

## 6. Randomized Fee Allocation (If Applicable)

When applicable, recipient selection uses deterministic randomness derived from on-chain data available at execution time.

Design goals:
- No oracles required by default
- No privileged actors
- Fully auditable outcomes

The protocol architecture allows for future integration of verifiable randomness systems if the community deems it beneficial.

---

## 7. Governance & Evolution

DXN Pot is intentionally minimal at launch.

Future enhancements may include:
- Improved randomness sources
- Additional distribution strategies
- Parameter adjustments based on community feedback

Any future upgrades are expected to be:
- Explicitly disclosed
- Auditable
- Community-reviewed

---

## 8. Risk Considerations

Users should understand:
- Smart contract risk exists
- Fee distribution timing may vary
- Gas costs are borne by transaction callers
- No guarantees of returns are made

Participation is entirely voluntary.

---

## 9. Disclaimer

DXN Pot is a community-built interface and smart contract system.

- No investment advice is provided
- No profit guarantees are implied
- Users interact at their own discretion and risk

Always verify contract addresses and transactions independently.

---

## 10. Conclusion

DXN Pot is designed to align incentives between DXN holders, protocol activity, and long-term ecosystem health.

By prioritizing transparency, simplicity, and community participation, the protocol aims to provide a sustainable mechanism for fee aggregation and redistribution without unnecessary complexity.

---

**Community-first. Transparent by design. Built for Ethereum.**

