import allure

@allure.severity(allure.severity_level.BLOCKER)
@allure.suite("authentication")
@allure.feature("authentication")
class TestAuthentication(object):
    @allure.description("""When user sign up then he should be logged in""")
    def test_new_users(self):
        self.create_supabase_anonymous_client()
        self.sign_up_valid("email", "password")
        self.check_logged_in()
        self.check_log_out()

    def test_existing_users(self):
        """ When user is already signed up then he should be able to logged in """
        self.create_valid_user()
        self.sign_in_valid("email", "password")
        self.check_logged_in()
        self.check_log_out()

    @allure.step("Create Supabase anonymous client")
    def create_supabase_anonymous_client(self):
        pass

    @allure.step("I sign up with a valid {email} and {password}")
    def sign_up_valid(self, email, password="password"):
         pass

    @allure.step("Create a valid user")
    def create_valid_user(self):
        pass

    @allure.step("I sign in with a valid {email} and {password}")
    def sign_in_valid(self, email, password="password"):
         pass

    @allure.step("Check if I am logged in")
    def check_logged_in(self):
         pass

    @allure.step("Check if I am being able to log out")
    def check_log_out(self):
         pass

