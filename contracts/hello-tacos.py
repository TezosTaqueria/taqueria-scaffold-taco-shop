import smartpy as sp

class HelloTacos(sp.Contract):
    def __init__(self, available_tacos, admin):
        self.init_type(sp.TRecord(available_tacos = sp.TNat, admin = sp.TAddress))
        self.init(available_tacos = available_tacos, admin = admin)

    @sp.entry_point
    def buy(self, tacos_to_buy):
        sp.set_type(tacos_to_buy, sp.TNat)
        sp.if self.data.available_tacos < tacos_to_buy:
            sp.failwith("NOT_ENOUGH_TACOS_AVAILABLE")
        sp.else:
            self.data.available_tacos = sp.as_nat(self.data.available_tacos - tacos_to_buy)

    @sp.entry_point
    def make(self, tacos_to_make):
        sp.if self.data.admin != sp.sender:
            sp.failwith("NOT_ALLOWED_TO_MAKE_TACOS")
        sp.else:
            self.data.available_tacos += tacos_to_make

admin = sp.test_account("Administrator")
user = sp.test_account("User")

@sp.add_test(name = "test_initial_state")
def test():
    hello_tacos = HelloTacos(10, admin.address)
    scenario = sp.test_scenario()
    scenario.h1("Hello Tacos")
    scenario += hello_tacos
    scenario.verify(hello_tacos.data.available_tacos == 10)
    scenario.verify(hello_tacos.data.admin == admin.address)

@sp.add_test(name = "test_can_buy_some_tacos")
def test():
    hello_tacos = HelloTacos(10, admin.address)
    scenario = sp.test_scenario()
    scenario.h1("Hello Tacos")
    scenario += hello_tacos
    hello_tacos.buy(2)
    scenario.verify(hello_tacos.data.available_tacos == 8)

@sp.add_test(name = "test_can_buy_all_remaining_tacos")
def test():
    hello_tacos = HelloTacos(10, admin.address)
    scenario = sp.test_scenario()
    scenario.h1("Hello Tacos")
    scenario += hello_tacos
    hello_tacos.buy(10)
    scenario.verify(hello_tacos.data.available_tacos == 0)

@sp.add_test(name = "test_cannot_buy_more_tacos_than_available")
def test():
    hello_tacos = HelloTacos(10, admin.address)
    scenario = sp.test_scenario()
    scenario.h1("Hello Tacos")
    scenario += hello_tacos
    hello_tacos.buy(12).run(valid = False, exception = "NOT_ENOUGH_TACOS_AVAILABLE")

@sp.add_test(name = "test_no_tacos_available")
def test():
    hello_tacos = HelloTacos(0, admin.address)
    scenario = sp.test_scenario()
    scenario.h1("Hello Tacos")
    scenario += hello_tacos
    hello_tacos.buy(1).run(valid = False, exception = "NOT_ENOUGH_TACOS_AVAILABLE")

@sp.add_test(name = "test_can_make_tacos")
def test():
    hello_tacos = HelloTacos(10, admin.address)
    scenario = sp.test_scenario()
    scenario.h1("Hello Tacos")
    scenario += hello_tacos
    hello_tacos.make(2).run(sender = admin.address)
    scenario.verify(hello_tacos.data.available_tacos == 12)

@sp.add_test(name = "test_only_admin_can_make_tacos")
def test():
    hello_tacos = HelloTacos(10, admin.address)
    scenario = sp.test_scenario()
    scenario.h1("Hello Tacos")
    scenario += hello_tacos
    hello_tacos.make(2).run(sender = user.address, valid = False, exception = "NOT_ALLOWED_TO_MAKE_TACOS")

sp.add_compilation_target("hello_tacos_compiled", HelloTacos(100, sp.address('tz1ge3zb6kC5iUZcXsjxiwwtU5MwP37T6m1z')))
sp.add_expression_compilation_target("buy_amount", 10)
sp.add_expression_compilation_target("make_amount", 5)
