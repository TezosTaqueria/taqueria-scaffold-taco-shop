(*
  These are Unit Tests for the hello-taco Smart Contract. They use the CameLIGO Test.Next
  library. For more information: https://ligolang.org/docs/reference/test?lang=cameligo

  To run these tests, invoke:

     $ taq test hello-tacos.test.mligo --plugin @taqueria/plugin-ligo

  ** Good to Know **

  => There is no deployment to, or interaction with, any Tezos blockchain instance
  => These tests only exercise the logic of the contract: not any integration
  => These tests are fast, but also isolated to the context of the contract

  ** Conventions **

  => `_good` denotes the happy *test* path - i.e. including when failure is expected
  => `_bad` denotes when a test has genuinely failed
  => Many variable names mirror their parameter or type name, à la Python

  Copyright (c) 2023 ECAD Labs. All rights reserved.
  This software is licensed under the terms of the included LICENSE file.

  Please see the top-level README file for more information.
*)

#import "hello-tacos.mligo" "HelloTacos"
module Test = Test.Next

let _print_header = Test.IO.println "Testing hello-tacos.mligo...."

let available_tacos: nat = 50n

(* Test that the contract initializes with the correct storage *)
let test_initial_contract_state =
    let contract = Test.Originate.contract (contract_of HelloTacos) available_tacos 0tez in
    let storage = Test.Typed_address.get_storage contract.taddr in
    Assert.assert (storage = available_tacos)

(* Test that we can buy some tacos and storage updates correctly *)
let test_can_buy_some_tacos =
    let contract = Test.Originate.contract (contract_of HelloTacos) available_tacos 0tez in
    let tacos_to_buy = 10n in
    let _ = Test.Contract.transfer_exn (Test.Typed_address.get_entrypoint "default" contract.taddr) tacos_to_buy 0tez in
    let storage = Test.Typed_address.get_storage contract.taddr in
    Assert.assert (storage = abs(available_tacos - tacos_to_buy))

(* Test that we can buy all remaining tacos *)
let test_can_buy_all_tacos =
    let contract = Test.Originate.contract (contract_of HelloTacos) available_tacos 0tez in
    let _ = Test.Contract.transfer_exn (Test.Typed_address.get_entrypoint "default" contract.taddr) available_tacos 0tez in
    let storage = Test.Typed_address.get_storage contract.taddr in
    Assert.assert (storage = 0n)

(* Test that buying more tacos than available fails with NOT_ENOUGH_TACOS *)
let test_cannot_buy_more_tacos_than_available =
    let contract = Test.Originate.contract (contract_of HelloTacos) available_tacos 0tez in
    let too_many_tacos = available_tacos + 1n in
    let result = Test.Contract.transfer (Test.Typed_address.get_entrypoint "default" contract.taddr) too_many_tacos 0tez in
    match result with
        | Fail (Rejected (msg, _good)) -> Assert.assert (msg = Test.Michelson.eval "NOT_ENOUGH_TACOS")
        | Success _bad -> Test.Assert.failwith "Failed to prevent purchasing too many tacos"
        | Fail _ -> Test.Assert.failwith "Unexpected failure type"

(* Test that buying when no tacos are available fails *)
let test_no_tacos_available =
    let no_tacos: nat = 0n in
    let contract = Test.Originate.contract (contract_of HelloTacos) no_tacos 0tez in
    let result = Test.Contract.transfer (Test.Typed_address.get_entrypoint "default" contract.taddr) 1n 0tez in
    match result with
        | Fail (Rejected (msg, _good)) -> Assert.assert (msg = Test.Michelson.eval "NOT_ENOUGH_TACOS")
        | Success _bad -> Test.Assert.failwith "Failed to prevent purchasing when no tacos available"
        | Fail _ -> Test.Assert.failwith "Unexpected failure type"

(* Test direct function call without contract origination *)
let test_main_function_directly =
    let result = HelloTacos.main 10n 50n in
    Assert.assert (result.1 = 40n)
