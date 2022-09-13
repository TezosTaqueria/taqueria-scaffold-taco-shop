#include "_schema.mligo"

let buy ((tacos_to_buy, store) : (taco_quantity * storage)) =
    if tacos_to_buy > store.available_tacos
    then (failwith "NOT_ENOUGH_TACOS": operation list * storage)
    else (([], {store with available_tacos = abs(store.available_tacos - tacos_to_buy)}) :
        operation list * storage)