import pytest
import allure

@allure.severity(allure.severity_level.BLOCKER)
@allure.suite("rpc")
@allure.feature("rpc")
class TestProcedures(object):
    @pytest.mark.skip(reason="need to implement")
    def test_call_rpc(self):
        """ When you call rpc then you are able to receive its result """
        self.create_valid_user()

    @allure.step("Create Supabase anonymous client")
    def create_supabase_anonymous_client(self):
        pass

    @allure.step("I sign up with a valid {email} and {password}")
    def sign_up_valid(self, email, password="password"):
         pass

    @allure.step("Create a valid user")
    def create_valid_user(self):
        pass
