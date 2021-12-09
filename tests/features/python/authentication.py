from behave import *

@given('an anonymous user')
def step_impl(context):
    pass

@when('an existing user')
def step_impl(context):
    assert True is not False

@then('I sign up with a valid email and password')
def step_impl(context):
    assert context.failed is False
