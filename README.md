# PaperRegistry — Contract API

**Deployed address (local Hardhat network):** `0x5FbDB2315678afecb367f032d93F642f64180aa3`
**Network:** Hardhat local (chainId 31337). Amoy address TBD — will update before final demo.
**ABI:** `contracts-shared/PaperRegistry.json`

## Roles
- **admin** — deployer address. Can register centers, add committee members, call `simulateTime`.
- **examBoard** — set at deploy time. Only address that can upload papers.
- **registered centers** — whitelisted by admin via `registerCenter`. Only these can call `requestKey`.

## Write functions

### `uploadPaper(string cid, string fileHash, uint256 examTimestamp, string subject) → uint256 paperId`
- Caller must be `examBoard`, else reverts `"Not authorized: not Exam Board"`.
- `examTimestamp` must be in the future, else reverts `"Exam time must be in the future"`.
- Emits `PaperUploaded(paperId, cid, fileHash, examTimestamp, subject)`.

### `requestKey(uint256 paperId) → bool`
- Caller must be a registered center, else reverts `"Not authorized: center not registered"`.
- Reverts `"Paper does not exist"` if `paperId` is invalid.
- **Does not revert on early request** — if `block.timestamp < examTimestamp`, emits `AccessAttempted(paperId, sender, false, "Too early")` and returns `false`. Check the return value (or the event), don't rely on a try/catch.
- If time has passed, emits `AccessAttempted(paperId, sender, true, "Granted")` and returns `true`.

### `registerCenter(address centerAddress)`
- Caller must be `admin`, else reverts `"Not authorized: not admin"`.
- Emits `CenterRegistered(centerAddress)`.

### `addCommitteeMember(address member)` *(stretch)*
- Caller must be `admin`.

### `approvePaper(uint256 paperId)` *(stretch)*
- Caller must be a committee member, else reverts `"Not a committee member"`.
- Reverts `"Already approved"` on double-approval from the same member.
- At 2 approvals, paper status flips to `Approved`.
- Emits `PaperApproved(paperId, approver, totalApprovals)`.

### `simulateTime(uint256 paperId, uint256 newExamTimestamp)` *(demo only)*
- Caller must be `admin`. Overwrites the exam timestamp — used to fast-forward past the time-lock on stage.

## Read functions

### `getPaper(uint256 paperId) → Paper`
Returns the full struct: `{ cid, fileHash, examTimestamp, subject, status, approvals }`.

### `papers(uint256)`, `registeredCenters(address)`, `committeeMembers(address)`, `paperCount()`
Public mappings/vars — auto-generated getters, callable directly.

## Events (source of truth for the Audit Trail)
| Event | Fields |
|---|---|
| `PaperUploaded` | `paperId, cid, fileHash, examTimestamp, subject` |
| `AccessAttempted` | `paperId, requester, success, reason` — fires on **both** success and denial |
| `PaperApproved` | `paperId, approver, totalApprovals` |
| `CenterRegistered` | `center` |

## Notes for Member B (backend `/decrypt`)
- Before releasing the decrypted file, call `requestKey` (or read the `AccessAttempted` event it emits) and check `success == true`. A `false` return means genuinely denied — no revert to catch.
- Read-only checks (`block.timestamp >= examTimestamp`, `registeredCenters[addr]`) can be done directly via `getPaper()` and `registeredCenters()` without spending gas on a full `requestKey` call, if you just need to pre-validate before showing UI state.

## Notes for Member C (frontend)
- Call `uploadPaper`, `requestKey`, `registerCenter`, `simulateTime` directly via ethers.js + MetaMask.
- Build the Audit Trail by listening for/querying all four events — `AccessAttempted` is the only one that fires on failed attempts too, so don't filter it down to successes only.