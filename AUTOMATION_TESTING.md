# Selenium Automation Testing Setup

This project includes a beginner-friendly Selenium WebDriver automation framework in Java.

The frontend UI is not redesigned or changed. These tests automate the existing Smart Task Management System pages.

## Tools Used

- Java
- Selenium WebDriver
- ChromeDriver
- TestNG
- Maven
- VS Code

## Project Structure

```text
SmartTaskManagementSystem/
├── drivers/
│   └── chromedriver.exe        # Add ChromeDriver here
├── screenshots/
│   └── failed test screenshots
├── tests/
│   └── TaskFlowTests.java      # Selenium test cases
├── utilities/
│   ├── BaseTest.java           # Browser setup and teardown
│   ├── SeleniumHelper.java     # Reusable click, wait, input helpers
│   ├── ScreenshotUtil.java     # Screenshot capture utility
│   └── ScreenshotListener.java # TestNG failure screenshot listener
├── pom.xml                     # Selenium and TestNG dependencies
└── testng.xml                  # TestNG suite file
```

## Automated Test Cases

`TaskFlowTests.java` includes:

- Valid login
- Invalid login
- Add task
- Edit task
- Delete task
- Search task
- Mark task completed
- Logout functionality

## Assertions Included

The tests validate:

- Successful login redirects to dashboard
- Invalid login shows an error message
- Task creation success toast appears
- Created task is visible
- Edited task title is visible
- Deleted task is removed
- Search result is visible
- Completed task moves to Completed column
- Login form is visible after logout

## ChromeDriver Setup

1. Check your Chrome browser version.
2. Download the matching ChromeDriver.
3. Place the driver inside:

```text
drivers/chromedriver.exe
```

For Windows, the expected path is:

```text
SmartTaskManagementSystem/drivers/chromedriver.exe
```

You can also pass the driver path from the command line:

```powershell
mvn test -Dchromedriver.path="D:\drivers\chromedriver.exe"
```

## Selenium Dependencies

Dependencies are already added in `pom.xml`:

```xml
selenium-java
testng
```

Maven will download these automatically when tests run.

## Running Tests in VS Code

1. Install Java JDK 11 or above.
2. Install Maven.
3. Install VS Code extensions:
   - Extension Pack for Java
   - Test Runner for Java
4. Open the project folder in VS Code.
5. Make sure ChromeDriver is inside the `drivers` folder.
6. Open the terminal in the project root.
7. Run:

```powershell
mvn test
```

## Running Against a Local Server

By default, tests open `index.html` directly using a local file URL.

If you want to run with a local server:

```powershell
python -m http.server 8000
```

Then run tests with:

```powershell
mvn test -Dapp.url="http://localhost:8000/index.html"
```

## Screenshot Capture

Failed tests automatically save screenshots in:

```text
screenshots/
```

The screenshot path is printed in the console.

## Selenium Flow Used

Each test follows this flow:

1. Launch Chrome browser.
2. Open the application login page.
3. Clear localStorage/sessionStorage.
4. Perform test actions.
5. Use explicit waits for elements.
6. Assert expected UI result.
7. Capture screenshot if the test fails.
8. Close browser.

## Presentation Note

This framework is intentionally simple:

- No advanced architecture
- No complex reporting setup
- Clear helper methods
- Clean console logs
- Easy to explain during internship evaluation
