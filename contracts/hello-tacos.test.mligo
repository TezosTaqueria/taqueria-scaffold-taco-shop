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
        | Fail (Rejected(msg,_good)) -> msg = Test.eval "NOT_ENOUGH_TACOS"
        | Success _bad -> Test.failwith("Failed to prevent purchasing too many tacos")
        | Fail unexpected -> Test.failwith("Unexpected failure: ", unexpected)

let test_can_buy_at_least_half_the_available_tacos =
    let addr,_,_ = Test.originate main initial_storage 0tez in
    let storage = storage_at addr in
    let tacos_to_buy = storage.available_tacos / 2n in
    match Test.transfer_to_contract (to_contract addr) (Buy tacos_to_buy) 0mutez with
        | Success _ -> true
        | Fail unexpected -> Test.failwith("Unexpected failure: ", unexpected)

//     let storage: storage = Test.get_storage_of_address contract_addr |> Test.decompile in
//     let _ = assert (storage.available_tacos = tacos_to_buy) in

//     // passing with the same quantity
//     let _ =
//         (match Test.transfer_to_contract (Test.to_contract contract_typed_addr) (Buy tacos_to_buy) 0mutez with
//         | Success _ -> true
//         | Fail _ -> false)
//         |> assert
//     in
//     let storage: storage = Test.get_storage_of_address contract_addr |> Test.decompile in
//     let _ = assert (storage.available_tacos = 0n) in

//     // testing with a zero value in storage
//     let _ =
//         (match Test.transfer_to_contract (Test.to_contract contract_typed_addr) (Buy 5n) 0mutez with
//         | Success _ -> false
//         | Fail err ->
//             (match err with
//             | Rejected (msg, _) -> msg = Test.eval "NOT_ENOUGH_TACOS"
//             | _ -> false))
//         |> assert
//     in

//     // MAKE ENTRYPOINT
//     // sender must be the admin
//     let _ = Test.set_source user_address in
//     let _ =
//         (match Test.transfer_to_contract (Test.to_contract contract_typed_addr) (Make initial_tacos) 0mutez with
//         | Success _ -> false
//         | Fail err ->
//             (match err with
//             | Rejected (msg, _) -> msg = Test.eval "NOT_ALLOWED"
//             | _ -> false))
//         |> assert
//     in

//     let _ = Test.set_source admin_address in
//     let _ =
//         (match Test.transfer_to_contract (Test.to_contract contract_typed_addr) (Make initial_tacos) 0mutez with
//         | Success _ -> true
//         | Fail _ -> false)
//         |> assert
//     in
//     let storage: storage = Test.get_storage_of_address contract_addr |> Test.decompile in
//     let _ = assert (storage.available_tacos = initial_tacos) in
//     ()
