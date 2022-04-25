import os
import pytest
import allure
import requests
import uuid

from faker import Faker
from faker.providers import internet
from supabase import create_client, Client


fake = Faker()
fake.add_provider(internet)


@allure.severity(allure.severity_level.BLOCKER)
@allure.suite("authentication")
@allure.feature("authentication")
def test_new_users(db):
    """When user sign up then he should not be logged in until he confirms his email"""
    supabase = create_supabase_anonymous_client()
    fake_user = {
        'username': fake.user_name(),
        'email': fake.email(),
        'password': fake.password(),
    }
    user = sign_up_valid(
        supabase, fake_user["email"], fake_user["password"])

    assert user is not None
    assert user.email == fake_user["email"].lower()

    token = get_confirmation_token(db, user.id)
    assert verify(token).ok is True

    session = sign_in_valid(
        supabase, fake_user["email"], fake_user["password"])
    assert session is not None

    data = insert_profile(supabase, fake_user["username"], user.id)
    assert len(data.data) > 0

    check_log_out(supabase)
    assert supabase.auth.session() is None


@allure.severity(allure.severity_level.BLOCKER)
@allure.suite("authentication")
@allure.feature("authentication")
@pytest.mark.skip(reason="need to implement")
def test_existing_users():
    """ When user is already signed up then he should be able to log in """
    create_valid_user()


@allure.severity(allure.severity_level.BLOCKER)
@allure.suite("authentication")
@allure.feature("authentication")
@pytest.mark.skip(reason="need to implement")
def test_signup_should_create_user():
    """ When user sign up then corresponding user in auth schema should be created """
    create_valid_user()


@allure.severity(allure.severity_level.BLOCKER)
@allure.suite("authentication")
@allure.feature("authentication")
@pytest.mark.skip(reason="need to implement")
def test_new_users_by_phone():
    """ When user sign up with phone then he should be logged in """
    create_valid_user()


@allure.severity(allure.severity_level.BLOCKER)
@allure.suite("authentication")
@allure.feature("authentication")
@pytest.mark.skip(reason="need to implement")
def test_get_user():
    """ When user is signed in then he should be able to get his info and metadata """
    create_valid_user()
    sign_in_valid("email", "password")
    check_logged_in()
    # to do get user
    check_log_out()


@allure.severity(allure.severity_level.BLOCKER)
@allure.suite("authentication")
@allure.feature("authentication")
@pytest.mark.skip(reason="need to implement")
def test_update_user():
    """ When user is signed in then he should be able to update his info """
    create_valid_user()
    sign_in_valid("email", "password")
    check_logged_in()
    # to do update user
    check_log_out()


@allure.severity(allure.severity_level.BLOCKER)
@allure.suite("authentication")
@allure.feature("authentication")
@pytest.mark.skip(reason="need to implement")
def test_set_session():
    """ When user changes session then he still should be correctly logined """
    create_valid_user()
    sign_in_valid("email", "password")
    check_logged_in()
    # to do set session and check
    check_log_out()


@allure.severity(allure.severity_level.BLOCKER)
@allure.suite("authentication")
@allure.feature("authentication")
@pytest.mark.skip(reason="need to implement")
def test_set_auth():
    """ When user changes auth then all new requests should have new JWT """
    create_valid_user()
    sign_in_valid("email", "password")
    check_logged_in()
    # to do set auth and check
    check_log_out()


@allure.severity(allure.severity_level.BLOCKER)
@allure.suite("authentication")
@allure.feature("authentication")
@pytest.mark.skip(reason="need to implement")
def test_refresh_session():
    """ When user refreshes session then user and session have to be updated """
    create_valid_user()


@allure.severity(allure.severity_level.BLOCKER)
@allure.suite("authentication")
@allure.feature("authentication")
@pytest.mark.skip(reason="need to implement")
def test_on_auth_state_changed():
    """ When user subscribes on auth changes then user has to receive auth updates """
    create_valid_user()


@allure.step("Create Supabase anonymous client")
def create_supabase_anonymous_client():
    url: str = os.environ.get("SUPABASE_URL")
    key: str = os.environ.get("SUPABASE_KEY_ANON")
    supabase: Client = create_client(url, key)
    return supabase


@allure.step("I sign up with a valid {email} and {password}")
def sign_up_valid(supabase: Client, email=fake.email(), password=fake.password()):
    return supabase.auth.sign_up(email=email, password=password)


@allure.step("get confirmation token for user {id}")
def get_confirmation_token(conn, id):
    return conn.execute(f"""select confirmation_token 
          from auth.users
          where id = '{id}'""").fetchone()[0]


@allure.step("verify with token {token}")
def verify(token: str):
    return requests.post(
        url=f"{os.environ.get('SUPABASE_GOTRUE')}/verify",
        json={
            "token": token,
            "type": "signup",
        }
    )


@allure.step("Create a valid user")
def create_valid_user():
    pass


@allure.step("I sign in with a valid {email} and {password}")
def sign_in_valid(supabase: Client, email, password):
    return supabase.auth.sign_in(email=email, password=password)


@allure.step("Check if I am logged in")
def check_logged_in():
    pass


@allure.step("Check if I am logged in by checking if I can insert my profile")
def insert_profile(supabase: Client, username, id: uuid.UUID):
    return supabase.table("profiles").insert({
        "id": str(id),
        "username": username,
    }).execute()


@allure.step("Check if I am being able to log out")
def check_log_out(supabase: Client):
    return supabase.auth.sign_out()
