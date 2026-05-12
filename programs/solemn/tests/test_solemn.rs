//! Integration tests untuk Solemn program
//! Run: `cargo test` atau `cargo test --test test_solemn`

use {
    anchor_lang::{
        solana_program::{
            clock::Clock,
            instruction::Instruction,
            pubkey::Pubkey,
            system_program,
        },
        InstructionData, ToAccountMetas,
    },
    litesvm::LiteSVM,
    solana_keypair::Keypair,
    solana_message::{Message, VersionedMessage},
    solana_signer::Signer,
    solana_transaction::versioned::VersionedTransaction,
};

// =============================================================================
// CONSTANTS
// =============================================================================

const ONE_SOL: u64 = 1_000_000_000;
const STAKE: u64 = 100_000_000; // 0.1 SOL
const ONE_HOUR: i64 = 3600;

// =============================================================================
// HELPERS
// =============================================================================

fn setup_svm() -> LiteSVM {
    let mut svm = LiteSVM::new();
    let bytes = include_bytes!("../../../target/deploy/solemn.so");
    svm.add_program(solemn::id(), bytes).unwrap();
    svm
}

fn now(svm: &LiteSVM) -> i64 {
    svm.get_sysvar::<Clock>().unix_timestamp
}

fn advance_time(svm: &mut LiteSVM, seconds: i64) {
    let mut clock: Clock = svm.get_sysvar();
    clock.unix_timestamp += seconds;
    svm.set_sysvar::<Clock>(&clock);
}

fn promise_pda(promiser: &Pubkey, deadline: i64) -> Pubkey {
    let (pda, _) = Pubkey::find_program_address(
        &[b"promise", promiser.as_ref(), &deadline.to_le_bytes()],
        &solemn::id(),
    );
    pda
}

fn build_tx(
    svm: &LiteSVM,
    ix: Instruction,
    fee_payer: &Pubkey,
    signers: &[&Keypair],
) -> VersionedTransaction {
    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[ix], Some(fee_payer), &blockhash);
    VersionedTransaction::try_new(VersionedMessage::Legacy(msg), signers).unwrap()
}

// =============================================================================
// INSTRUCTION BUILDERS
// =============================================================================

fn ix_create_promise(
    promiser: Pubkey,
    judge: Pubkey,
    charity: Pubkey,
    stake_amount: u64,
    deadline: i64,
) -> Instruction {
    Instruction::new_with_bytes(
        solemn::id(),
        &solemn::instruction::CreatePromise {
            stake_amount,
            deadline,
            judge,
            charity,
        }
        .data(),
        solemn::accounts::CreatePromise {
            promise: promise_pda(&promiser, deadline),
            promiser,
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    )
}

fn ix_approve_promise(promiser: Pubkey, judge: Pubkey, deadline: i64) -> Instruction {
    Instruction::new_with_bytes(
        solemn::id(),
        &solemn::instruction::ApprovePromise {}.data(),
        solemn::accounts::ApprovePromise {
            promise: promise_pda(&promiser, deadline),
            promiser,
            judge,
        }
        .to_account_metas(None),
    )
}

fn ix_reject_promise(
    promiser: Pubkey,
    judge: Pubkey,
    charity: Pubkey,
    deadline: i64,
) -> Instruction {
    Instruction::new_with_bytes(
        solemn::id(),
        &solemn::instruction::RejectPromise {}.data(),
        solemn::accounts::RejectPromise {
            promise: promise_pda(&promiser, deadline),
            charity,
            judge,
        }
        .to_account_metas(None),
    )
}

fn ix_claim_timeout(
    promiser: Pubkey,
    charity: Pubkey,
    caller: Pubkey,
    deadline: i64,
) -> Instruction {
    Instruction::new_with_bytes(
        solemn::id(),
        &solemn::instruction::ClaimTimeout {}.data(),
        solemn::accounts::ClaimTimeout {
            promise: promise_pda(&promiser, deadline),
            charity,
            caller,
        }
        .to_account_metas(None),
    )
}

// =============================================================================
// HAPPY PATH TESTS
// =============================================================================

#[test]
fn test_create_and_approve_promise() {
    let mut svm = setup_svm();
    let promiser = Keypair::new();
    let judge = Keypair::new();
    let charity = Keypair::new();

    svm.airdrop(&promiser.pubkey(), 5 * ONE_SOL).unwrap();
    svm.airdrop(&judge.pubkey(), ONE_SOL).unwrap();

    let deadline = now(&svm) + ONE_HOUR;

    // STEP 1: Create promise
    let create_ix = ix_create_promise(
        promiser.pubkey(),
        judge.pubkey(),
        charity.pubkey(),
        STAKE,
        deadline,
    );
    let tx = build_tx(&svm, create_ix, &promiser.pubkey(), &[&promiser]);
    let res = svm.send_transaction(tx);
    assert!(res.is_ok(), "create_promise failed: {:?}", res.err());

    // Verify SOL locked di PDA
    let promise_addr = promise_pda(&promiser.pubkey(), deadline);
    let promise_balance = svm.get_balance(&promise_addr).unwrap_or(0);
    assert!(
        promise_balance >= STAKE,
        "PDA harusnya nahan minimal {} lamports, dapat {}",
        STAKE,
        promise_balance
    );

    let promiser_before = svm.get_balance(&promiser.pubkey()).unwrap_or(0);

    // STEP 2: Judge approves
    let approve_ix = ix_approve_promise(promiser.pubkey(), judge.pubkey(), deadline);
    let tx = build_tx(&svm, approve_ix, &judge.pubkey(), &[&judge]);
    let res = svm.send_transaction(tx);
    assert!(res.is_ok(), "approve_promise failed: {:?}", res.err());

    // Verify stake balik ke promiser
    let promiser_after = svm.get_balance(&promiser.pubkey()).unwrap_or(0);
    assert!(
        promiser_after > promiser_before,
        "Balance promiser harusnya naik. Before: {}, After: {}",
        promiser_before,
        promiser_after
    );

    println!("✅ test_create_and_approve_promise passed");
}

#[test]
fn test_create_and_reject_promise() {
    let mut svm = setup_svm();
    let promiser = Keypair::new();
    let judge = Keypair::new();
    let charity = Keypair::new();

    svm.airdrop(&promiser.pubkey(), 5 * ONE_SOL).unwrap();
    svm.airdrop(&judge.pubkey(), ONE_SOL).unwrap();

    let deadline = now(&svm) + ONE_HOUR;

    // Create promise
    let create_ix = ix_create_promise(
        promiser.pubkey(),
        judge.pubkey(),
        charity.pubkey(),
        STAKE,
        deadline,
    );
    let tx = build_tx(&svm, create_ix, &promiser.pubkey(), &[&promiser]);
    assert!(svm.send_transaction(tx).is_ok());

    let charity_before = svm.get_balance(&charity.pubkey()).unwrap_or(0);

    // Judge rejects
    let reject_ix = ix_reject_promise(
        promiser.pubkey(),
        judge.pubkey(),
        charity.pubkey(),
        deadline,
    );
    let tx = build_tx(&svm, reject_ix, &judge.pubkey(), &[&judge]);
    let res = svm.send_transaction(tx);
    assert!(res.is_ok(), "reject_promise failed: {:?}", res.err());

    // Verify stake masuk ke charity
    let charity_after = svm.get_balance(&charity.pubkey()).unwrap_or(0);
    assert_eq!(
        charity_after - charity_before,
        STAKE,
        "Charity harusnya nerima persis stake amount"
    );

    println!("✅ test_create_and_reject_promise passed");
}

#[test]
fn test_create_and_claim_timeout() {
    let mut svm = setup_svm();
    let promiser = Keypair::new();
    let judge = Keypair::new();
    let charity = Keypair::new();
    let bystander = Keypair::new(); // siapa aja boleh claim timeout

    svm.airdrop(&promiser.pubkey(), 5 * ONE_SOL).unwrap();
    svm.airdrop(&bystander.pubkey(), ONE_SOL).unwrap();

    let deadline = now(&svm) + 60; // 60 detik di masa depan

    // Create promise
    let create_ix = ix_create_promise(
        promiser.pubkey(),
        judge.pubkey(),
        charity.pubkey(),
        STAKE,
        deadline,
    );
    let tx = build_tx(&svm, create_ix, &promiser.pubkey(), &[&promiser]);
    assert!(svm.send_transaction(tx).is_ok());

    let charity_before = svm.get_balance(&charity.pubkey()).unwrap_or(0);

    // Lompat waktu 2 menit ke depan (lewat deadline)
    advance_time(&mut svm, 120);

    // Bystander claim timeout
    let claim_ix = ix_claim_timeout(
        promiser.pubkey(),
        charity.pubkey(),
        bystander.pubkey(),
        deadline,
    );
    let tx = build_tx(&svm, claim_ix, &bystander.pubkey(), &[&bystander]);
    let res = svm.send_transaction(tx);
    assert!(res.is_ok(), "claim_timeout failed: {:?}", res.err());

    // Verify stake ke charity
    let charity_after = svm.get_balance(&charity.pubkey()).unwrap_or(0);
    assert_eq!(
        charity_after - charity_before,
        STAKE,
        "Charity harusnya dapat stake pas timeout"
    );

    println!("✅ test_create_and_claim_timeout passed");
}

// =============================================================================
// FAILURE TESTS (validasi error handling)
// =============================================================================

#[test]
fn test_fail_self_judge() {
    let mut svm = setup_svm();
    let promiser = Keypair::new();
    let charity = Keypair::new();

    svm.airdrop(&promiser.pubkey(), 5 * ONE_SOL).unwrap();

    let deadline = now(&svm) + ONE_HOUR;

    // Promiser nyoba jadi judge sendiri (gak boleh)
    let create_ix = ix_create_promise(
        promiser.pubkey(),
        promiser.pubkey(), // ❌ Sama dengan promiser!
        charity.pubkey(),
        STAKE,
        deadline,
    );
    let tx = build_tx(&svm, create_ix, &promiser.pubkey(), &[&promiser]);
    let res = svm.send_transaction(tx);

    assert!(
        res.is_err(),
        "Harusnya error karena promiser nggak boleh jadi judge sendiri"
    );
    println!("✅ test_fail_self_judge passed");
}

#[test]
fn test_fail_unauthorized_approve() {
    let mut svm = setup_svm();
    let promiser = Keypair::new();
    let judge = Keypair::new();
    let attacker = Keypair::new(); // bukan judge!
    let charity = Keypair::new();

    svm.airdrop(&promiser.pubkey(), 5 * ONE_SOL).unwrap();
    svm.airdrop(&attacker.pubkey(), ONE_SOL).unwrap();

    let deadline = now(&svm) + ONE_HOUR;

    // Create promise dengan judge yang bener
    let create_ix = ix_create_promise(
        promiser.pubkey(),
        judge.pubkey(),
        charity.pubkey(),
        STAKE,
        deadline,
    );
    let tx = build_tx(&svm, create_ix, &promiser.pubkey(), &[&promiser]);
    assert!(svm.send_transaction(tx).is_ok());

    // Attacker (bukan judge) nyoba approve
    let approve_ix = ix_approve_promise(promiser.pubkey(), attacker.pubkey(), deadline);
    let tx = build_tx(&svm, approve_ix, &attacker.pubkey(), &[&attacker]);
    let res = svm.send_transaction(tx);

    assert!(
        res.is_err(),
        "Bukan judge gak boleh approve"
    );
    println!("✅ test_fail_unauthorized_approve passed");
}

#[test]
fn test_fail_stake_too_low() {
    let mut svm = setup_svm();
    let promiser = Keypair::new();
    let judge = Keypair::new();
    let charity = Keypair::new();

    svm.airdrop(&promiser.pubkey(), ONE_SOL).unwrap();

    let deadline = now(&svm) + ONE_HOUR;

    // Stake cuma 100 lamports (di bawah MIN_STAKE_LAMPORTS = 1_000_000)
    let create_ix = ix_create_promise(
        promiser.pubkey(),
        judge.pubkey(),
        charity.pubkey(),
        100, // ❌ Way too low
        deadline,
    );
    let tx = build_tx(&svm, create_ix, &promiser.pubkey(), &[&promiser]);
    let res = svm.send_transaction(tx);

    assert!(res.is_err(), "Stake di bawah minimum harusnya error");
    println!("✅ test_fail_stake_too_low passed");
}

#[test]
fn test_fail_deadline_in_past() {
    let mut svm = setup_svm();
    let promiser = Keypair::new();
    let judge = Keypair::new();
    let charity = Keypair::new();

    svm.airdrop(&promiser.pubkey(), ONE_SOL).unwrap();

    // Advance time biar 'now' jelas > 0, lalu set deadline di masa lalu
    advance_time(&mut svm, 1000);
    let deadline = now(&svm) - 100; // 100 detik di masa lalu

    let create_ix = ix_create_promise(
        promiser.pubkey(),
        judge.pubkey(),
        charity.pubkey(),
        STAKE,
        deadline,
    );
    let tx = build_tx(&svm, create_ix, &promiser.pubkey(), &[&promiser]);
    let res = svm.send_transaction(tx);

    assert!(res.is_err(), "Deadline di masa lalu harusnya error");
    println!("✅ test_fail_deadline_in_past passed");
}