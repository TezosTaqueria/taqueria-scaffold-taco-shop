(*
  Unit Tests for the hello-taco.mligo Smart Contract.

  Copyright (c) 2022 ECAD Labs. All rights reserved.
  This software is licensed under the terms of the included LICENSE file.

  Please see the top-level README file for more information.
*)

#include "./_schema.mligo"
#include "./hello-tacos.mligo"

let _print_header = Test.println("Testing hello-taco.mligo....")

let _arrange = Test.reset_state 3n []
let admin_address = Test.nth_bootstrap_account 1
let user_address = Test.nth_bootstrap_account 2
let _set_source_to_admin = Test.set_source admin_address

let initial_tacos: nat = 50n

let initial_storage = {
    available_tacos = initial_tacos;
    admin = admin_address;
}

// rename to contract_at
let to_contract(address) = Test.to_contract address
let storage_at(address) = Test.get_storage(address)

let test_initial_contract_state =
    let addr,_,_ = Test.originate main initial_storage 0tez in
    let storage = storage_at addr in
    let _ = assert (storage.available_tacos = initial_tacos) in
    assert (storage.admin = admin_address)

let test_cannot_buy_more_tacos_than_available =
    let addr,_,_ = Test.originate main initial_storage 0tez in
    let storage = storage_at addr in
    let too_many_tacos = storage.available_tacos + 1n in
    let addr,_,_ = Test.originate main initial_storage 0tez in
    match Test.transfer_to_contract (to_contract addr) (Buy too_many_tacos) 0mutez with
        | Fail (Rejected(msg,_ok)) -> msg = Test.eval "NOT_ENOUGH_TACOS"
        | Success _bad -> Test.failwith("Failed to prevent purchasing too many tacos")
        | Fail unexpected -> Test.failwith("Unexpected failure: ", unexpected)

let test_can_buy_at_least_half_the_available_tacos =
    let addr,_,_ = Test.originate main initial_storage 0tez in
    let storage = storage_at addr in
    let tacos_to_buy = storage.available_tacos / 2n in
    match Test.transfer_to_contract (to_contract addr) (Buy tacos_to_buy) 0mutez with
        | Success _ok -> true
        | Fail unexpected -> Test.failwith("Unexpected failure: ", unexpected)

let test_can_buy_all_remaining_tacos =
    let addr,_,_ = Test.originate main initial_storage 0tez in
    let storage = storage_at addr in
    let number_of_available_tacos = storage.available_tacos in
    let _ensure_nonzero_tacos_available = assert (number_of_available_tacos > 0n) in
    match Test.transfer_to_contract (to_contract addr) (Buy number_of_available_tacos) 0mutez with
        | Success _ok -> true
        | Fail unexpected -> Test.failwith("Unexpected failure: ", unexpected)

let test_no_tacos_available =
    let no_tacos_available = { initial_storage with available_tacos = 0n } in
    let addr,_,_ = Test.originate main no_tacos_available 0tez in
    let storage = storage_at addr in
    let _verify_no_tacos_available = assert (storage.available_tacos = 0n) in
    match Test.transfer_to_contract (to_contract addr) (Buy 1n) 0mutez with
        | Fail (Rejected(msg,_ok)) -> msg = Test.eval "NOT_ENOUGH_TACOS"
        | Success _bad -> Test.failwith("Failed to prevent a purchase of 0 tacos")
        | Fail unexpected -> Test.failwith("Unexpected failure: ", unexpected)

let test_only_admin_can_make_tacos =
    let _ = Test.set_source user_address in
    let addr,_,_ = Test.originate main initial_storage 0tez in // N.B. originates as user_address
    match Test.transfer_to_contract (to_contract addr) (Make initial_tacos) 0mutez with
        | Fail (Rejected(msg,_ok)) -> msg = Test.eval "NOT_ALLOWED" // TODO Improve failure message
        | Success _bad -> Test.failwith("Failed to prevent a user from making tacos")
        | Fail unexpected -> Test.failwith("Unexpected failure: ", unexpected)

let test_can_make_tacos =
    let _ = Test.set_source admin_address in // Strictly unnecessary; just being explicit
    let addr,_,_ = Test.originate main initial_storage 0tez in
    let storage = storage_at addr in
    let _ = assert (storage.available_tacos = initial_tacos) in
    let _add_42_tacos =
    (match Test.transfer_to_contract (to_contract addr) (Make 42n) 0mutez with
        | Success _ -> true
        | Fail unexpected -> Test.failwith("Unexpected failure: ", unexpected)) in
    // Refresh storage after adding tacos
    let storage = storage_at addr in
    assert(storage.available_tacos = initial_tacos + 42n)


//     in
//     let storage: storage = Test.get_storage_of_address contract_addr |> Test.decompile in
//     let _ = assert (storage.available_tacos = initial_tacos) in
//     ()
