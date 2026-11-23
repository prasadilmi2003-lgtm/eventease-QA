Feature: User login
  As a registered EventEase user
  I want to log in with my email and password
  So that I can access my account

  Background:
    Given the following users exist:
      | email              | password | status    |
      | user@test.com      | Pass1234 | active    |
      | suspended@test.com | Pass1234 | suspended |

  Scenario: Successful login with valid credentials
    When I log in with email "user@test.com" and password "Pass1234"
    Then the response status should be 200
    And I should receive a login cookie
    And the response should not contain the password hash

  Scenario Outline: Login is rejected
    When I log in with email "<email>" and password "<password>"
    Then the response status should be <status>
    And the error message should be "<message>"
    And I should not receive a login cookie

    Examples:
      | email              | password  | status | message                                     |
      | user@test.com      | WrongPass | 401    | Incorrect email or password                 |
      | nobody@test.com    | Pass1234  | 401    | Incorrect email or password                 |
      | not-an-email       | Pass1234  | 400    | Validation failed                           |
      | suspended@test.com | Pass1234  | 403    | Your account is suspended. Contact support. |