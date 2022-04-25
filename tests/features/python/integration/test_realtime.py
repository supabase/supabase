import pytest
import allure

@allure.severity(allure.severity_level.BLOCKER)
@allure.suite("realtime")
@allure.feature("realtime")
class TestRealtime(object):
    @pytest.mark.skip(reason="need to implement")
    def test_realtime_connect(self):
        """ When you call "on" table then connected realtime client should be returned """
        self.create_valid_user()

    @pytest.mark.skip(reason="need to implement")
    def test_no_event_updates_until_subscribe(self):
        """ When you call "on" table but not subscribe then no events have to be returned """
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
