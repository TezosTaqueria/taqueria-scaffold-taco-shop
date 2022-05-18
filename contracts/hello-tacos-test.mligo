#include "./hello-tacos.mligo"

let test =
    let initial_storage = 100n in
    let (taddr, _, _) = Test.originate main initial_storage 0mutez in
    let _ = assert (Test.get_storage taddr = initial_storage) in
    // sends transaction to buy tacos
    let tacos_to_buy = 15n in
    let contr = Test.to_contract taddr in
    let () = Test.transfer_to_contract_exn contr tacos_to_buy 0mutez in
    let _ = assert (Test.get_storage taddr = abs(initial_storage - tacos_to_buy)) in
    // sends transaction with a too large amount of tacos
    let contr = Test.to_contract taddr in
    let can_buy_too_many_tacos: bool = 
        match (Test.transfer_to_contract contr initial_storage 0mutez) with
        | Success -> true
        | Fail err -> 
            begin
                match err with
                | Rejected res ->
                    if res.0 = Test.compile_value "NOT_ENOUGH_TACOS"
                    then false
                    else true
                | Other -> true
            end
    in
    assert (not can_buy_too_many_tacos)
