Feature: User Authentication

    Scenario: New users
        Given an anonymous user
        When I sign up with a valid email and password
        Then I should be logged in
        And I should be able to log out

    Scenario: Existing users
        Given an existing user
        When I sign up with a valid email and password
        Then I should be logged in
        And I should be able to log out
