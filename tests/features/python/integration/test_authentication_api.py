import pytest
import allure

@allure.severity(allure.severity_level.BLOCKER)
@allure.suite("authentication API")
@allure.feature("authentication API")
class TestAuthenticationAPI(object):
    @pytest.mark.skip(reason="need to implement")
    def test_create_user(self):
        """ When you create user then it has to be in auth db schema """
        self.create_valid_user()

    @pytest.mark.skip(reason="need to implement")
    def test_create_user_can_login(self): 
        """ When you create user then he can sign in """
        self.create_valid_user()

    @pytest.mark.skip(reason="need to implement")
    def test_create_user_with_anon_key(self):
        """ When you try to create user with anon key then you should get error """
        self.create_valid_user()

    @allure.step("Create a valid user")
    def create_valid_user(self):
        pass
